// Presentation-only wrapping. The server still owns the complete current line.
export function paginateText(text: string, fits: (candidate: string) => boolean): string[] {
  if (!text) return [''];
  const pages: string[] = [];
  let remaining = text;
  while (remaining.length) {
    if (fits(remaining)) { pages.push(remaining); break; }
    let low = 1;
    let high = remaining.length;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (fits(remaining.slice(0, mid))) { best = mid; low = mid + 1; }
      else high = mid - 1;
    }
    // Prefer a word boundary, but always make progress even for a long word.
    const prefix = remaining.slice(0, Math.max(1, best));
    const boundary = prefix.search(/\s+\S*$/);
    const cut = boundary > 0 ? boundary : Math.max(1, best);
    pages.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  return pages;
}
