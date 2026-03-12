import Link from "next/link";
import { tracks, getTrackVolumeLabel } from "@/data/lessons";
import { Card, Badge } from "@/components/ui";
import { Header } from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学ぶ",
};

const availabilityLabel = {
  available: "公開中",
  coming_soon: "準備中",
} as const;

const availabilityVariant = {
  available: "brand",
  coming_soon: "default",
} as const;

export default function LearnPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          学習トラック
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          トラックを選んで学習を始められます。
        </p>

        <div className="space-y-6">
          {tracks.map((track) => (
            <Link href={`/learn/${track.code}`} key={track.code}>
              <Card variant="default" hoverable padding="lg" className="mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${track.gradient} shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">
                        {track.label}
                      </span>
                      <Badge
                        variant={availabilityVariant[track.availability]}
                        size="sm"
                      >
                        {availabilityLabel[track.availability]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="font-semibold">{track.name}</h2>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {getTrackVolumeLabel(track)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {track.description}
                    </p>
                    {track.launchNote && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-2 leading-relaxed">
                        {track.launchNote}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
