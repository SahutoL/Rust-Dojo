import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCatalogTrackByCode,
  getTrackDisplayName,
  getTrackVolumeLabel,
} from "@/data/catalog";
import { Card, Badge, Button } from "@/components/ui";
import { Header } from "@/components/Header";
import type { Metadata } from "next";

type Params = Promise<{ trackSlug: string }>;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { trackSlug } = await params;
  const track = await getCatalogTrackByCode(trackSlug);
  if (!track) return { title: "トラックが見つかりません" };
  return { title: track.name };
}

export default async function TrackPage({
  params,
}: {
  params: Params;
}) {
  const { trackSlug } = await params;
  const track = await getCatalogTrackByCode(trackSlug);
  if (!track) notFound();
  const fallbackTrack = await getCatalogTrackByCode("track1");

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] py-3">
          <Link href="/learn" className="hover:text-[var(--text-secondary)] transition-colors">学ぶ</Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">{track.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-[var(--text-tertiary)] font-mono">
            {track.label}
          </span>
          <Badge
            variant={track.availability === "available" ? "brand" : "default"}
            size="sm"
          >
            {track.availability === "available" ? "公開中" : "準備中"}
          </Badge>
          <span className="text-xs text-[var(--text-tertiary)]">
            {getTrackVolumeLabel(track)}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {track.name}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          {track.description}
        </p>
        {track.launchNote && (
          <Card variant="bordered" padding="md" className="mb-8">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {track.launchNote}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
          <div>
            {track.availability === "available" && track.lessons.length > 0 ? (
              <>
                <h2 className="text-sm font-semibold mb-3">現在公開中のレッスン</h2>
                <div className="space-y-3">
                  {track.lessons.map((lesson, index) => (
                    <Link
                      href={`/learn/${track.code}/${lesson.slug}`}
                      key={lesson.slug}
                    >
                      <Card variant="default" hoverable padding="md" className="mb-2">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-0.5">
                              {lesson.title}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {lesson.summary}
                            </p>
                            <span className="text-xs text-[var(--text-tertiary)] mt-1 inline-block">
                              約 {lesson.estimatedMinutes} 分
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Card variant="bordered" padding="lg">
                <h2 className="text-lg font-semibold mb-2">
                  {getTrackDisplayName(track)} は準備中です
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  まずは Rust 入門を進めると、このトラックで扱う内容に入りやすくなります。
                </p>
                {fallbackTrack && (
                  <Link href={`/learn/${fallbackTrack.code}`}>
                    <Button size="sm">Track 1 を見る</Button>
                  </Link>
                )}
              </Card>
            )}
          </div>

          <aside>
            <Card variant="bordered" padding="md">
              <h2 className="text-sm font-semibold mb-3">このトラックで扱うテーマ</h2>
              <div className="space-y-2">
                {track.roadmapTopics.map((topic, index) => (
                  <div key={topic} className="flex items-start gap-3">
                    <span className="text-xs text-[var(--text-tertiary)] font-mono shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {topic}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
