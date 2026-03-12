"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは 8 文字以上にしてください。");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました。");
        return;
      }

      // 登録成功後、自動ログイン
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // 登録は成功したがログインに失敗した場合
        router.push("/login");
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } catch {
      setError("登録処理中にエラーが発生しました。");
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
          <h1 className="text-2xl font-bold tracking-tight">アカウント作成</h1>
        </div>

        <Card variant="bordered" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="表示名"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="任意"
              autoComplete="name"
            />
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 文字以上"
              required
              autoComplete="new-password"
            />
            <Input
              label="パスワード（確認）"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              required
              autoComplete="new-password"
            />
            {error && (
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="md"
              isLoading={isLoading}
            >
              登録する
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="text-[var(--color-brand)] hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
