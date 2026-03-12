"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export function SettingsSessionRefresh() {
  const hasRunRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  useEffect(() => {
    if (hasRunRef.current || searchParams.get("updated") !== "1") {
      return;
    }

    hasRunRef.current = true;

    void update().finally(() => {
      router.replace(pathname);
    });
  }, [pathname, router, searchParams, update]);

  return null;
}
