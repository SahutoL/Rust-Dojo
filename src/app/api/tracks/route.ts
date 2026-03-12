import { NextResponse } from "next/server";
import { tracks } from "@/data/lessons";

export async function GET() {
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
