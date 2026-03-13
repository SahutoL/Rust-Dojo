import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/data/notifications";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const ok = await markNotificationAsRead(session.user.id, id);

  return NextResponse.json(
    { ok },
    {
      status: ok ? 200 : 404,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
