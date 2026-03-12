import { NextResponse } from "next/server";
import { getProblem } from "@/data/problems";
import { getTrack } from "@/data/lessons";

type Params = Promise<{ problemId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { problemId } = await params;
  const problem = getProblem(problemId);

  if (!problem) {
    return NextResponse.json(
      { error: "問題が見つかりません。" },
      { status: 404 }
    );
  }

  const track = getTrack(problem.trackCode);

  return NextResponse.json({
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    trackCode: problem.trackCode,
    trackName: track?.name ?? problem.trackCode,
    relatedLessonSlugs: problem.relatedLessonSlugs,
    kind: problem.kind,
    estimatedMinutes: problem.estimatedMinutes,
    statement: problem.statement,
    constraintsText: problem.constraintsText ?? null,
    inputFormat: problem.inputFormat ?? null,
    outputFormat: problem.outputFormat ?? null,
    hintText: problem.hintText ?? null,
    explanationText: problem.explanationText ?? null,
    initialCode: problem.initialCode,
    testCases: problem.testCases.map((testCase, index) => ({
      index,
      input: testCase.isHidden ? null : testCase.input,
      expectedOutput: testCase.isHidden ? null : testCase.expectedOutput,
      isHidden: testCase.isHidden,
    })),
    href: `/exercises/${problem.id}`,
  });
}
