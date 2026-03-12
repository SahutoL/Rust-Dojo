import Link from "next/link";
import { notFound } from "next/navigation";
import { tracks, getTrack, getLesson } from "@/data/lessons";
import { Header } from "@/components/Header";
import type { Metadata } from "next";
import {
  extractLessonHeadings,
  extractLessonSandboxCode,
} from "@/lib/lesson-markdown";
import { LessonReadingWorkspace } from "./LessonReadingWorkspace";

type Params = Promise<{ trackSlug: string; lessonSlug: string }>;

export async function generateStaticParams() {
  const result: { trackSlug: string; lessonSlug: string }[] = [];
  for (const track of tracks) {
    for (const lesson of track.lessons) {
      result.push({ trackSlug: track.code, lessonSlug: lesson.slug });
    }
  }
  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { trackSlug, lessonSlug } = await params;
  const lesson = getLesson(trackSlug, lessonSlug);
  if (!lesson) return { title: "レッスンが見つかりません" };
  return { title: lesson.title };
}

export default async function LessonPage({
  params,
}: {
  params: Params;
}) {
  const { trackSlug, lessonSlug } = await params;
  const track = getTrack(trackSlug);
  const lesson = getLesson(trackSlug, lessonSlug);
  if (!track || !lesson) notFound();

  const currentIndex = track.lessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentIndex > 0 ? track.lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < track.lessons.length - 1
      ? track.lessons[currentIndex + 1]
      : null;
  const headings = extractLessonHeadings(lesson.content);
  const initialSandboxCode = extractLessonSandboxCode(lesson.content);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] py-3 flex-wrap">
          <Link href="/learn" className="hover:text-[var(--text-secondary)] transition-colors">学ぶ</Link>
          <span>/</span>
          <Link href={`/learn/${track.code}`} className="hover:text-[var(--text-secondary)] transition-colors">{track.name}</Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)] truncate">{lesson.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Lesson header */}
        <p className="text-xs text-[var(--text-tertiary)] font-mono mb-1">
          {track.name} · {currentIndex + 1} / {track.lessons.length}
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {lesson.title}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-1">
          {lesson.summary}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mb-8">
          約 {lesson.estimatedMinutes} 分
        </p>

        <LessonReadingWorkspace
          key={`${track.code}/${lesson.slug}`}
          trackCode={track.code}
          lessonSlug={lesson.slug}
          content={lesson.content}
          headings={headings}
          initialSandboxCode={initialSandboxCode}
        />

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-[var(--border-primary)] flex items-center justify-between">
          {prevLesson ? (
            <Link
              href={`/learn/${track.code}/${prevLesson.slug}`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← {prevLesson.title}
            </Link>
          ) : (
            <span />
          )}
          {nextLesson ? (
            <Link
              href={`/learn/${track.code}/${nextLesson.slug}`}
              className="text-sm text-[var(--color-brand)] hover:underline"
            >
              {nextLesson.title} →
            </Link>
          ) : (
            <Link
              href={`/learn/${track.code}`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              トラック一覧に戻る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
