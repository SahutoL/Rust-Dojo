"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { getTrack, getTrackDisplayName } from "@/data/lessons";

// spec.md §10.2 に基づく質問定義
interface Question {
  id: string;
  text: string;
  options: { value: string; label: string }[];
}

const questions: Question[] = [
  {
    id: "programming_experience",
    text: "プログラミングの経験はありますか？",
    options: [
      { value: "none", label: "経験なし" },
      { value: "beginner", label: "少し触ったことがある" },
      { value: "intermediate", label: "他言語で実務・個人開発の経験がある" },
      { value: "advanced", label: "複数言語で開発経験があり、設計にも慣れている" },
    ],
  },
  {
    id: "other_languages",
    text: "使ったことのある言語を選んでください。",
    options: [
      { value: "none", label: "なし" },
      { value: "python", label: "Python" },
      { value: "javascript", label: "JavaScript / TypeScript" },
      { value: "c_cpp", label: "C / C++" },
      { value: "java", label: "Java / Kotlin" },
      { value: "other", label: "その他" },
    ],
  },
  {
    id: "rust_experience",
    text: "Rust の経験はありますか？",
    options: [
      { value: "none", label: "まったく触ったことがない" },
      { value: "tried", label: "少し試したことがある" },
      { value: "basics", label: "基本文法は理解している" },
      { value: "intermediate", label: "所有権や借用も含めて理解している" },
    ],
  },
  {
    id: "goal",
    text: "Rust Dojo で何を達成したいですか？",
    options: [
      { value: "basics", label: "プログラミングの基礎を学びたい" },
      { value: "rust_intro", label: "Rust の基本を身につけたい" },
      { value: "practical", label: "Rust で実務的な開発ができるようになりたい" },
      { value: "atcoder", label: "AtCoder の問題を Rust で解きたい" },
    ],
  },
  {
    id: "learning_style",
    text: "普段の学習スタイルに近いのはどれですか？",
    options: [
      { value: "read_first", label: "まず解説を読んで理解してから手を動かす" },
      { value: "try_first", label: "先にコードを書いてみて、詰まったら調べる" },
      { value: "problem_first", label: "問題を解くことで理解を深める" },
    ],
  },
];

interface DiagnosisResult {
  track: string;
  trackName: string;
  description: string;
  slug: string;
}

function diagnose(answers: Record<string, string>): DiagnosisResult {
  const { programming_experience, rust_experience, goal } = answers;
  const buildResult = (trackCode: string, description: string): DiagnosisResult => {
    const track = getTrack(trackCode);
    return {
      track: trackCode,
      trackName: track ? getTrackDisplayName(track) : trackCode,
      description,
      slug: trackCode,
    };
  };

  // spec.md §10.4 ルールベース診断
  if (programming_experience === "none") {
    return buildResult(
      "track0",
      "コンピュータの仕組みから変数・型・制御構文まで、プログラミングの基礎を学びます。その後 Rust 入門へ進みます。"
    );
  }

  if (goal === "atcoder") {
    if (rust_experience === "none" || rust_experience === "tried") {
      return buildResult(
        "track1",
        "Rust の基本文法と所有権・借用を固めたあと、Track 3 の AtCoder Rust で入出力テンプレートや探索の基礎へ進みます。"
      );
    }
    return buildResult(
      "track3",
      "rustc 1.89.0 を前提に、AtCoder の入出力テンプレート、Vec、ソート、探索、全探索から競プロ向けの書き方を固めます。"
    );
  }

  if (goal === "practical") {
    if (rust_experience === "basics" || rust_experience === "intermediate") {
      return buildResult(
        "track2",
        "Rust の基本はできているため、準備中の Track 2 で実務向けの Cargo 運用、設計、テスト戦略へ進むのが自然です。公開までは Track 1 の復習を並行するとつながりやすくなります。"
      );
    }
    return buildResult(
      "track1",
      "Rust の基本文法と所有権・借用を習得したあと、Track 2 の実務開発フローへ進む構成が合っています。"
    );
  }

  if (rust_experience === "basics" || rust_experience === "intermediate") {
    return buildResult(
      "track2",
      "基本文法は理解しているため、次は準備中の Track 2 で Cargo、テスト、lint、crate 設計へ進む想定です。公開までは Track 1 後半の土台にあたる内容を優先すると効果的です。"
    );
  }

  // デフォルト: Rust 入門
  return buildResult(
    "track1",
    "let と mut から所有権・借用まで、Rust の中核概念を段階的に学びます。"
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const isComplete = currentStep >= questions.length;

  function handleSelect(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      // 次の質問へ（選択から少し遅延して遷移）
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
    } else {
      // 最後の質問 → 診断結果を表示
      setTimeout(() => {
        setResult(diagnose(newAnswers));
        setCurrentStep(questions.length);
      }, 200);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setResult(null);
    }
  }

  function handleStartLearning() {
    if (result) {
      router.push(`/learn/${result.slug}`);
    }
  }

  const question = questions[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-xl font-bold gradient-text tracking-tight">
              Rust Dojo
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            学習診断
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            経験と目的に合ったトラックを提案します
          </p>
        </div>

        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-2">
            <span>
              {isComplete ? "完了" : `${currentStep + 1} / ${questions.length}`}
            </span>
          </div>
          <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-300"
              style={{
                width: `${isComplete ? 100 : ((currentStep + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 質問表示 */}
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

        {/* 診断結果 */}
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
              <div className="flex flex-col gap-3">
                <Button onClick={handleStartLearning} className="w-full">
                  このトラックで始める
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/learn")}
                  className="w-full"
                >
                  トラック一覧を見る
                </Button>
              </div>
            </Card>
            <button
              onClick={() => {
                setCurrentStep(0);
                setAnswers({});
                setResult(null);
              }}
              className="mt-4 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer block mx-auto"
            >
              もう一度診断する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
