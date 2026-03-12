"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import {
  diagnoseAnswers,
  isOnboardingAnswers,
  onboardingQuestions,
  type DiagnosisResult,
  type OnboardingAnswers,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isComplete = currentStep >= onboardingQuestions.length;

  function handleSelect(questionId: keyof OnboardingAnswers, value: string) {
    setSaveError("");
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < onboardingQuestions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
      return;
    }

    if (isOnboardingAnswers(newAnswers)) {
      setTimeout(() => {
        setResult(diagnoseAnswers(newAnswers));
        setCurrentStep(onboardingQuestions.length);
      }, 200);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setResult(null);
      setSaveError("");
    }
  }

  async function handleStartLearning() {
    if (!result || !isOnboardingAnswers(answers)) {
      return;
    }
    if (status === "loading") {
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      if (status === "authenticated") {
        const response = await fetch("/api/onboarding/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.error || "診断結果を保存できませんでした。"
          );
        }
      }

      router.push(`/learn/${result.slug}`);
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "診断結果の保存中にエラーが発生しました。"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const question = onboardingQuestions[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-xl font-bold gradient-text tracking-tight">
              Rust Dojo
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">学習診断</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            経験と目的に合ったトラックを提案します
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-2">
            <span>
              {isComplete
                ? "完了"
                : `${currentStep + 1} / ${onboardingQuestions.length}`}
            </span>
          </div>
          <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-300"
              style={{
                width: `${isComplete ? 100 : ((currentStep + 1) / onboardingQuestions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {!isComplete && question && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold mb-6">{question.text}</h2>
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(question.id, option.value)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-all duration-150
                    cursor-pointer text-sm
                    ${
                      answers[question.id] === option.value
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-900)] text-[var(--text-primary)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="mt-4 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                前の質問に戻る
              </button>
            )}
          </div>
        )}

        {isComplete && result && (
          <div className="animate-slide-up">
            <Card variant="bordered" padding="lg">
              <p className="text-xs text-[var(--text-tertiary)] mb-1 font-mono">
                推奨トラック
              </p>
              <h2 className="text-lg font-bold mb-3">{result.trackName}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                {result.description}
              </p>
              {saveError && (
                <p className="text-sm text-[var(--color-error)] mb-4">
                  {saveError}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleStartLearning}
                  className="w-full"
                  isLoading={isSaving || status === "loading"}
                >
                  このトラックで始める
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep(0);
                    setAnswers({});
                    setResult(null);
                    setSaveError("");
                  }}
                >
                  もう一度診断する
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
