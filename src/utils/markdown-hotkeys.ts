import type { KeyboardEvent } from "react";

type SetValue = (next: string) => void;

function replaceSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  setValue: SetValue,
  before: string,
  after = before,
  placeholder = "текст",
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);

  setValue(next);

  requestAnimationFrame(() => {
    const selectionStart = start + before.length;
    const selectionEnd = selectionStart + selected.length;
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  });
}

function insertLinePrefix(
  textarea: HTMLTextAreaElement,
  value: string,
  setValue: SetValue,
  prefix: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selected = value.slice(lineStart, end);
  const nextSelected = selected
    .split("\n")
    .map((line, index) => `${prefix.replace("{n}", String(index + 1))}${line}`)
    .join("\n");
  const next = value.slice(0, lineStart) + nextSelected + value.slice(end);

  setValue(next);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + nextSelected.length);
  });
}

function isHotkey(event: KeyboardEvent<HTMLTextAreaElement>, code: string, key: string): boolean {
  return event.code === code || event.key.toLowerCase() === key;
}

/**
 * Markdown shortcuts for textarea editors.
 * Uses event.code in addition to event.key, so Ctrl+B works even with RU keyboard layout.
 */
export function handleMarkdownHotkey(
  event: KeyboardEvent<HTMLTextAreaElement>,
  setValue: SetValue,
): boolean {
  const isMod = event.ctrlKey || event.metaKey;

  if (!isMod || event.altKey) {
    return false;
  }

  const textarea = event.currentTarget;
  const value = textarea.value;
  let handled = true;

  if (!event.shiftKey && isHotkey(event, "KeyB", "b")) {
    replaceSelection(textarea, value, setValue, "**", "**", "жирный текст");
  } else if (!event.shiftKey && isHotkey(event, "KeyI", "i")) {
    replaceSelection(textarea, value, setValue, "*", "*", "курсив");
  } else if (!event.shiftKey && isHotkey(event, "KeyU", "u")) {
    replaceSelection(textarea, value, setValue, "++", "++", "подчёркнутый текст");
  } else if (!event.shiftKey && isHotkey(event, "KeyK", "k")) {
    replaceSelection(textarea, value, setValue, "[", "](https://example.com)", "текст ссылки");
  } else if (!event.shiftKey && isHotkey(event, "KeyE", "e")) {
    replaceSelection(textarea, value, setValue, "`", "`", "код");
  } else if (event.shiftKey && isHotkey(event, "KeyX", "x")) {
    replaceSelection(textarea, value, setValue, "~~", "~~", "зачёркнутый текст");
  } else if (event.shiftKey && (event.code === "Digit7" || event.key === "&" || event.key === "7")) {
    insertLinePrefix(textarea, value, setValue, "{n}. ");
  } else if (event.shiftKey && (event.code === "Digit8" || event.key === "*" || event.key === "8")) {
    insertLinePrefix(textarea, value, setValue, "- ");
  } else {
    handled = false;
  }

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }

  return handled;
}
