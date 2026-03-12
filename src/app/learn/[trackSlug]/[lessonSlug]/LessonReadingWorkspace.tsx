"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { LessonContent } from "./LessonContent";
import { LessonProgressTracker } from "./LessonProgressTracker";
import { LessonSandbox } from "./LessonSandbox";
import type { LessonHeading } from "@/lib/lesson-markdown";

function parseStoredStringArray(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function LessonReadingWorkspace({
  trackCode,
  lessonSlug,
  content,
  headings,
  initialSandboxCode,
}: {
  trackCode: string;
  lessonSlug: string;
  content: string;
  headings: LessonHeading[];
  initialSandboxCode: string;
}) {
  const lessonKey = `${trackCode}/${lessonSlug}`;
  const scrollStorageKey = `rust-dojo:lesson-scroll:${lessonKey}`;
  const seenHeadingStorageKey = `rust-dojo:lesson-seen-headings:${lessonKey}`;
  const sandboxStorageKey = `rust-dojo:lesson-sandbox-success:${lessonKey}`;
  const [seenHeadingIds, setSeenHeadingIds] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : parseStoredStringArray(window.localStorage.getItem(seenHeadingStorageKey))
  );
  const [hasSuccessfulRun, setHasSuccessfulRun] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(sandboxStorageKey) === "1"
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedScroll = Number(window.localStorage.getItem(scrollStorageKey));
    if (Number.isFinite(savedScroll) && savedScroll > 0) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: "auto" });
      });
    }
  }, [scrollStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        window.localStorage.setItem(scrollStorageKey, String(window.scrollY));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.localStorage.setItem(scrollStorageKey, String(window.scrollY));
    };
  }, [scrollStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) {
      return;
    }

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setSeenHeadingIds((previous) => {
          const next = new Set(previous);
          let changed = false;

          for (const entry of entries) {
            if (entry.isIntersecting) {
              next.add((entry.target as HTMLElement).id);
              changed = true;
            }
          }

          if (!changed) {
            return previous;
          }

          const nextValue = Array.from(next);
          window.localStorage.setItem(
            seenHeadingStorageKey,
            JSON.stringify(nextValue)
          );
          return nextValue;
        });
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
      observer.disconnect();
    };
  }, [headings, seenHeadingStorageKey]);

  const seenHeadingSet = useMemo(() => new Set(seenHeadingIds), [seenHeadingIds]);
  const completedHeadingCount = headings.filter((heading) =>
    seenHeadingSet.has(heading.id)
  ).length;
  const minimumHeadingCount =
    headings.length === 0 ? 0 : Math.max(1, Math.ceil(headings.length * 0.8));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_360px] gap-6 items-start">
      <aside className="xl:sticky xl:top-24">
        <Card variant="bordered" padding="lg">
          <h2 className="text-sm font-semibold mb-1">目次 / 進捗</h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-4 leading-relaxed">
            見出し {completedHeadingCount} / {headings.length}
            {headings.length > 0 && ` · 完了記録の目安 ${minimumHeadingCount} 見出し`}
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
          lessonSlug={lessonSlug}
          completedHeadingCount={completedHeadingCount}
          totalHeadingCount={headings.length}
          hasSuccessfulRun={hasSuccessfulRun}
        />
        <LessonContent content={content} />
      </div>

      <LessonSandbox
        initialCode={initialSandboxCode}
        onSuccessfulRun={() => {
          setHasSuccessfulRun(true);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(sandboxStorageKey, "1");
          }
        }}
      />
    </div>
  );
}
