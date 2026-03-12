import { tracks } from "@/data/lessons";
import { problems } from "@/data/problems";

type ProgressState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type SubmissionStatus = "AC" | "WA" | "CE" | "TLE" | "RE";
type RecommendationType = "NEXT_LESSON" | "REVIEW_CONCEPT" | "SOLVE_PROBLEM";
type ReviewReasonType =
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "LONG_TIME"
  | "PERIODIC_REVIEW";

interface DashboardUser {
  id: string;
  displayName: string;
  skillLevel: "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE";
  primaryGoal: "RUST_INTRO" | "ATCODER" | "RUST_PRACTICAL";
  dailyMinutesGoal: number;
}

interface TrackProgressSnapshot {
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

interface LessonProgressSnapshot {
  lessonSlug: string;
  trackCode: string;
  trackName: string;
  title: string;
  progressState: ProgressState;
  lastAccessedAt: string;
  href: string;
}

interface SubmissionSnapshot {
  submissionId: string;
  problemId: string;
  title: string;
  status: SubmissionStatus;
  submittedAt: string;
  attemptCount: number;
  tags: string[];
  href: string;
}

interface WeakTagSnapshot {
  tag: string;
  accuracy: number;
  attempts: number;
}

interface RecommendationSnapshot {
  id: string;
  recommendationType: RecommendationType;
  targetType: "LESSON" | "PROBLEM";
  targetId: string;
  title: string;
  reasonText: string;
  href: string;
}

interface ReviewQueueSnapshot {
  id: string;
  sourceType: "LESSON" | "PROBLEM";
  sourceId: string;
  title: string;
  reasonType: ReviewReasonType;
  priority: number;
  availableAt: string;
  href: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  user: DashboardUser;
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
  reviewQueue: ReviewQueueSnapshot[];
}

const problemTotalsByTrack = problems.reduce<Record<string, number>>(
  (acc, problem) => {
    acc[problem.trackCode] = (acc[problem.trackCode] ?? 0) + 1;
    return acc;
  },
  {}
);

const totalLessons = tracks.reduce((sum, track) => sum + track.lessons.length, 0);
const totalProblems = problems.length;

export const dashboardSnapshot: DashboardSnapshot = {
  generatedAt: "2026-03-12T08:45:00+09:00",
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
    reviewQueueCount: 3,
  },
  trackProgress: [
    {
      trackCode: "track0",
      trackName: "プログラミング前提",
      enrolledAt: "2026-03-04T19:20:00+09:00",
      completedLessons: 9,
      totalLessons: tracks.find((track) => track.code === "track0")?.lessons.length ?? 0,
      completedProblems: 4,
      totalProblems: problemTotalsByTrack.track0 ?? 0,
      lastAccessedAt: "2026-03-11T21:10:00+09:00",
      nextLesson: {
        title: "デバッグ",
        href: "/learn/track0/debugging-basics",
      },
    },
    {
      trackCode: "track1",
      trackName: "Rust 入門",
      enrolledAt: "2026-03-09T07:50:00+09:00",
      completedLessons: 4,
      totalLessons: tracks.find((track) => track.code === "track1")?.lessons.length ?? 0,
      completedProblems: 2,
      totalProblems: problemTotalsByTrack.track1 ?? 0,
      lastAccessedAt: "2026-03-12T07:55:00+09:00",
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
      trackName: "Rust 入門",
      title: "制御構文",
      progressState: "IN_PROGRESS",
      lastAccessedAt: "2026-03-12T07:55:00+09:00",
      href: "/learn/track1/control-flow",
    },
    {
      lessonSlug: "functions",
      trackCode: "track1",
      trackName: "Rust 入門",
      title: "関数",
      progressState: "COMPLETED",
      lastAccessedAt: "2026-03-11T22:10:00+09:00",
      href: "/learn/track1/functions",
    },
    {
      lessonSlug: "arrays-and-strings",
      trackCode: "track0",
      trackName: "プログラミング前提",
      title: "配列・文字列",
      progressState: "COMPLETED",
      lastAccessedAt: "2026-03-11T21:10:00+09:00",
      href: "/learn/track0/arrays-and-strings",
    },
  ],
  recentSubmissions: [
    {
      submissionId: "subm_001",
      problemId: "fizzbuzz",
      title: "FizzBuzz",
      status: "AC",
      submittedAt: "2026-03-12T08:10:00+09:00",
      attemptCount: 2,
      tags: ["条件分岐", "反復"],
      href: "/exercises/fizzbuzz",
    },
    {
      submissionId: "subm_002",
      problemId: "ownership-swap",
      title: "参照で値を入れ替える",
      status: "WA",
      submittedAt: "2026-03-12T07:20:00+09:00",
      attemptCount: 2,
      tags: ["参照", "借用", "関数"],
      href: "/exercises/ownership-swap",
    },
    {
      submissionId: "subm_003",
      problemId: "mutable-counter",
      title: "コンパイルを通す: カウンタ",
      status: "CE",
      submittedAt: "2026-03-11T22:25:00+09:00",
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
  reviewQueue: [
    {
      id: "rq_001",
      sourceType: "PROBLEM",
      sourceId: "ownership-swap",
      title: "参照で値を入れ替える",
      reasonType: "WRONG_ANSWER",
      priority: 90,
      availableAt: "2026-03-12T09:00:00+09:00",
      href: "/exercises/ownership-swap",
    },
    {
      id: "rq_002",
      sourceType: "PROBLEM",
      sourceId: "mutable-counter",
      title: "コンパイルを通す: カウンタ",
      reasonType: "COMPILE_ERROR",
      priority: 80,
      availableAt: "2026-03-12T09:10:00+09:00",
      href: "/exercises/mutable-counter",
    },
    {
      id: "rq_003",
      sourceType: "LESSON",
      sourceId: "track0/debugging-basics",
      title: "デバッグ",
      reasonType: "PERIODIC_REVIEW",
      priority: 60,
      availableAt: "2026-03-13T07:00:00+09:00",
      href: "/learn/track0/debugging-basics",
    },
  ],
};
