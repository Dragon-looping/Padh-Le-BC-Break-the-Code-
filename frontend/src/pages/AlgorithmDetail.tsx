import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { CATALOG } from '../content/catalog';
import { getLesson } from '../api/services/lessons';
import type { Lesson } from '../api/types';
import SplitLab from '../components/viz/SplitLab';
import Chip from '../components/ui/Chip';
import Button from '../components/ui/Button';
import Hairline from '../components/ui/Hairline';
import Footer from '../components/layout/Footer';
import { useRecentLessons } from '../hooks/useRecentItems';
import { useWorkspace } from '../app/WorkspaceContext';

// Math Renderer helper
function MathBlock({ tex }: { tex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: true });
    } catch {
      return tex;
    }
  }, [tex]);

  return (
    <div
      className="overflow-x-auto py-3 my-2 font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function AlgorithmDetail() {
  const { algorithm = 'decision_tree' } = useParams<{ algorithm: string }>();
  const navigate = useNavigate();
  const { add: recordLesson } = useRecentLessons();
  const { activeExperimentId } = useWorkspace();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Interactive controls state
  const [stepIndex, setStepIndex] = useState(0);
  const [mathLens, setMathLens] = useState<'plain' | 'math' | 'both'>('both');
  const [workedStep, setWorkedStep] = useState(0);

  const catalogEntry = useMemo(() => {
    return CATALOG.find((c) => c.slug === algorithm) || CATALOG[4];
  }, [algorithm]);

  useEffect(() => {
    recordLesson(algorithm);
    setLoading(true);

    getLesson(algorithm)
      .then((data) => {
        setLesson(data);
      })
      .catch(() => {
        // Fallback default mock
        setLesson({
          slug: algorithm,
          title: catalogEntry.title,
          category: catalogEntry.category,
          difficulty: catalogEntry.difficulty,
          estimated_minutes: catalogEntry.estimatedMinutes,
          blurb: catalogEntry.blurb,
          sections: [],
        });
      })
      .finally(() => setLoading(false));
  }, [algorithm, catalogEntry, recordLesson]);

  const stepsList = [
    { title: 'Evaluate candidate splits', desc: 'Sort continuous features and test candidate midpoints that divide classes.' },
    { title: 'Calculate Impurity metric', desc: 'Compute Gini or Shannon Entropy for both resulting subset partitions.' },
    { title: 'Maximize Information Gain', desc: 'Select the single feature and threshold offering greatest reduction in entropy.' },
    { title: 'Recurse or Prune', desc: 'Continue partitioning sub-nodes until stopping conditions (max depth, min leaf) trigger.' },
  ];

  const workedCalculations = [
    { label: 'Parent Node', text: '10 samples total (6 Class 0, 4 Class 1). Gini = 1 - (0.6² + 0.4²) = 0.480' },
    { label: 'Left Partition', text: 'Threshold x ≤ 2.4: 5 samples (5 Class 0, 0 Class 1). Gini = 1 - (1.0² + 0²) = 0.000 (Pure)' },
    { label: 'Right Partition', text: 'Threshold x > 2.4: 5 samples (1 Class 0, 4 Class 1). Gini = 1 - (0.2² + 0.8²) = 0.320' },
    { label: 'Information Gain', text: 'Weighted Gini = (5/10)*0.000 + (5/10)*0.320 = 0.160. Gain = 0.480 - 0.160 = +0.320!' },
  ];

  const mathFormulas: Record<string, string> = {
    decision_tree: 'Gini(p) = 1 - \\sum_{i=1}^{C} p_i^2 \\qquad \\text{Gain} = G_{parent} - \\sum_{k=1}^2 \\frac{n_k}{N} G_k',
    logistic_regression: 'P(y=1|x) = \\sigma(w^T x + b) = \\frac{1}{1 + e^{-(w^T x + b)}}',
    knn: 'd(p, q) = \\sqrt{\\sum_{i=1}^{n} (p_i - q_i)^2} \\qquad \\hat{y} = \\text{mode}(\\{y_1, \\dots, y_k\\})',
    linear_regression: '\\min_{w, b} \\frac{1}{2n} \\sum_{i=1}^n (y_i - (w^T x_i + b))^2 + \\lambda \\|w\\|_2^2',
  };

  const currentFormula = mathFormulas[algorithm] || mathFormulas.decision_tree;

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      {/* Thread Strip connecting Theory ↔ Practice */}
      <div className="bg-[var(--paper-2)] border-b border-[var(--ink)] px-6 py-2.5 font-mono text-xs flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--orange)]" />
          <span className="font-bold">{catalogEntry.title}</span>
          <span className="text-[var(--silver)]">↔</span>
          <span className="text-[var(--cobalt)]">
            {activeExperimentId ? `Linked Experiment #${activeExperimentId.slice(-6)}` : 'Studio Sandbox Preset Ready'}
          </span>
        </div>
        <button
          onClick={() => navigate(`/studio/${activeExperimentId || 'exp_iris_demo'}`)}
          className="text-[var(--orange)] font-bold uppercase hover:underline"
        >
          Open in Experiment Studio →
        </button>
      </div>

      {/* Main Layout: Wide Reading Column + Sticky Chapter Path */}
      <div className="max-w-[1440px] mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sticky Chapter Path (Right/Left Rail) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 order-2 lg:order-1 border-t lg:border-t-0 border-[var(--ink)] pt-6 lg:pt-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--silver)] mb-4">
            CHAPTER DECISION PATH
          </div>
          <nav className="space-y-1 font-mono text-xs">
            {[
              { id: 'what-is-it', label: '01. What It Is' },
              { id: 'why-use-it', label: '02. Why It Is Used' },
              { id: 'how-it-works', label: '03. How It Works' },
              { id: 'mathematics', label: '04. Mathematical Lens' },
              { id: 'worked-example', label: '05. Worked Example' },
              { id: 'interactive-lab', label: '06. Visual Split Lab' },
              { id: 'trade-offs', label: '07. Advantages & Limits' },
              { id: 'when-to-use', label: '08. Decision Checklist' },
              { id: 'comparison', label: '09. Related Algorithms' },
              { id: 'practical-experiment', label: '10. Take to Studio' },
            ].map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block p-2 border-l-2 border-transparent hover:border-[var(--orange)] hover:bg-[var(--paper-2)] transition-colors text-[var(--ink)] opacity-75 hover:opacity-100"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Wide Reading Content */}
        <article className="lg:col-span-9 order-1 lg:order-2 space-y-16">
          {/* Header */}
          <header className="border-b border-[var(--ink)] pb-8">
            <div className="flex items-center gap-2 mb-3">
              <Chip label={catalogEntry.category} color="default" size="sm" />
              <Chip label={catalogEntry.difficulty} color="orange" size="sm" />
            </div>
            <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
              {catalogEntry.title}
            </h1>
            <p className="font-sans text-xl text-[var(--silver)] mt-3 max-w-2xl">
              {catalogEntry.blurb}
            </p>
          </header>

          {/* 1. What It Is */}
          <section id="what-is-it" className="space-y-4">
            <Hairline label="01 / WHAT IT IS" />
            <h2 className="font-display font-bold text-2xl uppercase">Conceptual Essence</h2>
            <p className="font-sans text-base leading-relaxed text-[var(--ink)] opacity-90">
              A {catalogEntry.title} recursively partitions the feature space into axis-aligned rectangular hyper-rectangles. Unlike black-box models, it yields an explicit tree of boolean decision rules that map directly from input features to categorical or scalar predictions.
            </p>
          </section>

          {/* 2. Why It Is Used */}
          <section id="why-use-it" className="space-y-4">
            <Hairline label="02 / WHY IT IS USED" />
            <h2 className="font-display font-bold text-2xl uppercase">Primary Motivations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[var(--ink)] p-4 bg-[var(--paper-2)]">
                <h3 className="font-mono text-xs uppercase font-bold text-[var(--cobalt)] mb-1">
                  Absolute Interpretability
                </h3>
                <p className="font-sans text-sm text-[var(--silver)]">
                  Every inference can be audited as an IF-THEN path. Critical for healthcare, legal credit scoring, and regulated environments.
                </p>
              </div>
              <div className="border border-[var(--ink)] p-4 bg-[var(--paper-2)]">
                <h3 className="font-mono text-xs uppercase font-bold text-[var(--orange)] mb-1">
                  Zero Feature Normalization
                </h3>
                <p className="font-sans text-sm text-[var(--silver)]">
                  Because monotonic thresholds are invariant to scale, features measured in grams, millimeters, or dollars require no standardization.
                </p>
              </div>
            </div>
          </section>

          {/* 3. How It Works (Step Scrubber) */}
          <section id="how-it-works" className="space-y-4">
            <Hairline label="03 / HOW IT WORKS" />
            <h2 className="font-display font-bold text-2xl uppercase">Recursive Partitioning Scrubber</h2>
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6">
              {/* Progress Rail */}
              <div className="flex gap-1 mb-6">
                {stepsList.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStepIndex(i)}
                    className={`h-2 flex-1 cursor-pointer transition-colors ${
                      i <= stepIndex ? 'bg-[var(--orange)]' : 'bg-[var(--silver-light)]'
                    }`}
                  />
                ))}
              </div>

              <div className="min-h-[100px]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--silver)]">
                  STEP 0{stepIndex + 1} OF 04
                </span>
                <h3 className="font-display font-bold text-xl uppercase mt-1 text-[var(--ink)]">
                  {stepsList[stepIndex].title}
                </h3>
                <p className="font-sans text-base text-[var(--silver)] mt-2">
                  {stepsList[stepIndex].desc}
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--ink)]">
                <button
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((s) => s - 1)}
                  className="font-mono text-xs uppercase px-4 py-2 border border-[var(--ink)] disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  disabled={stepIndex === stepsList.length - 1}
                  onClick={() => setStepIndex((s) => s + 1)}
                  className="font-mono text-xs uppercase px-4 py-2 bg-[var(--ink)] text-[var(--paper)] disabled:opacity-30"
                >
                  Next Step →
                </button>
              </div>
            </div>
          </section>

          {/* 4. Mathematical Explanation with Lens Switch */}
          <section id="mathematics" className="space-y-4">
            <Hairline label="04 / MATHEMATICAL LENS" />
            <div className="flex justify-between items-center">
              <h2 className="font-display font-bold text-2xl uppercase">Impurity Formulation</h2>
              {/* Lens Switch */}
              <div className="flex border border-[var(--ink)] font-mono text-xs">
                {(['plain', 'math', 'both'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setMathLens(l)}
                    className={`px-3 py-1 uppercase ${
                      mathLens === l ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--paper)]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[var(--ink)] p-6 bg-[var(--paper-2)] space-y-4">
              {(mathLens === 'plain' || mathLens === 'both') && (
                <p className="font-sans text-base text-[var(--ink)] leading-relaxed">
                  <strong>In Plain Words:</strong> Impurity measures how mixed a basket of items is. If all items belong to class 0, impurity is exactly 0.0 (pure). If items are equally divided 50/50, impurity peaks at 0.50. The cut chosen is the one that causes the largest drop in impurity.
                </p>
              )}

              {(mathLens === 'math' || mathLens === 'both') && (
                <div className="border-t border-[var(--ink)] pt-4">
                  <span className="font-mono text-[10px] uppercase text-[var(--silver)] block mb-1">
                    FORMAL EXPRESSION
                  </span>
                  <MathBlock tex={currentFormula} />
                </div>
              )}
            </div>
          </section>

          {/* 5. Worked Example */}
          <section id="worked-example" className="space-y-4">
            <Hairline label="05 / WORKED EXAMPLE" />
            <h2 className="font-display font-bold text-2xl uppercase">Step-By-Step Numerical Walkthrough</h2>
            <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-6">
              <div className="space-y-3 font-mono text-xs">
                {workedCalculations.map((c, i) => (
                  <div
                    key={i}
                    className={`p-3 border transition-colors ${
                      i === workedStep
                        ? 'border-[var(--orange)] bg-[var(--paper)] shadow-hard'
                        : 'border-[var(--silver-light)] opacity-70'
                    }`}
                  >
                    <div className="font-bold uppercase text-[var(--ink)] mb-1">
                      {c.label}
                    </div>
                    <div className="text-[var(--silver)]">{c.text}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="font-mono text-[10px] text-[var(--silver)] uppercase">
                  Click 'Step' to follow the arithmetic
                </span>
                <button
                  onClick={() => setWorkedStep((s) => (s + 1) % workedCalculations.length)}
                  className="font-mono text-xs uppercase px-4 py-2 bg-[var(--orange)] text-[var(--ink)] font-bold border border-[var(--ink)]"
                >
                  Step Calculation ({workedStep + 1}/4)
                </button>
              </div>
            </div>
          </section>

          {/* 6. Interactive Visualisation Showpiece */}
          <section id="interactive-lab" className="space-y-4">
            <Hairline label="06 / INTERACTIVE SHOWPIECE" />
            <h2 className="font-display font-bold text-2xl uppercase">Split Lab Simulator</h2>
            <p className="font-sans text-sm text-[var(--silver)]">
              Interact directly with the decision boundary. Observe how axis-aligned partitions handle non-linear distributions like XOR and Moons.
            </p>
            <SplitLab />
          </section>

          {/* 7. Advantages & Limitations */}
          <section id="trade-offs" className="space-y-4">
            <Hairline label="07 / ADVANTAGES AND LIMITATIONS" />
            <h2 className="font-display font-bold text-2xl uppercase">Engineering Trade-offs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-l-4 border-l-[var(--lime)] bg-[var(--paper-2)] p-5 border border-[var(--ink)]">
                <h3 className="font-mono text-sm uppercase font-bold text-[var(--ink)] mb-2">
                  Advantages
                </h3>
                <ul className="space-y-2 font-sans text-sm text-[var(--silver)] list-disc pl-4">
                  <li>Zero data scaling or imputation required during inference.</li>
                  <li>Inherent non-linear interactions discovered automatically.</li>
                  <li>Fast training: <code className="font-mono text-xs">O(n_features · n_samples · log(n_samples))</code>.</li>
                </ul>
              </div>

              <div className="border-l-4 border-l-[var(--error)] bg-[var(--paper-2)] p-5 border border-[var(--ink)]">
                <h3 className="font-mono text-sm uppercase font-bold text-[var(--ink)] mb-2">
                  Limitations
                </h3>
                <ul className="space-y-2 font-sans text-sm text-[var(--silver)] list-disc pl-4">
                  <li>Extreme propensity to overfit unconstrained deep branches.</li>
                  <li>High variance: minor perturbation in training data completely alters top split.</li>
                  <li>Cannot approximate diagonal relationships without stair-stepping.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. When to Use It */}
          <section id="when-to-use" className="space-y-4">
            <Hairline label="08 / WHEN TO USE IT" />
            <h2 className="font-display font-bold text-2xl uppercase">Decision Checklist</h2>
            <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-5 font-mono text-xs space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="accent-[var(--cobalt)]" />
                <span>Need stakeholders to understand exact classification logic?</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="accent-[var(--cobalt)]" />
                <span>Dataset has mixture of categorical and numeric features?</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="accent-[var(--cobalt)]" />
                <span>Rapid baseline model required before training an ensemble?</span>
              </label>
            </div>
          </section>

          {/* 9. Comparison with Related Algorithms */}
          <section id="comparison" className="space-y-4">
            <Hairline label="09 / COMPARISON" />
            <h2 className="font-display font-bold text-2xl uppercase">Algorithm Comparison</h2>
            <div className="overflow-x-auto border border-[var(--ink)]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--ink)] text-[var(--paper)]">
                  <tr>
                    <th className="p-3">Algorithm</th>
                    <th className="p-3">Interpretability</th>
                    <th className="p-3">Training Speed</th>
                    <th className="p-3">Overfit Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink)] bg-[var(--paper)]">
                  <tr className="bg-[var(--paper-2)]">
                    <td className="p-3 font-bold text-[var(--orange)]">Decision Tree</td>
                    <td className="p-3">Very High</td>
                    <td className="p-3">Fast</td>
                    <td className="p-3 text-[var(--error)]">High (if unpruned)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Random Forest</td>
                    <td className="p-3">Low</td>
                    <td className="p-3">Moderate</td>
                    <td className="p-3 text-[var(--cobalt)]">Low</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">KNN</td>
                    <td className="p-3">Moderate</td>
                    <td className="p-3">Instant (lazy)</td>
                    <td className="p-3">High on noisy data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 10. Practical Experiment Studio CTA */}
          <section id="practical-experiment" className="border-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] p-8">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--lime)] block mb-2">
              10 / PRACTICAL BENCH EXPERIMENT
            </span>
            <h2 className="font-display font-bold uppercase text-3xl md:text-4xl text-[var(--paper)]">
              Take this to the Studio.
            </h2>
            <p className="font-sans text-base text-[var(--silver)] mt-2 max-w-xl">
              Apply this algorithm on real specimens. Tweak max depth, test minimum leaf samples, and observe the bias-variance curve live on the Scoreboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/studio/${activeExperimentId || 'exp_iris_demo'}`)}
              >
                Launch Studio Preset →
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/datasets')}
                className="bg-transparent text-[var(--paper)] border-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              >
                Upload CSV First
              </Button>
            </div>
          </section>
        </article>
      </div>

      <Footer />
    </div>
  );
}
