import { tracks } from "@/data/lessons";
import { problems } from "@/data/problems";
import {
  isReviewAvailable,
  sortReviewQueue,
  type LearningSnapshot,
  type LessonProgressSnapshot,
  type RecommendationSnapshot,
  type RecommendationType,
  type ReviewQueueItemSnapshot,
  type SubmissionSnapshot,
  type SubmissionStatus,
} from "@/data/learningSnapshot";
import { type AccountSnapshot, getAccountSnapshot } from "@/lib/account";
import { ensureLearningCatalogSynced, buildProblemTestCaseId } from "@/lib/content-sync";
import {
  buildLessonEntityId,
  getTotalLessonCount,
  getTotalProblemCount,
  getTrackProblemTotals,
  resolveLessonEntity,
  resolveProblemEntity,
} from "@/lib/learning-catalog";
import {
  EntityType,
  ProgressState,
  RecommendationType as PrismaRecommendationType,
  ReviewReasonType,
  SubmissionStatus as PrismaSubmissionStatus,
  prisma,
} from "@/lib/prisma";

type ProgressRow = {
  entityType: EntityType;
  entityId: string;
  progressState: ProgressState;
  score: number | null;
  lastAccessedAt: Date;
  completedAt: Date | null;
};

type ReviewRow = {
  id: string;
  sourceType: EntityType;
  sourceId: string;
  reasonType: ReviewReasonType;
  priority: number;
  availableAt: Date;
};

type RecommendationRow = {
  id: string;
  recommendationType: PrismaRecommendationType;
  targetType: EntityType;
  targetId: string;
  reasonText: string | null;
};

interface RecommendationDraft {
  recommendationType: RecommendationType;
  targetType: RecommendationSnapshot["targetType"];
  targetId: string;
  title: string;
  reasonText: string;
  href: string;
}

export interface PersistedSubmissionResultInput {
  index: number;
  status: SubmissionStatus;
  actualOutput: string;
  stderr: string;
  isHidden: boolean;
}

export interface PersistedSubmissionInput {
  problemId: string;
  sourceCode: string;
  overallStatus: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  results: PersistedSubmissionResultInput[];
}

function mapProgressState(value: ProgressState): LessonProgressSnapshot["progressState"] {
  return value;
}

function mapSubmissionStatus(
  value: PrismaSubmissionStatus
): SubmissionStatus | null {
  if (value === PrismaSubmissionStatus.AC) return "AC";
  if (value === PrismaSubmissionStatus.WA) return "WA";
  if (value === PrismaSubmissionStatus.CE) return "CE";
  if (value === PrismaSubmissionStatus.TLE) return "TLE";
  if (value === PrismaSubmissionStatus.RE) return "RE";
  return null;
}

function toPrismaSubmissionStatus(value: SubmissionStatus) {
  switch (value) {
    case "WA":
      return PrismaSubmissionStatus.WA;
    case "CE":
      return PrismaSubmissionStatus.CE;
    case "TLE":
      return PrismaSubmissionStatus.TLE;
    case "RE":
      return PrismaSubmissionStatus.RE;
    case "AC":
    default:
      return PrismaSubmissionStatus.AC;
  }
}

function mapRecommendationType(
  value: PrismaRecommendationType
): RecommendationType {
  if (value === PrismaRecommendationType.COMPETITIVE_SET) {
    return "COMPETITIVE_SET";
  }

  if (value === PrismaRecommendationType.PRACTICAL_TASK) {
    return "PRACTICAL_TASK";
  }

  return value;
}

function toPrismaRecommendationType(value: RecommendationType) {
  if (value === "COMPETITIVE_SET") {
    return PrismaRecommendationType.COMPETITIVE_SET;
  }

  if (value === "PRACTICAL_TASK") {
    return PrismaRecommendationType.PRACTICAL_TASK;
  }

  return value;
}

function mapSubmissionStatusToReviewReason(status: SubmissionStatus) {
  switch (status) {
    case "CE":
      return ReviewReasonType.COMPILE_ERROR;
    case "TLE":
      return ReviewReasonType.LONG_TIME;
    case "RE":
      return ReviewReasonType.WRONG_ANSWER;
    case "WA":
    default:
      return ReviewReasonType.WRONG_ANSWER;
  }
}

function mapSubmissionStatusToPriority(status: SubmissionStatus) {
  switch (status) {
    case "WA":
      return 90;
    case "CE":
      return 85;
    case "TLE":
      return 75;
    case "RE":
      return 70;
    case "AC":
    default:
      return 40;
  }
}

function buildStreakSummary(timestamps: Array<string | Date>) {
  const uniqueDays = Array.from(
    new Set(
      timestamps.map((timestamp) =>
        new Date(timestamp).toISOString().slice(0, 10)
      )
    )
  ).sort();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let currentRun = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(uniqueDays[index - 1]);
    const current = new Date(uniqueDays[index]);
    const diffDays =
      (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);

    if (diffDays === 1) {
      currentRun += 1;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let currentStreak = 0;
  let cursor = uniqueDays.length - 1;
  let expectedDay =
    uniqueDays[uniqueDays.length - 1] === todayKey ? todayKey : yesterday;

  while (cursor >= 0 && uniqueDays[cursor] === expectedDay) {
    currentStreak += 1;
    const nextExpected = new Date(`${expectedDay}T00:00:00.000Z`);
    nextExpected.setUTCDate(nextExpected.getUTCDate() - 1);
    expectedDay = nextExpected.toISOString().slice(0, 10);
    cursor -= 1;
  }

  return { currentStreak, longestStreak };
}

function getPreferredTrackCodes(account: AccountSnapshot) {
  const codes: string[] = [];

  switch (account.primaryGoal) {
    case "PROGRAMMING_BASICS":
      codes.push("track0", "track1", "track3");
      break;
    case "ATCODER":
      if (
        account.skillLevel === "INTERMEDIATE" ||
        account.skillLevel === "ADVANCED"
      ) {
        codes.push("track3", "track1", "track0");
      } else {
        codes.push("track1", "track3", "track0");
      }
      break;
    case "RUST_PRACTICAL":
    case "OSS":
    case "CAREER":
      if (
        account.skillLevel === "INTERMEDIATE" ||
        account.skillLevel === "ADVANCED"
      ) {
        codes.push("track2", "track1", "track3", "track0");
      } else {
        codes.push("track1", "track0", "track3");
      }
      break;
    case "RUST_INTRO":
    default:
      codes.push("track1", "track0", "track3");
      break;
  }

  for (const track of tracks) {
    if (!codes.includes(track.code)) {
      codes.push(track.code);
    }
  }

  return codes;
}

function buildNextLessonReason(
  account: AccountSnapshot,
  selectedTrackCode: string,
  title: string
) {
  const preferredTrackCode = getPreferredTrackCodes(account)[0];

  if (
    preferredTrackCode === "track2" &&
    selectedTrackCode !== "track2"
  ) {
    return `Track 2 公開までの土台として、${title} を先に進めるのが自然です。`;
  }

  return `${title} に進むと、いまの学習目的に合った流れを保てます。`;
}

function buildNextProblemReason(
  account: AccountSnapshot,
  selectedTrackCode: string,
  title: string
) {
  const preferredTrackCode = getPreferredTrackCodes(account)[0];

  if (
    preferredTrackCode === "track2" &&
    selectedTrackCode !== "track2"
  ) {
    return `実務トラック公開前の手慣らしとして、${title} で手を動かしておくのが有効です。`;
  }

  return `${title} を 1 問解くと、理解をコードで確かめられます。`;
}

function buildRecommendationDrafts(
  account: AccountSnapshot,
  progressRows: ProgressRow[],
  reviewQueue: ReviewQueueItemSnapshot[]
) {
  const lessonProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.LESSON
  );
  const problemProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.PROBLEM
  );
  const lessonProgressMap = new Map(
    lessonProgressRows.map((row) => [row.entityId, row])
  );
  const completedProblemIds = new Set(
    problemProgressRows
      .filter((row) => row.progressState === ProgressState.COMPLETED)
      .map((row) => row.entityId)
  );
  const preferredTrackCodes = getPreferredTrackCodes(account);
  const records: RecommendationDraft[] = [];
  const usedTargets = new Set<string>();
  const topReview = sortReviewQueue(reviewQueue)[0];

  if (topReview) {
    records.push({
      recommendationType: "REVIEW_CONCEPT",
      targetType: topReview.sourceType,
      targetId: topReview.sourceId,
      title: topReview.title,
      reasonText: `${topReview.trackName} で優先度の高い復習項目です。`,
      href: topReview.href,
    });
    usedTargets.add(topReview.sourceId);
  }

  for (const trackCode of preferredTrackCodes) {
    const track = tracks.find((candidate) => candidate.code === trackCode);

    if (!track || track.lessons.length === 0 || track.availability !== "available") {
      continue;
    }

    const nextLesson = track.lessons.find((lesson) => {
      const progress = lessonProgressMap.get(buildLessonEntityId(track.code, lesson.slug));
      return progress?.progressState !== ProgressState.COMPLETED;
    });

    if (!nextLesson) {
      continue;
    }

    const entityId = buildLessonEntityId(track.code, nextLesson.slug);

    if (!usedTargets.has(entityId)) {
      records.push({
        recommendationType: "NEXT_LESSON",
        targetType: "LESSON",
        targetId: entityId,
        title: nextLesson.title,
        reasonText: buildNextLessonReason(account, track.code, nextLesson.title),
        href: `/learn/${track.code}/${nextLesson.slug}`,
      });
      usedTargets.add(entityId);
    }

    break;
  }

  const problemTrackPreference = [
    records.find((record) => record.recommendationType === "NEXT_LESSON")?.href?.split("/")[2],
    ...preferredTrackCodes,
  ].filter((value): value is string => typeof value === "string");

  for (const trackCode of problemTrackPreference) {
    const nextProblem = problems.find(
      (problem) =>
        problem.trackCode === trackCode && !completedProblemIds.has(problem.id)
    );

    if (!nextProblem || usedTargets.has(nextProblem.id)) {
      continue;
    }

    records.push({
      recommendationType:
        nextProblem.trackCode === "track3" ? "COMPETITIVE_SET" : "SOLVE_PROBLEM",
      targetType: "PROBLEM",
      targetId: nextProblem.id,
      title: nextProblem.title,
      reasonText: buildNextProblemReason(
        account,
        nextProblem.trackCode,
        nextProblem.title
      ),
      href: `/exercises/${nextProblem.id}`,
    });
    usedTargets.add(nextProblem.id);
    break;
  }

  return records.slice(0, 5);
}

function buildRecommendationSnapshot(
  row: RecommendationRow
): RecommendationSnapshot | null {
  const resolved =
    row.targetType === EntityType.LESSON
      ? resolveLessonEntity(row.targetId)
      : resolveProblemEntity(row.targetId);

  if (!resolved) {
    return null;
  }

  return {
    id: row.id,
    recommendationType: mapRecommendationType(row.recommendationType),
    targetType: row.targetType as RecommendationSnapshot["targetType"],
    targetId: row.targetId,
    title: resolved.title,
    reasonText: row.reasonText ?? `${resolved.title} に進むのが自然です。`,
    href: resolved.href,
  };
}

function buildReviewQueueSnapshot(row: ReviewRow): ReviewQueueItemSnapshot | null {
  const resolved =
    row.sourceType === EntityType.LESSON
      ? resolveLessonEntity(row.sourceId)
      : resolveProblemEntity(row.sourceId);

  if (!resolved) {
    return null;
  }

  return {
    id: row.id,
    sourceType: row.sourceType as ReviewQueueItemSnapshot["sourceType"],
    sourceId: row.sourceId,
    trackCode: resolved.trackCode,
    trackName: resolved.trackName,
    title: resolved.title,
    reasonType: row.reasonType,
    priority: row.priority,
    availableAt: row.availableAt.toISOString(),
    conceptLabels: resolved.conceptLabels,
    href: resolved.href,
  };
}

async function loadRecommendationContext(userId: string) {
  const account = await getAccountSnapshot(userId);

  if (!account) {
    return null;
  }

  const [progressRows, reviewRows] = await prisma.$transaction([
    prisma.progress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: "desc" },
      select: {
        entityType: true,
        entityId: true,
        progressState: true,
        score: true,
        lastAccessedAt: true,
        completedAt: true,
      },
    }),
    prisma.reviewQueueItem.findMany({
      where: { userId, resolvedAt: null },
      orderBy: [{ priority: "desc" }, { availableAt: "asc" }],
      select: {
        id: true,
        sourceType: true,
        sourceId: true,
        reasonType: true,
        priority: true,
        availableAt: true,
      },
    }),
  ]);

  const reviewQueue = reviewRows
    .map(buildReviewQueueSnapshot)
    .filter((value): value is ReviewQueueItemSnapshot => value !== null);

  return { account, progressRows, reviewQueue };
}

async function upsertProgressRecord(
  userId: string,
  entityType: EntityType,
  entityId: string,
  progressState: ProgressState,
  score?: number
) {
  const now = new Date();
  const existing = await prisma.progress.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
    select: {
      progressState: true,
      completedAt: true,
      score: true,
    },
  });
  const nextProgressState =
    existing?.progressState === ProgressState.COMPLETED &&
    progressState !== ProgressState.COMPLETED
      ? ProgressState.COMPLETED
      : progressState;
  const completedAt =
    nextProgressState === ProgressState.COMPLETED
      ? existing?.completedAt ?? now
      : null;

  return prisma.progress.upsert({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
    update: {
      progressState: nextProgressState,
      score: score ?? existing?.score ?? null,
      lastAccessedAt: now,
      completedAt,
    },
    create: {
      userId,
      entityType,
      entityId,
      progressState: nextProgressState,
      score: score ?? null,
      lastAccessedAt: now,
      completedAt,
    },
  });
}

async function replaceReviewQueueItem({
  userId,
  sourceType,
  sourceId,
  reasonType,
  priority,
  availableAt,
}: {
  userId: string;
  sourceType: EntityType;
  sourceId: string;
  reasonType: ReviewReasonType;
  priority: number;
  availableAt: Date;
}) {
  await prisma.$transaction([
    prisma.reviewQueueItem.deleteMany({
      where: {
        userId,
        sourceType,
        sourceId,
        reasonType,
        resolvedAt: null,
      },
    }),
    prisma.reviewQueueItem.create({
      data: {
        userId,
        sourceType,
        sourceId,
        reasonType,
        priority,
        availableAt,
      },
    }),
  ]);
}

async function resolveReviewQueueItems(
  userId: string,
  sourceType: EntityType,
  sourceId: string,
  reasonTypes?: ReviewReasonType[]
) {
  await prisma.reviewQueueItem.updateMany({
    where: {
      userId,
      sourceType,
      sourceId,
      resolvedAt: null,
      ...(reasonTypes ? { reasonType: { in: reasonTypes } } : {}),
    },
    data: {
      resolvedAt: new Date(),
    },
  });
}

export async function syncRecommendationsForUser(userId: string) {
  const context = await loadRecommendationContext(userId);

  if (!context) {
    return;
  }

  const drafts = buildRecommendationDrafts(
    context.account,
    context.progressRows,
    context.reviewQueue
  );

  await prisma.$transaction(async (tx) => {
    await tx.recommendation.deleteMany({ where: { userId } });

    if (drafts.length > 0) {
      await tx.recommendation.createMany({
        data: drafts.map((draft) => ({
          userId,
          recommendationType: toPrismaRecommendationType(
            draft.recommendationType
          ),
          targetType: draft.targetType,
          targetId: draft.targetId,
          reasonText: draft.reasonText,
        })),
      });
    }
  });
}

export async function recordLessonProgress(
  userId: string,
  trackCode: string,
  lessonSlug: string,
  progressState: ProgressState = ProgressState.IN_PROGRESS
) {
  const entityId = buildLessonEntityId(trackCode, lessonSlug);

  await upsertProgressRecord(
    userId,
    EntityType.LESSON,
    entityId,
    progressState
  );

  if (progressState === ProgressState.COMPLETED) {
    const availableAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await replaceReviewQueueItem({
      userId,
      sourceType: EntityType.LESSON,
      sourceId: entityId,
      reasonType: ReviewReasonType.PERIODIC_REVIEW,
      priority: 45,
      availableAt,
    });
  }

  await syncRecommendationsForUser(userId);
}

export async function recordProblemProgress(
  userId: string,
  problemId: string,
  progressState: ProgressState = ProgressState.IN_PROGRESS,
  score?: number
) {
  await upsertProgressRecord(
    userId,
    EntityType.PROBLEM,
    problemId,
    progressState,
    score
  );

  if (progressState === ProgressState.COMPLETED) {
    await resolveReviewQueueItems(userId, EntityType.PROBLEM, problemId, [
      ReviewReasonType.WRONG_ANSWER,
      ReviewReasonType.COMPILE_ERROR,
      ReviewReasonType.LONG_TIME,
      ReviewReasonType.EXPLANATION_VIEWED,
    ]);
    await replaceReviewQueueItem({
      userId,
      sourceType: EntityType.PROBLEM,
      sourceId: problemId,
      reasonType: ReviewReasonType.PERIODIC_REVIEW,
      priority: 40,
      availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  await syncRecommendationsForUser(userId);
}

export async function persistSubmissionForUser(
  userId: string,
  input: PersistedSubmissionInput
) {
  await ensureLearningCatalogSynced();

  const score =
    input.totalCount > 0
      ? Math.round((input.passedCount / input.totalCount) * 100)
      : 0;
  const compileOutput =
    input.overallStatus === "CE"
      ? input.results.find((result) => result.status === "CE")?.stderr ?? null
      : null;
  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: input.problemId,
      sourceCode: input.sourceCode,
      status: toPrismaSubmissionStatus(input.overallStatus),
      score,
      compileOutput,
    },
    select: {
      id: true,
    },
  });

  if (input.results.length > 0) {
    await prisma.submissionResult.createMany({
      data: input.results.map((result) => ({
        submissionId: submission.id,
        testcaseId: buildProblemTestCaseId(
          input.problemId,
          result.index,
          result.isHidden
        ),
        status: toPrismaSubmissionStatus(result.status),
        stdoutText: result.actualOutput,
        stderrText: result.stderr || null,
      })),
    });
  }

  await upsertProgressRecord(
    userId,
    EntityType.PROBLEM,
    input.problemId,
    input.overallStatus === "AC"
      ? ProgressState.COMPLETED
      : ProgressState.IN_PROGRESS,
    score
  );

  if (input.overallStatus === "AC") {
    await resolveReviewQueueItems(userId, EntityType.PROBLEM, input.problemId, [
      ReviewReasonType.WRONG_ANSWER,
      ReviewReasonType.COMPILE_ERROR,
      ReviewReasonType.LONG_TIME,
      ReviewReasonType.EXPLANATION_VIEWED,
    ]);
    await replaceReviewQueueItem({
      userId,
      sourceType: EntityType.PROBLEM,
      sourceId: input.problemId,
      reasonType: ReviewReasonType.PERIODIC_REVIEW,
      priority: 40,
      availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } else {
    await replaceReviewQueueItem({
      userId,
      sourceType: EntityType.PROBLEM,
      sourceId: input.problemId,
      reasonType: mapSubmissionStatusToReviewReason(input.overallStatus),
      priority: mapSubmissionStatusToPriority(input.overallStatus),
      availableAt: new Date(),
    });
  }

  await syncRecommendationsForUser(userId);
}

export async function getLearningSnapshotForUser(
  userId: string
): Promise<LearningSnapshot | null> {
  const account = await getAccountSnapshot(userId);

  if (!account) {
    return null;
  }

  const [progressRows, reviewRows, recommendationRows, submissionRows] =
    await prisma.$transaction([
      prisma.progress.findMany({
        where: { userId },
        orderBy: { lastAccessedAt: "desc" },
        select: {
          entityType: true,
          entityId: true,
          progressState: true,
          score: true,
          lastAccessedAt: true,
          completedAt: true,
        },
      }),
      prisma.reviewQueueItem.findMany({
        where: { userId, resolvedAt: null },
        orderBy: [{ priority: "desc" }, { availableAt: "asc" }],
        select: {
          id: true,
          sourceType: true,
          sourceId: true,
          reasonType: true,
          priority: true,
          availableAt: true,
        },
      }),
      prisma.recommendation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          recommendationType: true,
          targetType: true,
          targetId: true,
          reasonText: true,
        },
      }),
      prisma.submission.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          problemId: true,
          status: true,
          submittedAt: true,
        },
      }),
    ]);

  const generatedAt = new Date();
  const trackProblemTotals = getTrackProblemTotals();
  const lessonProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.LESSON
  );
  const problemProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.PROBLEM
  );
  const lessonProgressMap = new Map(
    lessonProgressRows.map((row) => [row.entityId, row])
  );
  const problemProgressMap = new Map(
    problemProgressRows.map((row) => [row.entityId, row])
  );
  const reviewQueue = reviewRows
    .map(buildReviewQueueSnapshot)
    .filter((value): value is ReviewQueueItemSnapshot => value !== null);
  const recommendationsFromDb = recommendationRows
    .map(buildRecommendationSnapshot)
    .filter((value): value is RecommendationSnapshot => value !== null);
  const recommendations =
    recommendationsFromDb.length > 0
      ? recommendationsFromDb
      : buildRecommendationDrafts(account, progressRows, reviewQueue).map(
          (draft, index) => ({
            id: `derived-${index}-${draft.targetId}`,
            ...draft,
          })
        );
  const recentLessons = lessonProgressRows
    .map((row) => {
      const resolved = resolveLessonEntity(row.entityId);

      if (!resolved) {
        return null;
      }

      return {
        lessonSlug: resolved.lessonSlug,
        trackCode: resolved.trackCode,
        trackName: resolved.trackName,
        title: resolved.title,
        progressState: mapProgressState(row.progressState),
        lastAccessedAt: row.lastAccessedAt.toISOString(),
        href: resolved.href,
      };
    })
    .filter((value): value is LessonProgressSnapshot => value !== null)
    .slice(0, 5);
  const recentSubmissions = submissionRows
    .map((row) => {
      const resolved = resolveProblemEntity(row.problemId);
      const status = mapSubmissionStatus(row.status);

      if (!resolved || !status) {
        return null;
      }

      return {
        submissionId: row.id,
        problemId: row.problemId,
        title: resolved.title,
        status,
        submittedAt: row.submittedAt.toISOString(),
        attemptCount: 1,
        tags: resolved.tags,
        href: resolved.href,
      };
    })
    .filter((value): value is SubmissionSnapshot => value !== null);

  const weakTagsByName = new Map<string, { attempts: number; acCount: number }>();

  for (const submission of recentSubmissions) {
    for (const tag of submission.tags) {
      const entry = weakTagsByName.get(tag) ?? { attempts: 0, acCount: 0 };
      entry.attempts += 1;
      if (submission.status === "AC") {
        entry.acCount += 1;
      }
      weakTagsByName.set(tag, entry);
    }
  }

  if (weakTagsByName.size === 0) {
    for (const item of reviewQueue) {
      for (const label of item.conceptLabels) {
        const entry = weakTagsByName.get(label) ?? { attempts: 0, acCount: 0 };
        entry.attempts += 1;
        weakTagsByName.set(label, entry);
      }
    }
  }

  const weakTags = Array.from(weakTagsByName.entries())
    .map(([tag, value]) => ({
      tag,
      attempts: value.attempts,
      accuracy:
        value.attempts === 0
          ? 0
          : Math.round((value.acCount / value.attempts) * 100),
    }))
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy || right.attempts - left.attempts
    )
    .slice(0, 5);

  const trackProgress = tracks.map((track) => {
    const trackLessonIds = track.lessons.map((lesson) =>
      buildLessonEntityId(track.code, lesson.slug)
    );
    const trackProblemIds = problems
      .filter((problem) => problem.trackCode === track.code)
      .map((problem) => problem.id);
    const trackLessonRows = trackLessonIds
      .map((entityId) => lessonProgressMap.get(entityId))
      .filter((value): value is ProgressRow => value !== undefined);
    const trackProblemRows = trackProblemIds
      .map((entityId) => problemProgressMap.get(entityId))
      .filter((value): value is ProgressRow => value !== undefined);
    const activityTimestamps = [
      ...trackLessonRows.map((row) => row.lastAccessedAt),
      ...trackProblemRows.map((row) => row.lastAccessedAt),
    ];
    const nextLesson = track.lessons.find((lesson) => {
      const progress = lessonProgressMap.get(buildLessonEntityId(track.code, lesson.slug));
      return progress?.progressState !== ProgressState.COMPLETED;
    });

    return {
      trackCode: track.code,
      trackName: track.name,
      enrolledAt:
        activityTimestamps.length > 0
          ? new Date(
              Math.min(...activityTimestamps.map((value) => value.getTime()))
            ).toISOString()
          : generatedAt.toISOString(),
      completedLessons: trackLessonRows.filter(
        (row) => row.progressState === ProgressState.COMPLETED
      ).length,
      totalLessons: track.lessons.length,
      completedProblems: trackProblemRows.filter(
        (row) => row.progressState === ProgressState.COMPLETED
      ).length,
      totalProblems: trackProblemTotals[track.code] ?? 0,
      lastAccessedAt:
        activityTimestamps.length > 0
          ? new Date(
              Math.max(...activityTimestamps.map((value) => value.getTime()))
            ).toISOString()
          : generatedAt.toISOString(),
      nextLesson: nextLesson
        ? {
            title: nextLesson.title,
            href: `/learn/${track.code}/${nextLesson.slug}`,
          }
        : null,
    };
  });

  const estimatedStudyMinutes =
    lessonProgressRows.reduce((sum, row) => {
      const lesson = resolveLessonEntity(row.entityId);

      if (!lesson) {
        return sum;
      }

      return (
        sum +
        (row.progressState === ProgressState.COMPLETED
          ? lesson.estimatedMinutes
          : Math.max(5, Math.round(lesson.estimatedMinutes / 2)))
      );
    }, 0) +
    problemProgressRows.reduce((sum, row) => {
      const problem = resolveProblemEntity(row.entityId);

      if (!problem) {
        return sum;
      }

      return (
        sum +
        (row.progressState === ProgressState.COMPLETED
          ? problem.estimatedMinutes
          : Math.max(5, Math.round(problem.estimatedMinutes / 2)))
      );
    }, 0);
  const streakSummary = buildStreakSummary([
    ...progressRows.map((row) => row.lastAccessedAt),
    ...submissionRows.map((row) => row.submittedAt),
  ]);
  const recentAccuracy =
    recentSubmissions.length === 0
      ? 0
      : Math.round(
          (recentSubmissions.filter((submission) => submission.status === "AC").length /
            recentSubmissions.length) *
            100
        );
  const availableReviewCount = reviewQueue.filter((item) =>
    isReviewAvailable(item, generatedAt)
  ).length;

  return {
    generatedAt: generatedAt.toISOString(),
    user: {
      id: account.userId,
      displayName: account.displayName,
      skillLevel: account.skillLevel,
      primaryGoal: account.primaryGoal,
      dailyMinutesGoal: account.dailyMinutesGoal,
    },
    overview: {
      totalStudyMinutes: estimatedStudyMinutes,
      completedLessons: lessonProgressRows.filter(
        (row) => row.progressState === ProgressState.COMPLETED
      ).length,
      totalLessons: getTotalLessonCount(),
      solvedProblems: problemProgressRows.filter(
        (row) => row.progressState === ProgressState.COMPLETED
      ).length,
      totalProblems: getTotalProblemCount(),
      currentStreak: streakSummary.currentStreak,
      longestStreak: streakSummary.longestStreak,
      recentAccuracy,
      reviewQueueCount: reviewQueue.length || availableReviewCount,
    },
    trackProgress,
    recentLessons,
    recentSubmissions,
    weakTags,
    recommendations,
    reviewQueue,
  };
}
