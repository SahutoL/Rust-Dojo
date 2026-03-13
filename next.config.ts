import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/lessons/:lessonId/progress",
        destination: "/api/lesson-items/:lessonId/progress",
      },
      {
        source: "/api/lessons/:lessonId/complete",
        destination: "/api/lesson-items/:lessonId/complete",
      },
      {
        source: "/api/lessons/:lessonId",
        destination: "/api/lesson-items/:lessonId",
      },
    ];
  },
};

export default nextConfig;
