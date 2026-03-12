import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { ReviewPageClient } from "./ReviewPageClient";
import { auth } from "@/lib/auth";
import { getLearningSnapshotForUser } from "@/data/learningService";

export const metadata: Metadata = {
  title: "復習",
};

function buildLoginHref(pathname: string) {
  return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
}

export default async function ReviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildLoginHref("/review"));
  }

  const snapshot = await getLearningSnapshotForUser(session.user.id);

  if (!snapshot) {
    redirect(buildLoginHref("/review"));
  }

  return (
    <div className="min-h-screen">
      <Header />
      <ReviewPageClient
        viewerName={snapshot.user.displayName}
        dailyMinutesGoal={snapshot.user.dailyMinutesGoal}
        reviewQueue={snapshot.reviewQueue}
        generatedAt={snapshot.generatedAt}
      />
    </div>
  );
}
