import { tracks } from "@/data/lessons";
import { problems, type ProblemData } from "@/data/problems";
import { buildLessonEntityId } from "@/lib/learning-catalog";
import {
  CaseType,
  Difficulty,
  ProblemType,
  prisma,
} from "@/lib/prisma";

const globalForContentSync = globalThis as unknown as {
  learningCatalogSyncPromise?: Promise<void>;
  learningCatalogLastSyncedAt?: number;
};

const CONTENT_SYNC_TTL_MS = 60_000;

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

export function buildProblemTestCaseId(
  problemId: string,
  index: number,
  isHidden: boolean
) {
  return `${problemId}::${isHidden ? "hidden" : "sample"}::${index + 1}`;
}

async function syncLearningCatalogToDatabase() {
  const trackIdByCode = new Map<string, string>();

  for (const [trackIndex, track] of tracks.entries()) {
    const row = await prisma.track.upsert({
      where: { code: track.code },
      update: {
        name: track.name,
        description: track.description,
        sortOrder: trackIndex,
      },
      create: {
        code: track.code,
        name: track.name,
        description: track.description,
        sortOrder: trackIndex,
      },
      select: {
        id: true,
        code: true,
      },
    });

    trackIdByCode.set(row.code, row.id);
  }

  for (const track of tracks) {
    const trackId = trackIdByCode.get(track.code);

    if (!trackId) {
      continue;
    }

    for (const [lessonIndex, lesson] of track.lessons.entries()) {
      await prisma.lesson.upsert({
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
          id: buildLessonEntityId(track.code, lesson.slug),
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
      });
    }
  }

  for (const [problemIndex, problem] of problems.entries()) {
    await prisma.problem.upsert({
      where: { id: problem.id },
      update: {
        type: mapProblemType(problem.kind),
        title: problem.title,
        statement: problem.statement,
        difficulty: mapDifficulty(problem.difficulty),
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
        type: mapProblemType(problem.kind),
        title: problem.title,
        statement: problem.statement,
        difficulty: mapDifficulty(problem.difficulty),
        constraintsText: problem.constraintsText,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        hintText: problem.hintText,
        explanationText: problem.explanationText,
        initialCode: problem.initialCode,
        sortOrder: problemIndex,
        isPublished: true,
      },
    });

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
          problemId: problem.id,
          caseType: testCase.isHidden ? CaseType.HIDDEN : CaseType.SAMPLE,
          inputText: testCase.input,
          expectedOutputText: testCase.expectedOutput,
          score: testCase.isHidden ? 0 : 100,
        },
        create: {
          id: buildProblemTestCaseId(problem.id, testcaseIndex, testCase.isHidden),
          problemId: problem.id,
          caseType: testCase.isHidden ? CaseType.HIDDEN : CaseType.SAMPLE,
          inputText: testCase.input,
          expectedOutputText: testCase.expectedOutput,
          score: testCase.isHidden ? 0 : 100,
        },
      });
    }
  }
}

export async function ensureLearningCatalogSynced() {
  const lastSyncedAt = globalForContentSync.learningCatalogLastSyncedAt ?? 0;

  if (Date.now() - lastSyncedAt < CONTENT_SYNC_TTL_MS) {
    return;
  }

  if (!globalForContentSync.learningCatalogSyncPromise) {
    globalForContentSync.learningCatalogSyncPromise =
      syncLearningCatalogToDatabase()
        .then(() => {
          globalForContentSync.learningCatalogLastSyncedAt = Date.now();
        })
        .finally(() => {
          globalForContentSync.learningCatalogSyncPromise = undefined;
        });
  }

  await globalForContentSync.learningCatalogSyncPromise;
}
