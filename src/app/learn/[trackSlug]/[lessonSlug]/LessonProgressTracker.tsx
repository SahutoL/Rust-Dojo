"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, Button } from "@/components/ui";

const visitedLessonKeys = new Set<string>();

export function LessonProgressTracker({
  trackCode,
  lessonSlug,
}: {
  trackCode: string;
  lessonSlug: string;
}) {
  const { status } = useSession();
  const lessonKey = `${trackCode}/${lessonSlug}`;
  const [hasRecordedVisit, setHasRecordedVisit] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      hasRecordedVisit ||
      visitedLessonKeys.has(lessonKey)
    ) {
      if (visitedLessonKeys.has(lessonKey)) {
        setHasRecordedVisit(true);
      }
      return;
    }

    const controller = new AbortController();
    visitedLessonKeys.add(lessonKey);

    void fetch(`/api/lessons/${trackCode}/${lessonSlug}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ progressState: "IN_PROGRESS" }),
    })
      .then((response) => {
        if (response.ok) {
          setHasRecordedVisit(true);
        } else {
          visitedLessonKeys.delete(lessonKey);
        }
      })
      .catch(() => {
        visitedLessonKeys.delete(lessonKey);
      });

    return () => {
      controller.abort();
    };
  }, [hasRecordedVisit, lessonKey, lessonSlug, status, trackCode]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <Badge variant={isCompleted ? "success" : "info"} size="sm">
        {isCompleted ? "完了を記録済み" : hasRecordedVisit ? "閲覧を記録済み" : "学習を記録中"}
      </Badge>
      <Button
        type="button"
        size="sm"
        variant={isCompleted ? "ghost" : "primary"}
        disabled={isCompleted}
        isLoading={isCompleting}
        onClick={async () => {
          setIsCompleting(true);

          try {
            const response = await fetch(
              `/api/lessons/${trackCode}/${lessonSlug}/progress`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ progressState: "COMPLETED" }),
              }
            );

            if (response.ok) {
              setHasRecordedVisit(true);
              setIsCompleted(true);
              visitedLessonKeys.add(lessonKey);
            }
          } finally {
            setIsCompleting(false);
          }
        }}
      >
        {isCompleted ? "完了済み" : "完了として記録"}
      </Button>
    </div>
  );
}
