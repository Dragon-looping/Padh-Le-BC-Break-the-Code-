// Seeded random number generator (mulberry32)
export function seededRng(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Gini impurity ────────────────────────────────────────────────────────────
export function gini(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return 1 - counts.reduce((sum, c) => sum + (c / total) ** 2, 0);
}

// Weighted Gini for a binary split
export function weightedGini(
  leftCounts: number[],
  rightCounts: number[]
): { giniLeft: number; giniRight: number; weighted: number; infoGain: number } {
  const nLeft = leftCounts.reduce((a, b) => a + b, 0);
  const nRight = rightCounts.reduce((a, b) => a + b, 0);
  const total = nLeft + nRight;
  const giniLeft = gini(leftCounts);
  const giniRight = gini(rightCounts);
  const parentCounts = leftCounts.map((v, i) => v + (rightCounts[i] ?? 0));
  const parentGini = gini(parentCounts);
  const weighted = (nLeft / total) * giniLeft + (nRight / total) * giniRight;
  return { giniLeft, giniRight, weighted, infoGain: parentGini - weighted };
}

// Find the best Gini split for a 1D array of {x, label} points
export function findBestSplit(
  points: { x: number; label: number }[],
  numClasses = 2
): { threshold: number; gini: number; infoGain: number } {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const totalCounts = new Array(numClasses).fill(0);
  for (const p of sorted) totalCounts[p.label] = (totalCounts[p.label] || 0) + 1;

  const leftCounts = new Array(numClasses).fill(0);
  const rightCounts = [...totalCounts];

  let bestGini = Infinity;
  let bestThreshold = sorted[0].x;
  let bestGain = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    leftCounts[sorted[i].label]++;
    rightCounts[sorted[i].label]--;
    if (sorted[i].x === sorted[i + 1].x) continue;
    const { weighted, infoGain } = weightedGini(leftCounts, rightCounts);
    if (weighted < bestGini) {
      bestGini = weighted;
      bestThreshold = (sorted[i].x + sorted[i + 1].x) / 2;
      bestGain = infoGain;
    }
  }

  return { threshold: bestThreshold, gini: bestGini, infoGain: bestGain };
}

// ─── Entropy ──────────────────────────────────────────────────────────────────
export function entropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((sum, c) => {
    if (c === 0) return sum;
    const p = c / total;
    return sum + p * Math.log2(p);
  }, 0);
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmt2(n: number | undefined | null): string {
  if (n == null) return '—';
  return n.toFixed(2);
}

export function fmt4(n: number | undefined | null): string {
  if (n == null) return '—';
  return n.toFixed(4);
}

export function fmtPct(n: number | undefined | null): string {
  if (n == null) return '—';
  return (n * 100).toFixed(1) + '%';
}

export function fmtMs(seconds: number | undefined | null): string {
  if (seconds == null) return '—';
  if (seconds < 0.001) return '<1ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${seconds.toFixed(2)}s`;
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
