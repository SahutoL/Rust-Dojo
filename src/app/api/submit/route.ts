import { NextRequest, NextResponse } from "next/server";
import { executeRustCode, injectStdin } from "@/lib/playground";
import { getProblem } from "@/data/problems";
import { auth } from "@/lib/auth";
import { persistSubmissionForUser } from "@/data/learningService";

export type SubmissionStatus = "AC" | "WA" | "CE" | "TLE" | "RE";

export interface TestCaseResult {
  index: number;
  status: SubmissionStatus;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr: string;
  isHidden: boolean;
}

export interface SubmitResponse {
  overallStatus: SubmissionStatus;
  results: TestCaseResult[];
  passedCount: number;
  totalCount: number;
}

interface PersistedTestCaseResult {
  index: number;
  status: SubmissionStatus;
  actualOutput: string;
  stderr: string;
  isHidden: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, problemId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "code は必須です。" },
        { status: 400 }
      );
    }

    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json(
        { error: "problemId は必須です。" },
        { status: 400 }
      );
    }

    const problem = getProblem(problemId);
    if (!problem) {
      return NextResponse.json(
        { error: "問題が見つかりません。" },
        { status: 404 }
      );
    }

    const results: TestCaseResult[] = [];
    const persistedResults: PersistedTestCaseResult[] = [];
    let overallStatus: SubmissionStatus = "AC";

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      const execCode = tc.input
        ? injectStdin(code, tc.input)
        : code;

      const execResult = await executeRustCode(execCode);

      let status: SubmissionStatus;
      if (execResult.isTimeout) {
        status = "TLE";
      } else if (execResult.isCompileError) {
        status = "CE";
      } else if (!execResult.success) {
        status = "RE";
      } else {
        // 出力比較（末尾の改行・空白を正規化）
        const actual = execResult.stdout.trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        status = actual === expected ? "AC" : "WA";
      }

      results.push({
        index: i,
        status,
        input: tc.isHidden ? "(非公開)" : tc.input,
        expectedOutput: tc.isHidden ? "(非公開)" : tc.expectedOutput,
        actualOutput: tc.isHidden ? "(非公開)" : execResult.stdout,
        stderr: execResult.stderr,
        isHidden: tc.isHidden,
      });
      persistedResults.push({
        index: i,
        status,
        actualOutput: execResult.stdout,
        stderr: execResult.stderr,
        isHidden: tc.isHidden,
      });

      // CE は全テストケースに影響するため即座に中断
      if (status === "CE") {
        overallStatus = "CE";
        break;
      }

      if (status !== "AC" && overallStatus === "AC") {
        overallStatus = status;
      }
    }

    const passedCount = results.filter((r) => r.status === "AC").length;

    const response: SubmitResponse = {
      overallStatus,
      results,
      passedCount,
      totalCount: problem.testCases.length,
    };

    const session = await auth();

    if (session?.user) {
      try {
        await persistSubmissionForUser(session.user.id, {
          problemId: problem.id,
          sourceCode: code,
          overallStatus,
          passedCount,
          totalCount: problem.testCases.length,
          results: persistedResults,
        });
      } catch (persistenceError) {
        console.error("Submission persistence error:", persistenceError);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "採点中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
