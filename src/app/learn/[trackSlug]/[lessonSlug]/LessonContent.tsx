"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LessonContentProps {
  content: string;
}

export function LessonContent({ content }: LessonContentProps) {
  return (
    <article className="lesson-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-10 mb-4 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-8 mb-3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-4 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-4 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-1.5 py-0.5 text-sm text-[var(--color-brand-light)] font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} text-sm`}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl p-4 overflow-x-auto mb-4 text-sm leading-relaxed font-mono">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="text-sm w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 border-b border-[var(--border-secondary)] text-[var(--text-secondary)] font-semibold text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-mono text-xs">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="text-[var(--text-primary)] font-semibold">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--color-brand)] pl-4 my-4 text-sm text-[var(--text-secondary)] italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
