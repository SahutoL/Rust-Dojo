import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogProblemById } from "@/data/catalog";
import { ProblemPageClient } from "./ProblemPageClient";

type Params = Promise<{ problemId: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { problemId } = await params;
  const problem = await getCatalogProblemById(problemId);

  if (!problem) {
    return { title: "問題が見つかりません" };
  }

  return { title: problem.title };
}

export default async function ProblemPage({
  params,
}: {
  params: Params;
}) {
  const { problemId } = await params;
  const problem = await getCatalogProblemById(problemId);

  if (!problem) {
    notFound();
  }

  return <ProblemPageClient problem={problem} />;
}
