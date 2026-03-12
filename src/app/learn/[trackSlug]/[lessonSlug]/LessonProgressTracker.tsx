"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, Button } from "@/components/ui";
import { type LessonSectionProgressSummary } from "@/data/learningService";

const visitedLessonIds = new Set<string>();

export function LessonProgressTracker({
  trackCode,
  lessonId,
  lessonSlug,
  summary,
  onSummaryChange,
}: {
  trackCode: string;
  lessonId: string;
  lessonSlug: string;
  summary: LessonSectionProgressSummary | null;
  onSummaryChange: (summary: LessonSectionProgressSummary) => void;
}) {
  const { status } = useSession();
  const [hasRecordedVisit, setHasRecordedVisit] = useState(
    summary?.lessonProgressState === "IN_PROGRESS" ||
      summary?.lessonProgressState === "COMPLETED"
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    summary?.lessonProgressState === "COMPLETED"
  );
  const canComplete = summary?.canComplete ?? false;

  useEffect(() => {
    setIsCompleted(summary?.lessonProgressState === "COMPLETED");
    setHasRecordedVisit(
      summary?.lessonProgressState === "IN_PROGRESS" ||
        summary?.lessonProgressState === "COMPLETED"
    );
  }, [summary]);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      hasRecordedVisit ||
      visitedLessonIds.has(lessonId)
    ) {
      if (visitedLessonIds.has(lessonId)) {
        setHasRecordedVisit(true);
      }
      return;
    }

    const controller = new AbortController();
    visitedLessonIds.add(lessonId);

    void fetch(`/api/lessons/${trackCode}/${lessonSlug}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ progressState: "IN_PROGRESS" }),
    })
      .then(async (response) => {
        if (!response.ok) {
          visitedLessonIds.delete(lessonId);
          return;
        }

        const data = await response.json().catch(() => null);
        if (data?.summary) {
          onSummaryChange(data.summary);
        }
        setHasRecordedVisit(true);
      })
      .catch(() => {
        visitedLessonIds.delete(lessonId);
      });

    return () => {
      controller.abort();
    };
  }, [
    hasRecordedVisit,
    lessonId,
    lessonSlug,
    onSummaryChange,
    status,
    trackCode,
  ]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <Badge variant={isCompleted ? "success" : "info"} size="sm">
        {isCompleted
          ? "完了を記録済み"
          : hasRecordedVisit
            ? "閲覧を記録済み"
            : "学習を記録中"}
      </Badge>
      <Badge
        variant={
          summary?.explanationCompletedCount === summary?.explanationTotalCount
            ? "success"
            : "default"
        }
        size="sm"
      >
        解説 {summary?.explanationCompletedCount ?? 0} /{" "}
        {summary?.explanationTotalCount ?? 0}
      </Badge>
      <Badge variant={summary?.quizCompleted ? "success" : "default"} size="sm">
        {summary?.quizCompleted ? "クイズ正答" : "クイズ待ち"}
      </Badge>
      <Badge
        variant={summary?.codeExecutionCompleted ? "success" : "default"}
        size="sm"
      >
        {summary?.codeExecutionCompleted ? "実行課題完了" : "実行課題待ち"}
      </Badge>
      <Button
        type="button"
        size="sm"
        variant={isCompleted ? "ghost" : "primary"}
        disabled={isCompleted || !canComplete}
        isLoading={isCompleting}
        onClick={async () => {
          setIsCompleting(true);

          try {
            const response = await fetch(
              `/api/lessons/${trackCode}/${lessonSlug}/complete`,
              {
                method: "POST",
              }
            );
            const data = await response.json().catch(() => null);

            if (response.ok && data?.summary) {
              onSummaryChange(data.summary);
              setHasRecordedVisit(true);
              setIsCompleted(true);
              visitedLessonIds.add(lessonId);
            }
          } finally {
            setIsCompleting(false);
          }
        }}
      >
        {isCompleted ? "完了済み" : "完了として記録"}
      </Button>
      {!canComplete && !isCompleted && (
        <p className="text-xs text-[var(--text-tertiary)]">
          解説を読み切り、理解チェックに正答し、実行課題を通すと完了を記録できます。
        </p>
      )}
    </div>
  );
}
