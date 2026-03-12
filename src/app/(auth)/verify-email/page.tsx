"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [tokenPreview, setTokenPreview] = useState(
    searchParams.get("tokenPreview") ?? ""
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token && tokenPreview) {
      setToken(tokenPreview);
    }
  }, [token, tokenPreview]);

  async function handleVerify() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "メール確認に失敗しました。");
        return;
      }

      setMessage("メール確認が完了しました。ログインできます。");
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "確認メールの再発行に失敗しました。");
        return;
      }

      setMessage(
        data?.alreadyVerified
          ? "このメールアドレスは確認済みです。ログインできます。"
          : "確認トークンを再発行しました。"
      );
      if (typeof data?.verificationTokenPreview === "string") {
        setTokenPreview(data.verificationTokenPreview);
        setToken(data.verificationTokenPreview);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-xl font-bold gradient-text tracking-tight">
              Rust Dojo
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">メール確認</h1>
        </div>

        <Card variant="bordered" padding="lg">
          <div className="space-y-4">
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="確認トークン"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="開発環境ではここに preview を貼り付けます"
            />
            {tokenPreview && (
              <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">
                  開発用トークン
                </p>
                <p className="text-sm font-mono break-all">{tokenPreview}</p>
              </div>
            )}
            {message && (
              <p className="text-sm text-[var(--color-success)]">{message}</p>
            )}
            {error && (
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1"
                isLoading={isLoading}
                onClick={handleVerify}
              >
                確認する
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                isLoading={isLoading}
                onClick={handleResend}
              >
                再発行
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          <Link href="/login" className="text-[var(--color-brand)] hover:underline">
            ログインへ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <Card variant="bordered" padding="lg">
              <p className="text-sm text-[var(--text-secondary)]">
                メール確認画面を読み込み中です。
              </p>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
