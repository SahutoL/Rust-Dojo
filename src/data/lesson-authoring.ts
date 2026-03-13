export interface LessonExplanationSectionData {
  title: string;
  content: string;
  isRequired?: boolean;
}

export interface LessonQuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonSandboxData {
  prompt: string;
  starterCode: string;
  stdin: string;
  successMode: "compile";
}

export interface LessonSummarySectionData {
  title?: string;
  content: string;
}

export interface LessonData {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  content: string;
  explanationSections?: LessonExplanationSectionData[];
  quiz?: LessonQuizData;
  sandbox?: LessonSandboxData;
  summarySection?: LessonSummarySectionData;
}

export interface TrackData {
  code: string;
  label: string;
  name: string;
  description: string;
  gradient: string;
  availability: "available" | "coming_soon";
  roadmapTopics: string[];
  launchNote?: string;
  lessons: LessonData[];
}

function normalizeMarkdownBlock(value: string) {
  return value.trim().replace(/\n{3,}/g, "\n\n");
}

export function buildLessonContentFromExplanationSections(
  sections: LessonExplanationSectionData[]
) {
  return sections
    .map((section) => `## ${section.title}\n\n${normalizeMarkdownBlock(section.content)}`)
    .join("\n\n");
}

export function createAuthoredLesson(
  lesson: Omit<LessonData, "content"> & {
    explanationSections: LessonExplanationSectionData[];
    quiz: LessonQuizData;
    sandbox: LessonSandboxData;
    summarySection: LessonSummarySectionData;
  }
): LessonData {
  return {
    ...lesson,
    content: buildLessonContentFromExplanationSections(
      lesson.explanationSections
    ),
  };
}
