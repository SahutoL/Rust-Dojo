import { executeRustCode, injectStdin } from "@/lib/playground";
import { getProblem } from "@/data/problems";
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

export async function executeCode(code: string, stdin?: string) {
  const execCode = stdin ? injectStdin(code, stdin) : code;
  return executeRustCode(execCode);
}

export async function runProblemCode(problemId: string, code: string) {
  const problem = getProblem(problemId);

  if (!problem) {
    return null;
  }

  const sampleCase = problem.testCases.find((testCase) => !testCase.isHidden);

  return executeCode(code, sampleCase?.input ?? "");
}

export async function submitProblemCode({
  code,
  problemId,
  userId,
}: {
  code: string;
  problemId: string;
  userId?: string;
}): Promise<SubmitResponse | null> {
  const problem = getProblem(problemId);

  if (!problem) {
    return null;
  }

  const results: TestCaseResult[] = [];
  const persistedResults: PersistedTestCaseResult[] = [];
  let overallStatus: SubmissionStatus = "AC";

  for (let index = 0; index < problem.testCases.length; index += 1) {
    const testCase = problem.testCases[index];
    const execResult = await executeCode(
      code,
      testCase.input || undefined
    );

    let status: SubmissionStatus;
    if (execResult.isTimeout) {
      status = "TLE";
    } else if (execResult.isCompileError) {
      status = "CE";
    } else if (!execResult.success) {
      status = "RE";
    } else {
      const actual = execResult.stdout.trimEnd();
      const expected = testCase.expectedOutput.trimEnd();
      status = actual === expected ? "AC" : "WA";
    }

    results.push({
      index,
      status,
      input: testCase.isHidden ? "(非公開)" : testCase.input,
      expectedOutput: testCase.isHidden
        ? "(非公開)"
        : testCase.expectedOutput,
      actualOutput: testCase.isHidden ? "(非公開)" : execResult.stdout,
      stderr: execResult.stderr,
      isHidden: testCase.isHidden,
    });
    persistedResults.push({
      index,
      status,
      actualOutput: execResult.stdout,
      stderr: execResult.stderr,
      isHidden: testCase.isHidden,
    });

    if (status === "CE") {
      overallStatus = "CE";
      break;
    }

    if (status !== "AC" && overallStatus === "AC") {
      overallStatus = status;
    }
  }

  const passedCount = results.filter((result) => result.status === "AC").length;
  const response: SubmitResponse = {
    overallStatus,
    results,
    passedCount,
    totalCount: problem.testCases.length,
  };

  if (userId) {
    try {
      await persistSubmissionForUser(userId, {
        problemId: problem.id,
        sourceCode: code,
        overallStatus,
        passedCount,
        totalCount: problem.testCases.length,
        results: persistedResults,
      });
    } catch (error) {
      console.error("Submission persistence error:", error);
    }
  }

  return response;
}
