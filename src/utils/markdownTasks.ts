export function toggleMarkdownTaskAtLine(content: string, lineIndex: number): string {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return content;

  const unchecked = /^(\s*(?:[-+*]|\d+[.)])\s+)\[ \](\s+)/;
  const checked = /^(\s*(?:[-+*]|\d+[.)])\s+)\[[xX]\](\s+)/;

  if (unchecked.test(line)) lines[lineIndex] = line.replace(unchecked, "$1[x]$2");
  else if (checked.test(line)) lines[lineIndex] = line.replace(checked, "$1[ ]$2");

  return lines.join("\n");
}

export function findTaskLineByText(content: string, visibleText: string): number {
  const normalizedVisibleText = visibleText.trim().replace(/\s+/g, " ");
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  return lines.findIndex((line) => {
    if (!/^(\s*(?:[-+*]|\d+[.)])\s+)\[[ xX]\]/.test(line)) return false;
    const normalizedLine = line
      .replace(/^(\s*(?:[-+*]|\d+[.)])\s+)\[[ xX]\]\s+/, "")
      .trim()
      .replace(/\s+/g, " ");
    return Boolean(normalizedLine && normalizedVisibleText.includes(normalizedLine));
  });
}
