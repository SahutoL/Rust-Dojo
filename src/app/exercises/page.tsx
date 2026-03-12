import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { getCatalogProblems } from "@/data/catalog";
import { ExercisesPageClient } from "./ExercisesPageClient";

export const metadata: Metadata = {
  title: "演習問題",
};

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const problems = await getCatalogProblems();

  return (
    <div className="min-h-screen">
      <Header />
      <ExercisesPageClient problems={problems} />
    </div>
  );
}
