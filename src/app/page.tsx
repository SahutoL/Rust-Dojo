"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/Header";
import {
  tracks as lessonTracks,
  getTrackVolumeLabel,
  type TrackData,
} from "@/data/lessons";
import { problems } from "@/data/problems";

const availabilityLabel = {
  available: "公開中",
  coming_soon: "準備中",
} as const;

const availabilityVariant = {
  available: "brand",
  coming_soon: "default",
} as const;

function TrackCard({
  track,
  cardVariant,
}: {
  track: TrackData;
  cardVariant: "default" | "bordered";
}) {
  return (
    <Card variant={cardVariant} hoverable padding="md">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${track.gradient} shrink-0`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              {track.label}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              · {getTrackVolumeLabel(track)}
            </span>
            <Badge variant={availabilityVariant[track.availability]} size="sm">
              {availabilityLabel[track.availability]}
            </Badge>
          </div>
          <h3 className="font-semibold mb-1">{track.name}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {track.description}
          </p>
          {track.launchNote && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
              {track.launchNote}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

const learningFlow = [
  { step: 1, title: "概念を読む", desc: "図解と日本語で Rust の概念を把握する" },
  { step: 2, title: "コードを動かす", desc: "ブラウザ上でコードを実行し、挙動を確かめる" },
  { step: 3, title: "小問で確認する", desc: "クイズや穴埋めで理解度をその場でチェック" },
  { step: 4, title: "実問題を解く", desc: "学んだ概念を使って実装問題に取り組む" },
  { step: 5, title: "エラーから学ぶ", desc: "コンパイラの指摘を手がかりに原因を特定する" },
  { step: 6, title: "再挑戦する", desc: "復習キューで弱点を補い、確実に定着させる" },
];

const faqs = [
  {
    q: "プログラミング未経験でも始められますか？",
    a: "Track 0 でコンピュータの基本概念から解説します。変数や型、メモリの考え方を身につけたうえで Rust に進む構成です。",
  },
  {
    q: "Rust は難しいと聞きますが、ついていけるでしょうか。",
    a: "所有権や借用は段階を分けて導入します。コンパイラのエラーメッセージを教材として活用し、一つずつ理解を進める設計です。",
  },
  {
    q: "AtCoder 向けの内容はありますか？",
    a: "Track 3 では AtCoder の実行環境（rustc 1.89.0）を前提に、入出力テンプレート、Vec、ソート、探索、全探索の基礎を公開しています。典型問題や過去問セットは順次追加します。",
  },
  {
    q: "料金はかかりますか？",
    a: "Track 0 と Track 1 初級は無料で利用できます。実務トラックの中級以降や高難度の競プロセットは有料を予定しています。",
  },
];

/* ===== ログイン済みユーザー向けホーム ===== */
function AuthenticatedHome({ userName }: { userName: string }) {
  const totalLessons = lessonTracks.reduce((s, t) => s + t.lessons.length, 0);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          おかえりなさい、{userName}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          学習を続けましょう。
        </p>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/learn">
            <Card variant="bordered" hoverable padding="md">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">レッスン</p>
              <p className="text-lg font-bold">{totalLessons} 回</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">学習を続ける</p>
            </Card>
          </Link>
          <Link href="/exercises">
            <Card variant="bordered" hoverable padding="md">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">演習問題</p>
              <p className="text-lg font-bold">{problems.length} 問</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">問題を解く</p>
            </Card>
          </Link>
          <Link href="/dashboard">
            <Card variant="bordered" hoverable padding="md">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">進捗</p>
              <p className="text-lg font-bold">ダッシュボード</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">学習状況を確認</p>
            </Card>
          </Link>
        </div>

        {/* トラック一覧 */}
        <h2 className="text-sm font-semibold mb-3">学習トラック</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lessonTracks.map((track) => (
            <Link href={`/learn/${track.code}`} key={track.code}>
              <TrackCard track={track} cardVariant="bordered" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== 未ログインユーザー向けランディングページ ===== */
function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header fixed />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-brand)] opacity-[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--color-accent)] opacity-[0.04] rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            日本語で学べる Rust ハンズオン学習
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up tracking-tight">
            Rust を、
            <br className="sm:hidden" />
            <span className="gradient-text">基礎から実戦まで</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed">
            プログラミングの前提知識から、所有権・借用の理解、
            <br className="hidden sm:block" />
            実務開発と競技プログラミングまで。
            <br className="hidden sm:block" />
            コードを書き、エラーを読み、手を動かして身につける。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link href="/register">
              <Button size="lg">学習を始める</Button>
            </Link>
            <Link href="/learn/track0/what-is-computer">
              <Button variant="secondary" size="lg">
                体験してみる
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "自力でコードを書く",
                desc: "Rust の基本文法と所有権を理解し、コンパイラのエラーを読んで自分で修正できるようになる。",
              },
              {
                title: "実務の開発フローを回す",
                desc: "Cargo、テスト、lint、ドキュメントを含む一連の開発習慣を身につけ、保守可能なコードを書く。",
              },
              {
                title: "競プロの問題を解く",
                desc: "AtCoder の初中級問題を Rust で解けるようになる。入出力テンプレートと典型解法を習得する。",
              },
            ].map((item) => (
              <Card key={item.title} variant="bordered" hoverable>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight">
            {lessonTracks.length} つの学習トラック
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-12 max-w-xl mx-auto text-sm">
            目的と経験に応じてトラックを選択できます。学習診断で開始地点を提案します。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {lessonTracks.map((track) => (
              <Link href={`/learn/${track.code}`} key={track.code}>
                <TrackCard track={track} cardVariant="default" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Flow */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight">
            学習の進め方
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-12 text-sm max-w-lg mx-auto">
            読んで、動かして、間違えて、直す。この繰り返しで定着させます。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningFlow.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--color-brand-700)] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--color-brand)] shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight">
            よくある質問
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} variant="bordered" padding="lg">
                <h3 className="font-semibold mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
            Rust の学習を始める
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">
            学習診断で、あなたの経験と目的に合ったトラックを提案します。
          </p>
          <Link href="/register">
            <Button size="lg">無料で登録する</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-sm gradient-text">Rust Dojo</span>
          <div className="flex items-center gap-6 text-sm text-[var(--text-tertiary)]">
            <Link href="/about" className="hover:text-[var(--text-secondary)] transition-colors">
              概要
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">
              プライバシー
            </Link>
            <Link href="/contact" className="hover:text-[var(--text-secondary)] transition-colors">
              お問い合わせ
            </Link>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            &copy; 2026 Rust Dojo
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ===== メインコンポーネント: セッション状態で分岐 ===== */
export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-[var(--text-tertiary)]">読み込み中...</span>
      </div>
    );
  }

  if (status === "authenticated" && session?.user) {
    const userName =
      session.user.name || session.user.email?.split("@")[0] || "ユーザー";
    return <AuthenticatedHome userName={userName} />;
  }

  return <LandingPage />;
}
