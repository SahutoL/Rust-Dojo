export interface LessonHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const DEFAULT_LESSON_SANDBOX_CODE = `fn main() {
    println!("Hello, Rust!");
}
`;

function stripInlineMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function slugifyLessonHeading(text: string) {
  return stripInlineMarkdown(text)
    .toLocaleLowerCase("ja-JP")
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-") || "section";
}

export function createLessonHeadingIdFactory() {
  const seen = new Map<string, number>();

  return (text: string) => {
    const base = slugifyLessonHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export function extractLessonHeadings(content: string): LessonHeading[] {
  const nextId = createLessonHeadingIdFactory();
  const headings: LessonHeading[] = [];
  const matches = content.matchAll(/^(##|###)\s+(.+)$/gm);

  for (const match of matches) {
    const level = match[1] === "##" ? 2 : 3;
    const text = stripInlineMarkdown(match[2]);
    headings.push({
      id: nextId(text),
      text,
      level,
    });
  }

  return headings;
}

export function extractLessonSandboxCode(content: string) {
  const rustMatch = content.match(/```(?:rust|rs)\n([\s\S]*?)```/i);

  if (rustMatch?.[1]) {
    return `${rustMatch[1].trimEnd()}\n`;
  }

  const genericMatch = content.match(/```\n([\s\S]*?)```/);

  if (genericMatch?.[1]) {
    return `${genericMatch[1].trimEnd()}\n`;
  }

  return DEFAULT_LESSON_SANDBOX_CODE;
}
