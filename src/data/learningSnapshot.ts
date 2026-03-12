export type ProgressState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type SubmissionStatus = "AC" | "WA" | "CE" | "TLE" | "RE";
export type RecommendationType =
  | "NEXT_LESSON"
  | "REVIEW_CONCEPT"
  | "SOLVE_PROBLEM"
  | "COMPETITIVE_SET"
  | "PRACTICAL_TASK";
export type ReviewReasonType =
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "LONG_TIME"
  | "EXPLANATION_VIEWED"
  | "PERIODIC_REVIEW";

export interface DashboardUserSnapshot {
  id: string;
  displayName: string;
  skillLevel: "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE" | "ADVANCED";
  primaryGoal:
    | "PROGRAMMING_BASICS"
    | "RUST_INTRO"
    | "RUST_PRACTICAL"
    | "ATCODER"
    | "OSS"
    | "CAREER";
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
  COMPETITIVE_SET: "セットで解く",
  PRACTICAL_TASK: "課題に進む",
};

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
