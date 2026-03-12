"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";

interface HeaderProps {
  /** glass 背景 + fixed 固定。ホーム等のフルページでは true */
  fixed?: boolean;
}

export function Header({ fixed = false }: HeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuth = status === "authenticated";
  const isAdmin = Boolean(session?.user.adminRole);
  const navItems = [
    { href: "/learn", label: "学ぶ", requiresAuth: false },
    { href: "/exercises", label: "演習", requiresAuth: false },
    { href: "/learn/track3", label: "競プロ", requiresAuth: false },
    { href: "/learn/track2", label: "実務", requiresAuth: false },
    { href: "/dashboard", label: "進捗", requiresAuth: true },
    { href: "/review", label: "復習", requiresAuth: true },
    { href: "/admin", label: "管理", requiresAuth: true, requiresAdmin: true },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    [
      "transition-colors whitespace-nowrap",
      isActive(href)
        ? "text-[var(--text-primary)]"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    ].join(" ");

  return (
    <nav
      className={`${
        fixed
          ? "fixed top-0 left-0 right-0 z-50 glass"
          : "border-b border-[var(--border-primary)]"
      } px-4`}
    >
      <div className="max-w-7xl mx-auto py-2 sm:py-0">
        <div className="flex items-center justify-between gap-4 sm:h-14">
          <div className="flex items-center gap-6">
            <Link
              href={isAuth ? "/dashboard" : "/"}
              className="font-bold text-sm gradient-text tracking-tight"
            >
              Rust Dojo
            </Link>
            <div className="hidden sm:flex items-center gap-5 text-sm">
              {navItems.map(
                (item) =>
                  (!item.requiresAuth || isAuth) &&
                  (!item.requiresAdmin || isAdmin) && (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={navLinkClass(item.href)}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  )
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {status === "loading" && (
              <span className="text-xs text-[var(--text-tertiary)]">...</span>
            )}
            {isAuth && session?.user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {session.user.name || session.user.email?.split("@")[0] || "ユーザー"}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  ログアウト
                </Button>
              </>
            )}
            {status === "unauthenticated" && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">無料で始める</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex sm:hidden items-center gap-4 overflow-x-auto pb-1 text-sm">
          {navItems.map(
            (item) =>
              (!item.requiresAuth || isAuth) &&
              (!item.requiresAdmin || isAdmin) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
          )}
        </div>
      </div>
    </nav>
  );
}
