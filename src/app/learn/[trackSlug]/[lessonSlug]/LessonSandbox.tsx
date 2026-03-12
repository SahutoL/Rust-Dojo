"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { readEditorFontSizeFromCookieHeader } from "@/lib/account-preferences";

interface RunOutput {
  stdout: string;
  stderr: string;
  success: boolean;
}

export function LessonSandbox({
  initialCode,
  prompt,
  initialStdin = "",
  onSuccessfulRun,
}: {
  initialCode: string;
  prompt?: string;
  initialStdin?: string;
  onSuccessfulRun: () => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState(initialStdin);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [fontSize] = useState(() =>
    typeof document === "undefined"
      ? 14
      : readEditorFontSizeFromCookieHeader(document.cookie)
  );

  async function handleRun() {
    setIsRunning(true);
    setOutput(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          stdin,
        }),
      });
      const data = await response.json();

      setOutput(data);

      if (response.ok && data.success) {
        onSuccessfulRun();
      }
    } catch {
      setOutput({
        stdout: "",
        stderr: "実行中にエラーが発生しました。",
        success: false,
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card variant="bordered" padding="lg" className="xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold mb-1">実行エリア</h2>
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            {prompt ?? "例を少し書き換えて実行し、理解を手で確かめます。"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setCode(initialCode);
            setStdin(initialStdin);
            setOutput(null);
          }}
        >
          戻す
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="lesson-sandbox-code"
            className="block text-xs text-[var(--text-tertiary)] mb-2"
          >
            Rust コード
          </label>
          <textarea
            id="lesson-sandbox-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            className="w-full min-h-[280px] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-3 font-mono text-[var(--text-primary)]"
            style={{ fontSize }}
          />
        </div>

        <div>
          <label
            htmlFor="lesson-sandbox-stdin"
            className="block text-xs text-[var(--text-tertiary)] mb-2"
          >
            標準入力
          </label>
          <textarea
            id="lesson-sandbox-stdin"
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            spellCheck={false}
            className="w-full min-h-[96px] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-3 font-mono text-sm text-[var(--text-primary)]"
          />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleRun} isLoading={isRunning}>
            実行する
          </Button>
        </div>

        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-2">結果</p>
          {!output && (
            <div className="rounded-xl border border-dashed border-[var(--border-primary)] px-3 py-4 text-sm text-[var(--text-tertiary)]">
              実行結果はここに表示されます。
            </div>
          )}
          {output && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">stdout</p>
                <pre className="whitespace-pre-wrap break-words text-xs font-mono text-[var(--text-primary)]">
                  {output.stdout || "(空)"}
                </pre>
              </div>
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">stderr</p>
                <pre className="whitespace-pre-wrap break-words text-xs font-mono text-[var(--color-error)]">
                  {output.stderr || "(なし)"}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
