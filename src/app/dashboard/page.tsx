"use client";

import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { Header } from "@/components/Header";
import { dashboardSnapshot } from "@/data/dashboard";

const progressStateLabel = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "学習中",
  COMPLETED: "完了",
} as const;

const progressStateVariant = {
  NOT_STARTED: "default",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
} as const;

const reviewReasonLabel = {
  WRONG_ANSWER: "不正解の再確認",
  COMPILE_ERROR: "コンパイルエラーの復習",
  LONG_TIME: "時間がかかった問題",
  PERIODIC_REVIEW: "間隔を空けた復習",
} as const;

const recommendationTypeLabel = {
  NEXT_LESSON: "次に進む",
  REVIEW_CONCEPT: "復習する",
  SOLVE_PROBLEM: "問題を解く",
} as const;

const submissionVariant = {
  AC: "ac",
  WA: "wa",
  CE: "ce",
  TLE: "tle",
  RE: "re",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${value}%`;
}

export default function DashboardPage() {
  const { user, overview, trackProgress, recentLessons, recentSubmissions, weakTags, recommendations, reviewQueue } =
    dashboardSnapshot;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">学習状況</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          {user.displayName} さんの学習スナップショットです。1 日の目安は {user.dailyMinutesGoal} 分です。
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              label: "学習時間",
              value: `${overview.totalStudyMinutes} 分`,
            },
            {
              label: "レッスン完了",
              value: `${overview.completedLessons} / ${overview.totalLessons}`,
            },
            {
              label: "演習 AC",
              value: `${overview.solvedProblems} / ${overview.totalProblems}`,
            },
            {
              label: "最近の正答率",
              value: formatPercent(overview.recentAccuracy),
            },
            {
              label: "連続学習",
              value: `${overview.currentStreak} 日`,
            },
            {
              label: "復習待ち",
              value: `${overview.reviewQueueCount} 件`,
            },
          ].map((stat) => (
            <Card key={stat.label} variant="bordered" padding="md">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">
                {stat.label}
              </p>
              <p className="text-lg font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">トラック進捗</h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              更新日時: {formatDateTime(dashboardSnapshot.generatedAt)}
            </p>
          </div>
          <div className="space-y-3">
            {trackProgress.map((track) => {
              const lessonRate = Math.round(
                (track.completedLessons / track.totalLessons) * 100
              );
              const problemRate =
                track.totalProblems === 0
                  ? 0
                  : Math.round((track.completedProblems / track.totalProblems) * 100);

              return (
                <Card key={track.trackCode} variant="bordered" padding="md">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-semibold">{track.trackName}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        最終学習: {formatDateTime(track.lastAccessedAt)}
                      </p>
                    </div>
                    {track.nextLesson && (
                      <Link href={track.nextLesson.href}>
                        <Button variant="ghost" size="sm">
                          次: {track.nextLesson.title}
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                        <span>レッスン</span>
                        <span>
                          {track.completedLessons} / {track.totalLessons}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-brand)] rounded-full"
                          style={{ width: `${lessonRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                        <span>演習</span>
                        <span>
                          {track.completedProblems} / {track.totalProblems}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-success)] rounded-full"
                          style={{ width: `${problemRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="text-sm font-semibold mb-3">直近のレッスン</h2>
            <div className="space-y-2">
              {recentLessons.map((lesson) => (
                <Link href={lesson.href} key={`${lesson.trackCode}-${lesson.lessonSlug}`}>
                  <Card variant="bordered" padding="sm" className="mb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {lesson.trackName} · {formatDateTime(lesson.lastAccessedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={progressStateVariant[lesson.progressState]}
                        size="sm"
                      >
                        {progressStateLabel[lesson.progressState]}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">直近の提出</h2>
            <div className="space-y-2">
              {recentSubmissions.map((submission) => (
                <Link href={submission.href} key={submission.submissionId}>
                  <Card variant="bordered" padding="sm" className="mb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{submission.title}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {formatDateTime(submission.submittedAt)} · {submission.attemptCount} 回目
                        </p>
                      </div>
                      <Badge variant={submissionVariant[submission.status]} size="sm">
                        {submission.status}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="text-sm font-semibold mb-3">苦手タグ</h2>
            <div className="space-y-2">
              {weakTags.map((tag) => (
                <Card key={tag.tag} variant="bordered" padding="sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{tag.tag}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        正答率 {formatPercent(tag.accuracy)} · {tag.attempts} 回挑戦
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      要確認
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">推薦学習</h2>
            <div className="space-y-2">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} variant="bordered" padding="sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{recommendation.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {recommendation.reasonText}
                      </p>
                    </div>
                    <Link href={recommendation.href}>
                      <Button variant="ghost" size="sm">
                        {recommendationTypeLabel[recommendation.recommendationType]}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">復習キュー</h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              最長連続学習: {overview.longestStreak} 日
            </p>
          </div>
          <div className="space-y-2">
            {reviewQueue.map((item) => (
              <Card key={item.id} variant="bordered" padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {reviewReasonLabel[item.reasonType]} · 優先度 {item.priority} ·{" "}
                      {formatDateTime(item.availableAt)}
                    </p>
                  </div>
                  <Link href={item.href}>
                    <Button variant="ghost" size="sm">
                      開く
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
