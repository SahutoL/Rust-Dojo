import { getTrack, tracks } from "@/data/lessons";
import { problems } from "@/data/problems";

export type ProgressState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type SubmissionStatus = "AC" | "WA" | "CE" | "TLE" | "RE";
export type RecommendationType = "NEXT_LESSON" | "REVIEW_CONCEPT" | "SOLVE_PROBLEM";
export type ReviewReasonType =
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "LONG_TIME"
  | "EXPLANATION_VIEWED"
  | "PERIODIC_REVIEW";

export interface DashboardUserSnapshot {
  id: string;
  displayName: string;
  skillLevel: "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE";
  primaryGoal: "RUST_INTRO" | "ATCODER" | "RUST_PRACTICAL";
  dailyMinutesGoal: number;
}

export interface TrackProgressSnapshot {
  trackCode: string;
  trackName: string;
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
  completedProblems: number;
  totalProblems: number;
  lastAccessedAt: string;
  nextLesson: {
    title: string;
    href: string;
  } | null;
}

export interface LessonProgressSnapshot {
  lessonSlug: string;
  trackCode: string;
  trackName: string;
  title: string;
  progressState: ProgressState;
  lastAccessedAt: string;
  href: string;
}

export interface SubmissionSnapshot {
  submissionId: string;
  problemId: string;
  title: string;
  status: SubmissionStatus;
  submittedAt: string;
  attemptCount: number;
  tags: string[];
  href: string;
}

export interface WeakTagSnapshot {
  tag: string;
  accuracy: number;
  attempts: number;
}

export interface RecommendationSnapshot {
  id: string;
  recommendationType: RecommendationType;
  targetType: "LESSON" | "PROBLEM";
  targetId: string;
  title: string;
  reasonText: string;
  href: string;
}

export interface ReviewQueueItemSnapshot {
  id: string;
  sourceType: "LESSON" | "PROBLEM";
  sourceId: string;
  trackCode: string;
  trackName: string;
  title: string;
  reasonType: ReviewReasonType;
  priority: number;
  availableAt: string;
  conceptLabels: string[];
  href: string;
}

export interface LearningSnapshot {
  generatedAt: string;
  user: DashboardUserSnapshot;
  overview: {
    totalStudyMinutes: number;
    completedLessons: number;
    totalLessons: number;
    solvedProblems: number;
    totalProblems: number;
    currentStreak: number;
    longestStreak: number;
    recentAccuracy: number;
    reviewQueueCount: number;
  };
  trackProgress: TrackProgressSnapshot[];
  recentLessons: LessonProgressSnapshot[];
  recentSubmissions: SubmissionSnapshot[];
  weakTags: WeakTagSnapshot[];
  recommendations: RecommendationSnapshot[];
  reviewQueue: ReviewQueueItemSnapshot[];
}

export const reviewReasonLabel: Record<ReviewReasonType, string> = {
  WRONG_ANSWER: "不正解の再確認",
  COMPILE_ERROR: "コンパイルエラーの復習",
  LONG_TIME: "時間がかかった問題",
  EXPLANATION_VIEWED: "解説を読んだ問題の復習",
  PERIODIC_REVIEW: "間隔を空けた復習",
};

export const recommendationTypeLabel: Record<RecommendationType, string> = {
  NEXT_LESSON: "次に進む",
  REVIEW_CONCEPT: "復習する",
  SOLVE_PROBLEM: "問題を解く",
};

const problemTotalsByTrack = problems.reduce<Record<string, number>>(
  (acc, problem) => {
    acc[problem.trackCode] = (acc[problem.trackCode] ?? 0) + 1;
    return acc;
  },
  {}
);

const totalLessons = tracks.reduce((sum, track) => sum + track.lessons.length, 0);
const totalProblems = problems.length;
const generatedAtDate = new Date();

function offsetFromGenerated(minutes: number) {
  return new Date(generatedAtDate.getTime() + minutes * 60_000).toISOString();
}

function getTrackName(trackCode: string) {
  return getTrack(trackCode)?.name ?? trackCode;
}

const reviewQueue: ReviewQueueItemSnapshot[] = [
  {
    id: "rq_001",
    sourceType: "PROBLEM",
    sourceId: "ownership-swap",
    trackCode: "track1",
    trackName: getTrackName("track1"),
    title: "参照で値を入れ替える",
    reasonType: "WRONG_ANSWER",
    priority: 90,
    availableAt: offsetFromGenerated(-510),
    conceptLabels: ["参照", "借用"],
    href: "/exercises/ownership-swap",
  },
  {
    id: "rq_002",
    sourceType: "PROBLEM",
    sourceId: "mutable-counter",
    trackCode: "track1",
    trackName: getTrackName("track1"),
    title: "コンパイルを通す: カウンタ",
    reasonType: "COMPILE_ERROR",
    priority: 80,
    availableAt: offsetFromGenerated(-500),
    conceptLabels: ["let", "mut"],
    href: "/exercises/mutable-counter",
  },
  {
    id: "rq_003",
    sourceType: "PROBLEM",
    sourceId: "sum-k-bruteforce",
    trackCode: "track3",
    trackName: getTrackName("track3"),
    title: "合計 K を作れるか",
    reasonType: "LONG_TIME",
    priority: 72,
    availableAt: offsetFromGenerated(-345),
    conceptLabels: ["全探索", "条件分岐"],
    href: "/exercises/sum-k-bruteforce",
  },
  {
    id: "rq_004",
    sourceType: "LESSON",
    sourceId: "track0/debugging-basics",
    trackCode: "track0",
    trackName: getTrackName("track0"),
    title: "デバッグ",
    reasonType: "PERIODIC_REVIEW",
    priority: 60,
    availableAt: offsetFromGenerated(810),
    conceptLabels: ["デバッグ", "読み解き"],
    href: "/learn/track0/debugging-basics",
  },
  {
    id: "rq_005",
    sourceType: "PROBLEM",
    sourceId: "first-word-slice",
    trackCode: "track1",
    trackName: getTrackName("track1"),
    title: "最初の単語を切り出す",
    reasonType: "EXPLANATION_VIEWED",
    priority: 55,
    availableAt: offsetFromGenerated(1560),
    conceptLabels: ["スライス", "文字列"],
    href: "/exercises/first-word-slice",
  },
];

export function isReviewAvailable(
  item: ReviewQueueItemSnapshot,
  referenceNow: Date = new Date()
) {
  return new Date(item.availableAt).getTime() <= referenceNow.getTime();
}

export function sortReviewQueue(
  items: ReviewQueueItemSnapshot[],
  sortMode: "priority" | "availableAt" = "priority",
  referenceNow: Date = new Date()
) {
  return [...items].sort((left, right) => {
    if (sortMode === "availableAt") {
      return (
        new Date(left.availableAt).getTime() - new Date(right.availableAt).getTime() ||
        right.priority - left.priority
      );
    }

    const leftAvailable = isReviewAvailable(left, referenceNow);
    const rightAvailable = isReviewAvailable(right, referenceNow);

    if (leftAvailable !== rightAvailable) {
      return leftAvailable ? -1 : 1;
    }

    return (
      right.priority - left.priority ||
      new Date(left.availableAt).getTime() - new Date(right.availableAt).getTime()
    );
  });
}

export const learningSnapshot: LearningSnapshot = {
  generatedAt: generatedAtDate.toISOString(),
  user: {
    id: "mock-user-ren",
    displayName: "Ren",
    skillLevel: "BEGINNER",
    primaryGoal: "RUST_INTRO",
    dailyMinutesGoal: 40,
  },
  overview: {
    totalStudyMinutes: 515,
    completedLessons: 13,
    totalLessons,
    solvedProblems: 6,
    totalProblems,
    currentStreak: 4,
    longestStreak: 9,
    recentAccuracy: 75,
    reviewQueueCount: reviewQueue.length,
  },
  trackProgress: [
    {
      trackCode: "track0",
      trackName: getTrackName("track0"),
      enrolledAt: offsetFromGenerated(-8 * 24 * 60),
      completedLessons: 9,
      totalLessons: tracks.find((track) => track.code === "track0")?.lessons.length ?? 0,
      completedProblems: 4,
      totalProblems: problemTotalsByTrack.track0 ?? 0,
      lastAccessedAt: offsetFromGenerated(-20 * 60),
      nextLesson: {
        title: "デバッグ",
        href: "/learn/track0/debugging-basics",
      },
    },
    {
      trackCode: "track1",
      trackName: getTrackName("track1"),
      enrolledAt: offsetFromGenerated(-3 * 24 * 60 - 9 * 60),
      completedLessons: 4,
      totalLessons: tracks.find((track) => track.code === "track1")?.lessons.length ?? 0,
      completedProblems: 2,
      totalProblems: problemTotalsByTrack.track1 ?? 0,
      lastAccessedAt: offsetFromGenerated(-120),
      nextLesson: {
        title: "制御構文",
        href: "/learn/track1/control-flow",
      },
    },
  ],
  recentLessons: [
    {
      lessonSlug: "control-flow",
      trackCode: "track1",
      trackName: getTrackName("track1"),
      title: "制御構文",
      progressState: "IN_PROGRESS",
      lastAccessedAt: offsetFromGenerated(-120),
      href: "/learn/track1/control-flow",
    },
    {
      lessonSlug: "functions",
      trackCode: "track1",
      trackName: getTrackName("track1"),
      title: "関数",
      progressState: "COMPLETED",
      lastAccessedAt: offsetFromGenerated(-19 * 60),
      href: "/learn/track1/functions",
    },
    {
      lessonSlug: "arrays-and-strings",
      trackCode: "track0",
      trackName: getTrackName("track0"),
      title: "配列・文字列",
      progressState: "COMPLETED",
      lastAccessedAt: offsetFromGenerated(-21 * 60),
      href: "/learn/track0/arrays-and-strings",
    },
  ],
  recentSubmissions: [
    {
      submissionId: "subm_001",
      problemId: "fizzbuzz",
      title: "FizzBuzz",
      status: "AC",
      submittedAt: offsetFromGenerated(-70),
      attemptCount: 2,
      tags: ["条件分岐", "反復"],
      href: "/exercises/fizzbuzz",
    },
    {
      submissionId: "subm_002",
      problemId: "ownership-swap",
      title: "参照で値を入れ替える",
      status: "WA",
      submittedAt: offsetFromGenerated(-120),
      attemptCount: 2,
      tags: ["参照", "借用", "関数"],
      href: "/exercises/ownership-swap",
    },
    {
      submissionId: "subm_003",
      problemId: "mutable-counter",
      title: "コンパイルを通す: カウンタ",
      status: "CE",
      submittedAt: offsetFromGenerated(-19 * 60 - 30),
      attemptCount: 1,
      tags: ["let", "mut", "コンパイルエラー"],
      href: "/exercises/mutable-counter",
    },
  ],
  weakTags: [
    { tag: "参照", accuracy: 50, attempts: 2 },
    { tag: "スライス", accuracy: 33, attempts: 3 },
    { tag: "match", accuracy: 50, attempts: 2 },
  ],
  recommendations: [
    {
      id: "rec_001",
      recommendationType: "NEXT_LESSON",
      targetType: "LESSON",
      targetId: "track1/control-flow",
      title: "制御構文",
      reasonText: "関数までは完了しているため、次は分岐と反復に進むのが自然です。",
      href: "/learn/track1/control-flow",
    },
    {
      id: "rec_002",
      recommendationType: "REVIEW_CONCEPT",
      targetType: "PROBLEM",
      targetId: "ownership-swap",
      title: "参照で値を入れ替える",
      reasonText: "可変参照の提出で不正解が続いているため、借用規則の確認を挟むと戻りやすくなります。",
      href: "/exercises/ownership-swap",
    },
    {
      id: "rec_003",
      recommendationType: "SOLVE_PROBLEM",
      targetType: "PROBLEM",
      targetId: "signal-match",
      title: "信号の動作を判定する",
      reasonText: "列挙型と match の導入直後に 1 問解くと定着しやすい構成です。",
      href: "/exercises/signal-match",
    },
  ],
  reviewQueue,
};
