import { tracks } from "@/data/lessons";
import { problems, type ProblemKind } from "@/data/problems";
import {
  ProgressState,
  SubmissionStatus,
  UserStatus,
  prisma,
} from "@/lib/prisma";

const failingStatuses = [
  SubmissionStatus.WA,
  SubmissionStatus.CE,
  SubmissionStatus.TLE,
  SubmissionStatus.RE,
] as const;

type ManagedSubmissionStatus =
  | typeof SubmissionStatus.AC
  | typeof SubmissionStatus.WA
  | typeof SubmissionStatus.CE
  | typeof SubmissionStatus.TLE
  | typeof SubmissionStatus.RE;

const difficultyOrder = {
  easy: 0,
  medium: 1,
  hard: 2,
} as const;

const problemKindLabel: Record<ProblemKind, string> = {
  implementation: "実装",
  compile_error_fix: "コンパイル修正",
  ownership_fix: "所有権修正",
};

export interface AdminOverviewSnapshot {
  trackCount: number;
  availableTrackCount: number;
  lessonCount: number;
  publishedLessonCount: number;
  totalLessonMinutes: number;
  problemCount: number;
  sampleTestCaseCount: number;
  hiddenTestCaseCount: number;
  registeredUserCount: number;
  submissionCount: number;
  activeAdminCount: number;
}

export interface AdminLessonItemSnapshot {
  slug: string;
  title: string;
  estimatedMinutes: number;
  statusLabel: string;
  href: string;
}

export interface AdminLessonRowSnapshot {
  trackCode: string;
  trackLabel: string;
  trackName: string;
  availability: "available" | "coming_soon";
  roadmapTopicCount: number;
  publishedLessonCount: number;
  totalMinutes: number;
  launchNote?: string;
  roadmapTopics: string[];
  lessons: AdminLessonItemSnapshot[];
}

export interface AdminProblemRowSnapshot {
  problemId: string;
  title: string;
  trackCode: string;
  trackName: string;
  difficulty: "easy" | "medium" | "hard";
  kind: ProblemKind;
  kindLabel: string;
  estimatedMinutes: number;
  relatedLessonCount: number;
  sampleTestCaseCount: number;
  hiddenTestCaseCount: number;
  href: string;
}

export interface AdminSubmissionRowSnapshot {
  submissionId: string;
  status: string;
  problemId: string;
  problemTitle: string;
  userEmail: string;
  submittedAt: string;
}

export interface AdminGradingSnapshot {
  recentSubmissionCount: number;
  caseResultCount: number;
  statusCounts: Record<ManagedSubmissionStatus, number>;
  failureTrend: Array<{
    status: (typeof failingStatuses)[number];
    count: number;
  }>;
  latestSubmissions: AdminSubmissionRowSnapshot[];
}

export interface AdminUserAnalyticsSnapshot {
  registeredUserCount: number;
  activeProgressCount: number;
  completedProgressCount: number;
  unresolvedReviewQueueCount: number;
  recommendationCount: number;
  latestUsers: Array<{
    userId: string;
    email: string;
    status: UserStatus;
    createdAt: string;
  }>;
}

export interface AdminSnapshot {
  generatedAt: string;
  databaseStatus: {
    healthy: boolean;
    message?: string;
  };
  overview: AdminOverviewSnapshot;
  lessonRows: AdminLessonRowSnapshot[];
  problemRows: AdminProblemRowSnapshot[];
  grading: AdminGradingSnapshot;
  userAnalytics: AdminUserAnalyticsSnapshot;
}

export function getDifficultyLabel(value: AdminProblemRowSnapshot["difficulty"]) {
  if (value === "easy") return "easy";
  if (value === "medium") return "medium";
  return "hard";
}

function buildLessonRows(): AdminLessonRowSnapshot[] {
  return tracks.map((track) => ({
    trackCode: track.code,
    trackLabel: track.label,
    trackName: track.name,
    availability: track.availability,
    roadmapTopicCount: track.roadmapTopics.length,
    publishedLessonCount:
      track.availability === "available" ? track.lessons.length : 0,
    totalMinutes: track.lessons.reduce(
      (sum, lesson) => sum + lesson.estimatedMinutes,
      0
    ),
    launchNote: track.launchNote,
    roadmapTopics: track.roadmapTopics,
    lessons: track.lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      statusLabel: "公開",
      href: `/learn/${track.code}/${lesson.slug}`,
    })),
  }));
}

function buildProblemRows(): AdminProblemRowSnapshot[] {
  const trackOrder = new Map(tracks.map((track, index) => [track.code, index]));
  const trackNameMap = new Map(tracks.map((track) => [track.code, track.name]));

  return [...problems]
    .sort((left, right) => {
      return (
        (trackOrder.get(left.trackCode) ?? 999) -
          (trackOrder.get(right.trackCode) ?? 999) ||
        difficultyOrder[left.difficulty] - difficultyOrder[right.difficulty] ||
        left.title.localeCompare(right.title, "ja")
      );
    })
    .map((problem) => {
      const sampleTestCaseCount = problem.testCases.filter(
        (testCase) => !testCase.isHidden
      ).length;
      const hiddenTestCaseCount = problem.testCases.length - sampleTestCaseCount;

      return {
        problemId: problem.id,
        title: problem.title,
        trackCode: problem.trackCode,
        trackName: trackNameMap.get(problem.trackCode) ?? problem.trackCode,
        difficulty: problem.difficulty,
        kind: problem.kind,
        kindLabel: problemKindLabel[problem.kind],
        estimatedMinutes: problem.estimatedMinutes,
        relatedLessonCount: problem.relatedLessonSlugs.length,
        sampleTestCaseCount,
        hiddenTestCaseCount,
        href: `/exercises/${problem.id}`,
      };
    });
}

function buildStatusCounts(
  submissions: Array<{ status: string }>
): Record<ManagedSubmissionStatus, number> {
  const counts: Record<ManagedSubmissionStatus, number> = {
    AC: 0,
    WA: 0,
    CE: 0,
    TLE: 0,
    RE: 0,
  };

  for (const submission of submissions) {
    if (submission.status in counts) {
      counts[submission.status as ManagedSubmissionStatus] += 1;
    }
  }

  return counts;
}

function buildEmptyGradingSnapshot(): AdminGradingSnapshot {
  return {
    recentSubmissionCount: 0,
    caseResultCount: 0,
    statusCounts: {
      AC: 0,
      WA: 0,
      CE: 0,
      TLE: 0,
      RE: 0,
    },
    failureTrend: [],
    latestSubmissions: [],
  };
}

function buildEmptyUserAnalyticsSnapshot(): AdminUserAnalyticsSnapshot {
  return {
    registeredUserCount: 0,
    activeProgressCount: 0,
    completedProgressCount: 0,
    unresolvedReviewQueueCount: 0,
    recommendationCount: 0,
    latestUsers: [],
  };
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const lessonRows = buildLessonRows();
  const problemRows = buildProblemRows();
  const sampleTestCaseCount = problems.reduce(
    (sum, problem) =>
      sum + problem.testCases.filter((testCase) => !testCase.isHidden).length,
    0
  );
  const hiddenTestCaseCount = problems.reduce(
    (sum, problem) =>
      sum + problem.testCases.filter((testCase) => testCase.isHidden).length,
    0
  );
  const emptyGrading = buildEmptyGradingSnapshot();
  const emptyUserAnalytics = buildEmptyUserAnalyticsSnapshot();
  const staticOverview = {
    trackCount: tracks.length,
    availableTrackCount: tracks.filter(
      (track) => track.availability === "available"
    ).length,
    lessonCount: lessonRows.reduce(
      (sum, row) => sum + row.lessons.length,
      0
    ),
    publishedLessonCount: lessonRows.reduce(
      (sum, row) => sum + row.publishedLessonCount,
      0
    ),
    totalLessonMinutes: lessonRows.reduce(
      (sum, row) => sum + row.totalMinutes,
      0
    ),
    problemCount: problemRows.length,
    sampleTestCaseCount,
    hiddenTestCaseCount,
    registeredUserCount: 0,
    submissionCount: 0,
    activeAdminCount: 0,
  };

  try {
    const [
      registeredUserCount,
      submissionCount,
      caseResultCount,
      activeAdminCount,
      activeProgressCount,
      completedProgressCount,
      unresolvedReviewQueueCount,
      recommendationCount,
      latestUsers,
      latestSubmissions,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.submissionResult.count(),
      prisma.adminUser.count(),
      prisma.progress.count({
        where: { progressState: ProgressState.IN_PROGRESS },
      }),
      prisma.progress.count({
        where: { progressState: ProgressState.COMPLETED },
      }),
      prisma.reviewQueueItem.count({
        where: { resolvedAt: null },
      }),
      prisma.recommendation.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.submission.findMany({
        orderBy: { submittedAt: "desc" },
        take: 12,
        select: {
          id: true,
          status: true,
          problemId: true,
          submittedAt: true,
          user: {
            select: { email: true },
          },
          problem: {
            select: { title: true },
          },
        },
      }),
    ]);

    const statusCounts = buildStatusCounts(latestSubmissions);
    const failureTrend = failingStatuses
      .map((status) => ({
        status,
        count: statusCounts[status] ?? 0,
      }))
      .filter((entry) => entry.count > 0)
      .sort((left, right) => right.count - left.count);

    return {
      generatedAt: new Date().toISOString(),
      databaseStatus: {
        healthy: true,
      },
      overview: {
        ...staticOverview,
        registeredUserCount,
        submissionCount,
        activeAdminCount,
      },
      lessonRows,
      problemRows,
      grading: {
        recentSubmissionCount: latestSubmissions.length,
        caseResultCount,
        statusCounts,
        failureTrend,
        latestSubmissions: latestSubmissions.map((submission) => ({
          submissionId: submission.id,
          status: submission.status,
          problemId: submission.problemId,
          problemTitle: submission.problem?.title ?? submission.problemId,
          userEmail: submission.user.email,
          submittedAt: submission.submittedAt.toISOString(),
        })),
      },
      userAnalytics: {
        registeredUserCount,
        activeProgressCount,
        completedProgressCount,
        unresolvedReviewQueueCount,
        recommendationCount,
        latestUsers: latestUsers.map((user) => ({
          userId: user.id,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Admin snapshot query failed:", error);

    return {
      generatedAt: new Date().toISOString(),
      databaseStatus: {
        healthy: false,
        message:
          "管理用の DB 集計を取得できませんでした。教材一覧のみ表示しています。",
      },
      overview: staticOverview,
      lessonRows,
      problemRows,
      grading: emptyGrading,
      userAnalytics: emptyUserAnalytics,
    };
  }
}
