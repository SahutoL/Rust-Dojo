"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import type { CatalogProblemSummary } from "@/data/catalog";

const difficultyLabel: Record<string, string> = {
  easy: "初級",
  medium: "中級",
  hard: "上級",
};

const problemKindLabel: Record<string, string> = {
  implementation: "実装",
  compile_error_fix: "CE 修正",
  ownership_fix: "借用確認",
};

const difficultyVariant: Record<string, "success" | "warning" | "default"> = {
  easy: "success",
  medium: "warning",
  hard: "default",
};

export function ExercisesPageClient({
  problems,
}: {
  problems: CatalogProblemSummary[];
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const allTags = useMemo(
    () => Array.from(new Set(problems.flatMap((problem) => problem.tags))),
    [problems]
  );
  const filtered = useMemo(
    () =>
      problems.filter((problem) => {
        if (selectedDifficulty && problem.difficulty !== selectedDifficulty) {
          return false;
        }
        if (selectedTag && !problem.tags.includes(selectedTag)) {
          return false;
        }
        return true;
      }),
    [problems, selectedDifficulty, selectedTag]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-2">演習問題</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        問題を解いて理解を確認できます。
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={selectedDifficulty}
          onChange={(event) => setSelectedDifficulty(event.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="">難易度</option>
          <option value="easy">初級</option>
          <option value="medium">中級</option>
          <option value="hard">上級</option>
        </select>
        <select
          value={selectedTag}
          onChange={(event) => setSelectedTag(event.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="">タグ</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        {(selectedDifficulty || selectedTag) && (
          <button
            onClick={() => {
              setSelectedDifficulty("");
              setSelectedTag("");
            }}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            フィルタを解除
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((problem) => (
          <Link href={`/exercises/${problem.id}`} key={problem.id}>
            <Card variant="default" hoverable padding="md" className="mb-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{problem.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {problem.trackName} · {problemKindLabel[problem.kind]} · 約{" "}
                    {problem.estimatedMinutes} 分
                  </p>
                </div>
                <Badge
                  variant={difficultyVariant[problem.difficulty]}
                  size="sm"
                >
                  {difficultyLabel[problem.difficulty]}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            条件に一致する問題がありません。
          </p>
        )}
      </div>
    </div>
  );
}
