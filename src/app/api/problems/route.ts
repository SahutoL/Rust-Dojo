import { NextRequest, NextResponse } from "next/server";
import { getProblems } from "@/data/problems";

export async function GET(request: NextRequest) {
  const trackCode = request.nextUrl.searchParams.get("track");
  const difficulty = request.nextUrl.searchParams.get("difficulty");
  const tag = request.nextUrl.searchParams.get("tag");

  return NextResponse.json({
    problems: getProblems({
      trackCode: trackCode || undefined,
      difficulty: difficulty || undefined,
      tag: tag || undefined,
    }).map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      trackCode: problem.trackCode,
      relatedLessonSlugs: problem.relatedLessonSlugs,
      kind: problem.kind,
      estimatedMinutes: problem.estimatedMinutes,
      href: `/exercises/${problem.id}`,
    })),
  });
}
