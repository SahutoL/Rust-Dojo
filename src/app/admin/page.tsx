import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Badge, Card } from "@/components/ui";
import { getAdminSnapshot } from "@/data/adminSnapshot";
import { canAccessAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "管理画面",
};

const availabilityLabel = {
  available: "公開中",
  coming_soon: "準備中",
} as const;

const availabilityVariant = {
  available: "success",
  coming_soon: "warning",
} as const;

const difficultyVariant = {
  easy: "success",
  medium: "warning",
  hard: "error",
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

function buildLoginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

function getSubmissionVariant(status: string) {
  return submissionVariant[status as keyof typeof submissionVariant] ?? "default";
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginHref("/admin"));
  }

  if (!canAccessAdmin(session.user.adminRole)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card variant="bordered" padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="warning" size="sm">
                権限なし
              </Badge>
              <h1 className="text-xl font-semibold">管理画面を開けません</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              このページは管理者アカウント専用です。現在のログインでは閲覧権限が付与されていません。
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              必要な場合は、管理者に `admin_users` の付与を依頼してください。
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const snapshot = await getAdminSnapshot();
  const databaseHealthy = snapshot.databaseStatus.healthy;
  const difficultyCounts = {
    easy: snapshot.problemRows.filter((problem) => problem.difficulty === "easy").length,
    medium: snapshot.problemRows.filter((problem) => problem.difficulty === "medium").length,
    hard: snapshot.problemRows.filter((problem) => problem.difficulty === "hard").length,
  };
  const overviewCards = [
    {
      label: "登録ユーザー",
      value: databaseHealthy
        ? `${snapshot.userAnalytics.registeredUserCount} 人`
        : "取得失敗",
    },
    {
      label: "管理者アカウント",
      value: databaseHealthy ? `${snapshot.overview.activeAdminCount} 件` : "取得失敗",
    },
    {
      label: "公開レッスン",
      value: `${snapshot.overview.publishedLessonCount} 本`,
    },
    {
      label: "公開問題",
      value: `${snapshot.overview.problemCount} 問`,
    },
    {
      label: "提出総数",
      value: databaseHealthy ? `${snapshot.overview.submissionCount} 件` : "取得失敗",
    },
    {
      label: "未解決の復習キュー",
      value: databaseHealthy
        ? `${snapshot.userAnalytics.unresolvedReviewQueueCount} 件`
        : "取得失敗",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">管理画面</h1>
              <Badge variant="info" size="sm">
                読み取り専用
              </Badge>
              <Badge variant="brand" size="sm">
                {session.user.adminRole}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              現在の教材データと運用データを一覧で確認します。最終集計は{" "}
              {formatDateTime(snapshot.generatedAt)} です。
            </p>
          </div>
          <Link
            href="/api/admin/analytics"
            className="text-sm text-[var(--color-brand)] hover:underline"
          >
            analytics JSON を開く
          </Link>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
          {overviewCards.map((card) => (
            <Card key={card.label} variant="bordered" padding="md">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">{card.label}</p>
              <p className="text-lg font-semibold">{card.value}</p>
            </Card>
          ))}
        </div>

        {!databaseHealthy && (
          <Card variant="bordered" padding="md" className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="warning" size="sm">
                集計取得失敗
              </Badge>
              <p className="font-medium">DB 集計を一時的に取得できません</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {snapshot.databaseStatus.message}
            </p>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card variant="bordered" padding="lg">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold">コンテンツ管理</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  トラック別の公開状況、所要時間、レッスン一覧です。
                </p>
              </div>
              <Badge variant="default" size="sm">
                {snapshot.overview.lessonCount} 本
              </Badge>
            </div>

            <div className="space-y-4">
              {snapshot.lessonRows.map((track) => (
                <Card key={track.trackCode} variant="default" padding="md">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <p className="font-medium">
                      {track.trackLabel} {track.trackName}
                    </p>
                    <Badge
                      variant={availabilityVariant[track.availability]}
                      size="sm"
                    >
                      {availabilityLabel[track.availability]}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {track.publishedLessonCount} / {track.roadmapTopicCount} テーマ
                    </Badge>
                    <Badge variant="default" size="sm">
                      {track.totalMinutes} 分
                    </Badge>
                  </div>

                  {track.launchNote && (
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {track.launchNote}
                    </p>
                  )}

                  {track.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {track.lessons.map((lesson) => (
                        <Link
                          href={lesson.href}
                          key={`${track.trackCode}-${lesson.slug}`}
                          className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-secondary)] px-3 py-2 hover:border-[var(--color-brand)] transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {lesson.slug}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {lesson.estimatedMinutes} 分
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {lesson.statusLabel}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        まだ公開済みレッスンはありません。予定テーマを先に確認できます。
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {track.roadmapTopics.map((topic) => (
                          <Badge key={topic} variant="default" size="sm">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold">問題管理</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  難易度、形式、公開テストケース数、関連トラックを確認します。
                </p>
              </div>
              <Badge variant="default" size="sm">
                {snapshot.problemRows.length} 問
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="success" size="sm">
                easy {difficultyCounts.easy}
              </Badge>
              <Badge variant="warning" size="sm">
                medium {difficultyCounts.medium}
              </Badge>
              <Badge variant="error" size="sm">
                hard {difficultyCounts.hard}
              </Badge>
              <Badge variant="default" size="sm">
                公開 {snapshot.overview.sampleTestCaseCount} ケース
              </Badge>
              <Badge variant="default" size="sm">
                非公開 {snapshot.overview.hiddenTestCaseCount} ケース
              </Badge>
            </div>

            <div className="space-y-3">
              {snapshot.problemRows.map((problem) => (
                <Link href={problem.href} key={problem.problemId}>
                  <Card variant="default" padding="md" className="hover:border-[var(--color-brand)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-medium">{problem.title}</p>
                          <Badge
                            variant={difficultyVariant[problem.difficulty]}
                            size="sm"
                          >
                            {problem.difficulty}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {problem.kindLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {problem.trackName} · 関連レッスン {problem.relatedLessonCount} 件
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                        <span>{problem.estimatedMinutes} 分</span>
                        <span>公開 {problem.sampleTestCaseCount}</span>
                        <span>非公開 {problem.hiddenTestCaseCount}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold">採点管理</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  直近の提出、失敗傾向、ケース評価件数を確認します。
                </p>
              </div>
              <Badge variant="default" size="sm">
                直近 {snapshot.grading.recentSubmissionCount} 件
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-tertiary)]">ケース評価</p>
                <p className="text-lg font-semibold">{snapshot.grading.caseResultCount}</p>
              </Card>
              {Object.entries(snapshot.grading.statusCounts).map(([status, count]) => (
                <Card key={status} variant="default" padding="sm">
                  <p className="text-xs text-[var(--text-tertiary)]">{status}</p>
                  <p className="text-lg font-semibold">{count}</p>
                </Card>
              ))}
            </div>

            {!databaseHealthy ? (
              <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  現在は DB 集計に失敗しているため、採点状況を表示できません。接続復旧後に自動で反映されます。
                </p>
              </div>
            ) : snapshot.grading.latestSubmissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  提出データはまだありません。提出保存を入れる次段階までは、このセクションは空状態で運用します。
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {snapshot.grading.failureTrend.length > 0 ? (
                    snapshot.grading.failureTrend.map((entry) => (
                      <Badge
                        key={entry.status}
                        variant={getSubmissionVariant(entry.status)}
                        size="sm"
                      >
                        {entry.status} {entry.count}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="success" size="sm">
                      失敗傾向なし
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {snapshot.grading.latestSubmissions.map((submission) => (
                    <Card key={submission.submissionId} variant="default" padding="md">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-medium">{submission.problemTitle}</p>
                            <Badge
                              variant={getSubmissionVariant(submission.status)}
                              size="sm"
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {submission.userEmail}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] shrink-0">
                          {formatDateTime(submission.submittedAt)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card variant="bordered" padding="lg">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold">ユーザー分析</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  登録状況、進捗、復習キュー、推薦件数の概況です。
                </p>
              </div>
              <Badge variant="default" size="sm">
                新着 {snapshot.userAnalytics.latestUsers.length} 件
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-tertiary)]">進行中 progress</p>
                <p className="text-lg font-semibold">
                  {snapshot.userAnalytics.activeProgressCount}
                </p>
              </Card>
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-tertiary)]">完了 progress</p>
                <p className="text-lg font-semibold">
                  {snapshot.userAnalytics.completedProgressCount}
                </p>
              </Card>
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-tertiary)]">復習キュー</p>
                <p className="text-lg font-semibold">
                  {snapshot.userAnalytics.unresolvedReviewQueueCount}
                </p>
              </Card>
              <Card variant="default" padding="sm">
                <p className="text-xs text-[var(--text-tertiary)]">推薦件数</p>
                <p className="text-lg font-semibold">
                  {snapshot.userAnalytics.recommendationCount}
                </p>
              </Card>
            </div>

            {!databaseHealthy ? (
              <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  現在は DB 集計に失敗しているため、ユーザー分析を表示できません。
                </p>
              </div>
            ) : snapshot.userAnalytics.latestUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  登録ユーザーはまだありません。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshot.userAnalytics.latestUsers.map((user) => (
                  <Card key={user.userId} variant="default" padding="md">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {user.status}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          <Card variant="bordered" padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">通報対応</h2>
              <Badge variant="warning" size="sm">
                対象データなし
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              現行 schema には通報テーブルがありません。このバッチでは運用対象がないことを明示し、空状態で受けます。
            </p>
            <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
              <p className="text-sm text-[var(--text-tertiary)]">
                次段階で通報モデルと監査フローを追加した時点で、このセクションに一覧と処理履歴を載せます。
              </p>
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">お知らせ管理</h2>
              <Badge variant="warning" size="sm">
                対象データなし
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              お知らせ専用テーブルと公開フローはまだありません。保存操作は入れず、今は未実装領域として明示します。
            </p>
            <div className="rounded-lg border border-dashed border-[var(--border-secondary)] px-4 py-3">
              <p className="text-sm text-[var(--text-tertiary)]">
                後続バッチでデータモデルを追加したあと、一覧、下書き、公開状態をここへ統合します。
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
