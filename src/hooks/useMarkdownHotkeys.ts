import type { KeyboardEvent, RefObject } from "react";

type Setter = (value: string) => void;

function wrapSelection(textarea: HTMLTextAreaElement, value: string, setValue: Setter, left: string, right = left, placeholder = "текст") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  const nextValue = value.slice(0, start) + left + selected + right + value.slice(end);
  setValue(nextValue);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + left.length, start + left.length + selected.length);
  });
}

function prefixCurrentLine(textarea: HTMLTextAreaElement, value: string, setValue: Setter, prefix: string) {
  const start = textarea.selectionStart;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setValue(nextValue);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length);
  });
}

export function handleMarkdownHotkey(
  event: KeyboardEvent<HTMLTextAreaElement>,
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  setValue: Setter,
) {
  const textarea = textareaRef.current;
  if (!textarea) return;
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) return;
  const key = event.key.toLowerCase();

  if (key === "b") {
    event.preventDefault(); wrapSelection(textarea, value, setValue, "**", "**", "жирный текст");
  } else if (key === "i") {
    event.preventDefault(); wrapSelection(textarea, value, setValue, "*", "*", "курсив");
  } else if (key === "u") {
    event.preventDefault(); wrapSelection(textarea, value, setValue, "++", "++", "подчёркнутый текст");
  } else if (key === "k") {
    event.preventDefault(); wrapSelection(textarea, value, setValue, "[", "](https://)", "ссылка");
  } else if (key === "`") {
    event.preventDefault(); wrapSelection(textarea, value, setValue, "`", "`", "код");
  } else if (key === "8" && event.shiftKey) {
    event.preventDefault(); prefixCurrentLine(textarea, value, setValue, "- ");
  } else if (key === "7" && event.shiftKey) {
    event.preventDefault(); prefixCurrentLine(textarea, value, setValue, "1. ");
  } else if (key === "x" && event.shiftKey) {
    event.preventDefault(); prefixCurrentLine(textarea, value, setValue, "- [ ] ");
  }
}
