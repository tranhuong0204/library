import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeLink = (url: string): string => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
      return '#';
    }
    return url;
  };

  // Safe inline text mapping (handling bold, italics, inline code, links)
  const parseInline = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        elements.push(<strong key={`b-${keyIdx++}`}>{boldMatch[1]}</strong>);
        remaining = remaining.substring(boldMatch[0].length);
        continue;
      }

      // Inline code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        elements.push(
          <code
            key={`c-${keyIdx++}`}
            style={{
              backgroundColor: 'var(--color-slate-100)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '85%',
              fontFamily: 'monospace',
            }}
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(codeMatch[0].length);
        continue;
      }

      // Link [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const url = safeLink(linkMatch[2]);
        elements.push(
          <a
            key={`l-${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary-600)', textDecoration: 'underline' }}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.substring(linkMatch[0].length);
        continue;
      }

      // Plain character
      elements.push(remaining[0]);
      remaining = remaining.substring(1);
    }

    return elements;
  };

  // Split content into blocks (code blocks vs text blocks)
  const renderBlocks = () => {
    const blocks: React.ReactNode[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let textBuffer: string[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushTextBuffer = (idx: number) => {
      if (textBuffer.length > 0) {
        const text = textBuffer.join('\n').trim();
        if (text) {
          blocks.push(
            <p key={`p-${idx}`} style={{ marginBottom: 'var(--spacing-4)', wordBreak: 'break-word' }}>
              {parseInline(text)}
            </p>
          );
        }
        textBuffer = [];
      }
    };

    const flushListItems = (idx: number) => {
      if (listItems.length > 0) {
        blocks.push(
          <ul key={`ul-${idx}`} style={{ paddingLeft: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)', listStyleType: 'disc' }}>
            {listItems.map((item, itemIdx) => (
              <li key={`li-${idx}-${itemIdx}`} style={{ marginBottom: 'var(--spacing-1)' }}>
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block Start/End
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          const codeText = codeContent.join('\n');
          const blockId = `code-block-${i}`;
          const isCopied = copiedId === blockId;

          blocks.push(
            <div
              key={blockId}
              style={{
                position: 'relative',
                backgroundColor: 'var(--color-slate-900)',
                color: 'var(--color-slate-100)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-4)',
                fontFamily: 'monospace',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--spacing-4)',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {codeLanguage && (
                  <span style={{ fontSize: '10px', color: 'var(--color-slate-400)', textTransform: 'uppercase' }}>
                    {codeLanguage}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(codeText, blockId)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Copy code"
                >
                  {isCopied ? <Check size={14} style={{ color: 'var(--color-accent-400)' }} /> : <Copy size={14} />}
                </button>
              </div>
              <pre style={{ margin: 0, marginTop: codeLanguage ? '12px' : '0' }}>{codeText}</pre>
            </div>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          // Open code block
          flushTextBuffer(i);
          flushListItems(i);
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushTextBuffer(i);
        flushListItems(i);
        blocks.push(
          <h1 key={`h1-${i}`} style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-3)' }}>
            {parseInline(line.substring(2))}
          </h1>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        flushTextBuffer(i);
        flushListItems(i);
        blocks.push(
          <h2 key={`h2-${i}`} style={{ fontSize: 'var(--text-lg)', marginTop: 'var(--spacing-5)', marginBottom: 'var(--spacing-3)' }}>
            {parseInline(line.substring(3))}
          </h2>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        flushTextBuffer(i);
        flushListItems(i);
        blocks.push(
          <h3 key={`h3-${i}`} style={{ fontSize: 'var(--text-base)', marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)' }}>
            {parseInline(line.substring(4))}
          </h3>
        );
        continue;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        flushTextBuffer(i);
        inList = true;
        listItems.push(line.trim().substring(2));
        continue;
      }

      // Paragraph lines buffer
      if (line.trim() === '') {
        flushTextBuffer(i);
        flushListItems(i);
      } else {
        if (inList) {
          flushListItems(i);
        }
        textBuffer.push(line);
      }
    }

    // Final flushes
    flushTextBuffer(lines.length);
    flushListItems(lines.length);

    return blocks;
  };

  return <div style={{ fontSize: 'var(--text-base)', color: 'var(--color-slate-800)' }}>{renderBlocks()}</div>;
};
