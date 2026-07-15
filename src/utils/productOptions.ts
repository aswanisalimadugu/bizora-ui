/** Parse comma-separated product options into a clean, deduped list. */
export function parseProductOptions(options?: string | null): string[] {
  if (!options?.trim()) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of options.split(',')) {
    const opt = raw.trim();
    if (!opt) continue;
    const key = opt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(opt);
  }
  return result;
}
