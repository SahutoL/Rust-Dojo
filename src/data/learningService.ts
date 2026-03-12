import type { InputJsonValue } from "@prisma/client/runtime/client";
import {
  isReviewAvailable,
  type LearningSnapshot,
  type LessonProgressSnapshot,
  type RecommendationSnapshot,
  type RecommendationType,
  type ReviewQueueItemSnapshot,
  type SubmissionSnapshot,
  type SubmissionStatus,
} from "@/data/learningSnapshot";
import { type AccountSnapshot, getAccountSnapshot } from "@/lib/account";
import { buildProblemTestCaseId } from "@/lib/problem-testcase-id";
import {
  EntityType,
  ProblemCompletionMethod,
  ProgressState,
  RecommendationType as PrismaRecommendationType,
  ReviewReasonType,
  SubmissionStatus as PrismaSubmissionStatus,
  TrackAvailability,
  prisma,
} from "@/lib/prisma";

const EXPLANATION_COMPLETION_ATTEMPTS = 3;
const LONG_TIME_THRESHOLD_MS = 20 * 60 * 1000;

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

type CatalogLessonEntity = {
  id: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  trackCode: string;
  trackName: string;
  href: string;
  conceptLabels: string[];
  sortOrder: number;
};

type CatalogProblemEntity = {
  id: string;
  title: string;
  estimatedMinutes: number;
  trackCode: string;
  trackName: string;
  href: string;
  conceptLabels: string[];
  tags: string[];
  relatedLessons: CatalogLessonEntity[];
  sortOrder: number;
};

type CatalogTrackEntity = {
  id: string;
  code: string;
  name: string;
  availability: TrackAvailability;
  sortOrder: number;
  lessons: CatalogLessonEntity[];
  problems: CatalogProblemEntity[];
};

type CatalogContext = {
  tracks: CatalogTrackEntity[];
  lessonsById: Map<string, CatalogLessonEntity>;
  lessonsBySlug: Map<string, CatalogLessonEntity>;
  problemsById: Map<string, CatalogProblemEntity>;
  totalLessons: number;
  totalProblems: number;
  trackProblemTotals: Record<string, number>;
};

type SectionProgressSnapshot = {
  sectionId: string;
  status: ProgressState;
  payloadJson: unknown;
  completedAt: string | null;
};

type RecommendationDraft = {
  recommendationType: RecommendationType;
  targetType: RecommendationSnapshot["targetType"];
  targetId: string;
  title: string;
  reasonText: string;
  href: string;
};

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

export interface LessonSectionProgressUpdateInput {
  userId: string;
  lessonId: string;
  sectionId: string;
  status: ProgressState;
  payloadJson?: InputJsonValue | null;
}

export interface LessonSectionProgressSummary {
  lessonId: string;
  lessonProgressState: ProgressState | null;
  requiredSectionCount: number;
  completedRequiredSectionCount: number;
  explanationCompletedCount: number;
  explanationTotalCount: number;
  quizCompleted: boolean;
  codeExecutionCompleted: boolean;
  canComplete: boolean;
  progressBySectionId: Record<string, SectionProgressSnapshot>;
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

async function loadCatalogContext(): Promise<CatalogContext> {
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

  const lessonsById = new Map<string, CatalogLessonEntity>();
  const lessonsBySlug = new Map<string, CatalogLessonEntity>();
  const problemsById = new Map<string, CatalogProblemEntity>();
  const trackProblemTotals: Record<string, number> = {};
  let totalLessons = 0;
  let totalProblems = 0;

  const tracks = rows.map((track) => {
    const lessons = track.lessons.map((lesson) => {
      const entity = {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        trackCode: track.code,
        trackName: track.name,
        href: `/learn/${track.code}/${lesson.slug}`,
        conceptLabels: [lesson.title],
        sortOrder: lesson.sortOrder,
      } satisfies CatalogLessonEntity;

      lessonsById.set(entity.id, entity);
      lessonsBySlug.set(entity.slug, entity);
      totalLessons += 1;
      return entity;
    });

    const problems = track.problems.map((problem) => {
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

      const entity = {
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
      } satisfies CatalogProblemEntity;

      problemsById.set(entity.id, entity);
      totalProblems += 1;
      return entity;
    });

    trackProblemTotals[track.code] = problems.length;

    return {
      id: track.id,
      code: track.code,
      name: track.name,
      availability: track.availability,
      sortOrder: track.sortOrder,
      lessons,
      problems,
    } satisfies CatalogTrackEntity;
  });

  return {
    tracks,
    lessonsById,
    lessonsBySlug,
    problemsById,
    totalLessons,
    totalProblems,
    trackProblemTotals,
  };
}

function resolveLessonEntity(
  entityId: string,
  catalog: CatalogContext
): CatalogLessonEntity | null {
  return catalog.lessonsById.get(entityId) ?? catalog.lessonsBySlug.get(entityId) ?? null;
}

function resolveProblemEntity(
  entityId: string,
  catalog: CatalogContext
): CatalogProblemEntity | null {
  return catalog.problemsById.get(entityId) ?? null;
}

function buildReviewQueueSnapshot(
  row: ReviewRow,
  catalog: CatalogContext
): ReviewQueueItemSnapshot | null {
  const resolved =
    row.sourceType === EntityType.LESSON
      ? resolveLessonEntity(row.sourceId, catalog)
      : resolveProblemEntity(row.sourceId, catalog);

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

function buildRecommendationSnapshot(
  row: RecommendationRow,
  catalog: CatalogContext
): RecommendationSnapshot | null {
  const resolved =
    row.targetType === EntityType.LESSON
      ? resolveLessonEntity(row.targetId, catalog)
      : resolveProblemEntity(row.targetId, catalog);

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

function getPreferredTrackCodes(account: AccountSnapshot, catalog: CatalogContext) {
  const preferredCodes: string[] = [];

  switch (account.primaryGoal) {
    case "PROGRAMMING_BASICS":
      preferredCodes.push("track0", "track1", "track3");
      break;
    case "ATCODER":
      if (
        account.skillLevel === "INTERMEDIATE" ||
        account.skillLevel === "ADVANCED"
      ) {
        preferredCodes.push("track3", "track1", "track0");
      } else {
        preferredCodes.push("track1", "track3", "track0");
      }
      break;
    case "RUST_PRACTICAL":
    case "OSS":
    case "CAREER":
      if (
        account.skillLevel === "INTERMEDIATE" ||
        account.skillLevel === "ADVANCED"
      ) {
        preferredCodes.push("track2", "track1", "track3", "track0");
      } else {
        preferredCodes.push("track1", "track0", "track3");
      }
      break;
    case "RUST_INTRO":
    default:
      preferredCodes.push("track1", "track0", "track3");
      break;
  }

  for (const track of catalog.tracks) {
    if (!preferredCodes.includes(track.code)) {
      preferredCodes.push(track.code);
    }
  }

  return preferredCodes;
}

function buildNextLessonReason(
  account: AccountSnapshot,
  selectedTrackCode: string,
  title: string
) {
  if (
    account.primaryGoal !== "ATCODER" &&
    (account.primaryGoal === "RUST_PRACTICAL" ||
      account.primaryGoal === "OSS" ||
      account.primaryGoal === "CAREER") &&
    selectedTrackCode !== "track2"
  ) {
    return `実務トラック公開前の土台として、${title} を先に進めるのが自然です。`;
  }

  return `${title} に進むと、いまの学習目的に合った流れを保てます。`;
}

function buildNextProblemReason(
  account: AccountSnapshot,
  selectedTrackCode: string,
  title: string
) {
  if (
    account.primaryGoal !== "ATCODER" &&
    (account.primaryGoal === "RUST_PRACTICAL" ||
      account.primaryGoal === "OSS" ||
      account.primaryGoal === "CAREER") &&
    selectedTrackCode !== "track2"
  ) {
    return `実務トラック公開前の手慣らしとして、${title} で手を動かしておくのが有効です。`;
  }

  return `${title} を 1 問解くと、理解をコードで確かめられます。`;
}

function findLessonForTag(
  tag: string,
  catalog: CatalogContext,
  completedLessonIds: Set<string>,
  preferredTrackCodes: string[]
) {
  const candidates = Array.from(catalog.problemsById.values())
    .filter((problem) => problem.tags.includes(tag))
    .flatMap((problem) => problem.relatedLessons)
    .filter((lesson, index, lessons) => {
      return lessons.findIndex((candidate) => candidate.id === lesson.id) === index;
    })
    .filter((lesson) => !completedLessonIds.has(lesson.id));

  candidates.sort((left, right) => {
    return (
      preferredTrackCodes.indexOf(left.trackCode) -
        preferredTrackCodes.indexOf(right.trackCode) ||
      left.sortOrder - right.sortOrder
    );
  });

  return candidates[0] ?? null;
}

function buildRecommendationDrafts({
  account,
  catalog,
  progressRows,
  reviewQueue,
  recentSubmissionRows,
  problemStats,
}: {
  account: AccountSnapshot;
  catalog: CatalogContext;
  progressRows: ProgressRow[];
  reviewQueue: ReviewQueueItemSnapshot[];
  recentSubmissionRows: Array<{
    status: PrismaSubmissionStatus;
    problemId: string;
  }>;
  problemStats: Array<{
    problemId: string;
    ceCount: number;
    waCount: number;
    attemptCount: number;
  }>;
}) {
  const lessonProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.LESSON
  );
  const problemProgressRows = progressRows.filter(
    (row) => row.entityType === EntityType.PROBLEM
  );
  const lessonProgressMap = new Map(
    lessonProgressRows.map((row) => [row.entityId, row])
  );
  const completedLessonIds = new Set(
    lessonProgressRows
      .filter((row) => row.progressState === ProgressState.COMPLETED)
      .map((row) => row.entityId)
  );
  const completedProblemIds = new Set(
    problemProgressRows
      .filter((row) => row.progressState === ProgressState.COMPLETED)
      .map((row) => row.entityId)
  );
  const preferredTrackCodes = getPreferredTrackCodes(account, catalog);
  const availableTrackCodes = preferredTrackCodes.filter((code) => {
    const track = catalog.tracks.find((candidate) => candidate.code === code);
    return track?.availability === TrackAvailability.AVAILABLE;
  });
  const drafts: RecommendationDraft[] = [];
  const usedTargets = new Set<string>();
  const topReview = reviewQueue.find((item) => isReviewAvailable(item));

  if (topReview) {
    drafts.push({
      recommendationType: "REVIEW_CONCEPT",
      targetType: topReview.sourceType,
      targetId: topReview.sourceId,
      title: topReview.title,
      reasonText: `${topReview.trackName} で優先度の高い復習項目です。`,
      href: topReview.href,
    });
    usedTargets.add(topReview.sourceId);
  }

  const ceTagCounts = new Map<string, number>();
  for (const stat of problemStats) {
    const problem = catalog.problemsById.get(stat.problemId);
    if (!problem || stat.ceCount === 0) {
      continue;
    }

    for (const tag of problem.tags) {
      ceTagCounts.set(tag, (ceTagCounts.get(tag) ?? 0) + stat.ceCount);
    }
  }

  const ceHeavyTag = Array.from(ceTagCounts.entries())
    .sort((left, right) => right[1] - left[1])[0];

  if (ceHeavyTag && ceHeavyTag[1] >= 3) {
    const lesson = findLessonForTag(
      ceHeavyTag[0],
      catalog,
      completedLessonIds,
      preferredTrackCodes
    );

    if (lesson && !usedTargets.has(lesson.id)) {
      drafts.push({
        recommendationType: "REVIEW_CONCEPT",
        targetType: "LESSON",
        targetId: lesson.id,
        title: lesson.title,
        reasonText: `${ceHeavyTag[0]} でコンパイルエラーが続いているため、関連レッスンを先に見直します。`,
        href: lesson.href,
      });
      usedTargets.add(lesson.id);
    }
  }

  const recentAccuracyByTag = new Map<string, { attempts: number; ac: number }>();
  for (const row of recentSubmissionRows.slice(0, 5)) {
    const problem = catalog.problemsById.get(row.problemId);
    if (!problem) {
      continue;
    }

    for (const tag of problem.tags) {
      const current = recentAccuracyByTag.get(tag) ?? { attempts: 0, ac: 0 };
      current.attempts += 1;
      if (row.status === PrismaSubmissionStatus.AC) {
        current.ac += 1;
      }
      recentAccuracyByTag.set(tag, current);
    }
  }

  const weakTag = Array.from(recentAccuracyByTag.entries())
    .map(([tag, value]) => ({
      tag,
      accuracy: value.attempts === 0 ? 0 : (value.ac / value.attempts) * 100,
      attempts: value.attempts,
    }))
    .filter((entry) => entry.accuracy < 50)
    .sort((left, right) => left.accuracy - right.accuracy || right.attempts - left.attempts)[0];

  if (weakTag) {
    const lesson = findLessonForTag(
      weakTag.tag,
      catalog,
      completedLessonIds,
      preferredTrackCodes
    );

    if (lesson && !usedTargets.has(lesson.id)) {
      drafts.push({
        recommendationType: "REVIEW_CONCEPT",
        targetType: "LESSON",
        targetId: lesson.id,
        title: lesson.title,
        reasonText: `${weakTag.tag} の直近正答率が低いため、先に概念を整理します。`,
        href: lesson.href,
      });
      usedTargets.add(lesson.id);
    }
  }

  for (const trackCode of availableTrackCodes) {
    const track = catalog.tracks.find((candidate) => candidate.code === trackCode);
    if (!track || track.lessons.length === 0) {
      continue;
    }

    const nextLesson = track.lessons.find((lesson) => {
      const progress = lessonProgressMap.get(lesson.id);
      return progress?.progressState !== ProgressState.COMPLETED;
    });

    if (nextLesson && !usedTargets.has(nextLesson.id)) {
      drafts.push({
        recommendationType: "NEXT_LESSON",
        targetType: "LESSON",
        targetId: nextLesson.id,
        title: nextLesson.title,
        reasonText: buildNextLessonReason(account, track.code, nextLesson.title),
        href: nextLesson.href,
      });
      usedTargets.add(nextLesson.id);
    }
    break;
  }

  if (account.primaryGoal === "ATCODER") {
    const track3 = catalog.tracks.find(
      (track) =>
        track.code === "track3" &&
        track.availability === TrackAvailability.AVAILABLE
    );
    const completedTrack3Lessons = track3
      ? track3.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length
      : 0;
    const nextTrack3Problem = track3?.problems.find(
      (problem) => !completedProblemIds.has(problem.id)
    );

    if (
      track3 &&
      nextTrack3Problem &&
      completedTrack3Lessons >= 3 &&
      !usedTargets.has(nextTrack3Problem.id)
    ) {
      drafts.push({
        recommendationType: "COMPETITIVE_SET",
        targetType: "PROBLEM",
        targetId: nextTrack3Problem.id,
        title: nextTrack3Problem.title,
        reasonText: "AtCoder 向けの基礎が揃ってきたため、競プロ用の問題に進みます。",
        href: nextTrack3Problem.href,
      });
      usedTargets.add(nextTrack3Problem.id);
    }
  }

  if (
    (account.primaryGoal === "RUST_PRACTICAL" ||
      account.primaryGoal === "OSS" ||
      account.primaryGoal === "CAREER") &&
    !usedTargets.has("track2-practical")
  ) {
    const practicalTrack = catalog.tracks.find(
      (track) =>
        track.code === "track2" &&
        track.availability === TrackAvailability.AVAILABLE
    );
    const practicalProblem = practicalTrack?.problems.find(
      (problem) => !completedProblemIds.has(problem.id)
    );

    if (practicalProblem && !usedTargets.has(practicalProblem.id)) {
      drafts.push({
        recommendationType: "PRACTICAL_TASK",
        targetType: "PROBLEM",
        targetId: practicalProblem.id,
        title: practicalProblem.title,
        reasonText: "実務寄りの目標に合わせて、手を動かす課題を優先します。",
        href: practicalProblem.href,
      });
      usedTargets.add(practicalProblem.id);
    }
  }

  for (const trackCode of availableTrackCodes) {
    const track = catalog.tracks.find((candidate) => candidate.code === trackCode);
    const nextProblem = track?.problems.find(
      (problem) => !completedProblemIds.has(problem.id)
    );

    if (!nextProblem || usedTargets.has(nextProblem.id)) {
      continue;
    }

    drafts.push({
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
      href: nextProblem.href,
    });
    usedTargets.add(nextProblem.id);
    break;
  }

  return drafts.slice(0, 5);
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

async function getLessonProgressSummary(
  userId: string,
  lessonId: string
): Promise<LessonSectionProgressSummary> {
  const [sections, rows, lessonProgress] = await prisma.$transaction([
    prisma.lessonSection.findMany({
      where: { lessonId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        sectionType: true,
        isRequired: true,
      },
    }),
    prisma.lessonSectionProgress.findMany({
      where: { userId, lessonId },
      select: {
        sectionId: true,
        status: true,
        payloadJson: true,
        completedAt: true,
      },
    }),
    prisma.progress.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: EntityType.LESSON,
          entityId: lessonId,
        },
      },
      select: {
        progressState: true,
      },
    }),
  ]);

  const progressBySectionId = Object.fromEntries(
    rows.map((row) => [
      row.sectionId,
      {
        sectionId: row.sectionId,
        status: row.status,
        payloadJson: row.payloadJson,
        completedAt: row.completedAt?.toISOString() ?? null,
      } satisfies SectionProgressSnapshot,
    ])
  );

  const requiredSections = sections.filter((section) => section.isRequired);
  const explanationSections = requiredSections.filter(
    (section) => section.sectionType === "EXPLANATION"
  );
  const quizSections = requiredSections.filter(
    (section) => section.sectionType === "QUIZ"
  );
  const codeSections = requiredSections.filter(
    (section) => section.sectionType === "CODE_EXECUTION"
  );
  const isCompleted = (sectionId: string) =>
    progressBySectionId[sectionId]?.status === ProgressState.COMPLETED;
  const completedRequiredSectionCount = requiredSections.filter((section) =>
    isCompleted(section.id)
  ).length;
  const explanationCompletedCount = explanationSections.filter((section) =>
    isCompleted(section.id)
  ).length;
  const quizCompleted = quizSections.every((section) => isCompleted(section.id));
  const codeExecutionCompleted = codeSections.every((section) =>
    isCompleted(section.id)
  );

  return {
    lessonId,
    lessonProgressState: lessonProgress?.progressState ?? null,
    requiredSectionCount: requiredSections.length,
    completedRequiredSectionCount,
    explanationCompletedCount,
    explanationTotalCount: explanationSections.length,
    quizCompleted,
    codeExecutionCompleted,
    canComplete:
      requiredSections.length === 0 ||
      (completedRequiredSectionCount === requiredSections.length &&
        explanationCompletedCount === explanationSections.length &&
        quizCompleted &&
        codeExecutionCompleted),
    progressBySectionId,
  };
}

async function markProblemLongTimeIfNeeded(
  userId: string,
  problemId: string,
  stat: {
    firstViewedAt: Date;
    longTimeCount: number;
  }
) {
  const elapsed = Date.now() - stat.firstViewedAt.getTime();
  if (elapsed < LONG_TIME_THRESHOLD_MS || stat.longTimeCount > 0) {
    return;
  }

  await prisma.problemLearningStat.update({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    data: {
      longTimeCount: {
        increment: 1,
      },
    },
  });

  await replaceReviewQueueItem({
    userId,
    sourceType: EntityType.PROBLEM,
    sourceId: problemId,
    reasonType: ReviewReasonType.LONG_TIME,
    priority: 72,
    availableAt: new Date(),
  });
}

async function completeProblemWithAc(
  userId: string,
  problemId: string,
  score: number,
  stat: {
    firstViewedAt: Date;
    longTimeCount: number;
  }
) {
  await prisma.problemLearningStat.upsert({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    update: {
      completionMethod: ProblemCompletionMethod.AC,
    },
    create: {
      userId,
      problemId,
      completionMethod: ProblemCompletionMethod.AC,
    },
  });

  await upsertProgressRecord(
    userId,
    EntityType.PROBLEM,
    problemId,
    ProgressState.COMPLETED,
    score
  );
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
  await markProblemLongTimeIfNeeded(userId, problemId, stat);
}

async function completeProblemWithExplanation(
  userId: string,
  problemId: string,
  stat: {
    firstViewedAt: Date;
    longTimeCount: number;
  }
) {
  await prisma.problemLearningStat.update({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    data: {
      completionMethod: ProblemCompletionMethod.EXPLANATION_VIEWED,
    },
  });

  await upsertProgressRecord(
    userId,
    EntityType.PROBLEM,
    problemId,
    ProgressState.COMPLETED
  );
  await resolveReviewQueueItems(userId, EntityType.PROBLEM, problemId, [
    ReviewReasonType.WRONG_ANSWER,
    ReviewReasonType.COMPILE_ERROR,
  ]);
  await replaceReviewQueueItem({
    userId,
    sourceType: EntityType.PROBLEM,
    sourceId: problemId,
    reasonType: ReviewReasonType.EXPLANATION_VIEWED,
    priority: 55,
    availableAt: new Date(),
  });
  await markProblemLongTimeIfNeeded(userId, problemId, stat);
}

async function loadRecommendationContext(userId: string) {
  const account = await getAccountSnapshot(userId);

  if (!account) {
    return null;
  }

  const [catalog, progressRows, reviewRows, recentSubmissionRows, problemStats] =
    await Promise.all([
      loadCatalogContext(),
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
      prisma.submission.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          status: true,
          problemId: true,
        },
      }),
      prisma.problemLearningStat.findMany({
        where: { userId },
        select: {
          problemId: true,
          ceCount: true,
          waCount: true,
          attemptCount: true,
        },
      }),
    ]);

  const reviewQueue = reviewRows
    .map((row) => buildReviewQueueSnapshot(row, catalog))
    .filter((value): value is ReviewQueueItemSnapshot => value !== null);

  return {
    account,
    catalog,
    progressRows,
    reviewQueue,
    recentSubmissionRows,
    problemStats,
  };
}

export async function syncRecommendationsForUser(userId: string) {
  const context = await loadRecommendationContext(userId);

  if (!context) {
    return;
  }

  const drafts = buildRecommendationDrafts(context);

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

export async function syncRecommendationsForUserSafely(
  userId: string,
  context: string
) {
  try {
    await syncRecommendationsForUser(userId);
  } catch (error) {
    console.error(`Recommendation sync skipped (${context}):`, error);
  }
}

export async function getLessonSectionProgressForUser(
  userId: string,
  lessonId: string
) {
  return getLessonProgressSummary(userId, lessonId);
}

export async function recordLessonSectionProgress({
  userId,
  lessonId,
  sectionId,
  status,
  payloadJson,
}: LessonSectionProgressUpdateInput) {
  const normalizedPayloadJson =
    payloadJson == null ? undefined : payloadJson;

  await prisma.lessonSectionProgress.upsert({
    where: {
      userId_sectionId: {
        userId,
        sectionId,
      },
    },
    update: {
      lessonId,
      status,
      payloadJson: normalizedPayloadJson,
      completedAt: status === ProgressState.COMPLETED ? new Date() : null,
    },
    create: {
      userId,
      lessonId,
      sectionId,
      status,
      ...(typeof normalizedPayloadJson === "undefined"
        ? {}
        : { payloadJson: normalizedPayloadJson }),
      completedAt: status === ProgressState.COMPLETED ? new Date() : null,
    },
  });

  await upsertProgressRecord(
    userId,
    EntityType.LESSON,
    lessonId,
    ProgressState.IN_PROGRESS
  );

  return getLessonProgressSummary(userId, lessonId);
}

export async function recordLessonProgress(
  userId: string,
  trackCode: string,
  lessonId: string,
  _lessonSlug: string,
  progressState: ProgressState = ProgressState.IN_PROGRESS
) {
  await upsertProgressRecord(
    userId,
    EntityType.LESSON,
    lessonId,
    progressState === ProgressState.COMPLETED
      ? ProgressState.IN_PROGRESS
      : progressState
  );

  if (progressState !== ProgressState.COMPLETED) {
    return;
  }

  const summary = await getLessonProgressSummary(userId, lessonId);

  if (!summary.canComplete) {
    throw new Error("LESSON_COMPLETE_REQUIREMENTS_NOT_MET");
  }

  await upsertProgressRecord(
    userId,
    EntityType.LESSON,
    lessonId,
    ProgressState.COMPLETED
  );
  await replaceReviewQueueItem({
    userId,
    sourceType: EntityType.LESSON,
    sourceId: lessonId,
    reasonType: ReviewReasonType.PERIODIC_REVIEW,
    priority: 45,
    availableAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });

  await syncRecommendationsForUserSafely(
    userId,
    `lesson completion ${trackCode}`
  );
}

export async function recordProblemProgress(
  userId: string,
  problemId: string,
  progressState: ProgressState = ProgressState.IN_PROGRESS,
  score?: number
) {
  await prisma.problemLearningStat.upsert({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    update: {
      lastViewedAt: new Date(),
    },
    create: {
      userId,
      problemId,
    },
  });

  await upsertProgressRecord(
    userId,
    EntityType.PROBLEM,
    problemId,
    progressState === ProgressState.COMPLETED
      ? ProgressState.IN_PROGRESS
      : progressState,
    score
  );
}

export async function recordProblemExplanationViewed(
  userId: string,
  problemId: string
) {
  const stat = await prisma.problemLearningStat.upsert({
    where: {
      userId_problemId: {
        userId,
        problemId,
      },
    },
    update: {
      lastViewedAt: new Date(),
      explanationViewedAt: new Date(),
    },
    create: {
      userId,
      problemId,
      explanationViewedAt: new Date(),
    },
    select: {
      firstViewedAt: true,
      longTimeCount: true,
      attemptCount: true,
      completionMethod: true,
    },
  });

  await replaceReviewQueueItem({
    userId,
    sourceType: EntityType.PROBLEM,
    sourceId: problemId,
    reasonType: ReviewReasonType.EXPLANATION_VIEWED,
    priority: 55,
    availableAt: new Date(),
  });

  if (
    stat.completionMethod === null &&
    stat.attemptCount >= EXPLANATION_COMPLETION_ATTEMPTS
  ) {
    await completeProblemWithExplanation(userId, problemId, stat);
  }

  await syncRecommendationsForUserSafely(userId, "problem explanation viewed");
}

export async function persistSubmissionForUser(
  userId: string,
  input: PersistedSubmissionInput
) {
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

  const stat = await prisma.problemLearningStat.upsert({
    where: {
      userId_problemId: {
        userId,
        problemId: input.problemId,
      },
    },
    update: {
      lastViewedAt: new Date(),
      attemptCount: {
        increment: 1,
      },
      waCount:
        input.overallStatus === "WA" || input.overallStatus === "RE"
          ? {
              increment: 1,
            }
          : undefined,
      ceCount:
        input.overallStatus === "CE"
          ? {
              increment: 1,
            }
          : undefined,
    },
    create: {
      userId,
      problemId: input.problemId,
      attemptCount: 1,
      waCount:
        input.overallStatus === "WA" || input.overallStatus === "RE" ? 1 : 0,
      ceCount: input.overallStatus === "CE" ? 1 : 0,
    },
    select: {
      firstViewedAt: true,
      longTimeCount: true,
      attemptCount: true,
      explanationViewedAt: true,
      completionMethod: true,
    },
  });

  if (input.overallStatus === "AC") {
    await completeProblemWithAc(userId, input.problemId, score, stat);
  } else {
    await upsertProgressRecord(
      userId,
      EntityType.PROBLEM,
      input.problemId,
      ProgressState.IN_PROGRESS,
      score
    );
    await replaceReviewQueueItem({
      userId,
      sourceType: EntityType.PROBLEM,
      sourceId: input.problemId,
      reasonType: mapSubmissionStatusToReviewReason(input.overallStatus),
      priority: mapSubmissionStatusToPriority(input.overallStatus),
      availableAt: new Date(),
    });

    if (
      stat.completionMethod === null &&
      stat.explanationViewedAt &&
      stat.attemptCount >= EXPLANATION_COMPLETION_ATTEMPTS
    ) {
      await completeProblemWithExplanation(userId, input.problemId, stat);
    }
  }

  await syncRecommendationsForUserSafely(userId, "submission persistence");
}

export async function getLearningSnapshotForUser(
  userId: string
): Promise<LearningSnapshot | null> {
  const account = await getAccountSnapshot(userId);

  if (!account) {
    return null;
  }

  const [catalog, progressRows, reviewRows, recommendationRows, submissionRows] =
    await Promise.all([
      loadCatalogContext(),
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
    .map((row) => buildReviewQueueSnapshot(row, catalog))
    .filter((value): value is ReviewQueueItemSnapshot => value !== null);
  const recommendationsFromDb = recommendationRows
    .map((row) => buildRecommendationSnapshot(row, catalog))
    .filter((value): value is RecommendationSnapshot => value !== null);
  const recommendations =
    recommendationsFromDb.length > 0
      ? recommendationsFromDb
      : buildRecommendationDrafts({
          account,
          catalog,
          progressRows,
          reviewQueue,
          recentSubmissionRows: submissionRows.map((row) => ({
            status: row.status,
            problemId: row.problemId,
          })),
          problemStats: await prisma.problemLearningStat.findMany({
            where: { userId },
            select: {
              problemId: true,
              ceCount: true,
              waCount: true,
              attemptCount: true,
            },
          }),
        }).map((draft, index) => ({
          id: `derived-${index}-${draft.targetId}`,
          ...draft,
        }));

  const recentLessons = lessonProgressRows
    .map((row) => {
      const lesson = resolveLessonEntity(row.entityId, catalog);

      if (!lesson) {
        return null;
      }

      return {
        lessonSlug: lesson.slug,
        trackCode: lesson.trackCode,
        trackName: lesson.trackName,
        title: lesson.title,
        progressState: row.progressState,
        lastAccessedAt: row.lastAccessedAt.toISOString(),
        href: lesson.href,
      } satisfies LessonProgressSnapshot;
    })
    .filter((value): value is LessonProgressSnapshot => value !== null)
    .slice(0, 5);

  const recentSubmissions = submissionRows
    .map((row) => {
      const problem = resolveProblemEntity(row.problemId, catalog);
      const status = mapSubmissionStatus(row.status);

      if (!problem || !status) {
        return null;
      }

      return {
        submissionId: row.id,
        problemId: row.problemId,
        title: problem.title,
        status,
        submittedAt: row.submittedAt.toISOString(),
        attemptCount: 1,
        tags: problem.tags,
        href: problem.href,
      } satisfies SubmissionSnapshot;
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

  const trackProgress = catalog.tracks.map((track) => {
    const trackLessonRows = track.lessons
      .map((lesson) => lessonProgressMap.get(lesson.id))
      .filter((value): value is ProgressRow => value !== undefined);
    const trackProblemRows = track.problems
      .map((problem) => problemProgressMap.get(problem.id))
      .filter((value): value is ProgressRow => value !== undefined);
    const activityTimestamps = [
      ...trackLessonRows.map((row) => row.lastAccessedAt),
      ...trackProblemRows.map((row) => row.lastAccessedAt),
    ];
    const nextLesson = track.lessons.find((lesson) => {
      const progress = lessonProgressMap.get(lesson.id);
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
      totalProblems: catalog.trackProblemTotals[track.code] ?? 0,
      lastAccessedAt:
        activityTimestamps.length > 0
          ? new Date(
              Math.max(...activityTimestamps.map((value) => value.getTime()))
            ).toISOString()
          : generatedAt.toISOString(),
      nextLesson: nextLesson
        ? {
            title: nextLesson.title,
            href: nextLesson.href,
          }
        : null,
    };
  });

  const estimatedStudyMinutes =
    lessonProgressRows.reduce((sum, row) => {
      const lesson = resolveLessonEntity(row.entityId, catalog);

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
      const problem = resolveProblemEntity(row.entityId, catalog);

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
      totalLessons: catalog.totalLessons,
      solvedProblems: problemProgressRows.filter(
        (row) => row.progressState === ProgressState.COMPLETED
      ).length,
      totalProblems: catalog.totalProblems,
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
