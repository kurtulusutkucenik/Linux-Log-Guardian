/** Copilot mesajlarini satir/bullet/bold ile gosterir (hafif markdown). */

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export function CopilotMessageBody({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 whitespace-pre-wrap">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (/^[-•]\s/.test(trimmed)) {
          return (
            <p key={i} className="pl-3 border-l-2 border-primary/25 text-white/80">
              {renderInline(trimmed.replace(/^[-•]\s*/, ""))}
            </p>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <p key={i} className="pl-1 text-white/85">
              {renderInline(trimmed)}
            </p>
          );
        }

        const isHeading =
          trimmed.length < 48 &&
          !trimmed.includes(":") &&
          (i === 0 || !lines[i - 1]?.trim());

        if (isHeading) {
          return (
            <p key={i} className="font-semibold text-white text-[15px]">
              {renderInline(trimmed)}
            </p>
          );
        }

        return (
          <p key={i} className="text-white/85">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
