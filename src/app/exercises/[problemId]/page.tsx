"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/Header";
import { problems } from "@/data/problems";
import { getLesson, getTrack } from "@/data/lessons";
import { LessonContent } from "@/app/learn/[trackSlug]/[lessonSlug]/LessonContent";
import type { SubmitResponse, TestCaseResult } from "@/app/api/submit/route";
import { readEditorFontSizeFromCookieHeader } from "@/lib/account-preferences";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-tertiary)]">
      エディタを読み込み中...
    </div>
  ),
});

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

export default function ProblemPage() {
  const params = useParams();
  const problemId = params.problemId as string;
  const problem = problems.find((p) => p.id === problemId);

  const [code, setCode] = useState(problem?.initialCode ?? "");
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

  const handleRun = useCallback(async () => {
    if (!problem) return;
    setIsRunning(true);
    setRunOutput(null);
    setSubmitResult(null);

    try {
      // サンプルテストケースの最初の入力で実行
      const sampleCase = problem.testCases.find((tc) => !tc.isHidden);
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          stdin: sampleCase?.input ?? "",
        }),
      });
      const data = await res.json();
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
  }, [code, problem]);

  const handleSubmit = useCallback(async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setRunOutput(null);
    setSubmitResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, problemId: problem.id }),
      });
      const data: SubmitResponse = await res.json();
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
  }, [code, problem]);

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">問題が見つかりません。</p>
      </div>
    );
  }

  const sampleCases = problem.testCases.filter((testCase) => !testCase.isHidden);
  const track = getTrack(problem.trackCode);
  const relatedLessons = problem.relatedLessonSlugs.flatMap((lessonSlug) => {
    const lesson = getLesson(problem.trackCode, lessonSlug);
    return lesson ? [lesson] : [];
  });

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
          </div>
        </div>
      </div>

      {/* Main content: split view */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left panel: problem / result */}
        <div className="w-1/2 min-w-0 border-r border-[var(--border-primary)] flex flex-col overflow-hidden">
          {/* Tabs */}
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

          {/* Content */}
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
                          key={`${problem.id}-sample-${index}`}
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
                  <ProblemMetaSection
                    title="解説"
                    content={problem.explanationText}
                  />
                )}

                {relatedLessons.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-sm font-semibold mb-3">関連レッスン</h3>
                    <div className="space-y-2">
                      {relatedLessons.map((lesson) => (
                        <Link
                          href={`/learn/${problem.trackCode}/${lesson.slug}`}
                          key={lesson.slug}
                        >
                          <Card variant="bordered" padding="sm" className="mb-2">
                            <p className="text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                              {track?.name ?? "学習トラック"} · 約 {lesson.estimatedMinutes} 分
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
                {/* 実行結果 */}
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

                {/* 提出結果 */}
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
                        {statusLabel[submitResult.overallStatus]}
                        {" — "}
                        {submitResult.passedCount} / {submitResult.totalCount}{" "}
                        通過
                      </span>
                    </div>

                    <div className="space-y-3">
                      {submitResult.results.map(
                        (result: TestCaseResult, i: number) => (
                          <Card
                            key={i}
                            variant="bordered"
                            padding="sm"
                          >
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

        {/* Right panel: editor + actions */}
        <div className="w-1/2 min-w-0 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="rust"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
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

          {/* Actions */}
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
