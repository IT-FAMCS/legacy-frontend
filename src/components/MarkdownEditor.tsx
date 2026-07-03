import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { handleMarkdownHotkey } from "../hooks/useMarkdownHotkeys";
import {
  findTaskLineByText,
  toggleMarkdownTaskAtLine,
} from "../utils/markdownTasks";

const SAVE_DEBOUNCE_MS = 700;

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  onSaveContent?: (value: string) => Promise<void> | void;
};

function getSelectedWord(): string {
  const selected = window.getSelection()?.toString().trim();
  return selected || "";
}

export function MarkdownEditor({
  value,
  onChange,
  editable = true,
  onSaveContent,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(
    null as unknown as HTMLTextAreaElement,
  );
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!onSaveContent) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(
      () => void onSaveContent(value),
      SAVE_DEBOUNCE_MS,
    );
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [value, onSaveContent]);

  const taskLineIndexes = useMemo(() => {
    return value
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line, index) =>
        /^(\s*(?:[-+*]|\d+[.)])\s+)\[[ xX]\]/.test(line) ? index : -1,
      )
      .filter((index) => index >= 0);
  }, [value]);

  const focusWordInTextarea = (word: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !word) return;
    const index = value.toLowerCase().indexOf(word.toLowerCase());
    if (index < 0) return;
    textarea.focus();
    textarea.setSelectionRange(index, index + word.length);
    textarea.scrollTop = Math.max(
      0,
      (index / Math.max(1, value.length)) * textarea.scrollHeight - 80,
    );
  };

  const handlePreviewClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.tagName !== "INPUT" ||
      (target as HTMLInputElement).type !== "checkbox"
    )
      return;
    event.preventDefault();
    const rowText = target.closest("li, p, div")?.textContent || "";
    let lineIndex = findTaskLineByText(value, rowText);
    if (lineIndex < 0 && taskLineIndexes.length === 1)
      lineIndex = taskLineIndexes[0];
    if (lineIndex >= 0) onChange(toggleMarkdownTaskAtLine(value, lineIndex));
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "16px",
        alignItems: "start",
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        disabled={!editable}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) =>
          handleMarkdownHotkey(event, textareaRef, value, onChange)
        }
        placeholder="Содержимое карточки (поддерживается Markdown)"
        aria-label="Содержимое карточки в формате Markdown"
        style={{
          width: "100%",
          minHeight: "420px",
          padding: "12px",
          border: "1px solid #d8d8df",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
          resize: "vertical",
        }}
      />
      <div
        onDoubleClick={() => focusWordInTextarea(getSelectedWord())}
        onClick={handlePreviewClick}
        style={{
          minHeight: "420px",
          padding: "16px",
          border: "1px solid #d8d8df",
          borderRadius: "8px",
          backgroundColor: "white",
          overflow: "auto",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: "12px" }}>
          Предпросмотр
        </div>
        <MarkdownRenderer content={value} />
      </div>
    </div>
  );
}
