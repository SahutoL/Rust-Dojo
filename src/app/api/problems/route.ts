import { NextRequest, NextResponse } from "next/server";
import { getCatalogProblems } from "@/data/catalog";

export async function GET(request: NextRequest) {
  const trackCode = request.nextUrl.searchParams.get("track");
  const difficulty = request.nextUrl.searchParams.get("difficulty");
  const tag = request.nextUrl.searchParams.get("tag");
  const q = request.nextUrl.searchParams.get("q");
  const problems = await getCatalogProblems({
    trackCode: trackCode || undefined,
    difficulty: difficulty || undefined,
    tag: tag || undefined,
    q: q || undefined,
  });

  return NextResponse.json({
    problems: problems.map((problem) => ({
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
