import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Button, Card, Input } from "@/components/ui";
import { Header } from "@/components/Header";
import { getAccountSnapshot, primaryGoalLabel } from "@/lib/account";
import { auth } from "@/lib/auth";
import { saveSettingsAction } from "./actions";
import { SettingsSessionRefresh } from "./SettingsSessionRefresh";

export const metadata: Metadata = {
  title: "設定",
};

function buildLoginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-[var(--text-secondary)]"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-[var(--border-primary)] px-4 py-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[var(--border-primary)]"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="block text-xs text-[var(--text-tertiary)] mt-1">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginHref("/settings"));
  }

  const account = await getAccountSnapshot(session.user.id);

  if (!account) {
    redirect(buildLoginHref("/settings"));
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Suspense fallback={null}>
        <SettingsSessionRefresh />
      </Suspense>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">設定</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              表示設定、通知、学習目標をアカウント単位で保存します。
            </p>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              プロフィールへ戻る
            </Button>
          </Link>
        </div>

        <form action={saveSettingsAction} className="space-y-6">
          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">基本情報</h2>
            <div className="space-y-4">
              <Input
                name="displayName"
                label="表示名"
                defaultValue={account.displayName}
                placeholder="表示名"
              />
              <div className="text-sm text-[var(--text-secondary)]">
                メールアドレス: {account.email}
              </div>
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">表示設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="テーマ"
                name="theme"
                defaultValue={account.preferences.theme}
                options={[
                  { value: "dark", label: "ダーク" },
                  { value: "light", label: "ライト" },
                ]}
              />
              <SelectField
                label="エディタ文字サイズ"
                name="editorFontSize"
                defaultValue={String(account.preferences.editorFontSize)}
                options={[
                  { value: "14", label: "14 px" },
                  { value: "16", label: "16 px" },
                  { value: "18", label: "18 px" },
                ]}
                hint="演習ページの Monaco Editor に反映されます。"
              />
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">通知設定</h2>
            <div className="space-y-3">
              <CheckboxField
                label="学習リマインドを受け取る"
                name="studyReminderEnabled"
                defaultChecked={account.preferences.studyReminderEnabled}
              />
              <CheckboxField
                label="復習リマインドを受け取る"
                name="reviewReminderEnabled"
                defaultChecked={account.preferences.reviewReminderEnabled}
              />
              <CheckboxField
                label="新規コンテンツの通知を受け取る"
                name="newContentNotificationEnabled"
                defaultChecked={account.preferences.newContentNotificationEnabled}
              />
            </div>
          </Card>

          <Card variant="bordered" padding="lg">
            <h2 className="text-lg font-semibold mb-4">学習目標・プライバシー</h2>
            <div className="space-y-4">
              <Input
                name="dailyMinutesGoal"
                type="number"
                min={1}
                max={600}
                label="1 日の学習目標 (分)"
                defaultValue={String(account.dailyMinutesGoal)}
              />
              <SelectField
                label="主な学習目的"
                name="primaryGoal"
                defaultValue={account.primaryGoal}
                options={[
                  { value: "PROGRAMMING_BASICS", label: primaryGoalLabel.PROGRAMMING_BASICS },
                  { value: "RUST_INTRO", label: primaryGoalLabel.RUST_INTRO },
                  { value: "RUST_PRACTICAL", label: primaryGoalLabel.RUST_PRACTICAL },
                  { value: "ATCODER", label: primaryGoalLabel.ATCODER },
                  { value: "OSS", label: primaryGoalLabel.OSS },
                  { value: "CAREER", label: primaryGoalLabel.CAREER },
                ]}
              />
              <CheckboxField
                label="利用状況の計測を許可する"
                name="usageAnalyticsEnabled"
                defaultChecked={account.preferences.usageAnalyticsEnabled}
                hint="学習改善のための利用状況集計に使います。"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">設定を保存する</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
