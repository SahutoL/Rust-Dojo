import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

type Params = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  { params }: { params: Params }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const { id } = await params;
    const result = await prisma.reviewQueueItem.updateMany({
      where: {
        id,
        userId: session.user.id,
        resolvedAt: null,
      },
      data: {
        resolvedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "復習キュー項目が見つかりません。" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, reviewQueueItemId: id },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Review resolve error:", error);
    return NextResponse.json(
      { error: "復習キューの更新に失敗しました。" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
