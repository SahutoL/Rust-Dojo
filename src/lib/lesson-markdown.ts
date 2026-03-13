export interface LessonHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ExtractedLessonSection {
  title: string;
  markdown: string;
}

const DEFAULT_LESSON_SANDBOX_CODE = `fn main() {
    println!("Hello, Rust!");
}
`;

function looksLikeRustSourceCode(value: string) {
  const code = value.trim();

  if (code.length === 0) {
    return false;
  }

  if (/[→←]/u.test(code)) {
    return false;
  }

  return [
    "fn main",
    "println!",
    "let ",
    "let mut ",
    "use ",
    "struct ",
    "enum ",
    "impl ",
    "match ",
    "String",
    "Vec<",
    "Result<",
    "Option<",
  ].some((token) => code.includes(token));
}

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
  const rustMatches = content.matchAll(/```(?:rust|rs)\n([\s\S]*?)```/gi);

  for (const match of rustMatches) {
    if (match[1]) {
      return `${match[1].trimEnd()}\n`;
    }
  }

  const genericMatches = content.matchAll(/```\n([\s\S]*?)```/g);

  for (const match of genericMatches) {
    if (match[1] && looksLikeRustSourceCode(match[1])) {
      return `${match[1].trimEnd()}\n`;
    }
  }

  return DEFAULT_LESSON_SANDBOX_CODE;
}

export function extractLessonMarkdownSections(content: string): ExtractedLessonSection[] {
  const sections: ExtractedLessonSection[] = [];
  const lines = content.split("\n");
  let currentTitle = "導入";
  let currentLines: string[] = [];

  const flush = () => {
    const markdown = currentLines.join("\n").trim();
    if (markdown.length === 0) {
      currentLines = [];
      return;
    }

    sections.push({
      title: currentTitle,
      markdown,
    });
    currentLines = [];
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);

    if (match) {
      flush();
      currentTitle = stripInlineMarkdown(match[1]);
      continue;
    }

    currentLines.push(line);
  }

  flush();
  return sections;
}
