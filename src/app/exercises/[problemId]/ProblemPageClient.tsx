"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/Header";
import { LessonContent } from "@/app/learn/[trackSlug]/[lessonSlug]/LessonContent";
import { readEditorFontSizeFromCookieHeader } from "@/lib/account-preferences";
import type { CatalogProblemDetail } from "@/data/catalog";
import type { SubmitResponse, TestCaseResult } from "@/lib/problem-attempts";

const viewedProblemIds = new Set<string>();

const Editor = dynamic(
  () => import("@monaco-editor/react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-sm text-[var(--text-tertiary)]">
        エディタを読み込み中...
      </div>
    ),
  }
);

const difficultyLabel: Record<string, string> = {
  easy: "初級",
  medium: "中級",
  hard: "上級",
};

const difficultyVariant: Record<string, "success" | "warning" | "default"> = {
  easy: "success",
  medium: "warning",
  hard: "default",
};

const statusLabel: Record<string, string> = {
  AC: "正解",
  WA: "不正解",
  CE: "コンパイルエラー",
  TLE: "実行時間超過",
  RE: "実行時エラー",
};

const statusVariant: Record<string, "ac" | "wa" | "ce" | "tle" | "re"> = {
  AC: "ac",
  WA: "wa",
  CE: "ce",
  TLE: "tle",
  RE: "re",
};

function ProblemMetaSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <LessonContent content={content} />
    </section>
  );
}

export function ProblemPageClient({
  problem,
}: {
  problem: CatalogProblemDetail;
}) {
  const { status } = useSession();
  const [code, setCode] = useState(problem.initialCode);
  const [editorFontSize] = useState(() =>
    typeof document === "undefined"
      ? 14
      : readEditorFontSizeFromCookieHeader(document.cookie)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runOutput, setRunOutput] = useState<{
    stdout: string;
    stderr: string;
    success: boolean;
  } | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"problem" | "result">("problem");
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const sampleCases = problem.testCases.filter((testCase) => !testCase.isHidden);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      viewedProblemIds.has(problem.id)
    ) {
      return;
    }

    const controller = new AbortController();
    viewedProblemIds.add(problem.id);

    void fetch(`/api/problems/${problem.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ progressState: "IN_PROGRESS" }),
    })
      .then((response) => {
        if (!response.ok) {
          viewedProblemIds.delete(problem.id);
        }
      })
      .catch(() => {
        viewedProblemIds.delete(problem.id);
      });

    return () => {
      controller.abort();
    };
  }, [problem.id, status]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setRunOutput(null);
    setSubmitResult(null);

    try {
      const response = await fetch(`/api/problems/${problem.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
        }),
      });
      const data = await response.json();
      setRunOutput(data);
      setActiveTab("result");
    } catch {
      setRunOutput({
        stdout: "",
        stderr: "実行中にエラーが発生しました。",
        success: false,
      });
      setActiveTab("result");
    } finally {
      setIsRunning(false);
    }
  }, [code, problem.id]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setRunOutput(null);
    setSubmitResult(null);

    try {
      const response = await fetch(`/api/problems/${problem.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: SubmitResponse = await response.json();
      setSubmitResult(data);
      setActiveTab("result");
    } catch {
      setSubmitResult(null);
      setRunOutput({
        stdout: "",
        stderr: "提出中にエラーが発生しました。",
        success: false,
      });
      setActiveTab("result");
    } finally {
      setIsSubmitting(false);
    }
  }, [code, problem.id]);

  const handleShowExplanation = useCallback(async () => {
    setIsExplanationVisible(true);

    if (status !== "authenticated") {
      return;
    }

    try {
      await fetch(`/api/problems/${problem.id}/explanation-viewed`, {
        method: "POST",
      });
    } catch {
      // 解説表示自体は止めない
    }
  }, [problem.id, status]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="border-b border-[var(--border-primary)] px-4 shrink-0">
        <div className="h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link
              href="/exercises"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              演習
            </Link>
            <span className="text-[var(--text-tertiary)]">/</span>
            <span className="text-[var(--text-primary)] truncate max-w-[200px]">
              {problem.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={difficultyVariant[problem.difficulty]} size="sm">
              {difficultyLabel[problem.difficulty]}
            </Badge>
            {status === "authenticated" && (
              <span className="text-xs text-[var(--text-tertiary)]">
                進捗は自動で記録されます
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-1/2 min-w-0 border-r border-[var(--border-primary)] flex flex-col overflow-hidden">
          <div className="flex border-b border-[var(--border-primary)] shrink-0">
            <button
              onClick={() => setActiveTab("problem")}
              className={`px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                activeTab === "problem"
                  ? "text-[var(--text-primary)] border-b-2 border-[var(--color-brand)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              問題
            </button>
            <button
              onClick={() => setActiveTab("result")}
              className={`px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                activeTab === "result"
                  ? "text-[var(--text-primary)] border-b-2 border-[var(--color-brand)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              結果
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "problem" && (
              <>
                <LessonContent content={problem.statement} />

                {problem.constraintsText && (
                  <ProblemMetaSection
                    title="制約"
                    content={problem.constraintsText}
                  />
                )}

                {problem.inputFormat && (
                  <ProblemMetaSection
                    title="入力形式"
                    content={problem.inputFormat}
                  />
                )}

                {problem.outputFormat && (
                  <ProblemMetaSection
                    title="出力形式"
                    content={problem.outputFormat}
                  />
                )}

                {sampleCases.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-sm font-semibold mb-3">サンプル</h3>
                    <div className="space-y-3">
                      {sampleCases.map((testCase, index) => (
                        <Card
                          key={testCase.id}
                          variant="bordered"
                          padding="sm"
                        >
                          <p className="text-xs text-[var(--text-tertiary)] mb-2">
                            サンプル {index + 1}
                          </p>
                          <div className="space-y-2 text-xs font-mono">
                            {testCase.input && (
                              <div>
                                <span className="text-[var(--text-tertiary)]">
                                  入力:
                                </span>
                                <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap">
                                  {testCase.input.trimEnd()}
                                </pre>
                              </div>
                            )}
                            <div>
                              <span className="text-[var(--text-tertiary)]">
                                出力:
                              </span>
                              <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap">
                                {testCase.expectedOutput.trimEnd()}
                              </pre>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {problem.hintText && (
                  <ProblemMetaSection title="ヒント" content={problem.hintText} />
                )}

                {problem.explanationText && (
                  <section className="mt-8">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold">解説</h3>
                      {!isExplanationVisible && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleShowExplanation}
                        >
                          解説を見る
                        </Button>
                      )}
                    </div>
                    {isExplanationVisible ? (
                      <LessonContent content={problem.explanationText} />
                    ) : (
                      <Card variant="bordered" padding="sm">
                        <p className="text-sm text-[var(--text-secondary)]">
                          自力での試行後に読む前提です。必要になった時点で開けます。
                        </p>
                      </Card>
                    )}
                  </section>
                )}

                {problem.relatedLessons.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-sm font-semibold mb-3">関連レッスン</h3>
                    <div className="space-y-2">
                      {problem.relatedLessons.map((lesson) => (
                        <Link
                          href={`/learn/${lesson.trackCode}/${lesson.slug}`}
                          key={lesson.id}
                        >
                          <Card variant="bordered" padding="sm" className="mb-2">
                            <p className="text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                              {lesson.trackName} · 約 {lesson.estimatedMinutes} 分
                            </p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === "result" && (
              <div className="space-y-4">
                {runOutput && !submitResult && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">実行結果</h3>
                    {runOutput.stdout && (
                      <div className="mb-3">
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          stdout
                        </p>
                        <pre className="text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                          {runOutput.stdout}
                        </pre>
                      </div>
                    )}
                    {runOutput.stderr && (
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          stderr
                        </p>
                        <pre className="text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-[var(--color-error)]">
                          {runOutput.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {submitResult && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge
                        variant={statusVariant[submitResult.overallStatus]}
                        size="md"
                      >
                        {submitResult.overallStatus}
                      </Badge>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {statusLabel[submitResult.overallStatus]}{" "}
                        {submitResult.passedCount} / {submitResult.totalCount} 通過
                      </span>
                    </div>

                    <div className="space-y-3">
                      {submitResult.results.map(
                        (result: TestCaseResult, index: number) => (
                          <Card key={index} variant="bordered" padding="sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={statusVariant[result.status]}
                                size="sm"
                              >
                                {result.status}
                              </Badge>
                              <span className="text-xs text-[var(--text-tertiary)]">
                                テストケース {result.index + 1}
                                {result.isHidden ? " (非公開)" : ""}
                              </span>
                            </div>

                            {!result.isHidden && (
                              <div className="space-y-2 text-xs font-mono">
                                {result.input && (
                                  <div>
                                    <span className="text-[var(--text-tertiary)]">
                                      入力:
                                    </span>
                                    <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap">
                                      {result.input.trimEnd()}
                                    </pre>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[var(--text-tertiary)]">
                                    期待出力:
                                  </span>
                                  <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap">
                                    {result.expectedOutput.trimEnd()}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[var(--text-tertiary)]">
                                    実際の出力:
                                  </span>
                                  <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap">
                                    {result.actualOutput.trimEnd()}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {result.stderr && result.status !== "AC" && (
                              <div className="mt-2 text-xs">
                                <span className="text-[var(--text-tertiary)]">
                                  stderr:
                                </span>
                                <pre className="bg-[var(--bg-tertiary)] rounded p-2 mt-0.5 whitespace-pre-wrap text-[var(--color-error)]">
                                  {result.stderr}
                                </pre>
                              </div>
                            )}
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {!runOutput && !submitResult && (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
                    コードを実行または提出すると、ここに結果が表示されます。
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="rust"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                fontSize: editorFontSize,
                fontFamily: "var(--font-mono), monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbersMinChars: 3,
                tabSize: 4,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="border-t border-[var(--border-primary)] px-4 py-3 flex items-center justify-between shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCode(problem.initialCode)}
            >
              リセット
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRun}
                isLoading={isRunning}
                disabled={isSubmitting}
              >
                実行
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={isRunning}
              >
                提出
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
