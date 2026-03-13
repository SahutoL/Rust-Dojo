import type { InputJsonValue } from "@prisma/client/runtime/client";
import { tracks, type LessonData, type TrackData } from "../data/lessons";
import { problems, type ProblemData } from "../data/problems";
import { buildProblemTestCaseId } from "./problem-testcase-id";
import {
  extractLessonMarkdownSections,
  extractLessonSandboxCode,
} from "./lesson-markdown";
import {
  CaseType,
  Difficulty,
  EntityType,
  ProblemType,
  ReviewReasonType,
  TrackAvailability,
  prisma,
} from "./prisma";

interface LessonQuizPayload {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonCodeExecutionPayload {
  prompt: string;
  starterCode: string;
  stdin: string;
  successMode: "compile";
}

function mapTrackAvailability(value: TrackData["availability"]) {
  return value === "coming_soon"
    ? TrackAvailability.COMING_SOON
    : TrackAvailability.AVAILABLE;
}

function mapProblemType(kind: ProblemData["kind"]) {
  switch (kind) {
    case "compile_error_fix":
      return ProblemType.COMPILE_ERROR_FIX;
    case "ownership_fix":
      return ProblemType.OWNERSHIP_FIX;
    case "implementation":
    default:
      return ProblemType.IMPLEMENTATION;
  }
}

function mapDifficulty(value: ProblemData["difficulty"]) {
  switch (value) {
    case "medium":
      return Difficulty.MEDIUM;
    case "hard":
      return Difficulty.HARD;
    case "easy":
    default:
      return Difficulty.EASY;
  }
}

function buildLessonLegacyEntityId(trackCode: string, lessonSlug: string) {
  return `${trackCode}/${lessonSlug}`;
}

function buildLessonSectionId(
  lessonSlug: string,
  suffix: string,
  index?: number
) {
  return `${lessonSlug}::${suffix}${typeof index === "number" ? `::${index + 1}` : ""}`;
}

function buildLessonExplanationSections(lesson: LessonData) {
  if (lesson.explanationSections && lesson.explanationSections.length > 0) {
    return lesson.explanationSections.map((section, index) => ({
      id: buildLessonSectionId(lesson.slug, "explanation", index),
      sectionType: "EXPLANATION" as const,
      isRequired: section.isRequired ?? true,
      title: section.title,
      content: section.content,
      payloadJson: null,
      sortOrder: index,
    }));
  }

  return extractLessonMarkdownSections(lesson.content).map((section, index) => ({
    id: buildLessonSectionId(lesson.slug, "explanation", index),
    sectionType: "EXPLANATION" as const,
    isRequired: true,
    title: section.title,
    content: section.markdown,
    payloadJson: null,
    sortOrder: index,
  }));
}

function pickQuizDistractors(track: TrackData, lesson: LessonData) {
  const sameTrack = track.lessons
    .filter((candidate) => candidate.slug !== lesson.slug)
    .slice(0, 3)
    .map((candidate) => candidate.title);

  if (sameTrack.length === 3) {
    return sameTrack;
  }

  const crossTrack = tracks
    .flatMap((candidateTrack) => candidateTrack.lessons)
    .filter((candidate) => candidate.slug !== lesson.slug)
    .map((candidate) => candidate.title)
    .filter((title) => !sameTrack.includes(title));

  return [...sameTrack, ...crossTrack].slice(0, 3);
}

function buildLessonQuizPayload(track: TrackData, lesson: LessonData): LessonQuizPayload {
  if (lesson.quiz) {
    return lesson.quiz;
  }

  const distractors = pickQuizDistractors(track, lesson);
  const options = [lesson.title, ...distractors];

  return {
    question: "このレッスンで中心になるテーマはどれですか。",
    options,
    correctIndex: 0,
    explanation: lesson.summary,
  };
}

function buildLessonCodePayload(lesson: LessonData): LessonCodeExecutionPayload {
  if (lesson.sandbox) {
    return {
      prompt: lesson.sandbox.prompt,
      starterCode: lesson.sandbox.starterCode,
      stdin: lesson.sandbox.stdin ?? "",
      successMode: lesson.sandbox.successMode,
    };
  }

  return {
    prompt: `${lesson.title} に出てきたコードを実行し、コンパイルを通します。`,
    starterCode: extractLessonSandboxCode(lesson.content),
    stdin: "",
    successMode: "compile",
  };
}

async function syncFixtureTrack(track: TrackData, trackIndex: number) {
  return prisma.track.upsert({
    where: { code: track.code },
    update: {
      label: track.label,
      name: track.name,
      description: track.description,
      gradient: track.gradient,
      availability: mapTrackAvailability(track.availability),
      roadmapTopicsJson: track.roadmapTopics,
      launchNote: track.launchNote ?? null,
      sortOrder: trackIndex,
    },
    create: {
      code: track.code,
      label: track.label,
      name: track.name,
      description: track.description,
      gradient: track.gradient,
      availability: mapTrackAvailability(track.availability),
      roadmapTopicsJson: track.roadmapTopics,
      launchNote: track.launchNote ?? null,
      sortOrder: trackIndex,
    },
    select: {
      id: true,
      code: true,
    },
  });
}

async function syncFixtureLesson(track: TrackData, trackId: string, lesson: LessonData, lessonIndex: number) {
  const lessonRow = await prisma.lesson.upsert({
    where: { slug: lesson.slug },
    update: {
      trackId,
      title: lesson.title,
      level: lessonIndex + 1,
      estimatedMinutes: lesson.estimatedMinutes,
      summary: lesson.summary,
      content: lesson.content,
      sortOrder: lessonIndex,
      isPublished: track.availability === "available",
    },
    create: {
      trackId,
      slug: lesson.slug,
      title: lesson.title,
      level: lessonIndex + 1,
      estimatedMinutes: lesson.estimatedMinutes,
      summary: lesson.summary,
      content: lesson.content,
      sortOrder: lessonIndex,
      isPublished: track.availability === "available",
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const explanationSections = buildLessonExplanationSections(lesson).map((section) => ({
    ...section,
    lessonId: lessonRow.id,
  }));
  const quizSection = {
    id: buildLessonSectionId(lesson.slug, "quiz"),
    lessonId: lessonRow.id,
    sectionType: "QUIZ" as const,
    isRequired: true,
    title: "理解チェック",
    content: "このレッスンの理解を確認します。",
    payloadJson: buildLessonQuizPayload(track, lesson),
    sortOrder: explanationSections.length,
  };
  const codeSection = {
    id: buildLessonSectionId(lesson.slug, "code"),
    lessonId: lessonRow.id,
    sectionType: "CODE_EXECUTION" as const,
    isRequired: true,
    title: "手を動かす",
    content: lesson.sandbox?.prompt ?? "コードを実行して内容を確かめます。",
    payloadJson: buildLessonCodePayload(lesson),
    sortOrder: explanationSections.length + 1,
  };
  const summarySection = {
    id: buildLessonSectionId(lesson.slug, "summary"),
    lessonId: lessonRow.id,
    sectionType: "SUMMARY" as const,
    isRequired: false,
    title: lesson.summarySection?.title ?? "まとめ",
    content: lesson.summarySection?.content ?? lesson.summary,
    payloadJson: null,
    sortOrder: explanationSections.length + 2,
  };
  const sections = [...explanationSections, quizSection, codeSection, summarySection];

  await prisma.lessonSection.deleteMany({
    where: {
      lessonId: lessonRow.id,
      id: { notIn: sections.map((section) => section.id) },
    },
  });

  for (const section of sections) {
    const normalizedPayloadJson =
      section.payloadJson == null
        ? undefined
        : (section.payloadJson as unknown as InputJsonValue);
    await prisma.lessonSection.upsert({
      where: { id: section.id },
      update: {
        lessonId: section.lessonId,
        sectionType: section.sectionType,
        isRequired: section.isRequired,
        title: section.title,
        content: section.content,
        payloadJson: normalizedPayloadJson,
        sortOrder: section.sortOrder,
      },
      create: {
        ...section,
        ...(typeof normalizedPayloadJson === "undefined"
          ? { payloadJson: undefined }
          : { payloadJson: normalizedPayloadJson }),
      },
    });
  }

  await prisma.progress.updateMany({
    where: {
      entityType: EntityType.LESSON,
      entityId: buildLessonLegacyEntityId(track.code, lesson.slug),
    },
    data: {
      entityId: lessonRow.id,
    },
  });

  await prisma.progress.updateMany({
    where: {
      entityType: EntityType.LESSON,
      entityId: lesson.slug,
    },
    data: {
      entityId: lessonRow.id,
    },
  });

  await prisma.reviewQueueItem.updateMany({
    where: {
      sourceType: EntityType.LESSON,
      sourceId: buildLessonLegacyEntityId(track.code, lesson.slug),
      reasonType: ReviewReasonType.PERIODIC_REVIEW,
    },
    data: {
      sourceId: lessonRow.id,
    },
  });

  await prisma.reviewQueueItem.updateMany({
    where: {
      sourceType: EntityType.LESSON,
      sourceId: lesson.slug,
      reasonType: ReviewReasonType.PERIODIC_REVIEW,
    },
    data: {
      sourceId: lessonRow.id,
    },
  });

  await prisma.recommendation.updateMany({
    where: {
      targetType: EntityType.LESSON,
      targetId: buildLessonLegacyEntityId(track.code, lesson.slug),
    },
    data: {
      targetId: lessonRow.id,
    },
  });

  await prisma.recommendation.updateMany({
    where: {
      targetType: EntityType.LESSON,
      targetId: lesson.slug,
    },
    data: {
      targetId: lessonRow.id,
    },
  });
}

async function upsertTagIds(names: string[]) {
  const ids: string[] = [];

  for (const name of names) {
    const row = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });
    ids.push(row.id);
  }

  return ids;
}

async function syncFixtureProblem(problem: ProblemData, problemIndex: number, trackIdByCode: Map<string, string>) {
  const trackId = trackIdByCode.get(problem.trackCode) ?? null;
  const problemRow = await prisma.problem.upsert({
    where: { id: problem.id },
    update: {
      trackId,
      type: mapProblemType(problem.kind),
      title: problem.title,
      statement: problem.statement,
      difficulty: mapDifficulty(problem.difficulty),
      estimatedMinutes: problem.estimatedMinutes,
      constraintsText: problem.constraintsText,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      hintText: problem.hintText,
      explanationText: problem.explanationText,
      initialCode: problem.initialCode,
      sortOrder: problemIndex,
      isPublished: true,
    },
    create: {
      id: problem.id,
      trackId,
      type: mapProblemType(problem.kind),
      title: problem.title,
      statement: problem.statement,
      difficulty: mapDifficulty(problem.difficulty),
      estimatedMinutes: problem.estimatedMinutes,
      constraintsText: problem.constraintsText,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      hintText: problem.hintText,
      explanationText: problem.explanationText,
      initialCode: problem.initialCode,
      sortOrder: problemIndex,
      isPublished: true,
    },
    select: {
      id: true,
    },
  });

  const tagIds = await upsertTagIds(problem.tags);

  await prisma.problemTag.deleteMany({
    where: {
      problemId: problem.id,
      tagId: { notIn: tagIds },
    },
  });

  for (const tagId of tagIds) {
    await prisma.problemTag.upsert({
      where: {
        problemId_tagId: {
          problemId: problem.id,
          tagId,
        },
      },
      update: {},
      create: {
        problemId: problem.id,
        tagId,
      },
    });
  }

  const relatedLessonIds = await prisma.lesson.findMany({
    where: {
      slug: {
        in: problem.relatedLessonSlugs,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.problemLesson.deleteMany({
    where: {
      problemId: problem.id,
      lessonId: { notIn: relatedLessonIds.map((lesson) => lesson.id) },
    },
  });

  for (const lesson of relatedLessonIds) {
    await prisma.problemLesson.upsert({
      where: {
        problemId_lessonId: {
          problemId: problem.id,
          lessonId: lesson.id,
        },
      },
      update: {},
      create: {
        problemId: problem.id,
        lessonId: lesson.id,
      },
    });
  }

  const testcaseIds = problem.testCases.map((testCase, index) =>
    buildProblemTestCaseId(problem.id, index, testCase.isHidden)
  );

  await prisma.problemTestCase.deleteMany({
    where: {
      problemId: problem.id,
      id: { notIn: testcaseIds },
    },
  });

  for (const [testcaseIndex, testCase] of problem.testCases.entries()) {
    await prisma.problemTestCase.upsert({
      where: {
        id: buildProblemTestCaseId(problem.id, testcaseIndex, testCase.isHidden),
      },
      update: {
        problemId: problemRow.id,
        caseType: testCase.isHidden ? CaseType.HIDDEN : CaseType.SAMPLE,
        inputText: testCase.input,
        expectedOutputText: testCase.expectedOutput,
        score: testCase.isHidden ? 0 : 100,
      },
      create: {
        id: buildProblemTestCaseId(problem.id, testcaseIndex, testCase.isHidden),
        problemId: problemRow.id,
        caseType: testCase.isHidden ? CaseType.HIDDEN : CaseType.SAMPLE,
        inputText: testCase.input,
        expectedOutputText: testCase.expectedOutput,
        score: testCase.isHidden ? 0 : 100,
      },
    });
  }
}

export async function bootstrapContentFixtures() {
  const trackIdByCode = new Map<string, string>();

  for (const [trackIndex, track] of tracks.entries()) {
    const row = await syncFixtureTrack(track, trackIndex);
    trackIdByCode.set(row.code, row.id);
  }

  for (const track of tracks) {
    const trackId = trackIdByCode.get(track.code);

    if (!trackId) {
      continue;
    }

    for (const [lessonIndex, lesson] of track.lessons.entries()) {
      await syncFixtureLesson(track, trackId, lesson, lessonIndex);
    }
  }

  for (const [problemIndex, problem] of problems.entries()) {
    await syncFixtureProblem(problem, problemIndex, trackIdByCode);
  }
}

export async function ensureLearningCatalogSynced() {
  return;
}
