import type { ReactNode } from 'react';
import { Bot } from 'lucide-react';
import type { AiTutorChatRole } from '@/types/ai-tutor';

interface MessageProps {
  role: AiTutorChatRole;
  content: string;
  createdAt: string;
  userName?: string | null;
  userAvatarUrl?: string | null;
}

interface MarkdownBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInitial(value?: string | null) {
  return value?.trim().charAt(0)?.toUpperCase() || 'U';
}

function splitMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const codeFencePattern = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFencePattern.exec(content)) !== null) {
    if (match.index > cursor) {
      blocks.push({ type: 'text', content: content.slice(cursor, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1],
      content: match[2].trim(),
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < content.length) {
    blocks.push({ type: 'text', content: content.slice(cursor) });
  }

  return blocks.length > 0 ? blocks : [{ type: 'text', content }];
}

function renderInlineMarkdown(text: string, isUser: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold">
          {renderInlineMarkdown(token.slice(2, -2), isUser)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className={`rounded-md px-1.5 py-0.5 font-mono text-[0.9em] ${
            isUser ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={`${match.index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className={`font-medium underline underline-offset-2 ${isUser ? 'text-white' : 'text-violet-700'}`}
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function renderTextBlock(content: string, isUser: boolean, blockIndex: number) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const className = level === 1 ? 'text-lg font-bold' : level === 2 ? 'text-base font-bold' : 'text-sm font-bold';
      elements.push(
        <div key={`${blockIndex}-${index}`} className={`${className} mt-1 text-inherit`}>
          {renderInlineMarkdown(headingMatch[2], isUser)}
        </div>,
      );
      index += 1;
      continue;
    }

    const unorderedItems: string[] = [];
    while (index < lines.length) {
      const itemMatch = lines[index].match(/^\s*[-*]\s+(.+)$/);
      if (!itemMatch) break;
      unorderedItems.push(itemMatch[1]);
      index += 1;
    }
    if (unorderedItems.length > 0) {
      elements.push(
        <ul key={`${blockIndex}-${index}-ul`} className="my-2 list-disc space-y-1 pl-5">
          {unorderedItems.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item, isUser)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const orderedItems: string[] = [];
    while (index < lines.length) {
      const itemMatch = lines[index].match(/^\s*\d+\.\s+(.+)$/);
      if (!itemMatch) break;
      orderedItems.push(itemMatch[1]);
      index += 1;
    }
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={`${blockIndex}-${index}-ol`} className="my-2 list-decimal space-y-1 pl-5">
          {orderedItems.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item, isUser)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim().length > 0 &&
      !lines[index].match(/^(#{1,3})\s+(.+)$/) &&
      !lines[index].match(/^\s*[-*]\s+(.+)$/) &&
      !lines[index].match(/^\s*\d+\.\s+(.+)$/)
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    elements.push(
      <p key={`${blockIndex}-${index}`} className="my-2 first:mt-0 last:mb-0">
        {paragraphLines.map((paragraphLine, lineIndex) => (
          <span key={lineIndex}>
            {renderInlineMarkdown(paragraphLine, isUser)}
            {lineIndex < paragraphLines.length - 1 && <br />}
          </span>
        ))}
      </p>,
    );
  }

  return elements;
}

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = splitMarkdownBlocks(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'code') {
          return (
            <pre
              key={blockIndex}
              className={`overflow-x-auto rounded-xl p-3 text-xs leading-5 ${
                isUser ? 'bg-white/15 text-white' : 'bg-slate-950 text-slate-100'
              }`}
            >
              {block.language && <div className="mb-2 text-[11px] uppercase opacity-60">{block.language}</div>}
              <code>{block.content}</code>
            </pre>
          );
        }

        return <div key={blockIndex}>{renderTextBlock(block.content, isUser, blockIndex)}</div>;
      })}
    </div>
  );
}

export default function Message({ role, content, createdAt, userName, userAvatarUrl }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Bot className="h-5 w-5" />
        </div>
      )}

      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-500/15'
              : 'border border-slate-100 bg-white text-slate-700'
          }`}
        >
          <MarkdownContent content={content} isUser={isUser} />
        </div>
        <span className="px-1 text-xs text-slate-400">{formatTime(createdAt)}</span>
      </div>

      {isUser && (
        userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt=""
            className="mt-1 h-9 w-9 shrink-0 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand shadow-md">
            <span className="text-sm font-bold text-white">{getInitial(userName)}</span>
          </div>
        )
      )}
    </div>
  );
}
