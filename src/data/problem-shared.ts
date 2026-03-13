export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export type ProblemKind =
  | "implementation"
  | "compile_error_fix"
  | "ownership_fix";

export interface ProblemData {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  trackCode: string;
  relatedLessonSlugs: string[];
  kind: ProblemKind;
  estimatedMinutes: number;
  statement: string;
  constraintsText?: string;
  inputFormat?: string;
  outputFormat?: string;
  hintText?: string;
  explanationText?: string;
  initialCode: string;
  testCases: TestCase[];
}
