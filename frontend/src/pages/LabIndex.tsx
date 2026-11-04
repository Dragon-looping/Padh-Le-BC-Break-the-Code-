import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CATALOG, CATEGORIES } from '../content/catalog';
import Hairline from '../components/ui/Hairline';
import Chip from '../components/ui/Chip';
import Footer from '../components/layout/Footer';

// Inline SVG Signature Illustration
function SignatureGlyph({ type }: { type: string }) {
  switch (type) {
    case 'line':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="8" cy="32" r="2.5" fill="var(--cobalt)" />
          <circle cx="16" cy="24" r="2.5" fill="var(--cobalt)" />
          <circle cx="24" cy="18" r="2.5" fill="var(--lime)" stroke="var(--ink)" strokeWidth="0.8" />
          <circle cx="32" cy="10" r="2.5" fill="var(--lime)" stroke="var(--ink)" strokeWidth="0.8" />
          <line x1="4" y1="36" x2="36" y2="6" stroke="var(--orange)" strokeWidth="2" />
        </svg>
      );
    case 'sigmoid':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M4 32 C 16 32, 20 8, 36 8" stroke="var(--cobalt)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="10" cy="32" r="2" fill="var(--cobalt)" />
          <circle cx="30" cy="8" r="2" fill="var(--lime)" stroke="var(--ink)" strokeWidth="0.8" />
        </svg>
      );
    case 'knn':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="14" stroke="var(--blush)" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="20" cy="20" r="3" fill="var(--orange)" />
          <circle cx="14" cy="16" r="2.5" fill="var(--cobalt)" />
          <circle cx="25" cy="14" r="2.5" fill="var(--cobalt)" />
          <circle cx="24" cy="26" r="2.5" fill="var(--lime)" stroke="var(--ink)" strokeWidth="0.8" />
        </svg>
      );
    case 'tree':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="8" r="3.5" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
          <line x1="18" y1="11" x2="11" y2="22" stroke="var(--ink)" strokeWidth="1.5" />
          <line x1="22" y1="11" x2="29" y2="22" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="10" cy="25" r="3" fill="var(--cobalt)" />
          <circle cx="30" cy="25" r="3" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
        </svg>
      );
    case 'forest':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 28 L14 16 L20 28 Z" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
          <path d="M20 28 L26 12 L32 28 Z" fill="var(--orange)" stroke="var(--ink)" strokeWidth="1" />
          <circle cx="26" cy="12" r="2" fill="var(--cobalt)" />
        </svg>
      );
    case 'confusion':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="6" y="6" width="12" height="12" fill="var(--cobalt)" />
          <rect x="22" y="6" width="12" height="12" fill="var(--silver-light)" />
          <rect x="6" y="22" width="12" height="12" fill="var(--silver-light)" />
          <rect x="22" y="22" width="12" height="12" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1" />
        </svg>
      );
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="6" y="6" width="28" height="28" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="20" cy="20" r="4" fill="var(--orange)" />
        </svg>
      );
  }
}

export default function LabIndex() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'all' | 'algorithm' | 'concept'>('all');

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((item) => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.blurb.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase());

      const matchesCat = !activeCategory || item.category === activeCategory;
      const matchesType = activeType === 'all' || item.type === activeType;

      return matchesQuery && matchesCat && matchesType;
    });
  }, [query, activeCategory, activeType]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof CATALOG>();
    filteredCatalog.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return map;
  }, [filteredCatalog]);

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      {/* Index Masthead */}
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto border-b border-[var(--ink)]">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-3">
          CATALOG OF SPECIMENS · INDEX
        </span>
        <h1 className="font-display font-extrabold uppercase text-5xl md:text-7xl tracking-tight text-[var(--ink)]">
          The Learning Lab
        </h1>
        <p className="font-sans text-lg md:text-xl text-[var(--silver)] max-w-xl mt-3">
          Don't memorise it. Break it. From geometric bounds to loss gradients, inspect each algorithm's mechanics with hands-on labs.
        </p>

        {/* Search bar & Category chips */}
        <div className="mt-8 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search algorithms, metrics, criteria, formulations (Press '/' to focus)..."
              className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-4 font-mono text-sm placeholder:text-[var(--silver)] focus:bg-[var(--paper)] outline-none shadow-hard"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-4 font-mono text-xs uppercase hover:text-[var(--orange)]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => { setActiveCategory(null); setActiveType('all'); }}
              className={`font-mono text-xs uppercase px-3 py-1.5 border border-[var(--ink)] transition-colors ${
                !activeCategory && activeType === 'all'
                  ? 'bg-[var(--ink)] text-[var(--paper)] shadow-hard'
                  : 'bg-[var(--paper-2)] hover:bg-[var(--paper)]'
              }`}
            >
              All Specimens ({CATALOG.length})
            </button>

            <div className="w-px bg-[var(--silver)] my-1" />

            {(['algorithm', 'concept'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(activeType === t ? 'all' : t)}
                className={`font-mono text-xs uppercase px-3 py-1.5 border border-[var(--ink)] transition-colors ${
                  activeType === t
                    ? 'bg-[var(--orange)] text-[var(--ink)] font-bold shadow-hard'
                    : 'bg-[var(--paper-2)] hover:bg-[var(--paper)]'
                }`}
              >
                {t}s
              </button>
            ))}

            <div className="w-px bg-[var(--silver)] my-1" />

            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCategory(activeCategory === c.name ? null : c.name)}
                className={`font-mono text-xs uppercase px-3 py-1.5 border border-[var(--ink)] transition-colors ${
                  activeCategory === c.name
                    ? 'bg-[var(--cobalt)] text-[var(--paper)] font-bold shadow-hard'
                    : 'bg-[var(--paper-2)] hover:bg-[var(--paper)]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-16">
        {filteredCatalog.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--silver)] p-12 text-center font-mono">
            <p className="text-base text-[var(--silver)]">No lessons matching "{query}"</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory(null); setActiveType('all'); }}
              className="mt-4 font-mono text-xs uppercase px-4 py-2 bg-[var(--orange)] text-[var(--ink)] border border-[var(--ink)]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([cat, items], idx) => (
            <section key={cat} aria-label={cat}>
              <Hairline
                label={cat.toUpperCase()}
                index={`0${idx + 1}`}
                className="mb-8"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((entry) => (
                  <Link
                    key={entry.slug}
                    to={`/lab/${entry.slug}`}
                    className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 flex flex-col justify-between hover:bg-[var(--paper)] hover:shadow-hard transition-all group relative overflow-hidden"
                  >
                    {/* Orange hairline top tick */}
                    <div className="absolute top-0 left-0 w-8 h-[3px] bg-[var(--orange)]" />

                    <div>
                      {/* Top icons & badges */}
                      <div className="flex justify-between items-start mb-4">
                        <SignatureGlyph type={entry.illustrationKey} />
                        <div className="flex gap-1.5 items-center">
                          <Chip
                            label={entry.difficulty}
                            size="sm"
                            color={
                              entry.difficulty === 'beginner'
                                ? 'lime'
                                : entry.difficulty === 'intermediate'
                                ? 'orange'
                                : 'cobalt'
                            }
                          />
                          <span className="font-mono text-[10px] text-[var(--silver)] tabular-nums">
                            {entry.estimatedMinutes}m read
                          </span>
                        </div>
                      </div>

                      {/* Title & Blurb */}
                      <h3 className="font-display font-bold uppercase text-2xl tracking-tight text-[var(--ink)] group-hover:text-[var(--cobalt)] transition-colors mb-2">
                        {entry.title}
                      </h3>
                      <p className="font-sans text-sm text-[var(--silver)] leading-relaxed">
                        {entry.blurb}
                      </p>
                    </div>

                    <div className="border-t border-[var(--ink)] pt-4 mt-6 flex justify-between items-center font-mono text-xs">
                      <span className="uppercase text-[var(--silver)] text-[10px]">
                        {entry.type}
                      </span>
                      <span className="text-[var(--cobalt)] font-bold group-hover:translate-x-1 transition-transform">
                        Study Lesson →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Footer />
    </div>
  );
}
