import type { InputJsonValue } from "@prisma/client/runtime/client";
import {
  CaseType,
  Difficulty,
  ProblemType,
  SectionType,
  prisma,
} from "@/lib/prisma";
import {
  extractLessonMarkdownSections,
  extractLessonSandboxCode,
} from "@/lib/lesson-markdown";

type LessonSectionInput = {
  sectionType: SectionType;
  title?: string | null;
  content: string;
  isRequired?: boolean;
  payloadJson?: InputJsonValue | null;
};

type ResolvedLessonSectionInput = LessonSectionInput & {
  id: string;
};

type LessonPayload = {
  trackCode: string;
  slug: string;
  title: string;
  summary?: string | null;
  estimatedMinutes?: number;
  content?: string | null;
  isPublished?: boolean;
  tags?: string[];
  sections?: LessonSectionInput[];
};

type ProblemPayload = {
  trackCode?: string | null;
  type: ProblemType;
  title: string;
  statement: string;
  difficulty: Difficulty;
  estimatedMinutes?: number;
  constraintsText?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  hintText?: string | null;
  explanationText?: string | null;
  initialCode?: string | null;
  isPublished?: boolean;
  tags?: string[];
  relatedLessonIds?: string[];
};

type TestcasePayload = {
  problemId: string;
  caseType: CaseType;
  inputText: string;
  expectedOutputText: string;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  score?: number;
};

function buildSectionId(lessonId: string, suffix: string, index?: number) {
  return `${lessonId}::${suffix}${typeof index === "number" ? `::${index + 1}` : ""}`;
}

function normalizeTagNames(tags?: string[]) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  );
}

function buildDefaultLessonSections(
  lessonId: string,
  payload: LessonPayload
): ResolvedLessonSectionInput[] {
  const content = payload.content ?? "";
  const explanationSections = extractLessonMarkdownSections(content).map(
    (section, index) => ({
      sectionType: SectionType.EXPLANATION,
      title: section.title,
      content: section.markdown,
      isRequired: true,
      payloadJson: null,
      id: buildSectionId(lessonId, "explanation", index),
    })
  );
  const quizSection = {
    sectionType: SectionType.QUIZ,
    title: "理解チェック",
    content: "このレッスンの主題を確認します。",
    isRequired: true,
    payloadJson: {
      question: "このレッスンで中心になるテーマはどれですか。",
      options: [payload.title, "別のテーマ", "実装例の暗記", "周辺知識の確認"],
      correctIndex: 0,
      explanation: payload.summary ?? "",
    } satisfies InputJsonValue,
    id: buildSectionId(lessonId, "quiz"),
  };
  const codeSection = {
    sectionType: SectionType.CODE_EXECUTION,
    title: "手を動かす",
    content: "コードを実行して内容を確かめます。",
    isRequired: true,
    payloadJson: {
      prompt: `${payload.title} に出てきたコードを実行し、コンパイルを通します。`,
      starterCode: extractLessonSandboxCode(content),
      stdin: "",
      successMode: "compile",
    } satisfies InputJsonValue,
    id: buildSectionId(lessonId, "code"),
  };
  const summarySection = {
    sectionType: SectionType.SUMMARY,
    title: "まとめ",
    content: payload.summary ?? "",
    isRequired: false,
    payloadJson: null,
    id: buildSectionId(lessonId, "summary"),
  };

  return [...explanationSections, quizSection, codeSection, summarySection].map(
    (section, index) => ({
      sectionType: section.sectionType,
      title: section.title,
      content: section.content,
      isRequired: section.isRequired,
      payloadJson: section.payloadJson,
      id: "id" in section ? section.id : buildSectionId(lessonId, "custom", index),
    })
  );
}

async function upsertTagIds(tagNames: string[]) {
  const ids: string[] = [];

  for (const name of tagNames) {
    const row = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });
    ids.push(row.id);
  }

  return ids;
}

async function writeAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: InputJsonValue
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      targetId: actorId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

export async function createLessonContent(
  actorId: string,
  payload: LessonPayload
) {
  const track = await prisma.track.findUnique({
    where: { code: payload.trackCode },
    select: { id: true, code: true },
  });

  if (!track) {
    throw new Error("TRACK_NOT_FOUND");
  }

  const lesson = await prisma.lesson.create({
    data: {
      trackId: track.id,
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary ?? null,
      estimatedMinutes: payload.estimatedMinutes ?? 10,
      content: payload.content ?? "",
      isPublished: payload.isPublished ?? false,
      sortOrder:
        (await prisma.lesson.count({ where: { trackId: track.id } })) + 1,
    },
    select: {
      id: true,
      slug: true,
      track: {
        select: { code: true },
      },
    },
  });

  await updateLessonContent(actorId, lesson.id, payload);
  return lesson;
}

export async function updateLessonContent(
  actorId: string,
  lessonId: string,
  payload: Partial<LessonPayload>
) {
  const existing = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      track: {
        select: { id: true, code: true },
      },
    },
  });

  if (!existing) {
    throw new Error("LESSON_NOT_FOUND");
  }

  const nextTrack =
    payload.trackCode && payload.trackCode !== existing.track.code
      ? await prisma.track.findUnique({
          where: { code: payload.trackCode },
          select: { id: true, code: true },
        })
      : existing.track;

  if (!nextTrack) {
    throw new Error("TRACK_NOT_FOUND");
  }

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      trackId: nextTrack.id,
      slug: payload.slug ?? existing.slug,
      title: payload.title ?? existing.title,
      summary: payload.summary ?? existing.summary,
      estimatedMinutes: payload.estimatedMinutes ?? existing.estimatedMinutes,
      content: payload.content ?? existing.content,
      isPublished: payload.isPublished ?? existing.isPublished,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      content: true,
      track: {
        select: { code: true },
      },
    },
  });

  const nextSections: ResolvedLessonSectionInput[] =
    payload.sections && payload.sections.length > 0
      ? payload.sections.map((section, index) => ({
          ...section,
          id: buildSectionId(updated.id, "custom", index),
        }))
      : buildDefaultLessonSections(updated.id, {
          trackCode: nextTrack.code,
          slug: updated.slug,
          title: updated.title,
          summary: updated.summary,
          content: updated.content,
        });

  await prisma.lessonSection.deleteMany({
    where: {
      lessonId: updated.id,
      id: {
        notIn: nextSections.map((section) => section.id),
      },
    },
  });

  for (const [index, section] of nextSections.entries()) {
    await prisma.lessonSection.upsert({
      where: { id: section.id },
      update: {
        lessonId: updated.id,
        sectionType: section.sectionType,
        title: section.title ?? null,
        content: section.content,
        isRequired: section.isRequired ?? false,
        payloadJson: section.payloadJson ?? undefined,
        sortOrder: index,
      },
      create: {
        id: section.id,
        lessonId: updated.id,
        sectionType: section.sectionType,
        title: section.title ?? null,
        content: section.content,
        isRequired: section.isRequired ?? false,
        payloadJson: section.payloadJson ?? undefined,
        sortOrder: index,
      },
    });
  }

  const tagIds = await upsertTagIds(normalizeTagNames(payload.tags));
  await prisma.lessonTag.deleteMany({
    where: {
      lessonId: updated.id,
      ...(tagIds.length > 0 ? { tagId: { notIn: tagIds } } : {}),
    },
  });
  for (const tagId of tagIds) {
    await prisma.lessonTag.upsert({
      where: {
        lessonId_tagId: {
          lessonId: updated.id,
          tagId,
        },
      },
      update: {},
      create: {
        lessonId: updated.id,
        tagId,
      },
    });
  }

  await writeAuditLog(actorId, "lesson.update", "LESSON", updated.id, {
    lessonId: updated.id,
    slug: updated.slug,
    trackCode: nextTrack.code,
  });

  return updated;
}

export async function createProblemContent(
  actorId: string,
  payload: ProblemPayload
) {
  const track =
    payload.trackCode
      ? await prisma.track.findUnique({
          where: { code: payload.trackCode },
          select: { id: true },
        })
      : null;

  const problem = await prisma.problem.create({
    data: {
      trackId: track?.id ?? null,
      type: payload.type,
      title: payload.title,
      statement: payload.statement,
      difficulty: payload.difficulty,
      estimatedMinutes: payload.estimatedMinutes ?? 10,
      constraintsText: payload.constraintsText ?? null,
      inputFormat: payload.inputFormat ?? null,
      outputFormat: payload.outputFormat ?? null,
      hintText: payload.hintText ?? null,
      explanationText: payload.explanationText ?? null,
      initialCode: payload.initialCode ?? "",
      isPublished: payload.isPublished ?? false,
      sortOrder: (await prisma.problem.count()) + 1,
    },
    select: { id: true },
  });

  return updateProblemContent(actorId, problem.id, payload);
}

export async function updateProblemContent(
  actorId: string,
  problemId: string,
  payload: Partial<ProblemPayload>
) {
  const existing = await prisma.problem.findUnique({
    where: { id: problemId },
    select: {
      id: true,
      trackId: true,
      type: true,
      title: true,
      statement: true,
      difficulty: true,
      estimatedMinutes: true,
      constraintsText: true,
      inputFormat: true,
      outputFormat: true,
      hintText: true,
      explanationText: true,
      initialCode: true,
      isPublished: true,
    },
  });

  if (!existing) {
    throw new Error("PROBLEM_NOT_FOUND");
  }

  const track =
    typeof payload.trackCode === "string"
      ? await prisma.track.findUnique({
          where: { code: payload.trackCode },
          select: { id: true, code: true },
        })
      : null;

  const updated = await prisma.problem.update({
    where: { id: problemId },
    data: {
      trackId: track ? track.id : existing.trackId,
      type: payload.type ?? existing.type,
      title: payload.title ?? existing.title,
      statement: payload.statement ?? existing.statement,
      difficulty: payload.difficulty ?? existing.difficulty,
      estimatedMinutes: payload.estimatedMinutes ?? existing.estimatedMinutes,
      constraintsText: payload.constraintsText ?? existing.constraintsText,
      inputFormat: payload.inputFormat ?? existing.inputFormat,
      outputFormat: payload.outputFormat ?? existing.outputFormat,
      hintText: payload.hintText ?? existing.hintText,
      explanationText: payload.explanationText ?? existing.explanationText,
      initialCode: payload.initialCode ?? existing.initialCode,
      isPublished: payload.isPublished ?? existing.isPublished,
    },
    select: {
      id: true,
      track: {
        select: {
          code: true,
        },
      },
    },
  });

  const tagIds = await upsertTagIds(normalizeTagNames(payload.tags));
  await prisma.problemTag.deleteMany({
    where: {
      problemId,
      ...(tagIds.length > 0 ? { tagId: { notIn: tagIds } } : {}),
    },
  });
  for (const tagId of tagIds) {
    await prisma.problemTag.upsert({
      where: {
        problemId_tagId: {
          problemId,
          tagId,
        },
      },
      update: {},
      create: {
        problemId,
        tagId,
      },
    });
  }

  const relatedLessonIds = Array.from(new Set(payload.relatedLessonIds ?? []));
  await prisma.problemLesson.deleteMany({
    where: {
      problemId,
      ...(relatedLessonIds.length > 0 ? { lessonId: { notIn: relatedLessonIds } } : {}),
    },
  });
  for (const lessonId of relatedLessonIds) {
    await prisma.problemLesson.upsert({
      where: {
        problemId_lessonId: {
          problemId,
          lessonId,
        },
      },
      update: {},
      create: {
        problemId,
        lessonId,
      },
    });
  }

  await writeAuditLog(actorId, "problem.update", "PROBLEM", updated.id, {
    problemId: updated.id,
    trackCode: updated.track?.code ?? payload.trackCode ?? null,
  });

  return {
    ...updated,
    trackCode: updated.track?.code ?? null,
  };
}

export async function createProblemTestcase(
  actorId: string,
  payload: TestcasePayload
) {
  const testcase = await prisma.problemTestCase.create({
    data: {
      problemId: payload.problemId,
      caseType: payload.caseType,
      inputText: payload.inputText,
      expectedOutputText: payload.expectedOutputText,
      timeLimitMs: payload.timeLimitMs ?? 2000,
      memoryLimitKb: payload.memoryLimitKb ?? 262144,
      score: payload.score ?? 0,
    },
    select: {
      id: true,
      problemId: true,
    },
  });

  await writeAuditLog(actorId, "testcase.create", "PROBLEM_TEST_CASE", testcase.id, {
    problemId: testcase.problemId,
    testcaseId: testcase.id,
  });

  return testcase;
}
