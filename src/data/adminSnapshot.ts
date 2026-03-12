import {
  ProblemType,
  ProgressState,
  SubmissionStatus,
  TrackAvailability,
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
  id: string;
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
  kind: "implementation" | "compile_error_fix" | "ownership_fix";
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

function parseRoadmapTopics(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapAvailability(value: TrackAvailability) {
  return value === TrackAvailability.COMING_SOON ? "coming_soon" : "available";
}

function mapDifficulty(value: string): AdminProblemRowSnapshot["difficulty"] {
  if (value === "MEDIUM") return "medium";
  if (value === "HARD" || value === "EXPERT") return "hard";
  return "easy";
}

function mapProblemKind(value: ProblemType): AdminProblemRowSnapshot["kind"] {
  if (value === ProblemType.COMPILE_ERROR_FIX) return "compile_error_fix";
  if (value === ProblemType.OWNERSHIP_FIX) return "ownership_fix";
  return "implementation";
}

function getProblemKindLabel(kind: AdminProblemRowSnapshot["kind"]) {
  if (kind === "compile_error_fix") return "コンパイル修正";
  if (kind === "ownership_fix") return "所有権修正";
  return "実装";
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
  const [tracks, problems] = await Promise.all([
    prisma.track.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            estimatedMinutes: true,
            isPublished: true,
          },
        },
      },
    }),
    prisma.problem.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        track: {
          select: {
            code: true,
            name: true,
          },
        },
        testCases: {
          select: {
            caseType: true,
          },
        },
        relatedLessons: {
          select: {
            lessonId: true,
          },
        },
      },
    }),
  ]);

  const lessonRows = tracks.map((track) => {
    const roadmapTopics = parseRoadmapTopics(track.roadmapTopicsJson);
    const publishedLessons = track.lessons.filter((lesson) => lesson.isPublished);

    return {
      trackCode: track.code,
      trackLabel: track.label ?? track.code.toUpperCase(),
      trackName: track.name,
      availability: mapAvailability(track.availability),
      roadmapTopicCount: roadmapTopics.length,
      publishedLessonCount: publishedLessons.length,
      totalMinutes: publishedLessons.reduce(
        (sum, lesson) => sum + lesson.estimatedMinutes,
        0
      ),
      launchNote: track.launchNote ?? undefined,
      roadmapTopics,
      lessons: track.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        statusLabel: lesson.isPublished ? "公開" : "下書き",
        href: `/learn/${track.code}/${lesson.slug}`,
      })),
    } satisfies AdminLessonRowSnapshot;
  });

  const problemRows = problems.map((problem) => {
    const kind = mapProblemKind(problem.type);
    const sampleTestCaseCount = problem.testCases.filter(
      (testCase) => testCase.caseType === "SAMPLE"
    ).length;
    const hiddenTestCaseCount =
      problem.testCases.length - sampleTestCaseCount;

    return {
      problemId: problem.id,
      title: problem.title,
      trackCode: problem.track?.code ?? "unassigned",
      trackName: problem.track?.name ?? "未割り当て",
      difficulty: mapDifficulty(problem.difficulty),
      kind,
      kindLabel: getProblemKindLabel(kind),
      estimatedMinutes: problem.estimatedMinutes,
      relatedLessonCount: problem.relatedLessons.length,
      sampleTestCaseCount,
      hiddenTestCaseCount,
      href: `/exercises/${problem.id}`,
    } satisfies AdminProblemRowSnapshot;
  });

  const staticOverview = {
    trackCount: tracks.length,
    availableTrackCount: tracks.filter(
      (track) => track.availability === TrackAvailability.AVAILABLE
    ).length,
    lessonCount: tracks.reduce((sum, track) => sum + track.lessons.length, 0),
    publishedLessonCount: tracks.reduce(
      (sum, track) => sum + track.lessons.filter((lesson) => lesson.isPublished).length,
      0
    ),
    totalLessonMinutes: tracks.reduce(
      (sum, track) =>
        sum +
        track.lessons
          .filter((lesson) => lesson.isPublished)
          .reduce((lessonSum, lesson) => lessonSum + lesson.estimatedMinutes, 0),
      0
    ),
    problemCount: problems.filter((problem) => problem.isPublished).length,
    sampleTestCaseCount: problems.reduce(
      (sum, problem) =>
        sum +
        problem.testCases.filter((testCase) => testCase.caseType === "SAMPLE").length,
      0
    ),
    hiddenTestCaseCount: problems.reduce(
      (sum, problem) =>
        sum +
        problem.testCases.filter((testCase) => testCase.caseType === "HIDDEN").length,
      0
    ),
    registeredUserCount: 0,
    submissionCount: 0,
    activeAdminCount: 0,
  } satisfies AdminOverviewSnapshot;

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
      grading: buildEmptyGradingSnapshot(),
      userAnalytics: buildEmptyUserAnalyticsSnapshot(),
    };
  }
}
