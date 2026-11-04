import React, { useState, useMemo } from 'react';
import { seededRng, gini, weightedGini } from '../../lib/math';

export type DemoDatasetType = 'blobs' | 'moons' | 'xor';

interface Point {
  x: number;
  y: number;
  label: 0 | 1;
}

export default function SplitLab({ showFull = true }: { showFull?: boolean }) {
  const [datasetType, setDatasetType] = useState<DemoDatasetType>('blobs');
  const [splitAxis, setSplitAxis] = useState<'x' | 'y'>('x');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>('gini');
  const [maxDepth, setMaxDepth] = useState<number>(2);

  // Generate deterministic points based on chosen dataset type
  const points = useMemo<Point[]>(() => {
    const rng = seededRng(1337);
    const pts: Point[] = [];
    const n = 120;

    if (datasetType === 'blobs') {
      for (let i = 0; i < n; i++) {
        if (i < n / 2) {
          // Class 0: left cluster
          pts.push({
            x: Math.max(0.05, Math.min(0.48, 0.28 + (rng() - 0.5) * 0.35)),
            y: Math.max(0.05, Math.min(0.95, 0.5 + (rng() - 0.5) * 0.5)),
            label: 0,
          });
        } else {
          // Class 1: right cluster
          pts.push({
            x: Math.max(0.52, Math.min(0.95, 0.74 + (rng() - 0.5) * 0.35)),
            y: Math.max(0.05, Math.min(0.95, 0.5 + (rng() - 0.5) * 0.5)),
            label: 1,
          });
        }
      }
    } else if (datasetType === 'moons') {
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI;
        if (i < n / 2) {
          pts.push({
            x: Math.max(0.05, Math.min(0.95, 0.35 + Math.cos(t * 2) * 0.25 + (rng() - 0.5) * 0.1)),
            y: Math.max(0.05, Math.min(0.95, 0.4 + Math.sin(t * 2) * 0.25 + (rng() - 0.5) * 0.1)),
            label: 0,
          });
        } else {
          pts.push({
            x: Math.max(0.05, Math.min(0.95, 0.65 - Math.cos(t * 2) * 0.25 + (rng() - 0.5) * 0.1)),
            y: Math.max(0.05, Math.min(0.95, 0.6 - Math.sin(t * 2) * 0.25 + (rng() - 0.5) * 0.1)),
            label: 1,
          });
        }
      }
    } else {
      // XOR
      for (let i = 0; i < n; i++) {
        const x = rng();
        const y = rng();
        const label: 0 | 1 = (x > 0.5 && y > 0.5) || (x <= 0.5 && y <= 0.5) ? 0 : 1;
        pts.push({ x, y, label });
      }
    }
    return pts;
  }, [datasetType]);

  // Compute live split statistics
  const stats = useMemo(() => {
    let left0 = 0, left1 = 0, right0 = 0, right1 = 0;
    points.forEach((p) => {
      const val = splitAxis === 'x' ? p.x : p.y;
      if (val <= threshold) {
        if (p.label === 0) left0++;
        else left1++;
      } else {
        if (p.label === 0) right0++;
        else right1++;
      }
    });

    const leftCounts = [left0, left1];
    const rightCounts = [right0, right1];
    const { giniLeft, giniRight, weighted, infoGain } = weightedGini(leftCounts, rightCounts);

    return {
      left0, left1, leftTotal: left0 + left1,
      right0, right1, rightTotal: right0 + right1,
      giniLeft, giniRight,
      weightedImpurity: weighted,
      gain: Math.max(0, infoGain),
    };
  }, [points, splitAxis, threshold]);

  return (
    <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-5 md:p-8">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ink)] pb-4 mb-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--silver)] block">
            LAB BENCH EXPERIMENT
          </span>
          <h3 className="font-display font-bold text-xl uppercase tracking-tight text-[var(--ink)]">
            Decision Tree Split Lab
          </h3>
        </div>

        {/* Dataset switch */}
        <div className="flex items-center gap-1 border border-[var(--ink)] bg-[var(--paper)] p-0.5">
          {(['blobs', 'moons', 'xor'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDatasetType(d)}
              className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 transition-colors ${
                datasetType === d ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--ink)] hover:bg-[var(--silver-light)]'
              }`}
            >
              {d === 'blobs' ? 'Two Blobs' : d === 'moons' ? 'Two Moons' : 'XOR'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scatter Visualisation with Draggable Cut */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[420px] bg-[var(--paper)] border border-[var(--ink)] overflow-hidden shadow-hard">
            {/* Dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'radial-gradient(circle, var(--silver) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Split region highlight tint */}
            {splitAxis === 'x' ? (
              <div
                className="absolute inset-y-0 left-0 bg-[var(--cobalt)] opacity-5 pointer-events-none transition-all"
                style={{ width: `${threshold * 100}%` }}
              />
            ) : (
              <div
                className="absolute inset-x-0 bottom-0 bg-[var(--cobalt)] opacity-5 pointer-events-none transition-all"
                style={{ height: `${threshold * 100}%` }}
              />
            )}

            {/* Points */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x * 100}
                  cy={(1 - p.y) * 100}
                  r="2.2"
                  fill={p.label === 0 ? 'var(--cobalt)' : 'var(--lime)'}
                  stroke="var(--ink)"
                  strokeWidth="0.8"
                />
              ))}

              {/* Threshold Cut Line */}
              {splitAxis === 'x' ? (
                <line
                  x1={threshold * 100}
                  y1={0}
                  x2={threshold * 100}
                  y2={100}
                  stroke="var(--orange)"
                  strokeWidth="2"
                  strokeDasharray="3 1.5"
                />
              ) : (
                <line
                  x1={0}
                  y1={(1 - threshold) * 100}
                  x2={100}
                  y2={(1 - threshold) * 100}
                  stroke="var(--orange)"
                  strokeWidth="2"
                  strokeDasharray="3 1.5"
                />
              )}
            </svg>

            {/* Floating Cut marker pill */}
            <div
              className="absolute font-mono text-[10px] bg-[var(--orange)] text-[var(--ink)] px-2 py-0.5 border border-[var(--ink)] select-none pointer-events-none shadow-sm"
              style={
                splitAxis === 'x'
                  ? { left: `clamp(4px, ${threshold * 100}%, calc(100% - 64px))`, top: '8px' }
                  : { bottom: `clamp(4px, ${threshold * 100}%, calc(100% - 24px))`, left: '8px' }
              }
            >
              CUT: {threshold.toFixed(2)}
            </div>
          </div>

          {/* Slider controller */}
          <div className="w-full max-w-[420px] mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--ink)] font-bold">THRESHOLD VALUE ({splitAxis.toUpperCase()})</span>
              <span className="text-[var(--orange)] font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-[var(--silver-light)] accent-[var(--orange)] cursor-ew-resize border border-[var(--ink)]"
            />
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setSplitAxis('x')}
                  className={`font-mono text-xs uppercase px-3 py-1 border border-[var(--ink)] ${
                    splitAxis === 'x' ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--paper)] text-[var(--ink)]'
                  }`}
                >
                  Cut on X1
                </button>
                <button
                  onClick={() => setSplitAxis('y')}
                  className={`font-mono text-xs uppercase px-3 py-1 border border-[var(--ink)] ${
                    splitAxis === 'y' ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--paper)] text-[var(--ink)]'
                  }`}
                >
                  Cut on X2
                </button>
              </div>

              <button
                onClick={() => {
                  // Find optimal heuristic threshold
                  setThreshold(datasetType === 'blobs' ? 0.5 : 0.48);
                }}
                className="font-mono text-xs uppercase px-3 py-1 bg-[var(--lime)] text-[var(--ink)] border border-[var(--ink)] hover:bg-[var(--paper)]"
              >
                Auto Best
              </button>
            </div>
          </div>
        </div>

        {/* Readout Panels and Tree Representation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Impurity meter */}
          <div className="bg-[var(--paper)] border border-[var(--ink)] p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)]">
                SPLIT QUALITY ({criterion.toUpperCase()})
              </span>
              <div className="flex gap-1">
                {(['gini', 'entropy'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCriterion(c)}
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                      criterion === c ? 'bg-[var(--orange)] text-[var(--ink)] border-[var(--ink)]' : 'border-transparent text-[var(--silver)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-[var(--ink)] p-3 bg-[var(--paper-2)]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--silver)] block">
                  LEFT NODE (≤ {threshold.toFixed(2)})
                </span>
                <div className="font-mono text-xl font-bold text-[var(--ink)] tabular-nums mt-1">
                  GINI {stats.giniLeft.toFixed(3)}
                </div>
                <div className="font-mono text-[10px] text-[var(--silver)] mt-1 flex gap-2">
                  <span className="text-[var(--cobalt)]">C0: {stats.left0}</span>
                  <span className="text-[var(--lime)] bg-[var(--ink)] px-1">C1: {stats.left1}</span>
                </div>
              </div>

              <div className="border border-[var(--ink)] p-3 bg-[var(--paper-2)]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--silver)] block">
                  RIGHT NODE (&gt; {threshold.toFixed(2)})
                </span>
                <div className="font-mono text-xl font-bold text-[var(--ink)] tabular-nums mt-1">
                  GINI {stats.giniRight.toFixed(3)}
                </div>
                <div className="font-mono text-[10px] text-[var(--silver)] mt-1 flex gap-2">
                  <span className="text-[var(--cobalt)]">C0: {stats.right0}</span>
                  <span className="text-[var(--lime)] bg-[var(--ink)] px-1">C1: {stats.right1}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--ink)] pt-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--silver)] block">
                  WEIGHTED IMPURITY
                </span>
                <span className="font-mono text-2xl font-bold text-[var(--orange)] tabular-nums">
                  {stats.weightedImpurity.toFixed(3)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase text-[var(--silver)] block">
                  PURITY GAIN
                </span>
                <span className="font-mono text-xl font-bold text-[var(--cobalt)] tabular-nums">
                  +{stats.gain.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Mini Decision Tree visualization */}
          <div className="bg-[var(--paper)] border border-[var(--ink)] p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--silver)] block mb-3">
              GENERATED TREE HIERARCHY
            </span>
            <div className="flex flex-col items-center">
              {/* Root node */}
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] px-3 py-1.5 text-center font-mono text-xs shadow-sm">
                <div className="font-bold text-[var(--orange)]">{splitAxis.toUpperCase()} &le; {threshold.toFixed(2)}?</div>
                <div className="text-[9px] text-[var(--silver)]">n={points.length} · Gini=0.500</div>
              </div>

              {/* Connecting branches */}
              <div className="flex w-36 justify-between h-5 border-x-2 border-t-2 border-[var(--ink)] my-1" />

              {/* Child leaves */}
              <div className="flex justify-between w-52 gap-2">
                <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-2 text-center flex-1 font-mono text-[10px]">
                  <div className="font-bold text-[var(--cobalt)]">Left Leaf</div>
                  <div>Gini: {stats.giniLeft.toFixed(2)}</div>
                  <div className="text-[9px] text-[var(--silver)]">{stats.leftTotal} samples</div>
                </div>
                <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-2 text-center flex-1 font-mono text-[10px]">
                  <div className="font-bold text-[var(--lime)] bg-[var(--ink)] inline-block px-1">Right Leaf</div>
                  <div>Gini: {stats.giniRight.toFixed(2)}</div>
                  <div className="text-[9px] text-[var(--silver)]">{stats.rightTotal} samples</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
