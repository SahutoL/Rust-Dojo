import { NextRequest, NextResponse } from "next/server";
import { executeRustCode, injectStdin } from "@/lib/playground";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, stdin } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "code は必須です。" },
        { status: 400 }
      );
    }

    // stdin がある場合はモックを注入
    const execCode = stdin ? injectStdin(code, stdin) : code;
    const result = await executeRustCode(execCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Execute error:", error);
    return NextResponse.json(
      { error: "実行中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
