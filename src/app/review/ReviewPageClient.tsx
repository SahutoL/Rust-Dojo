"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import {
  learningSnapshot,
  reviewReasonLabel,
  sortReviewQueue,
  isReviewAvailable,
  type ReviewQueueItemSnapshot,
} from "@/data/learningSnapshot";

const sourceTypeLabel = {
  PROBLEM: "問題",
  LESSON: "レッスン",
} as const;

const sortModeLabel = {
  priority: "重要度順",
  availableAt: "期限順",
} as const;

const reasonVariant = {
  WRONG_ANSWER: "warning",
  COMPILE_ERROR: "error",
  LONG_TIME: "info",
  EXPLANATION_VIEWED: "brand",
  PERIODIC_REVIEW: "default",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
        active
          ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
          : "bg-transparent text-[var(--text-secondary)] border-[var(--border-primary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}

export function ReviewPageClient({
  viewerName,
  dailyMinutesGoal,
}: {
  viewerName: string;
  dailyMinutesGoal: number;
}) {
  const [referenceNow] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "scheduled">(
    "all"
  );
  const [sourceFilter, setSourceFilter] = useState<"all" | "PROBLEM" | "LESSON">(
    "all"
  );
  const [sortMode, setSortMode] = useState<"priority" | "availableAt">("priority");
  const [conceptFilter, setConceptFilter] = useState("すべて");

  const availableCount = learningSnapshot.reviewQueue.filter((item) =>
    isReviewAvailable(item, referenceNow)
  ).length;
  const scheduledCount = learningSnapshot.reviewQueue.length - availableCount;
  const uniqueConceptLabels = Array.from(
    new Set(learningSnapshot.reviewQueue.flatMap((item) => item.conceptLabels))
  ).sort((left, right) => left.localeCompare(right, "ja"));

  const filteredItems = sortReviewQueue(
    learningSnapshot.reviewQueue.filter((item) => {
      const available = isReviewAvailable(item, referenceNow);

      if (statusFilter === "available" && !available) return false;
      if (statusFilter === "scheduled" && available) return false;
      if (sourceFilter !== "all" && item.sourceType !== sourceFilter) return false;
      if (conceptFilter !== "すべて" && !item.conceptLabels.includes(conceptFilter)) {
        return false;
      }

      return true;
    }),
    sortMode,
    referenceNow
  );

  const topPriorityItem = sortReviewQueue(
    learningSnapshot.reviewQueue,
    "priority",
    referenceNow
  )[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-1">復習</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        {viewerName} さん向けの復習キューです。1 日の目安は {dailyMinutesGoal} 分です。優先度と期限を見ながら、戻るべき問題とレッスンを整理できます。
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">今すぐ復習</p>
          <p className="text-lg font-bold">{availableCount} 件</p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">あとで復習</p>
          <p className="text-lg font-bold">{scheduledCount} 件</p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">最優先項目</p>
          <p className="text-sm font-semibold leading-relaxed">
            {topPriorityItem?.title ?? "なし"}
          </p>
        </Card>
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">苦手概念数</p>
          <p className="text-lg font-bold">{uniqueConceptLabels.length}</p>
        </Card>
      </div>

      <div className="space-y-6 mb-8">
        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-3">状態</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              すべて
            </FilterChip>
            <FilterChip
              active={statusFilter === "available"}
              onClick={() => setStatusFilter("available")}
            >
              今すぐ
            </FilterChip>
            <FilterChip
              active={statusFilter === "scheduled"}
              onClick={() => setStatusFilter("scheduled")}
            >
              予定
            </FilterChip>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-3">出典</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={sourceFilter === "all"}
              onClick={() => setSourceFilter("all")}
            >
              すべて
            </FilterChip>
            <FilterChip
              active={sourceFilter === "PROBLEM"}
              onClick={() => setSourceFilter("PROBLEM")}
            >
              問題
            </FilterChip>
            <FilterChip
              active={sourceFilter === "LESSON"}
              onClick={() => setSourceFilter("LESSON")}
            >
              レッスン
            </FilterChip>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <p className="text-xs text-[var(--text-tertiary)] mb-3">苦手概念</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={conceptFilter === "すべて"}
              onClick={() => setConceptFilter("すべて")}
            >
              すべて
            </FilterChip>
            {uniqueConceptLabels.map((conceptLabel) => (
              <FilterChip
                key={conceptLabel}
                active={conceptFilter === conceptLabel}
                onClick={() => setConceptFilter(conceptLabel)}
              >
                {conceptLabel}
              </FilterChip>
            ))}
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-1">並び順</p>
              <p className="text-sm text-[var(--text-secondary)]">
                既定は今すぐ復習を先頭にまとめます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["priority", "availableAt"] as const).map((mode) => (
                <FilterChip
                  key={mode}
                  active={sortMode === mode}
                  onClick={() => setSortMode(mode)}
                >
                  {sortModeLabel[mode]}
                </FilterChip>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-sm font-semibold">復習キュー</h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          更新日時: {formatDateTime(learningSnapshot.generatedAt)}
        </p>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item: ReviewQueueItemSnapshot) => {
          const available = isReviewAvailable(item, referenceNow);

          return (
            <Card key={item.id} variant="bordered" padding="md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={available ? "success" : "default"} size="sm">
                      {available ? "今すぐ" : "予定"}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {sourceTypeLabel[item.sourceType]}
                    </Badge>
                    <Badge variant={reasonVariant[item.reasonType]} size="sm">
                      {reviewReasonLabel[item.reasonType]}
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {item.trackName} · 重要度 {item.priority} · 復習可能時刻{" "}
                    {formatDateTime(item.availableAt)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {item.conceptLabels.map((conceptLabel) => (
                      <Badge key={`${item.id}-${conceptLabel}`} variant="default" size="sm">
                        {conceptLabel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Link href={item.href}>
                  <Button variant="ghost" size="sm">
                    開く
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}

        {filteredItems.length === 0 && (
          <Card variant="bordered" padding="lg">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              条件に一致する復習項目はありません。別の概念や並び順に切り替えると、次に戻る候補を確認できます。
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
