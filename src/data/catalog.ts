import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  tracks as fixtureTracks,
  type LessonData as FixtureLessonData,
  type TrackData as FixtureTrackData,
} from "@/data/lessons";
import {
  problems as fixtureProblems,
  type ProblemData as FixtureProblemData,
} from "@/data/problems";
import {
  extractLessonMarkdownSections,
  extractLessonSandboxCode,
} from "@/lib/lesson-markdown";
import {
  prisma,
  type Difficulty,
  type ProblemType,
  type SectionType,
  type TrackAvailability,
} from "@/lib/prisma";

export const CATALOG_TRACKS_TAG = "catalog:tracks";
export const CATALOG_LESSONS_TAG = "catalog:lessons";
export const CATALOG_PROBLEMS_TAG = "catalog:problems";

export function getCatalogTrackTag(trackCode: string) {
  return `catalog:track:${trackCode}`;
}

export function getCatalogLessonTag(trackCode: string, lessonSlug: string) {
  return `catalog:lesson:${trackCode}:${lessonSlug}`;
}

export function getCatalogProblemTag(problemId: string) {
  return `catalog:problem:${problemId}`;
}

export interface CatalogTrack {
  id: string;
  code: string;
  label: string;
  name: string;
  description: string;
  gradient: string;
  availability: "available" | "coming_soon";
  roadmapTopics: string[];
  launchNote?: string;
  lessons: CatalogLessonSummary[];
}

export interface CatalogLessonSummary {
  id: string;
  trackCode?: string;
  trackName?: string;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
}

export interface CatalogLessonSection {
  id: string;
  sectionType: SectionType;
  isRequired: boolean;
  title: string | null;
  content: string;
  payloadJson: unknown;
  sortOrder: number;
}

export interface CatalogLessonDetail extends CatalogLessonSummary {
  track: Omit<CatalogTrack, "lessons">;
  content: string;
  sections: CatalogLessonSection[];
}

export interface CatalogProblemSummary {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  trackCode: string;
  trackName: string;
  relatedLessonSlugs: string[];
  kind: "implementation" | "compile_error_fix" | "ownership_fix";
  estimatedMinutes: number;
}

export interface CatalogProblemDetail extends CatalogProblemSummary {
  statement: string;
  constraintsText?: string;
  inputFormat?: string;
  outputFormat?: string;
  hintText?: string;
  explanationText?: string;
  initialCode: string;
  solutionOutline?: string;
  trackLabel?: string;
  relatedLessons: Array<{
    id: string;
    slug: string;
    title: string;
    estimatedMinutes: number;
    trackCode: string;
    trackName: string;
  }>;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeLimitMs: number;
    memoryLimitKb: number;
    score: number;
  }>;
}

export interface PublishedCatalogContextLesson {
  id: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  trackCode: string;
  trackName: string;
  href: string;
  conceptLabels: string[];
  sortOrder: number;
}

export interface PublishedCatalogContextProblem {
  id: string;
  title: string;
  estimatedMinutes: number;
  trackCode: string;
  trackName: string;
  href: string;
  conceptLabels: string[];
  tags: string[];
  relatedLessons: PublishedCatalogContextLesson[];
  sortOrder: number;
}

export interface PublishedCatalogContextTrack {
  id: string;
  code: string;
  name: string;
  availability: TrackAvailability;
  sortOrder: number;
  lessons: PublishedCatalogContextLesson[];
  problems: PublishedCatalogContextProblem[];
}

interface PublishedCatalogBaseData {
  tracks: CatalogTrack[];
  lessons: CatalogLessonSummary[];
  problems: CatalogProblemSummary[];
  lessonLookup: Array<{
    id: string;
    slug: string;
    trackCode: string;
  }>;
  contextTracks: PublishedCatalogContextTrack[];
}

const CATALOG_RECOVERY_RETRY_DELAY_MS = 200;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecoverableCatalogError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    code === "P1001" ||
    code === "P2024" ||
    code === "P2028" ||
    /Connection terminated|connection timeout|timeout exceeded when trying to connect|Unable to start a transaction|Can't reach database server/i.test(
      message
    )
  );
}

function buildFixtureLessonId(trackCode: string, lessonSlug: string) {
  return `fixture:${trackCode}:${lessonSlug}`;
}

function buildFixtureLessonSectionId(
  trackCode: string,
  lessonSlug: string,
  suffix: string,
  index?: number
) {
  return `fixture:${trackCode}:${lessonSlug}:${suffix}${typeof index === "number" ? `:${index + 1}` : ""}`;
}

function mapFixtureTrackAvailability(
  value: FixtureTrackData["availability"]
): TrackAvailability {
  return (value === "coming_soon" ? "COMING_SOON" : "AVAILABLE") as TrackAvailability;
}

function findFixtureTrack(trackCode: string) {
  return fixtureTracks.find((track) => track.code === trackCode) ?? null;
}

function findFixtureLesson(trackCode: string, lessonSlug: string) {
  const track = findFixtureTrack(trackCode);
  if (!track) {
    return null;
  }

  const lesson = track.lessons.find((candidate) => candidate.slug === lessonSlug) ?? null;
  if (!lesson) {
    return null;
  }

  return { track, lesson };
}

function findFixtureLessonById(lessonId: string) {
  for (const track of fixtureTracks) {
    for (const lesson of track.lessons) {
      if (buildFixtureLessonId(track.code, lesson.slug) === lessonId) {
        return { track, lesson };
      }
    }
  }

  return null;
}

function pickFixtureQuizDistractors(
  track: FixtureTrackData,
  lesson: FixtureLessonData
) {
  const sameTrack = track.lessons
    .filter((candidate) => candidate.slug !== lesson.slug)
    .slice(0, 3)
    .map((candidate) => candidate.title);

  if (sameTrack.length === 3) {
    return sameTrack;
  }

  const crossTrack = fixtureTracks
    .flatMap((candidateTrack) => candidateTrack.lessons)
    .filter((candidate) => candidate.slug !== lesson.slug)
    .map((candidate) => candidate.title)
    .filter((title) => !sameTrack.includes(title));

  return [...sameTrack, ...crossTrack].slice(0, 3);
}

function buildFixtureLessonSections(
  track: FixtureTrackData,
  lesson: FixtureLessonData
): CatalogLessonSection[] {
  const explanationSections = extractLessonMarkdownSections(lesson.content).map(
    (section, index) => ({
      id: buildFixtureLessonSectionId(track.code, lesson.slug, "explanation", index),
      sectionType: "EXPLANATION" as SectionType,
      isRequired: true,
      title: section.title,
      content: section.markdown,
      payloadJson: null,
      sortOrder: index,
    })
  );

  const quizSection = {
    id: buildFixtureLessonSectionId(track.code, lesson.slug, "quiz"),
    sectionType: "QUIZ" as SectionType,
    isRequired: true,
    title: "理解チェック",
    content: "このレッスンの主題を確認します。",
    payloadJson: {
      question: "このレッスンで中心になるテーマはどれですか。",
      options: [lesson.title, ...pickFixtureQuizDistractors(track, lesson)],
      correctIndex: 0,
      explanation: lesson.summary,
    },
    sortOrder: explanationSections.length,
  } satisfies CatalogLessonSection;

  const codeSection = {
    id: buildFixtureLessonSectionId(track.code, lesson.slug, "code"),
    sectionType: "CODE_EXECUTION" as SectionType,
    isRequired: true,
    title: "手を動かす",
    content: "コードを実行して内容を確かめます。",
    payloadJson: {
      prompt: `${lesson.title} に出てきたコードを実行し、コンパイルを通します。`,
      starterCode: extractLessonSandboxCode(lesson.content),
      stdin: "",
      successMode: "compile" as const,
    },
    sortOrder: explanationSections.length + 1,
  } satisfies CatalogLessonSection;

  const summarySection = {
    id: buildFixtureLessonSectionId(track.code, lesson.slug, "summary"),
    sectionType: "SUMMARY" as SectionType,
    isRequired: false,
    title: "まとめ",
    content: lesson.summary,
    payloadJson: null,
    sortOrder: explanationSections.length + 2,
  } satisfies CatalogLessonSection;

  return [...explanationSections, quizSection, codeSection, summarySection];
}

function buildFixtureProblemSummary(problem: FixtureProblemData): CatalogProblemSummary {
  const track = findFixtureTrack(problem.trackCode);

  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    trackCode: problem.trackCode,
    trackName: track?.name ?? "学習トラック",
    relatedLessonSlugs: problem.relatedLessonSlugs,
    kind: problem.kind,
    estimatedMinutes: problem.estimatedMinutes,
  };
}

function buildFallbackPublishedCatalogBaseData(): PublishedCatalogBaseData {
  const tracks: CatalogTrack[] = [];
  const lessons: CatalogLessonSummary[] = [];
  const problems: CatalogProblemSummary[] = [];
  const lessonLookup: PublishedCatalogBaseData["lessonLookup"] = [];
  const lessonEntryBySlug = new Map<
    string,
    { track: FixtureTrackData; lesson: FixtureLessonData; sortOrder: number }
  >();
  const contextTracks: PublishedCatalogContextTrack[] = [];

  for (const track of fixtureTracks) {
    for (const [lessonIndex, lesson] of track.lessons.entries()) {
      lessonEntryBySlug.set(lesson.slug, {
        track,
        lesson,
        sortOrder: lessonIndex,
      });
    }
  }

  for (const [trackIndex, track] of fixtureTracks.entries()) {
    const lessonSummaries = track.lessons.map((lesson) => {
      const summary: CatalogLessonSummary = {
        id: buildFixtureLessonId(track.code, lesson.slug),
        trackCode: track.code,
        trackName: track.name,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        estimatedMinutes: lesson.estimatedMinutes,
      };

      lessons.push(summary);
      lessonLookup.push({
        id: summary.id,
        slug: lesson.slug,
        trackCode: track.code,
      });

      return summary;
    });

    const trackProblems = fixtureProblems
      .filter((problem) => problem.trackCode === track.code)
      .sort((left, right) => left.title.localeCompare(right.title, "ja"));

    const contextLessons = track.lessons.map((lesson, lessonIndex) => ({
      id: buildFixtureLessonId(track.code, lesson.slug),
      slug: lesson.slug,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      trackCode: track.code,
      trackName: track.name,
      href: `/learn/${track.code}/${lesson.slug}`,
      conceptLabels: [lesson.title],
      sortOrder: lessonIndex,
    }));

    const contextProblems = trackProblems.map((problem, problemIndex) => {
      const relatedLessons = problem.relatedLessonSlugs
        .map((lessonSlug) => {
          const match = lessonEntryBySlug.get(lessonSlug);
          if (!match) {
            return null;
          }

          return {
            id: buildFixtureLessonId(match.track.code, match.lesson.slug),
            slug: match.lesson.slug,
            title: match.lesson.title,
            estimatedMinutes: match.lesson.estimatedMinutes,
            trackCode: match.track.code,
            trackName: match.track.name,
            href: `/learn/${match.track.code}/${match.lesson.slug}`,
            conceptLabels: [match.lesson.title],
            sortOrder: match.sortOrder,
          } satisfies PublishedCatalogContextLesson;
        })
        .filter((lesson): lesson is PublishedCatalogContextLesson => lesson !== null);

      const summary = buildFixtureProblemSummary(problem);
      problems.push(summary);

      return {
        id: problem.id,
        title: problem.title,
        estimatedMinutes: problem.estimatedMinutes,
        trackCode: track.code,
        trackName: track.name,
        href: `/exercises/${problem.id}`,
        conceptLabels: problem.tags,
        tags: problem.tags,
        relatedLessons,
        sortOrder: problemIndex,
      } satisfies PublishedCatalogContextProblem;
    });

    tracks.push({
      id: `fixture:${track.code}`,
      code: track.code,
      label: track.label,
      name: track.name,
      description: track.description,
      gradient: track.gradient,
      availability: track.availability,
      roadmapTopics: track.roadmapTopics,
      launchNote: track.launchNote,
      lessons: lessonSummaries,
    });

    contextTracks.push({
      id: `fixture:${track.code}`,
      code: track.code,
      name: track.name,
      availability: mapFixtureTrackAvailability(track.availability),
      sortOrder: trackIndex,
      lessons: contextLessons,
      problems: contextProblems,
    });
  }

  return {
    tracks,
    lessons,
    problems,
    lessonLookup,
    contextTracks,
  };
}

function buildFallbackLessonDetail(
  trackCode: string,
  lessonSlug: string
): CatalogLessonDetail | null {
  const match = findFixtureLesson(trackCode, lessonSlug);
  if (!match) {
    return null;
  }

  const { track, lesson } = match;

  return {
    id: buildFixtureLessonId(track.code, lesson.slug),
    trackCode: track.code,
    trackName: track.name,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    content: lesson.content,
    track: {
      id: `fixture:${track.code}`,
      code: track.code,
      label: track.label,
      name: track.name,
      description: track.description,
      gradient: track.gradient,
      availability: track.availability,
      roadmapTopics: track.roadmapTopics,
      launchNote: track.launchNote,
    },
    sections: buildFixtureLessonSections(track, lesson),
  };
}

function buildFallbackProblemDetail(problemId: string): CatalogProblemDetail | null {
  const problem = fixtureProblems.find((candidate) => candidate.id === problemId) ?? null;
  if (!problem) {
    return null;
  }

  const track = findFixtureTrack(problem.trackCode);
  const relatedLessons = problem.relatedLessonSlugs
    .map((lessonSlug) => {
      const directMatch = findFixtureLesson(problem.trackCode, lessonSlug);
      if (directMatch) {
        return directMatch;
      }

      for (const candidateTrack of fixtureTracks) {
        const lesson = candidateTrack.lessons.find(
          (candidateLesson) => candidateLesson.slug === lessonSlug
        );
        if (lesson) {
          return { track: candidateTrack, lesson };
        }
      }

      return null;
    })
    .filter(
      (
        value
      ): value is { track: FixtureTrackData; lesson: FixtureLessonData } => value !== null
    )
    .map(({ track: relatedTrack, lesson }) => ({
      id: buildFixtureLessonId(relatedTrack.code, lesson.slug),
      slug: lesson.slug,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      trackCode: relatedTrack.code,
      trackName: relatedTrack.name,
    }));

  return {
    ...buildFixtureProblemSummary(problem),
    statement: problem.statement,
    constraintsText: problem.constraintsText,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    hintText: problem.hintText,
    explanationText: problem.explanationText,
    initialCode: problem.initialCode,
    solutionOutline: undefined,
    trackLabel: track?.label,
    relatedLessons,
    testCases: problem.testCases.map((testCase, index) => ({
      id: `fixture:${problem.id}:case:${index + 1}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isHidden: testCase.isHidden,
      timeLimitMs: 2000,
      memoryLimitKb: 262144,
      score: testCase.isHidden ? 0 : 1,
    })),
  };
}

function filterFallbackLessons(filters?: {
  trackCode?: string;
  q?: string;
}) {
  const query = filters?.q?.trim().toLocaleLowerCase("ja-JP") ?? "";

  return fixtureTracks
    .filter((track) => !filters?.trackCode || track.code === filters.trackCode)
    .flatMap((track) =>
      track.lessons
        .filter((lesson) => {
          if (!query) {
            return true;
          }

          return [lesson.title, lesson.summary, lesson.content].some((value) =>
            value.toLocaleLowerCase("ja-JP").includes(query)
          );
        })
        .map((lesson) => ({
          id: buildFixtureLessonId(track.code, lesson.slug),
          trackCode: track.code,
          trackName: track.name,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          estimatedMinutes: lesson.estimatedMinutes,
        }))
    );
}

function filterFallbackProblems(filters?: {
  trackCode?: string;
  difficulty?: string;
  tag?: string;
  q?: string;
}) {
  const query = filters?.q?.trim().toLocaleLowerCase("ja-JP") ?? "";
  const normalizedTag = filters?.tag?.trim();
  const normalizedDifficulty = filters?.difficulty?.trim().toLocaleLowerCase("ja-JP");

  return fixtureProblems
    .filter((problem) => !filters?.trackCode || problem.trackCode === filters.trackCode)
    .filter((problem) => !normalizedDifficulty || problem.difficulty === normalizedDifficulty)
    .filter((problem) => !normalizedTag || problem.tags.includes(normalizedTag))
    .filter((problem) => {
      if (!query) {
        return true;
      }

      return [problem.title, problem.statement, ...problem.tags].some((value) =>
        value.toLocaleLowerCase("ja-JP").includes(query)
      );
    })
    .map((problem) => buildFixtureProblemSummary(problem));
}

async function recoverCatalogRead<T>(
  label: string,
  initialError: unknown,
  execute: () => Promise<T>,
  fallback: () => T | Promise<T>
) {
  if (!isRecoverableCatalogError(initialError)) {
    throw initialError;
  }

  console.error(`[catalog] ${label} failed. Retrying once.`, initialError);
  await prisma.$disconnect().catch(() => undefined);
  await wait(CATALOG_RECOVERY_RETRY_DELAY_MS);

  try {
    return await execute();
  } catch (retryError) {
    if (!isRecoverableCatalogError(retryError)) {
      throw retryError;
    }

    console.error(`[catalog] ${label} fell back to fixture content.`, retryError);
    return fallback();
  }
}

function mapTrackAvailability(value: TrackAvailability) {
  return value === "COMING_SOON" ? "coming_soon" : "available";
}

function mapProblemType(value: ProblemType): CatalogProblemSummary["kind"] {
  if (value === "COMPILE_ERROR_FIX") return "compile_error_fix";
  if (value === "OWNERSHIP_FIX") return "ownership_fix";
  return "implementation";
}

function mapDifficulty(value: Difficulty): CatalogProblemSummary["difficulty"] {
  if (value === "MEDIUM") return "medium";
  if (value === "HARD" || value === "EXPERT") return "hard";
  return "easy";
}

function parseRoadmapTopics(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toLessonSummary(row: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  estimatedMinutes: number;
  track?: {
    code: string;
    name: string;
  };
}): CatalogLessonSummary {
  return {
    id: row.id,
    trackCode: row.track?.code,
    trackName: row.track?.name,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    estimatedMinutes: row.estimatedMinutes,
  };
}

function toTrack(row: {
  id: string;
  code: string;
  label: string | null;
  name: string;
  description: string | null;
  gradient: string | null;
  availability: TrackAvailability;
  roadmapTopicsJson: unknown;
  launchNote: string | null;
  lessons?: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    estimatedMinutes: number;
  }>;
}): CatalogTrack {
  return {
    id: row.id,
    code: row.code,
    label: row.label ?? row.code.toUpperCase(),
    name: row.name,
    description: row.description ?? "",
    gradient: row.gradient ?? "from-stone-600 to-stone-700",
    availability: mapTrackAvailability(row.availability),
    roadmapTopics: parseRoadmapTopics(row.roadmapTopicsJson),
    launchNote: row.launchNote ?? undefined,
    lessons: (row.lessons ?? []).map(toLessonSummary),
  };
}

function toLessonDetail(row: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  estimatedMinutes: number;
  content: string | null;
  track: {
    id: string;
    code: string;
    label: string | null;
    name: string;
    description: string | null;
    gradient: string | null;
    availability: TrackAvailability;
    roadmapTopicsJson: unknown;
    launchNote: string | null;
  };
  sections: Array<{
    id: string;
    sectionType: SectionType;
    isRequired: boolean;
    title: string | null;
    content: string;
    payloadJson: unknown;
    sortOrder: number;
  }>;
}): CatalogLessonDetail {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    estimatedMinutes: row.estimatedMinutes,
    content: row.content ?? "",
    track: {
      id: row.track.id,
      code: row.track.code,
      label: row.track.label ?? row.track.code.toUpperCase(),
      name: row.track.name,
      description: row.track.description ?? "",
      gradient: row.track.gradient ?? "from-stone-600 to-stone-700",
      availability: mapTrackAvailability(row.track.availability),
      roadmapTopics: parseRoadmapTopics(row.track.roadmapTopicsJson),
      launchNote: row.track.launchNote ?? undefined,
    },
    sections: row.sections.map((section) => ({
      id: section.id,
      sectionType: section.sectionType,
      isRequired: section.isRequired,
      title: section.title,
      content: section.content,
      payloadJson: section.payloadJson,
      sortOrder: section.sortOrder,
    })),
  };
}

function toProblemDetail(row: {
  id: string;
  title: string;
  statement: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  constraintsText: string | null;
  inputFormat: string | null;
  outputFormat: string | null;
  solutionOutline: string | null;
  hintText: string | null;
  explanationText: string | null;
  initialCode: string | null;
  type: ProblemType;
  track: {
    code: string;
    name: string;
    label: string | null;
  } | null;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  relatedLessons: Array<{
    lesson: {
      id: string;
      slug: string;
      title: string;
      estimatedMinutes: number;
      track: {
        code: string;
        name: string;
      };
    };
  }>;
  testCases: Array<{
    id: string;
    inputText: string;
    expectedOutputText: string;
    caseType: string;
    timeLimitMs: number;
    memoryLimitKb: number;
    score: number;
  }>;
}): CatalogProblemDetail {
  return {
    id: row.id,
    title: row.title,
    difficulty: mapDifficulty(row.difficulty),
    tags: row.tags.map((tag) => tag.tag.name),
    trackCode: row.track?.code ?? "track0",
    trackName: row.track?.name ?? "学習トラック",
    trackLabel: row.track?.label ?? undefined,
    relatedLessonSlugs: row.relatedLessons.map((relation) => relation.lesson.slug),
    kind: mapProblemType(row.type),
    estimatedMinutes: row.estimatedMinutes,
    statement: row.statement,
    constraintsText: row.constraintsText ?? undefined,
    inputFormat: row.inputFormat ?? undefined,
    outputFormat: row.outputFormat ?? undefined,
    solutionOutline: row.solutionOutline ?? undefined,
    hintText: row.hintText ?? undefined,
    explanationText: row.explanationText ?? undefined,
    initialCode: row.initialCode ?? "",
    relatedLessons: row.relatedLessons.map((relation) => ({
      id: relation.lesson.id,
      slug: relation.lesson.slug,
      title: relation.lesson.title,
      estimatedMinutes: relation.lesson.estimatedMinutes,
      trackCode: relation.lesson.track.code,
      trackName: relation.lesson.track.name,
    })),
    testCases: row.testCases.map((testCase) => ({
      id: testCase.id,
      input: testCase.inputText,
      expectedOutput: testCase.expectedOutputText,
      isHidden: testCase.caseType === "HIDDEN",
      timeLimitMs: testCase.timeLimitMs,
      memoryLimitKb: testCase.memoryLimitKb,
      score: testCase.score,
    })),
  };
}

async function fetchPublishedCatalogBaseData(): Promise<PublishedCatalogBaseData> {
  const rows = await prisma.track.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          estimatedMinutes: true,
          sortOrder: true,
        },
      },
      problems: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          relatedLessons: {
            include: {
              lesson: {
                include: {
                  track: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const tracks: CatalogTrack[] = [];
  const lessons: CatalogLessonSummary[] = [];
  const problems: CatalogProblemSummary[] = [];
  const lessonLookup: PublishedCatalogBaseData["lessonLookup"] = [];
  const contextTracks: PublishedCatalogContextTrack[] = [];

  for (const track of rows) {
    tracks.push(toTrack(track));

    const contextLessons = track.lessons.map((lesson) => {
      const summary = toLessonSummary({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        estimatedMinutes: lesson.estimatedMinutes,
        track: {
          code: track.code,
          name: track.name,
        },
      });

      lessons.push(summary);
      lessonLookup.push({
        id: lesson.id,
        slug: lesson.slug,
        trackCode: track.code,
      });

      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        trackCode: track.code,
        trackName: track.name,
        href: `/learn/${track.code}/${lesson.slug}`,
        conceptLabels: [lesson.title],
        sortOrder: lesson.sortOrder,
      } satisfies PublishedCatalogContextLesson;
    });

    const contextProblems = track.problems.map((problem) => {
      const relatedLessons = problem.relatedLessons.map((relation) => ({
        id: relation.lesson.id,
        slug: relation.lesson.slug,
        title: relation.lesson.title,
        estimatedMinutes: relation.lesson.estimatedMinutes,
        trackCode: relation.lesson.track.code,
        trackName: relation.lesson.track.name,
        href: `/learn/${relation.lesson.track.code}/${relation.lesson.slug}`,
        conceptLabels: [relation.lesson.title],
        sortOrder: relation.lesson.sortOrder,
      }));

      problems.push({
        id: problem.id,
        title: problem.title,
        difficulty: mapDifficulty(problem.difficulty),
        tags: problem.tags.map((tag) => tag.tag.name),
        trackCode: track.code,
        trackName: track.name,
        relatedLessonSlugs: relatedLessons.map((lesson) => lesson.slug),
        kind: mapProblemType(problem.type),
        estimatedMinutes: problem.estimatedMinutes,
      });

      return {
        id: problem.id,
        title: problem.title,
        estimatedMinutes: problem.estimatedMinutes,
        trackCode: track.code,
        trackName: track.name,
        href: `/exercises/${problem.id}`,
        conceptLabels: problem.tags.map((tag) => tag.tag.name),
        tags: problem.tags.map((tag) => tag.tag.name),
        relatedLessons,
        sortOrder: problem.sortOrder,
      } satisfies PublishedCatalogContextProblem;
    });

    contextTracks.push({
      id: track.id,
      code: track.code,
      name: track.name,
      availability: track.availability,
      sortOrder: track.sortOrder,
      lessons: contextLessons,
      problems: contextProblems,
    });
  }

  return {
    tracks,
    lessons,
    problems,
    lessonLookup,
    contextTracks,
  };
}

const getCachedPublishedCatalogBaseData = unstable_cache(
  fetchPublishedCatalogBaseData,
  ["catalog-base"],
  {
    tags: [CATALOG_TRACKS_TAG, CATALOG_LESSONS_TAG, CATALOG_PROBLEMS_TAG],
  }
);

async function fetchPublishedLessonDetail(
  trackCode: string,
  lessonSlug: string
): Promise<CatalogLessonDetail | null> {
  const row = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      isPublished: true,
      track: { code: trackCode },
    },
    include: {
      track: true,
      sections: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return row ? toLessonDetail(row) : null;
}

function getCachedPublishedLessonDetail(trackCode: string, lessonSlug: string) {
  return unstable_cache(
    () => fetchPublishedLessonDetail(trackCode, lessonSlug),
    ["catalog-lesson-detail", trackCode, lessonSlug],
    {
      tags: [
        CATALOG_LESSONS_TAG,
        getCatalogTrackTag(trackCode),
        getCatalogLessonTag(trackCode, lessonSlug),
      ],
    }
  )();
}

async function fetchPublishedProblemDetail(
  problemId: string
): Promise<CatalogProblemDetail | null> {
  const row = await prisma.problem.findFirst({
    where: {
      id: problemId,
      isPublished: true,
    },
    include: {
      track: true,
      tags: {
        include: {
          tag: true,
        },
      },
      relatedLessons: {
        include: {
          lesson: {
            include: {
              track: true,
            },
          },
        },
      },
      testCases: {
        orderBy: { id: "asc" },
      },
    },
  });

  return row ? toProblemDetail(row) : null;
}

function getCachedPublishedProblemDetail(problemId: string) {
  return unstable_cache(
    () => fetchPublishedProblemDetail(problemId),
    ["catalog-problem-detail", problemId],
    {
      tags: [CATALOG_PROBLEMS_TAG, getCatalogProblemTag(problemId)],
    }
  )();
}

const getPublishedCatalogBaseDataWithRecovery = cache(async () => {
  try {
    return await getCachedPublishedCatalogBaseData();
  } catch (error) {
    return recoverCatalogRead(
      "published catalog base",
      error,
      fetchPublishedCatalogBaseData,
      buildFallbackPublishedCatalogBaseData
    );
  }
});

const getPublishedLessonDetailWithRecovery = cache(
  async (trackCode: string, lessonSlug: string) => {
    try {
      return await getCachedPublishedLessonDetail(trackCode, lessonSlug);
    } catch (error) {
      return recoverCatalogRead(
        `published lesson detail (${trackCode}/${lessonSlug})`,
        error,
        () => fetchPublishedLessonDetail(trackCode, lessonSlug),
        () => buildFallbackLessonDetail(trackCode, lessonSlug)
      );
    }
  }
);

const getPublishedProblemDetailWithRecovery = cache(async (problemId: string) => {
  try {
    return await getCachedPublishedProblemDetail(problemId);
  } catch (error) {
    return recoverCatalogRead(
      `published problem detail (${problemId})`,
      error,
      () => fetchPublishedProblemDetail(problemId),
      () => buildFallbackProblemDetail(problemId)
    );
  }
});

export function getTrackDisplayName(track: Pick<CatalogTrack, "label" | "name">) {
  return `${track.label} — ${track.name}`;
}

export function getTrackVolumeLabel(
  track: Pick<CatalogTrack, "availability" | "roadmapTopics" | "lessons">
) {
  if (track.availability === "coming_soon") {
    return `予定 ${track.roadmapTopics.length} テーマ`;
  }

  if (track.lessons.length === track.roadmapTopics.length) {
    return `全 ${track.lessons.length} 回`;
  }

  return `公開 ${track.lessons.length} / ${track.roadmapTopics.length} テーマ`;
}

export async function getPublishedCatalogContextTracks() {
  const baseData = await getPublishedCatalogBaseDataWithRecovery();
  return baseData.contextTracks;
}

export async function getCatalogTracks() {
  const baseData = await getPublishedCatalogBaseDataWithRecovery();
  return baseData.tracks;
}

export async function getCatalogLessons(filters?: {
  trackCode?: string;
  q?: string;
  includeUnpublished?: boolean;
}) {
  if (!filters?.q && !filters?.includeUnpublished) {
    const baseData = await getPublishedCatalogBaseDataWithRecovery();
    return filters?.trackCode
      ? baseData.lessons.filter((lesson) => lesson.trackCode === filters.trackCode)
      : baseData.lessons;
  }

  let rows;
  try {
    rows = await prisma.lesson.findMany({
      where: {
        ...(filters?.includeUnpublished ? {} : { isPublished: true }),
        ...(filters?.trackCode ? { track: { code: filters.trackCode } } : {}),
        ...(filters?.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { summary: { contains: filters.q, mode: "insensitive" } },
                { content: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ track: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        track: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    if (filters?.includeUnpublished || !isRecoverableCatalogError(error)) {
      throw error;
    }

    console.error("[catalog] lesson query fell back to fixture content.", error);
    return filterFallbackLessons(filters);
  }

  return rows.map((row) =>
    toLessonSummary({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      estimatedMinutes: row.estimatedMinutes,
      track: row.track,
    })
  );
}

export async function getCatalogTrackByCode(trackCode: string) {
  const baseData = await getPublishedCatalogBaseDataWithRecovery();
  return baseData.tracks.find((track) => track.code === trackCode) ?? null;
}

export async function getCatalogTrackBySlug(trackCode: string) {
  return getCatalogTrackByCode(trackCode);
}

export async function getCatalogLessonByTrackAndSlug(
  trackCode: string,
  lessonSlug: string
) {
  return getPublishedLessonDetailWithRecovery(trackCode, lessonSlug);
}

export async function getCatalogLessonBySlug(lessonSlug: string) {
  const baseData = await getPublishedCatalogBaseDataWithRecovery();
  const match = baseData.lessonLookup.find((lesson) => lesson.slug === lessonSlug);

  if (!match) {
    return null;
  }

  return getPublishedLessonDetailWithRecovery(match.trackCode, lessonSlug);
}

export async function getCatalogLessonById(lessonId: string) {
  const baseData = await getPublishedCatalogBaseDataWithRecovery();
  const match = baseData.lessonLookup.find((lesson) => lesson.id === lessonId);

  if (!match) {
    const fixtureMatch = findFixtureLessonById(lessonId);
    return fixtureMatch
      ? buildFallbackLessonDetail(fixtureMatch.track.code, fixtureMatch.lesson.slug)
      : null;
  }

  return getPublishedLessonDetailWithRecovery(match.trackCode, match.slug);
}

export async function getCatalogProblems(filters?: {
  trackCode?: string;
  difficulty?: string;
  tag?: string;
  q?: string;
  includeUnpublished?: boolean;
}) {
  if (
    !filters?.includeUnpublished &&
    !filters?.difficulty &&
    !filters?.tag &&
    !filters?.q
  ) {
    const baseData = await getPublishedCatalogBaseDataWithRecovery();
    return filters?.trackCode
      ? baseData.problems.filter((problem) => problem.trackCode === filters.trackCode)
      : baseData.problems;
  }

  let rows;
  try {
    rows = await prisma.problem.findMany({
      where: {
        ...(filters?.includeUnpublished ? {} : { isPublished: true }),
        ...(filters?.trackCode ? { track: { code: filters.trackCode } } : {}),
        ...(filters?.difficulty
          ? { difficulty: filters.difficulty.toUpperCase() as Difficulty }
          : {}),
        ...(filters?.tag ? { tags: { some: { tag: { name: filters.tag } } } } : {}),
        ...(filters?.q
          ? {
              OR: [
                { title: { contains: filters.q, mode: "insensitive" } },
                { statement: { contains: filters.q, mode: "insensitive" } },
                {
                  tags: {
                    some: {
                      tag: {
                        name: { contains: filters.q, mode: "insensitive" },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        track: true,
        tags: {
          include: {
            tag: true,
          },
        },
        relatedLessons: {
          include: {
            lesson: {
              include: {
                track: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (filters?.includeUnpublished || !isRecoverableCatalogError(error)) {
      throw error;
    }

    console.error("[catalog] problem query fell back to fixture content.", error);
    return filterFallbackProblems(filters);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: mapDifficulty(row.difficulty),
    tags: row.tags.map((tag) => tag.tag.name),
    trackCode: row.track?.code ?? "track0",
    trackName: row.track?.name ?? "学習トラック",
    relatedLessonSlugs: row.relatedLessons.map((relation) => relation.lesson.slug),
    kind: mapProblemType(row.type),
    estimatedMinutes: row.estimatedMinutes,
  })) satisfies CatalogProblemSummary[];
}

export async function getCatalogProblemById(problemId: string) {
  return getPublishedProblemDetailWithRecovery(problemId);
}
