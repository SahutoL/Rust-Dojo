import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card } from "@/components/ui";
import { Header } from "@/components/Header";
import {
  getAccountSnapshot,
  primaryGoalLabel,
  skillLevelLabel,
} from "@/lib/account";
import {
  ProgressState,
  prisma,
} from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "プロフィール",
};

const progressStateLabel: Record<ProgressState, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "学習中",
  COMPLETED: "完了",
};

const progressStateVariant = {
  NOT_STARTED: "default",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
} as const;

const submissionVariant = {
  AC: "ac",
  WA: "wa",
  CE: "ce",
  TLE: "tle",
  RE: "re",
  PENDING: "default",
  RUNNING: "info",
  MLE: "warning",
  OLE: "warning",
  INTERNAL_ERROR: "error",
} as const;

function buildLoginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toTimestamp(value: string | Date) {
  return new Date(value).getTime();
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginHref("/profile"));
  }

  const account = await getAccountSnapshot(session.user.id);

  if (!account) {
    redirect(buildLoginHref("/profile"));
  }

  const [recentProgress, recentSubmissions, achievements] = await prisma.$transaction([
    prisma.progress.findMany({
      where: { userId: session.user.id },
      orderBy: { lastAccessedAt: "desc" },
      take: 5,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        progressState: true,
        lastAccessedAt: true,
        lesson: {
          select: { title: true },
        },
        problem: {
          select: { title: true },
        },
      },
    }),
    prisma.submission.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        problemId: true,
        problem: {
          select: { title: true },
        },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { earnedAt: "desc" },
      take: 8,
      select: {
        id: true,
        earnedAt: true,
        achievement: {
          select: {
            code: true,
            name: true,
            description: true,
          },
        },
      },
    }),
  ]);
  const recentActivities = [
    ...recentProgress.map((progress) => ({
      id: `progress-${progress.id}`,
      title:
        progress.lesson?.title ?? progress.problem?.title ?? progress.entityId,
      timestamp: progress.lastAccessedAt,
      metaLabel: progress.entityType === "LESSON" ? "レッスン" : "問題",
      badgeLabel: progressStateLabel[progress.progressState],
      badgeVariant: progressStateVariant[progress.progressState],
    })),
    ...recentSubmissions.map((submission) => ({
      id: `submission-${submission.id}`,
      title: submission.problem?.title ?? submission.problemId,
      timestamp: submission.submittedAt,
      metaLabel: "提出",
      badgeLabel: submission.status,
      badgeVariant:
        submissionVariant[
          submission.status as keyof typeof submissionVariant
        ],
    })),
  ].sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp));

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">プロフィール</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              学習目的、現在のレベル、最近の学習履歴を確認できます。
            </p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              設定を開く
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <Card variant="bordered" padding="md">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">表示名</p>
            <p className="text-lg font-semibold">{account.displayName}</p>
          </Card>
          <Card variant="bordered" padding="md">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">メールアドレス</p>
            <p className="text-sm font-medium break-all">{account.email}</p>
          </Card>
          <Card variant="bordered" padding="md">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">学習目的</p>
            <p className="text-lg font-semibold">
              {primaryGoalLabel[account.primaryGoal]}
            </p>
          </Card>
          <Card variant="bordered" padding="md">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">レベル</p>
            <p className="text-lg font-semibold">
              {skillLevelLabel[account.skillLevel]}
            </p>
          </Card>
          <Card variant="bordered" padding="md">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">1 日の学習目標</p>
            <p className="text-lg font-semibold">{account.dailyMinutesGoal} 分</p>
          </Card>
        </div>

        {account.onboardingResult && (
          <Card variant="bordered" padding="lg" className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">前回の診断結果</h2>
              <Badge variant="brand" size="sm">
                {account.onboardingResult.recommendedTrackName}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              {account.onboardingResult.description}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              診断日時: {formatDateTime(account.onboardingResult.answeredAt)}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">学習履歴</h2>
            <div className="space-y-3">
              {recentActivities.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  まだ保存済みの学習履歴はありません。
                </p>
              )}

              {recentActivities.map((activity) => (
                <Card key={activity.id} variant="default" padding="md">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-medium">{activity.title}</p>
                    <Badge variant={activity.badgeVariant} size="sm">
                      {activity.badgeLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {activity.metaLabel} · {formatDateTime(activity.timestamp)}
                  </p>
                </Card>
              ))}
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">実績</h2>
            <div className="space-y-3">
              {achievements.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  まだ獲得した実績はありません。
                </p>
              )}

              {achievements.map((achievement) => (
                <Card key={achievement.id} variant="default" padding="md">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-medium">{achievement.achievement.name}</p>
                    <Badge variant="success" size="sm">
                      達成
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    {achievement.achievement.description || achievement.achievement.code}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {formatDateTime(achievement.earnedAt)}
                  </p>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
