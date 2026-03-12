import { NextResponse } from "next/server";
import { getCatalogProblemById } from "@/data/catalog";

type Params = Promise<{ problemId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { problemId } = await params;
  const problem = await getCatalogProblemById(problemId);

  if (!problem) {
    return NextResponse.json(
      { error: "問題が見つかりません。" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    trackCode: problem.trackCode,
    trackName: problem.trackName,
    relatedLessonSlugs: problem.relatedLessonSlugs,
    kind: problem.kind,
    estimatedMinutes: problem.estimatedMinutes,
    statement: problem.statement,
    constraintsText: problem.constraintsText ?? null,
    inputFormat: problem.inputFormat ?? null,
    outputFormat: problem.outputFormat ?? null,
    solutionOutline: problem.solutionOutline ?? null,
    hintText: problem.hintText ?? null,
    explanationText: problem.explanationText ?? null,
    initialCode: problem.initialCode,
    relatedLessons: problem.relatedLessons,
    testCases: problem.testCases.map((testCase, index) => ({
      index,
      input: testCase.isHidden ? null : testCase.input,
      expectedOutput: testCase.isHidden ? null : testCase.expectedOutput,
      isHidden: testCase.isHidden,
    })),
    href: `/exercises/${problem.id}`,
  });
}
