"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isConfirmMode = token.length > 0;

  async function handleRequest() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "request", email }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "再設定トークンの発行に失敗しました。");
        return;
      }

      setMessage("再設定トークンを発行しました。");
      if (typeof data?.resetTokenPreview === "string") {
        setTokenPreview(data.resetTokenPreview);
        setToken(data.resetTokenPreview);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "confirm", token, password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "パスワード再設定に失敗しました。");
        return;
      }

      setMessage("パスワードを更新しました。");
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
          <h1 className="text-2xl font-bold tracking-tight">パスワード再設定</h1>
        </div>

        <Card variant="bordered" padding="lg">
          <div className="space-y-4">
            {!isConfirmMode && (
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            )}
            {isConfirmMode && (
              <>
                <Input
                  label="再設定トークン"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <Input
                  label="新しいパスワード"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8 文字以上"
                />
              </>
            )}
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
            <Button
              type="button"
              className="w-full"
              isLoading={isLoading}
              onClick={isConfirmMode ? handleConfirm : handleRequest}
            >
              {isConfirmMode ? "パスワードを更新する" : "再設定トークンを発行する"}
            </Button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <Card variant="bordered" padding="lg">
              <p className="text-sm text-[var(--text-secondary)]">
                パスワード再設定画面を読み込み中です。
              </p>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
