"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";

type Option = {
  value: string;
  label: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
      >
        <option value="">選択してください</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
      />
    </label>
  );
}

export function AdminMutationPanel({
  trackOptions,
  lessonOptions,
  problemOptions,
}: {
  trackOptions: Option[];
  lessonOptions: Option[];
  problemOptions: Option[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lessonMode, setLessonMode] = useState<"create" | "update">("create");
  const [lessonId, setLessonId] = useState("");
  const [lessonTrackCode, setLessonTrackCode] = useState(trackOptions[0]?.value ?? "");
  const [lessonSlug, setLessonSlug] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonTags, setLessonTags] = useState("");
  const [lessonEstimatedMinutes, setLessonEstimatedMinutes] = useState("10");
  const [lessonPublished, setLessonPublished] = useState(false);
  const [problemMode, setProblemMode] = useState<"create" | "update">("create");
  const [problemId, setProblemId] = useState("");
  const [problemTrackCode, setProblemTrackCode] = useState(trackOptions[0]?.value ?? "");
  const [problemType, setProblemType] = useState("IMPLEMENTATION");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [problemDifficulty, setProblemDifficulty] = useState("EASY");
  const [problemEstimatedMinutes, setProblemEstimatedMinutes] = useState("10");
  const [problemConstraints, setProblemConstraints] = useState("");
  const [problemInputFormat, setProblemInputFormat] = useState("");
  const [problemOutputFormat, setProblemOutputFormat] = useState("");
  const [problemHint, setProblemHint] = useState("");
  const [problemExplanation, setProblemExplanation] = useState("");
  const [problemInitialCode, setProblemInitialCode] = useState("");
  const [problemTags, setProblemTags] = useState("");
  const [problemPublished, setProblemPublished] = useState(false);
  const [relatedLessonIds, setRelatedLessonIds] = useState("");
  const [testcaseProblemId, setTestcaseProblemId] = useState(problemOptions[0]?.value ?? "");
  const [testcaseCaseType, setTestcaseCaseType] = useState("SAMPLE");
  const [testcaseInput, setTestcaseInput] = useState("");
  const [testcaseExpectedOutput, setTestcaseExpectedOutput] = useState("");
  const [testcaseTimeLimitMs, setTestcaseTimeLimitMs] = useState("2000");
  const [testcaseMemoryLimitKb, setTestcaseMemoryLimitKb] = useState("262144");
  const [testcaseScore, setTestcaseScore] = useState("0");

  async function submitJson(url: string, method: string, body: Record<string, unknown>) {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "保存に失敗しました。");
        return;
      }

      setMessage("保存しました。");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3 mb-8">
      <Card variant="bordered" padding="lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">レッスン編集</h2>
          <select
            value={lessonMode}
            onChange={(event) =>
              setLessonMode(event.target.value as "create" | "update")
            }
            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-2 py-1 text-sm"
          >
            <option value="create">新規作成</option>
            <option value="update">更新</option>
          </select>
        </div>
        <div className="space-y-3">
          {lessonMode === "update" && (
            <SelectField
              label="対象レッスン"
              value={lessonId}
              onChange={setLessonId}
              options={lessonOptions}
            />
          )}
          <SelectField
            label="トラック"
            value={lessonTrackCode}
            onChange={setLessonTrackCode}
            options={trackOptions}
          />
          <Input label="slug" value={lessonSlug} onChange={(event) => setLessonSlug(event.target.value)} />
          <Input label="タイトル" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} />
          <Input label="所要時間（分）" value={lessonEstimatedMinutes} onChange={(event) => setLessonEstimatedMinutes(event.target.value)} />
          <Input label="タグ（カンマ区切り）" value={lessonTags} onChange={(event) => setLessonTags(event.target.value)} />
          <TextareaField label="要約" value={lessonSummary} onChange={setLessonSummary} rows={3} />
          <TextareaField label="本文 Markdown" value={lessonContent} onChange={setLessonContent} rows={8} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lessonPublished}
              onChange={(event) => setLessonPublished(event.target.checked)}
            />
            公開する
          </label>
          <Button
            className="w-full"
            isLoading={isLoading}
            onClick={() =>
              submitJson(
                lessonMode === "create"
                  ? "/api/admin/lessons"
                  : `/api/admin/lessons/${lessonId}`,
                lessonMode === "create" ? "POST" : "PATCH",
                {
                  trackCode: lessonTrackCode,
                  slug: lessonSlug,
                  title: lessonTitle,
                  estimatedMinutes: Number(lessonEstimatedMinutes),
                  summary: lessonSummary,
                  content: lessonContent,
                  tags: lessonTags,
                  isPublished: lessonPublished,
                }
              )
            }
          >
            {lessonMode === "create" ? "レッスンを作成" : "レッスンを更新"}
          </Button>
        </div>
      </Card>

      <Card variant="bordered" padding="lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">問題編集</h2>
          <select
            value={problemMode}
            onChange={(event) =>
              setProblemMode(event.target.value as "create" | "update")
            }
            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-2 py-1 text-sm"
          >
            <option value="create">新規作成</option>
            <option value="update">更新</option>
          </select>
        </div>
        <div className="space-y-3">
          {problemMode === "update" && (
            <SelectField
              label="対象問題"
              value={problemId}
              onChange={setProblemId}
              options={problemOptions}
            />
          )}
          <SelectField
            label="トラック"
            value={problemTrackCode}
            onChange={setProblemTrackCode}
            options={trackOptions}
          />
          <SelectField
            label="種別"
            value={problemType}
            onChange={setProblemType}
            options={[
              { value: "IMPLEMENTATION", label: "実装" },
              { value: "COMPILE_ERROR_FIX", label: "コンパイル修正" },
              { value: "OWNERSHIP_FIX", label: "所有権修正" },
            ]}
          />
          <SelectField
            label="難易度"
            value={problemDifficulty}
            onChange={setProblemDifficulty}
            options={[
              { value: "EASY", label: "初級" },
              { value: "MEDIUM", label: "中級" },
              { value: "HARD", label: "上級" },
            ]}
          />
          <Input label="タイトル" value={problemTitle} onChange={(event) => setProblemTitle(event.target.value)} />
          <Input label="所要時間（分）" value={problemEstimatedMinutes} onChange={(event) => setProblemEstimatedMinutes(event.target.value)} />
          <Input label="タグ（カンマ区切り）" value={problemTags} onChange={(event) => setProblemTags(event.target.value)} />
          <Input label="関連レッスン ID（カンマ区切り）" value={relatedLessonIds} onChange={(event) => setRelatedLessonIds(event.target.value)} />
          <TextareaField label="問題文" value={problemStatement} onChange={setProblemStatement} rows={6} />
          <TextareaField label="制約" value={problemConstraints} onChange={setProblemConstraints} rows={3} />
          <TextareaField label="入力形式" value={problemInputFormat} onChange={setProblemInputFormat} rows={3} />
          <TextareaField label="出力形式" value={problemOutputFormat} onChange={setProblemOutputFormat} rows={3} />
          <TextareaField label="ヒント" value={problemHint} onChange={setProblemHint} rows={3} />
          <TextareaField label="解説" value={problemExplanation} onChange={setProblemExplanation} rows={4} />
          <TextareaField label="初期コード" value={problemInitialCode} onChange={setProblemInitialCode} rows={5} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={problemPublished}
              onChange={(event) => setProblemPublished(event.target.checked)}
            />
            公開する
          </label>
          <Button
            className="w-full"
            isLoading={isLoading}
            onClick={() =>
              submitJson(
                problemMode === "create"
                  ? "/api/admin/problems"
                  : `/api/admin/problems/${problemId}`,
                problemMode === "create" ? "POST" : "PATCH",
                {
                  trackCode: problemTrackCode,
                  type: problemType,
                  difficulty: problemDifficulty,
                  title: problemTitle,
                  statement: problemStatement,
                  estimatedMinutes: Number(problemEstimatedMinutes),
                  constraintsText: problemConstraints,
                  inputFormat: problemInputFormat,
                  outputFormat: problemOutputFormat,
                  hintText: problemHint,
                  explanationText: problemExplanation,
                  initialCode: problemInitialCode,
                  tags: problemTags,
                  relatedLessonIds: relatedLessonIds
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  isPublished: problemPublished,
                }
              )
            }
          >
            {problemMode === "create" ? "問題を作成" : "問題を更新"}
          </Button>
        </div>
      </Card>

      <Card variant="bordered" padding="lg">
        <h2 className="text-lg font-semibold mb-4">テストケース追加</h2>
        <div className="space-y-3">
          <SelectField
            label="対象問題"
            value={testcaseProblemId}
            onChange={setTestcaseProblemId}
            options={problemOptions}
          />
          <SelectField
            label="ケース種別"
            value={testcaseCaseType}
            onChange={setTestcaseCaseType}
            options={[
              { value: "SAMPLE", label: "サンプル" },
              { value: "HIDDEN", label: "非公開" },
            ]}
          />
          <TextareaField label="入力" value={testcaseInput} onChange={setTestcaseInput} rows={4} />
          <TextareaField
            label="期待出力"
            value={testcaseExpectedOutput}
            onChange={setTestcaseExpectedOutput}
            rows={4}
          />
          <Input label="timeLimitMs" value={testcaseTimeLimitMs} onChange={(event) => setTestcaseTimeLimitMs(event.target.value)} />
          <Input label="memoryLimitKb" value={testcaseMemoryLimitKb} onChange={(event) => setTestcaseMemoryLimitKb(event.target.value)} />
          <Input label="score" value={testcaseScore} onChange={(event) => setTestcaseScore(event.target.value)} />
          <Button
            className="w-full"
            isLoading={isLoading}
            onClick={() =>
              submitJson("/api/admin/testcases", "POST", {
                problemId: testcaseProblemId,
                caseType: testcaseCaseType,
                inputText: testcaseInput,
                expectedOutputText: testcaseExpectedOutput,
                timeLimitMs: Number(testcaseTimeLimitMs),
                memoryLimitKb: Number(testcaseMemoryLimitKb),
                score: Number(testcaseScore),
              })
            }
          >
            テストケースを追加
          </Button>
          {message && (
            <p className="text-sm text-[var(--color-success)]">{message}</p>
          )}
          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
