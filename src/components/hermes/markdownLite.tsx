// src/components/hermes/markdownLite.tsx
//
// Hand-rolled, minimal markdown renderer for HermesChat -- headings, bold,
// inline code, fenced code blocks, unordered lists, links, and images.
// No dependency pulled in for this deliberately (same principle as
// DayShelf.tsx's inline SVG Sparkline): the chat only ever needs to render
// what Hermes itself produces (prose, a code block, an image_gen result),
// not arbitrary user-authored markdown, so a small renderer covers the
// real cases without a heavier library's parsing edge cases/bundle size.
import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Order matters: images before links (both use [..](..)-shaped syntax,
  // image is link prefixed with "!"), code spans before bold (so bold
  // markers inside a code span aren't misread as emphasis).
  const nodes: React.ReactNode[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    if (match[1] !== undefined) {
      // eslint-disable-next-line @next/next/no-img-element
      nodes.push(<img key={key} src={match[2]} alt={match[1]} className="rounded-lg max-h-64 my-1" />);
    } else if (match[3] !== undefined) {
      nodes.push(
        <a key={key} href={match[4]} target="_blank" rel="noreferrer" className="underline text-cyan-300">
          {match[3]}
        </a>
      );
    } else if (match[5] !== undefined) {
      nodes.push(
        <code key={key} className="bg-slate-900/70 px-1 py-0.5 rounded text-cyan-200 text-xs">
          {match[5]}
        </code>
      );
    } else if (match[6] !== undefined) {
      nodes.push(<strong key={key}>{match[6]}</strong>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function renderMarkdownLite(content: string): React.ReactNode {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc list-inside space-y-0.5">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={`code-${blocks.length}`} className="bg-slate-900/80 rounded-lg p-2 overflow-x-auto text-xs text-cyan-100">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizeClass = level === 1 ? "text-base font-semibold" : level === 2 ? "text-sm font-semibold" : "text-sm font-medium";
      blocks.push(
        <div key={`h-${blocks.length}`} className={sizeClass}>
          {renderInline(headingMatch[2], `h-${blocks.length}`)}
        </div>
      );
      i++;
      continue;
    }

    // Unordered list item
    const listMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
      i++;
      continue;
    }
    flushList();

    if (line.trim() === "") {
      i++;
      continue;
    }

    blocks.push(
      <div key={`p-${blocks.length}`} className="whitespace-pre-wrap">
        {renderInline(line, `p-${blocks.length}`)}
      </div>
    );
    i++;
  }
  flushList();
  return <div className="space-y-1">{blocks}</div>;
}
