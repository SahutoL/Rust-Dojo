import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getNotificationsForUser } from "@/data/notifications";
import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";
import { NotificationsPageClient } from "./NotificationsPageClient";

export const metadata: Metadata = {
  title: "通知",
};

function buildLoginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginHref("/notifications"));
  }

  const snapshot = await getNotificationsForUser(session.user.id);

  return (
    <div className="min-h-screen">
      <Header />
      <NotificationsPageClient
        generatedAt={snapshot.generatedAt}
        initialItems={snapshot.items}
        initialUnreadCount={snapshot.unreadCount}
      />
    </div>
  );
}
