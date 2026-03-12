"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, Button, Card } from "@/components/ui";
import type { CatalogLessonSection } from "@/data/catalog";
import type { LessonSectionProgressSummary } from "@/data/learningService";
import { LessonContent } from "./LessonContent";
import { LessonProgressTracker } from "./LessonProgressTracker";
import { LessonSandbox } from "./LessonSandbox";
import type { LessonHeading } from "@/lib/lesson-markdown";

interface LessonQuizPayload {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonCodeExecutionPayload {
  prompt: string;
  starterCode: string;
  stdin: string;
  successMode: "compile";
}

function isLessonQuizPayload(value: unknown): value is LessonQuizPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.question === "string" &&
    Array.isArray(payload.options) &&
    typeof payload.correctIndex === "number" &&
    typeof payload.explanation === "string"
  );
}

function isLessonCodeExecutionPayload(
  value: unknown
): value is LessonCodeExecutionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.prompt === "string" &&
    typeof payload.starterCode === "string" &&
    typeof payload.stdin === "string"
  );
}

function buildDefaultSummary(
  lessonId: string,
  sections: CatalogLessonSection[]
): LessonSectionProgressSummary {
  const requiredSections = sections.filter((section) => section.isRequired);
  const explanationSections = requiredSections.filter(
    (section) => section.sectionType === "EXPLANATION"
  );

  return {
    lessonId,
    lessonProgressState: null,
    requiredSectionCount: requiredSections.length,
    completedRequiredSectionCount: 0,
    explanationCompletedCount: 0,
    explanationTotalCount: explanationSections.length,
    quizCompleted: false,
    codeExecutionCompleted: false,
    canComplete: false,
    progressBySectionId: {},
  };
}

export function LessonReadingWorkspace({
  trackCode,
  lessonId,
  lessonSlug,
  content,
  sections,
  headings,
  initialSandboxCode,
  initialSectionProgress,
}: {
  trackCode: string;
  lessonId: string;
  lessonSlug: string;
  content: string;
  sections: CatalogLessonSection[];
  headings: LessonHeading[];
  initialSandboxCode: string;
  initialSectionProgress: LessonSectionProgressSummary | null;
}) {
  const { status } = useSession();
  const [summary, setSummary] = useState<LessonSectionProgressSummary>(
    initialSectionProgress ?? buildDefaultSummary(lessonId, sections)
  );
  const [seenHeadingIds, setSeenHeadingIds] = useState<string[]>([]);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [quizMessage, setQuizMessage] = useState("");
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const explanationSections = sections.filter(
    (section) => section.sectionType === "EXPLANATION"
  );
  const quizSection = sections.find((section) => section.sectionType === "QUIZ") ?? null;
  const codeSection =
    sections.find((section) => section.sectionType === "CODE_EXECUTION") ?? null;
  const quizPayload =
    quizSection && isLessonQuizPayload(quizSection.payloadJson)
      ? quizSection.payloadJson
      : null;
  const codePayload =
    codeSection && isLessonCodeExecutionPayload(codeSection.payloadJson)
      ? codeSection.payloadJson
      : null;

  useEffect(() => {
    setSummary(initialSectionProgress ?? buildDefaultSummary(lessonId, sections));
  }, [initialSectionProgress, lessonId, sections]);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const controller = new AbortController();
    const observer = new IntersectionObserver(
      (entries) => {
        setSeenHeadingIds((previous) => {
          const next = new Set(previous);

          for (const entry of entries) {
            if (entry.isIntersecting) {
              next.add((entry.target as HTMLElement).id);
            }
          }

          return Array.from(next);
        });

        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const headingIndex = headings.findIndex(
            (heading) => heading.id === (entry.target as HTMLElement).id
          );
          const section = explanationSections[headingIndex];

          if (
            status !== "authenticated" ||
            !section ||
            summary.progressBySectionId[section.id]?.status === "COMPLETED"
          ) {
            continue;
          }

          void fetch(`/api/lessons/${trackCode}/${lessonSlug}/progress`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              sectionId: section.id,
              status: "COMPLETED",
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                return;
              }
              const data = await response.json().catch(() => null);
              if (data?.summary) {
                setSummary(data.summary);
              }
            })
            .catch(() => {
              return;
            });
        }
      },
      {
        rootMargin: "-15% 0px -60% 0px",
        threshold: 0.2,
      }
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [
    explanationSections,
    headings,
    lessonSlug,
    status,
    summary.progressBySectionId,
    trackCode,
  ]);

  const seenHeadingSet = useMemo(() => new Set(seenHeadingIds), [seenHeadingIds]);
  const completedHeadingCount = Math.max(
    summary.explanationCompletedCount,
    headings.filter((heading) => seenHeadingSet.has(heading.id)).length
  );

  async function postSectionProgress(sectionId: string, payload: Record<string, unknown>) {
    const response = await fetch(`/api/lessons/${trackCode}/${lessonSlug}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sectionId,
        ...payload,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json().catch(() => null);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_360px] gap-6 items-start">
      <aside className="xl:sticky xl:top-24">
        <Card variant="bordered" padding="lg">
          <h2 className="text-sm font-semibold mb-1">目次 / 進捗</h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-4 leading-relaxed">
            解説 {completedHeadingCount} / {headings.length}
          </p>

          {headings.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              目次として扱う見出しはありません。
            </p>
          ) : (
            <nav className="space-y-1">
              {headings.map((heading) => {
                const isSeen = seenHeadingSet.has(heading.id);

                return (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                      isSeen
                        ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                    } ${heading.level === 3 ? "ml-4" : ""}`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                        isSeen
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--border-secondary)]"
                      }`}
                    />
                    <span className="leading-relaxed">{heading.text}</span>
                  </a>
                );
              })}
            </nav>
          )}
        </Card>
      </aside>

      <div className="min-w-0">
        <LessonProgressTracker
          trackCode={trackCode}
          lessonId={lessonId}
          lessonSlug={lessonSlug}
          summary={summary}
          onSummaryChange={setSummary}
        />
        <LessonContent content={content} />

        {quizPayload && quizSection && (
          <Card variant="bordered" padding="lg" className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold">理解チェック</h2>
              <Badge
                variant={summary.quizCompleted ? "success" : "default"}
                size="sm"
              >
                {summary.quizCompleted ? "正答済み" : "必須"}
              </Badge>
            </div>
            <p className="text-sm font-medium mb-4">{quizPayload.question}</p>
            <div className="space-y-2">
              {quizPayload.options.map((option, index) => (
                <button
                  key={`${quizSection.id}-${index}`}
                  type="button"
                  disabled={summary.quizCompleted}
                  onClick={() => setSelectedQuizIndex(index)}
                  className={`w-full text-left rounded-lg border px-3 py-3 text-sm transition-colors cursor-pointer ${
                    selectedQuizIndex === index
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-900)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--border-secondary)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button
                size="sm"
                disabled={selectedQuizIndex === null || summary.quizCompleted}
                isLoading={isQuizSubmitting}
                onClick={async () => {
                  if (selectedQuizIndex === null) {
                    return;
                  }

                  const isCorrect = selectedQuizIndex === quizPayload.correctIndex;
                  setQuizMessage(
                    isCorrect
                      ? quizPayload.explanation
                      : "まだ違います。レッスン本文の定義をもう一度確認してください。"
                  );

                  if (status !== "authenticated") {
                    return;
                  }

                  setIsQuizSubmitting(true);
                  try {
                    const data = await postSectionProgress(quizSection.id, {
                      status: isCorrect ? "COMPLETED" : "IN_PROGRESS",
                      payloadJson: {
                        selectedIndex: selectedQuizIndex,
                        isCorrect,
                      },
                    });
                    if (data?.summary) {
                      setSummary(data.summary);
                    }
                  } finally {
                    setIsQuizSubmitting(false);
                  }
                }}
              >
                回答を記録
              </Button>
              {quizMessage && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {quizMessage}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <LessonSandbox
        initialCode={codePayload?.starterCode ?? initialSandboxCode}
        initialStdin={codePayload?.stdin ?? ""}
        prompt={codePayload?.prompt}
        onSuccessfulRun={() => {
          if (
            status !== "authenticated" ||
            !codeSection ||
            summary.progressBySectionId[codeSection.id]?.status === "COMPLETED"
          ) {
            return;
          }

          void postSectionProgress(codeSection.id, {
            status: "COMPLETED",
            payloadJson: {
              successMode: codePayload?.successMode ?? "compile",
            },
          }).then((data) => {
            if (data?.summary) {
              setSummary(data.summary);
            }
          });
        }}
      />
    </div>
  );
}
