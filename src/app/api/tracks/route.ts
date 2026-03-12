import { NextResponse } from "next/server";
import { getCatalogTracks } from "@/data/catalog";

export async function GET() {
  const tracks = await getCatalogTracks();

  return NextResponse.json({
    tracks: tracks.map((track) => ({
      code: track.code,
      label: track.label,
      name: track.name,
      description: track.description,
      availability: track.availability,
      roadmapTopics: track.roadmapTopics,
      launchNote: track.launchNote ?? null,
      lessonCount: track.lessons.length,
    })),
  });
}
