import { getLesson, getTrack, tracks } from "@/data/lessons";
import { getProblem, problems } from "@/data/problems";

export function buildLessonEntityId(trackCode: string, lessonSlug: string) {
  return `${trackCode}/${lessonSlug}`;
}

export function parseLessonEntityId(entityId: string) {
  const [trackCode, lessonSlug] = entityId.split("/");

  if (!trackCode || !lessonSlug) {
    return null;
  }

  return { trackCode, lessonSlug };
}

export function resolveLessonEntity(entityId: string) {
  const parsed = parseLessonEntityId(entityId);

  if (!parsed) {
    return null;
  }

  const track = getTrack(parsed.trackCode);
  const lesson = getLesson(parsed.trackCode, parsed.lessonSlug);

  if (!track || !lesson) {
    return null;
  }

  return {
    entityId,
    trackCode: track.code,
    trackName: track.name,
    lessonSlug: lesson.slug,
    title: lesson.title,
    href: `/learn/${track.code}/${lesson.slug}`,
    estimatedMinutes: lesson.estimatedMinutes,
    conceptLabels: [lesson.title],
  };
}

export function resolveProblemEntity(problemId: string) {
  const problem = getProblem(problemId);
  const track = problem ? getTrack(problem.trackCode) : null;

  if (!problem || !track) {
    return null;
  }

  return {
    entityId: problem.id,
    trackCode: problem.trackCode,
    trackName: track.name,
    title: problem.title,
    href: `/exercises/${problem.id}`,
    estimatedMinutes: problem.estimatedMinutes,
    conceptLabels: problem.tags,
    tags: problem.tags,
  };
}

export function getTrackProblemTotals() {
  return problems.reduce<Record<string, number>>((acc, problem) => {
    acc[problem.trackCode] = (acc[problem.trackCode] ?? 0) + 1;
    return acc;
  }, {});
}

export function getTotalLessonCount() {
  return tracks.reduce((sum, track) => sum + track.lessons.length, 0);
}

export function getTotalProblemCount() {
  return problems.length;
}
