import { unstable_cache } from "next/cache";
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
  const baseData = await getCachedPublishedCatalogBaseData();
  return baseData.contextTracks;
}

export async function getCatalogTracks() {
  const baseData = await getCachedPublishedCatalogBaseData();
  return baseData.tracks;
}

export async function getCatalogLessons(filters?: {
  trackCode?: string;
  q?: string;
  includeUnpublished?: boolean;
}) {
  if (!filters?.q && !filters?.includeUnpublished) {
    const baseData = await getCachedPublishedCatalogBaseData();
    return filters?.trackCode
      ? baseData.lessons.filter((lesson) => lesson.trackCode === filters.trackCode)
      : baseData.lessons;
  }

  const rows = await prisma.lesson.findMany({
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
  const baseData = await getCachedPublishedCatalogBaseData();
  return baseData.tracks.find((track) => track.code === trackCode) ?? null;
}

export async function getCatalogTrackBySlug(trackCode: string) {
  return getCatalogTrackByCode(trackCode);
}

export async function getCatalogLessonByTrackAndSlug(
  trackCode: string,
  lessonSlug: string
) {
  return getCachedPublishedLessonDetail(trackCode, lessonSlug);
}

export async function getCatalogLessonBySlug(lessonSlug: string) {
  const baseData = await getCachedPublishedCatalogBaseData();
  const match = baseData.lessonLookup.find((lesson) => lesson.slug === lessonSlug);

  if (!match) {
    return null;
  }

  return getCachedPublishedLessonDetail(match.trackCode, lessonSlug);
}

export async function getCatalogLessonById(lessonId: string) {
  const baseData = await getCachedPublishedCatalogBaseData();
  const match = baseData.lessonLookup.find((lesson) => lesson.id === lessonId);

  if (!match) {
    return null;
  }

  return getCachedPublishedLessonDetail(match.trackCode, match.slug);
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
    const baseData = await getCachedPublishedCatalogBaseData();
    return filters?.trackCode
      ? baseData.problems.filter((problem) => problem.trackCode === filters.trackCode)
      : baseData.problems;
  }

  const rows = await prisma.problem.findMany({
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
  return getCachedPublishedProblemDetail(problemId);
}
