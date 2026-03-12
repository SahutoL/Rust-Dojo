"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrlParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackUrlParam &&
    callbackUrlParam.startsWith("/") &&
    !callbackUrlParam.startsWith("//")
      ? callbackUrlParam
      : "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません。");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("ログイン処理中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <span className="text-xl font-bold gradient-text tracking-tight">
            Rust Dojo
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">ログイン</h1>
      </div>

      <Card variant="bordered" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
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
            ログイン
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/register"
          className="text-[var(--color-brand)] hover:underline"
        >
          新規登録
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block mb-6">
                <span className="text-xl font-bold gradient-text tracking-tight">
                  Rust Dojo
                </span>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">ログイン</h1>
            </div>
            <Card variant="bordered" padding="lg">
              <p className="text-sm text-[var(--text-secondary)]">
                ログインフォームを読み込み中です。
              </p>
            </Card>
          </div>
        }
      >
        <LoginPageContent />
      </Suspense>
    </div>
  );
}
