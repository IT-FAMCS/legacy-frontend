import { Fragment, useMemo, type ReactNode } from "react";
import "../styles/markdown.css";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

type ListMatch = {
  indent: number;
  ordered: boolean;
  marker: string;
  content: string;
};

type ParsedBlock = {
  node: ReactNode;
  nextIndex: number;
};

type TextAlignment = "left" | "center" | "right";

const SPECIAL_INLINE_CHARS = new Set([
  "\\",
  "`",
  "!",
  "[",
  "*",
  "_",
  "+",
  "~",
  "<",
  "\n",
]);

const SAFE_PROTOCOL_RE = /^(https?:|mailto:|tel:)/i;
const RELATIVE_URL_RE = /^(?:[/.?#]|\.\.?\/)/;
const BARE_URL_RE = /^https?:\/\/[^\s<>]+/i;

function countIndent(line: string): number {
  let width = 0;

  for (const char of line) {
    if (char === " ") {
      width += 1;
    } else if (char === "\t") {
      width += 2;
    } else {
      break;
    }
  }

  return width;
}

function stripIndent(line: string, width: number): string {
  let consumed = 0;
  let index = 0;

  while (index < line.length && consumed < width) {
    if (line[index] === " ") {
      consumed += 1;
      index += 1;
    } else if (line[index] === "\t") {
      consumed += 2;
      index += 1;
    } else {
      break;
    }
  }

  return line.slice(index);
}

function parseListMatch(line: string): ListMatch | null {
  const match = /^(\s*)([-+*]|\d+[.)])\s+(.*)$/.exec(line);

  if (!match) {
    return null;
  }

  const marker = match[2];

  return {
    indent: countIndent(match[1]),
    ordered: /^\d/.test(marker),
    marker,
    content: match[3],
  };
}

function sanitizeUrl(url: string): string | null {
  const normalized = url.trim().replace(/^<|>$/g, "");

  if (SAFE_PROTOCOL_RE.test(normalized) || RELATIVE_URL_RE.test(normalized)) {
    return normalized;
  }

  return null;
}

function sanitizeImageUrl(url: string): string | null {
  const safeUrl = sanitizeUrl(url);

  if (!safeUrl || /^(?:mailto:|tel:)/i.test(safeUrl)) {
    return null;
  }

  return safeUrl;
}

function splitDestination(rawDestination: string): {
  url: string;
  title?: string;
} {
  const trimmed = rawDestination.trim();
  const titleMatch = /^(<[^>]+>|\S+?)(?:\s+["']([^"']*)["'])?$/.exec(trimmed);

  if (!titleMatch) {
    return { url: trimmed };
  }

  return {
    url: titleMatch[1],
    ...(titleMatch[2] ? { title: titleMatch[2] } : {}),
  };
}

function findClosingBracket(text: string, startIndex: number): number {
  let depth = 0;

  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === "\\") {
      index += 1;
      continue;
    }

    if (text[index] === "[") {
      depth += 1;
    } else if (text[index] === "]") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findClosingParenthesis(text: string, startIndex: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === "\\") {
      index += 1;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function trimBareUrl(url: string): { url: string; suffix: string } {
  let cleanUrl = url;
  let suffix = "";

  while (/[.,!?;:]$/.test(cleanUrl)) {
    suffix = cleanUrl.slice(-1) + suffix;
    cleanUrl = cleanUrl.slice(0, -1);
  }

  while (cleanUrl.endsWith(")")) {
    const openingCount = (cleanUrl.match(/\(/g) ?? []).length;
    const closingCount = (cleanUrl.match(/\)/g) ?? []).length;

    if (closingCount <= openingCount) {
      break;
    }

    suffix = ")" + suffix;
    cleanUrl = cleanUrl.slice(0, -1);
  }

  return { url: cleanUrl, suffix };
}

function renderLink(
  href: string,
  children: ReactNode,
  key: string,
  title?: string,
): ReactNode {
  const external = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      key={key}
      title={title}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let plainText = "";
  let index = 0;
  let nodeIndex = 0;

  const flushPlainText = () => {
    if (!plainText) {
      return;
    }

    nodes.push(
      <Fragment key={`${keyPrefix}-text-${nodeIndex}`}>{plainText}</Fragment>,
    );
    nodeIndex += 1;
    plainText = "";
  };

  const pushNode = (node: ReactNode) => {
    flushPlainText();
    nodes.push(node);
    nodeIndex += 1;
  };

  while (index < text.length) {
    const char = text[index];
    const nodeKey = `${keyPrefix}-inline-${nodeIndex}`;

    if (char === "\\" && index + 1 < text.length) {
      plainText += text[index + 1];
      index += 2;
      continue;
    }

    if (char === "\n") {
      pushNode(<br key={nodeKey} />);
      index += 1;
      continue;
    }

    if (char === "`") {
      let delimiterLength = 1;

      while (text[index + delimiterLength] === "`") {
        delimiterLength += 1;
      }

      const delimiter = "`".repeat(delimiterLength);
      const closingIndex = text.indexOf(delimiter, index + delimiterLength);

      if (closingIndex !== -1) {
        const code = text
          .slice(index + delimiterLength, closingIndex)
          .replace(/^ | $/g, "");
        pushNode(<code key={nodeKey}>{code}</code>);
        index = closingIndex + delimiterLength;
        continue;
      }
    }

    const isImage = text.startsWith("![", index);
    const isLink = char === "[";

    if (isImage || isLink) {
      const labelStart = index + (isImage ? 1 : 0);
      const labelEnd = findClosingBracket(text, labelStart);

      if (labelEnd !== -1 && text[labelEnd + 1] === "(") {
        const destinationEnd = findClosingParenthesis(text, labelEnd + 1);

        if (destinationEnd !== -1) {
          const label = text.slice(labelStart + 1, labelEnd);
          const destination = splitDestination(
            text.slice(labelEnd + 2, destinationEnd),
          );

          if (isImage) {
            const src = sanitizeImageUrl(destination.url);

            if (src) {
              pushNode(
                <img
                  key={nodeKey}
                  src={src}
                  alt={label}
                  title={destination.title}
                  loading="lazy"
                />,
              );
              index = destinationEnd + 1;
              continue;
            }
          } else {
            const href = sanitizeUrl(destination.url);

            if (href) {
              pushNode(
                renderLink(
                  href,
                  parseInline(label, `${nodeKey}-label`),
                  nodeKey,
                  destination.title,
                ),
              );
              index = destinationEnd + 1;
              continue;
            }
          }
        }
      }
    }

    const delimiter = text.startsWith("**", index)
      ? "**"
      : text.startsWith("__", index)
        ? "__"
        : text.startsWith("++", index)
          ? "++"
          : text.startsWith("~~", index)
            ? "~~"
            : char === "*" || char === "_"
              ? char
              : null;

    if (delimiter) {
      const contentStart = index + delimiter.length;
      const closingIndex = text.indexOf(delimiter, contentStart);

      if (closingIndex > contentStart) {
        const innerContent = text.slice(contentStart, closingIndex);
        const children = parseInline(innerContent, `${nodeKey}-nested`);

        if (delimiter === "**" || delimiter === "__") {
          pushNode(<strong key={nodeKey}>{children}</strong>);
        } else if (delimiter === "++") {
          pushNode(<u key={nodeKey}>{children}</u>);
        } else if (delimiter === "~~") {
          pushNode(<del key={nodeKey}>{children}</del>);
        } else {
          pushNode(<em key={nodeKey}>{children}</em>);
        }

        index = closingIndex + delimiter.length;
        continue;
      }
    }

    if (char === "<") {
      const closingIndex = text.indexOf(">", index + 1);

      if (closingIndex !== -1) {
        const rawUrl = text.slice(index + 1, closingIndex);
        const href = sanitizeUrl(rawUrl);

        if (href) {
          pushNode(renderLink(href, rawUrl, nodeKey));
          index = closingIndex + 1;
          continue;
        }
      }
    }

    const previousChar = index > 0 ? text[index - 1] : "";
    const canStartBareUrl =
      (index === 0 || /[\s(]/.test(previousChar)) &&
      text.slice(index).toLowerCase().startsWith("http");

    if (canStartBareUrl) {
      const urlMatch = BARE_URL_RE.exec(text.slice(index));

      if (urlMatch) {
        const { url, suffix } = trimBareUrl(urlMatch[0]);
        const href = sanitizeUrl(url);

        if (href) {
          pushNode(renderLink(href, url, nodeKey));
          plainText += suffix;
          index += urlMatch[0].length;
          continue;
        }
      }
    }

    plainText += char;
    index += 1;

    if (!SPECIAL_INLINE_CHARS.has(text[index] ?? "")) {
      while (
        index < text.length &&
        !SPECIAL_INLINE_CHARS.has(text[index]) &&
        !text.slice(index).toLowerCase().startsWith("http")
      ) {
        plainText += text[index];
        index += 1;
      }
    }
  }

  flushPlainText();
  return nodes;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  let codeDelimiterOpen = false;

  for (const char of trimmed) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      current += char;
      continue;
    }

    if (char === "`") {
      codeDelimiterOpen = !codeDelimiterOpen;
      current += char;
      continue;
    }

    if (char === "|" && !codeDelimiterOpen) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseTableAlignment(cell: string): TextAlignment | null {
  const normalized = cell.trim();

  if (!/^:?-{3,}:?$/.test(normalized)) {
    return null;
  }

  if (normalized.startsWith(":") && normalized.endsWith(":")) {
    return "center";
  }

  if (normalized.endsWith(":")) {
    return "right";
  }

  return "left";
}

function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length || !lines[index].includes("|")) {
    return false;
  }

  const headerCells = splitTableRow(lines[index]);
  const delimiterCells = splitTableRow(lines[index + 1]);

  return (
    headerCells.length > 0 &&
    headerCells.length === delimiterCells.length &&
    delimiterCells.every((cell) => parseTableAlignment(cell) !== null)
  );
}

function isHorizontalRule(line: string): boolean {
  return /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line);
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index];

  return (
    /^\s{0,3}#{1,6}\s+/.test(line) ||
    /^\s{0,3}(```|~~~)/.test(line) ||
    /^\s{0,3}>/.test(line) ||
    parseListMatch(line) !== null ||
    isHorizontalRule(line) ||
    isTableStart(lines, index)
  );
}

function parseList(
  lines: string[],
  startIndex: number,
  keyPrefix: string,
): ParsedBlock {
  const firstMatch = parseListMatch(lines[startIndex]);

  if (!firstMatch) {
    return {
      node: null,
      nextIndex: startIndex + 1,
    };
  }

  const baseIndent = firstMatch.indent;
  const ordered = firstMatch.ordered;
  const items: ReactNode[] = [];
  let index = startIndex;
  let containsTasks = false;
  let itemIndex = 0;

  while (index < lines.length) {
    const itemMatch = parseListMatch(lines[index]);

    if (
      !itemMatch ||
      itemMatch.indent !== baseIndent ||
      itemMatch.ordered !== ordered
    ) {
      break;
    }

    const itemLines = [itemMatch.content];
    index += 1;

    while (index < lines.length) {
      const line = lines[index];
      const nestedMatch = parseListMatch(line);
      const lineIndent = countIndent(line);

      if (
        nestedMatch &&
        nestedMatch.indent === baseIndent &&
        nestedMatch.ordered === ordered
      ) {
        break;
      }

      if (line.trim() && lineIndent <= baseIndent) {
        break;
      }

      if (!line.trim()) {
        const nextNonEmptyIndex = lines.findIndex(
          (candidate, candidateIndex) =>
            candidateIndex > index && candidate.trim().length > 0,
        );

        if (nextNonEmptyIndex === -1) {
          index = lines.length;
          break;
        }

        const nextLine = lines[nextNonEmptyIndex];
        const nextMatch = parseListMatch(nextLine);
        const nextIndent = countIndent(nextLine);

        if (
          nextIndent < baseIndent ||
          (nextIndent === baseIndent &&
            (!nextMatch || nextMatch.ordered !== ordered))
        ) {
          break;
        }

        itemLines.push("");
        index += 1;
        continue;
      }

      itemLines.push(stripIndent(line, baseIndent + 2));
      index += 1;
    }

    const taskMatch = /^\[( |x|X)\]\s+(.*)$/.exec(itemLines[0]);
    const isTask = Boolean(taskMatch);

    if (taskMatch) {
      containsTasks = true;
      itemLines[0] = taskMatch[2];
    }

    const itemKey = `${keyPrefix}-item-${itemIndex}`;
    const itemContent = parseBlocks(itemLines, `${itemKey}-content`);

    items.push(
      <li className={isTask ? "markdown-task-item" : undefined} key={itemKey}>
        {taskMatch && (
          <input
            type="checkbox"
            checked={taskMatch[1].toLowerCase() === "x"}
            readOnly
            aria-label={
              taskMatch[1].toLowerCase() === "x"
                ? "Выполнено"
                : "Не выполнено"
            }
          />
        )}
        <div className="markdown-list-item-content">{itemContent}</div>
      </li>,
    );
    itemIndex += 1;
  }

  const className = containsTasks ? "markdown-task-list" : undefined;
  const listNode = ordered ? (
    <ol className={className} key={`${keyPrefix}-list`}>
      {items}
    </ol>
  ) : (
    <ul className={className} key={`${keyPrefix}-list`}>
      {items}
    </ul>
  );

  return { node: listNode, nextIndex: index };
}

function parseBlocks(lines: string[], keyPrefix: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const line = lines[index];
    const blockKey = `${keyPrefix}-block-${blockIndex}`;

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fenceMatch = /^\s{0,3}(```+|~~~+)\s*([^\s`]*)\s*$/.exec(line);

    if (fenceMatch) {
      const fence = fenceMatch[1];
      const language = fenceMatch[2].replace(/[^a-zA-Z0-9_-]/g, "");
      const codeLines: string[] = [];
      index += 1;

      while (
        index < lines.length &&
        !new RegExp(`^\\s{0,3}${fence[0]}{${fence.length},}\\s*$`).test(
          lines[index],
        )
      ) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <pre key={blockKey}>
          <code className={language ? `language-${language}` : undefined}>
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      blockIndex += 1;
      continue;
    }

    const headingMatch = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = parseInline(
        headingMatch[2],
        `${blockKey}-heading`,
      );

      if (level === 1) {
        blocks.push(<h1 key={blockKey}>{headingContent}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={blockKey}>{headingContent}</h2>);
      } else if (level === 3) {
        blocks.push(<h3 key={blockKey}>{headingContent}</h3>);
      } else if (level === 4) {
        blocks.push(<h4 key={blockKey}>{headingContent}</h4>);
      } else if (level === 5) {
        blocks.push(<h5 key={blockKey}>{headingContent}</h5>);
      } else {
        blocks.push(<h6 key={blockKey}>{headingContent}</h6>);
      }

      index += 1;
      blockIndex += 1;
      continue;
    }

    if (index + 1 < lines.length && /^\s*(=+|-+)\s*$/.test(lines[index + 1])) {
      const level = lines[index + 1].trim().startsWith("=") ? 1 : 2;
      const headingContent = parseInline(line.trim(), `${blockKey}-setext`);
      blocks.push(
        level === 1 ? (
          <h1 key={blockKey}>{headingContent}</h1>
        ) : (
          <h2 key={blockKey}>{headingContent}</h2>
        ),
      );
      index += 2;
      blockIndex += 1;
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push(<hr key={blockKey} />);
      index += 1;
      blockIndex += 1;
      continue;
    }

    if (/^\s{0,3}>/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length) {
        const quoteMatch = /^\s{0,3}>\s?(.*)$/.exec(lines[index]);

        if (!quoteMatch) {
          break;
        }

        quoteLines.push(quoteMatch[1]);
        index += 1;
      }

      blocks.push(
        <blockquote key={blockKey}>
          {parseBlocks(quoteLines, `${blockKey}-quote`)}
        </blockquote>,
      );
      blockIndex += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const alignments = splitTableRow(lines[index + 1]).map((cell) =>
        parseTableAlignment(cell),
      );
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        const row = splitTableRow(lines[index]);
        rows.push(
          headers.map((_, cellIndex) => row[cellIndex] ?? ""),
        );
        index += 1;
      }

      blocks.push(
        <div className="markdown-table-wrapper" key={blockKey}>
          <table>
            <thead>
              <tr>
                {headers.map((header, cellIndex) => (
                  <th
                    key={`${blockKey}-header-${cellIndex}`}
                    style={{ textAlign: alignments[cellIndex] ?? "left" }}
                  >
                    {parseInline(header, `${blockKey}-header-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${blockKey}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${blockKey}-row-${rowIndex}-cell-${cellIndex}`}
                      style={{ textAlign: alignments[cellIndex] ?? "left" }}
                    >
                      {parseInline(
                        cell,
                        `${blockKey}-row-${rowIndex}-cell-${cellIndex}`,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      blockIndex += 1;
      continue;
    }

    if (parseListMatch(line)) {
      const parsedList = parseList(lines, index, blockKey);
      blocks.push(parsedList.node);
      index = parsedList.nextIndex;
      blockIndex += 1;
      continue;
    }

    if (/^(?: {4}|\t)/.test(line)) {
      const codeLines: string[] = [];

      while (index < lines.length && (/^(?: {4}|\t)/.test(lines[index]) || !lines[index].trim())) {
        codeLines.push(stripIndent(lines[index], 4));
        index += 1;
      }

      blocks.push(
        <pre key={blockKey}>
          <code>{codeLines.join("\n").replace(/\n+$/, "")}</code>
        </pre>,
      );
      blockIndex += 1;
      continue;
    }

    const paragraphLines = [line.trimEnd()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines, index) &&
      !(index + 1 < lines.length && /^\s*(=+|-+)\s*$/.test(lines[index + 1]))
    ) {
      paragraphLines.push(lines[index].trimEnd());
      index += 1;
    }

    blocks.push(
      <p key={blockKey}>
        {parseInline(paragraphLines.join("\n"), `${blockKey}-paragraph`)}
      </p>,
    );
    blockIndex += 1;
  }

  return blocks;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    const normalizedContent = content.replace(/\r\n?/g, "\n");
    return parseBlocks(normalizedContent.split("\n"), "markdown");
  }, [content]);

  return (
    <div className={`markdown-content ${className}`.trim()}>
      {renderedContent}
    </div>
  );
}
