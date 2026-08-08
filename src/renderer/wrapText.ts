/**
 * Greedy word-wrap by approximate character width. Not pixel-perfect (SVG
 * text doesn't measure itself without a live DOM), but close enough for the
 * fixed font/size this renderer always uses. Revisit if we ever support
 * variable font sizes per theme.
 */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}
