import { NextResponse } from "next/server";
import { getNotificationsForUser } from "@/data/notifications";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "ログインが必要です。" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const snapshot = await getNotificationsForUser(session.user.id);

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
