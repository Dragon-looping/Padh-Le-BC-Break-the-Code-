import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import HeroCanvas from '../components/three/HeroCanvas';
import SplitLab from '../components/viz/SplitLab';
import Footer from '../components/layout/Footer';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import { useMotion } from '../app/MotionContext';
import { useRecentExperiments, useRecentLessons } from '../hooks/useRecentItems';
import { CATALOG } from '../content/catalog';

// ─── Loader Experience ─────────────────────────────────────────────────────────
function Loader({ onComplete }: { onComplete: () => void }) {
  const [impurity, setImpurity] = useState(0.5);
  const [isSplitting, setIsSplitting] = useState(false);
  const { reducedMotion } = useMotion();

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }

    const startTime = Date.now();
    const duration = 1200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Decrease from 0.50 to 0.00
      setImpurity(parseFloat((0.5 * (1 - progress)).toFixed(2)));

      if (progress >= 1) {
        clearInterval(interval);
        setIsSplitting(true);
        setTimeout(() => {
          onComplete();
        }, 700);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [reducedMotion, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-700 ${
        isSplitting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--cobalt)' }}
    >
      {/* Orange vertical cut line */}
      <div
        className={`absolute top-0 bottom-0 w-[2px] bg-[var(--orange)] transition-transform duration-700 ${
          isSplitting ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-40'
        }`}
      />

      <div className="text-center z-10 px-4">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--lime)] block mb-3">
          IMPURITY READOUT
        </span>
        <div
          className="font-mono font-bold tabular-nums text-[var(--lime)] tracking-tight text-7xl md:text-9xl leading-none"
        >
          {impurity.toFixed(2)}
        </div>
        <p className="font-mono text-xs text-[var(--paper)] mt-6 uppercase tracking-widest">
          Sorting the data…
        </p>
      </div>
    </div>
  );
}

// ─── Landing Page Component ───────────────────────────────────────────────────
export default function Landing() {
  const [hasLoaded, setHasLoaded] = useState<boolean>(() => {
    return sessionStorage.getItem('padh_loader_seen') === 'true';
  });
  const [cutValue, setCutValue] = useState<number>(0.31);
  const [isHoveringHero, setIsHoveringHero] = useState<boolean>(false);
  const [mouseCoords, setMouseCoords] = useState<[number, number]>([0, 0]);
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { reducedMotion } = useMotion();
  const { items: recentExperiments } = useRecentExperiments();
  const { items: recentLessons } = useRecentLessons();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Calculate scroll-driven cut displacement
  const autoCut = useTransform(scrollYProgress, [0, 0.45], [0.31, 0.72]);

  useEffect(() => {
    return autoCut.on('change', (v) => {
      if (!isHoveringHero) {
        setCutValue(v);
      }
    });
  }, [autoCut, isHoveringHero]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMouseCoords([nx, ny]);

    // Pointer-driven cut adjustment
    const ratio = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
    setCutValue(ratio);
  };

  const giniReadout = (0.50 * (1 - Math.min(1, Math.abs(cutValue - 0.5) * 1.8))).toFixed(2);

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] overflow-hidden">
      {/* Initial Story Loader */}
      {!hasLoaded && (
        <Loader
          onComplete={() => {
            sessionStorage.setItem('padh_loader_seen', 'true');
            setHasLoaded(true);
          }}
        />
      )}

      {/* ─── Hero Section ("The Cut") ────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        className="relative min-h-[95vh] flex flex-col justify-between p-6 md:p-12 border-b border-[var(--ink)] overflow-hidden select-none"
        aria-label="Interactive Hero"
      >
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--ink) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* 3D Point Field Canvas */}
        {!reducedMotion && (
          <HeroCanvas
            cutPosition={cutValue}
            isHovered={isHoveringHero}
            mousePos={mouseCoords}
          />
        )}

        {/* Dynamic Orange Cut Line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[var(--orange)] z-10 pointer-events-none transition-all duration-75"
          style={{ left: `${cutValue * 100}%` }}
        >
          {/* Draggable Cut Tag */}
          <div className="absolute top-8 -left-10 font-mono text-[9px] bg-[var(--orange)] text-[var(--ink)] font-bold px-2 py-0.5 border border-[var(--ink)] whitespace-nowrap shadow-sm">
            CUT x={cutValue.toFixed(2)}
          </div>
        </div>

        {/* Top Eyebrow & HUD */}
        <div className="flex flex-wrap justify-between items-start z-10 gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] max-w-sm">
            A machine learning lab for people who read the docs and still didn't get it.
          </p>

          <div className="font-mono text-xs tracking-wider bg-[var(--paper)] border border-[var(--ink)] p-2 shadow-hard flex gap-4">
            <div>
              <span className="text-[var(--silver)] text-[10px] block">IMPURITY</span>
              <span className="font-bold text-[var(--orange)]">GINI {giniReadout}</span>
            </div>
            <div className="w-px bg-[var(--ink)]" />
            <div>
              <span className="text-[var(--silver)] text-[10px] block">THRESHOLD</span>
              <span className="font-bold">x={cutValue.toFixed(2)}</span>
            </div>
            <div className="w-px bg-[var(--ink)]" />
            <div>
              <span className="text-[var(--silver)] text-[10px] block">SAMPLES</span>
              <span className="font-bold">n=2,200</span>
            </div>
          </div>
        </div>

        {/* Center Giant Wordmark */}
        <div className="my-auto py-12 z-10">
          <h1 className="font-display font-extrabold uppercase text-[13vw] leading-[0.88] tracking-tighter text-[var(--ink)] flex flex-wrap items-baseline gap-x-6">
            <span style={{ color: 'var(--cobalt)' }}>PADH LE</span>
            <span
              className="text-[var(--lime)]"
              style={{
                WebkitTextStroke: '2.5px var(--ink)',
                textShadow: '4px 4px 0 var(--ink)',
              }}
            >
              BC
            </span>
          </h1>

          <p className="font-sans text-xl md:text-2xl mt-4 max-w-2xl text-[var(--ink)] font-normal">
            Learn the algorithm. Understand the <span className="font-serif italic font-normal text-2xl md:text-3xl">result</span>. Choose with confidence.
          </p>
        </div>

        {/* Bottom Actions & Accessible Cut Controller */}
        <div className="flex flex-wrap items-end justify-between gap-6 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/lab')}
            >
              Enter the Lab →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/datasets')}
            >
              Upload a CSV
            </Button>
          </div>

          {/* Accessible interactive slider fallback / mobile controller */}
          <div className="bg-[var(--paper)] border border-[var(--ink)] p-3 shadow-hard max-w-xs w-full">
            <div className="flex justify-between font-mono text-[10px] text-[var(--silver)] mb-1">
              <span>MANUAL CUT CONTROL</span>
              <span className="text-[var(--orange)] font-bold">{(cutValue * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={cutValue}
              onChange={(e) => setCutValue(parseFloat(e.target.value))}
              aria-label="Decision boundary cut threshold"
              className="w-full accent-[var(--orange)] h-2 cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* ─── Chapter 1: "Every answer starts with a cut" ─────────────────────── */}
      <section className="p-6 md:p-16 max-w-[1440px] mx-auto border-b border-[var(--ink)]">
        <Hairline label="CHAPTER 01 / 04" index="01" className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-[var(--ink)]">
              Every answer starts with a <span className="text-[var(--orange)] underline decoration-2 underline-offset-4">cut</span>.
            </h2>
            <p className="font-sans text-base leading-relaxed text-[var(--ink)] opacity-85">
              A decision tree doesn't memorise. It partitions space. It iterates over every feature, evaluates every possible threshold, and selects the single division that minimises impurity.
            </p>
            <p className="font-mono text-xs text-[var(--silver)]">
              Adjust the threshold below to observe Gini reduction in real time.
            </p>
          </div>
          <div className="lg:col-span-7">
            <SplitLab />
          </div>
        </div>
      </section>

      {/* ─── Chapter 2: "Feed it a CSV" Dropzone ─────────────────────────────── */}
      <section className="p-6 md:p-16 max-w-[1440px] mx-auto border-b border-[var(--ink)]">
        <Hairline label="CHAPTER 02 / 04" index="02" className="mb-8" />
        <div className="max-w-2xl mb-8">
          <h2 className="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-[var(--ink)]">
            Feed it a CSV.
          </h2>
          <p className="font-sans text-base text-[var(--silver)] mt-2">
            Upload any tabular dataset. The engine validates column cardinalities, flags potential data leakage, and computes missingness barcodes before you fit a single parameter.
          </p>
        </div>

        {/* Large Marching Dropzone Container */}
        <div
          onClick={() => navigate('/datasets')}
          className="border-2 border-dashed border-[var(--ink)] p-12 md:p-20 text-center cursor-pointer bg-[var(--paper-2)] hover:bg-[var(--paper)] transition-colors group relative shadow-hard"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/datasets'); }}
        >
          <div className="w-16 h-16 mx-auto mb-4 border border-[var(--ink)] bg-[var(--paper)] flex items-center justify-center font-mono font-bold text-xl group-hover:scale-110 transition-transform">
            CSV
          </div>
          <h3 className="font-display font-bold uppercase text-2xl md:text-3xl text-[var(--ink)]">
            Drag & drop dataset or click to browse
          </h3>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] mt-2">
            Max 25 MB · Instant client-side profiling & target selection
          </p>
          <div className="mt-6 inline-block font-mono text-xs uppercase px-4 py-2 bg-[var(--cobalt)] text-[var(--paper)]">
            Open Specimen Sheet →
          </div>
        </div>
      </section>

      {/* ─── Chapter 3: "Same data. Same rules. Five models." ────────────────── */}
      <section className="p-6 md:p-16 max-w-[1440px] mx-auto border-b border-[var(--ink)]">
        <Hairline label="CHAPTER 03 / 04" index="03" className="mb-8" />
        <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
          <div>
            <h2 className="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-[var(--ink)]">
              Same data. Same rules. Five models.
            </h2>
            <p className="font-sans text-base text-[var(--silver)] mt-2">
              The starting grid. Identical splits, unified preprocessing, fair cross-validation.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest bg-[var(--paper-2)] border border-[var(--ink)] px-2 py-1">
            ILLUSTRATION ONLY
          </span>
        </div>

        {/* Five racing lanes preview */}
        <div className="space-y-3 font-mono text-xs">
          {[
            { name: 'Logistic Regression', color: 'var(--cobalt)', width: '82%', val: '0.82 F1' },
            { name: 'KNN (K=5)', color: 'var(--blush)', width: '74%', val: '0.74 F1' },
            { name: 'Decision Tree', color: 'var(--lime)', width: '88%', val: '0.88 F1' },
            { name: 'Random Forest (100 Trees)', color: 'var(--orange)', width: '94%', val: '0.94 F1', winner: true },
            { name: 'Gradient Boosting', color: 'var(--ink)', width: '91%', val: '0.91 F1' },
          ].map((item, idx) => (
            <div key={idx} className="border border-[var(--ink)] bg-[var(--paper-2)] p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold flex items-center gap-2">
                  {item.name}
                  {item.winner && (
                    <span className="bg-[var(--orange)] text-[var(--ink)] text-[9px] px-1.5 py-0.2 border border-[var(--ink)]">
                      STARTING GRID WINNER
                    </span>
                  )}
                </span>
                <span className="tabular-nums font-bold">{item.val}</span>
              </div>
              <div className="w-full h-3 bg-[var(--paper)] border border-[var(--ink)] overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: item.width,
                    backgroundColor: item.color,
                    borderRight: '1px solid var(--ink)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Chapter 4 & The Bench Dashboard ─────────────────────────────────── */}
      <section className="p-6 md:p-16 max-w-[1440px] mx-auto border-b border-[var(--ink)]">
        <Hairline label="THE BENCH" index="04" className="mb-8" />
        <h2 className="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-[var(--ink)] mb-8">
          The Bench
        </h2>

        {/* Three big entry panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div
            onClick={() => navigate('/lab')}
            className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 cursor-pointer hover:shadow-hard transition-shadow group flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="font-mono text-[10px] text-[var(--silver)] uppercase tracking-widest block mb-2">
                01 · FOUNDATIONS
              </span>
              <h3 className="font-display font-bold text-2xl uppercase group-hover:text-[var(--cobalt)] transition-colors">
                Learning Lab
              </h3>
              <p className="font-sans text-sm text-[var(--silver)] mt-2">
                From least squares to ensemble boosting. Interactive step-scrubbers, KaTeX proofs, and visual decision planes.
              </p>
            </div>
            <div className="font-mono text-xs uppercase font-bold text-[var(--cobalt)] mt-4">
              Explore Specimens →
            </div>
          </div>

          <div
            onClick={() => navigate('/datasets')}
            className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 cursor-pointer hover:shadow-hard transition-shadow group flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="font-mono text-[10px] text-[var(--silver)] uppercase tracking-widest block mb-2">
                02 · INPUT SPECIMENS
              </span>
              <h3 className="font-display font-bold text-2xl uppercase group-hover:text-[var(--orange)] transition-colors">
                Dataset Explorer
              </h3>
              <p className="font-sans text-sm text-[var(--silver)] mt-2">
                Upload CSVs, inspect histograms, configure targets, and isolate leakage before fitting.
              </p>
            </div>
            <div className="font-mono text-xs uppercase font-bold text-[var(--orange)] mt-4">
              Open Explorer →
            </div>
          </div>

          <div
            onClick={() => navigate('/arena/ds_iris')}
            className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 cursor-pointer hover:shadow-hard transition-shadow group flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="font-mono text-[10px] text-[var(--silver)] uppercase tracking-widest block mb-2">
                03 · TOURNAMENT
              </span>
              <h3 className="font-display font-bold text-2xl uppercase group-hover:text-[var(--lime)] transition-colors">
                Model Arena
              </h3>
              <p className="font-sans text-sm text-[var(--silver)] mt-2">
                Simultaneous multi-model evaluation. Automated ranking, confusion matrices, and evidence strings.
              </p>
            </div>
            <div className="font-mono text-xs uppercase font-bold text-[var(--ink)] mt-4">
              Enter Arena →
            </div>
          </div>
        </div>

        {/* Recent Items Activity Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[var(--ink)] pt-8">
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] mb-4">
              RECENTLY OPENED LESSONS
            </h4>
            {recentLessons.length === 0 ? (
              <div className="border border-dashed border-[var(--silver)] p-4 text-center font-mono text-xs text-[var(--silver)]">
                No lessons visited yet.{' '}
                <Link to="/lab" className="text-[var(--cobalt)] underline">
                  Start in the Lab
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLessons.map((slug) => {
                  const entry = CATALOG.find((c) => c.slug === slug);
                  return (
                    <Link
                      key={slug}
                      to={`/lab/${slug}`}
                      className="flex items-center justify-between border border-[var(--ink)] p-2.5 bg-[var(--paper-2)] hover:bg-[var(--paper)] transition-colors font-mono text-xs"
                    >
                      <span>{entry?.title ?? slug}</span>
                      <span className="text-[var(--cobalt)]">Open →</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] mb-4">
              RECENT EXPERIMENTS
            </h4>
            {recentExperiments.length === 0 ? (
              <div className="border border-dashed border-[var(--silver)] p-4 text-center font-mono text-xs text-[var(--silver)]">
                No recent runs recorded.{' '}
                <Link to="/datasets" className="text-[var(--cobalt)] underline">
                  Load a specimen to train
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentExperiments.map((id) => (
                  <Link
                    key={id}
                    to={`/results/${id}`}
                    className="flex items-center justify-between border border-[var(--ink)] p-2.5 bg-[var(--paper-2)] hover:bg-[var(--paper)] transition-colors font-mono text-xs"
                  >
                    <span>EXPERIMENT {id}</span>
                    <span className="text-[var(--orange)]">Inspect Readout →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
