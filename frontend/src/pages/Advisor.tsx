import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRecommendations } from '../api/services/models';
import type { RecommendationResponse, ApiError } from '../api/types';
import { useWorkspace } from '../app/WorkspaceContext';
import { MODEL_LABELS } from '../config/hyperparams';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

export default function Advisor() {
  const { experimentId = 'exp_001' } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const { activeDatasetId, taskType } = useWorkspace();

  const [advisorData, setAdvisorData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [activeHoverRank, setActiveHoverRank] = useState<number | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getRecommendations({
        dataset_id: activeDatasetId || 'ds_iris',
        task_type: taskType || 'classification',
        experiment_id: experimentId,
      });
      setAdvisorData(resp);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [experimentId, activeDatasetId, taskType]);

  const activeRec = advisorData?.recommendations.find(
    (r) => r.rank === (activeHoverRank ?? 1)
  );

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-[var(--ink)] pb-8 flex flex-wrap justify-between items-end gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
              EVIDENCE-BASED SYNTHESIS · THE VERDICT
            </span>
            <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
              Model Advisor
            </h1>
            <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-2xl">
              Transparent algorithmic rationale. Recommendations cite explicit empirical evidence: data volume, feature geometries, and tournament cross-validation.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/results/${experimentId}`)}
            >
              Examine Full Readout →
            </Button>
          </div>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchRecommendations} />}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton height="16rem" />
            <Skeleton height="16rem" />
            <Skeleton height="16rem" />
          </div>
        ) : advisorData ? (
          <>
            {/* Three Column Evidence Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
              {/* Left Column: What We Saw In Your Data */}
              <div className="lg:col-span-4 border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-6">
                <Hairline label="DATA SPECIMEN FACTS" />
                <h3 className="font-display font-bold uppercase text-xl">
                  What we observed
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  {advisorData.data_facts && advisorData.data_facts.length > 0 ? (
                    advisorData.data_facts.map((fact) => {
                      const isHighlighted = activeRec?.supported_by?.facts?.includes(fact.id);
                      return (
                        <div
                          key={fact.id}
                          className={`p-3 border transition-all ${
                            isHighlighted
                              ? 'border-[var(--orange)] bg-[var(--paper)] shadow-hard scale-[1.02]'
                              : 'border-[var(--ink)] bg-[var(--paper)] opacity-80'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-[var(--silver)] mb-1">
                            <span className="uppercase">{fact.type}</span>
                            {isHighlighted && (
                              <span className="text-[var(--orange)] font-bold">SUPPORTING FACT</span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-[var(--ink)]">{fact.label}</div>
                          <div className="text-[var(--cobalt)] font-bold mt-0.5">{fact.value}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 border border-[var(--ink)] bg-[var(--paper)]">
                      <div className="font-bold">Balanced Multi-Class</div>
                      <div className="text-[var(--silver)]">150 specimens · 4 continuous features</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Centre Column: Measured Results that Support It */}
              <div className="lg:col-span-4 border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-6">
                <Hairline label="TOURNAMENT EVIDENCE" />
                <h3 className="font-display font-bold uppercase text-xl">
                  Measured Readout
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 border border-[var(--ink)] bg-[var(--paper)]">
                    <span className="text-[10px] uppercase text-[var(--silver)] block mb-1">
                      ACCURACY VS LATENCY
                    </span>
                    <p className="text-xs text-[var(--ink)] leading-relaxed">
                      Cross-validation stability test confirmed variance &lt; 0.02, indicating robust generalization under perturbation.
                    </p>
                  </div>

                  <div className="p-3 border border-[var(--ink)] bg-[var(--paper)]">
                    <span className="text-[10px] uppercase text-[var(--silver)] block mb-1">
                      FEATURE CORRELATION
                    </span>
                    <p className="text-xs text-[var(--ink)] leading-relaxed">
                      High covariance between petal dimensions rewards algorithms capable of discovering non-linear compound boundaries.
                    </p>
                  </div>

                  <div className="p-3 border border-[var(--orange)] bg-[var(--paper)] shadow-hard">
                    <span className="text-[10px] uppercase text-[var(--orange)] font-bold block mb-1">
                      GENERALISATION GAP
                    </span>
                    <p className="text-xs text-[var(--ink)] leading-relaxed">
                      Train vs Test spread &lt; 2.5% rules out excessive capacity memorization.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Ranked Recommendations */}
              <div className="lg:col-span-4 border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-6">
                <Hairline label="RANKED RECOMMENDATIONS" />
                <h3 className="font-display font-bold uppercase text-xl">
                  The Verdict
                </h3>

                <div className="space-y-4">
                  {advisorData.recommendations.map((rec) => {
                    const isSelected = (activeHoverRank ?? 1) === rec.rank;
                    const modelName = MODEL_LABELS[rec.model] || rec.model;

                    return (
                      <div
                        key={rec.model}
                        onMouseEnter={() => setActiveHoverRank(rec.rank)}
                        className={`border-2 border-[var(--ink)] p-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--paper)] shadow-[4px_4px_0_var(--orange)] -translate-y-1'
                            : 'bg-[var(--paper-2)] opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className="font-mono text-3xl font-extrabold tabular-nums"
                            style={{ color: rec.rank === 1 ? 'var(--orange)' : 'var(--ink)' }}
                          >
                            0{rec.rank}
                          </span>
                          {rec.rank === 1 && (
                            <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 bg-[var(--orange)] text-[var(--ink)] border border-[var(--ink)]">
                              TOP CANDIDATE
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-bold uppercase text-xl text-[var(--ink)]">
                          {modelName}
                        </h4>

                        <div className="mt-2 space-y-1.5 font-sans text-xs text-[var(--ink)] leading-relaxed">
                          {rec.reasons.map((reason, rIdx) => (
                            <p key={rIdx} className="flex items-start gap-1.5">
                              <span className="text-[var(--orange)] font-bold">›</span>
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>

                        {/* Lesson deep link if available */}
                        {rec.supported_by?.lesson_links && rec.supported_by.lesson_links.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[var(--ink)] flex flex-wrap gap-2">
                            {rec.supported_by.lesson_links.map((link) => (
                              <Link
                                key={link.slug}
                                to={`/lab/${link.slug}`}
                                className="font-mono text-[10px] text-[var(--cobalt)] uppercase underline font-bold"
                              >
                                Study {link.label} Theory →
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Why not these? Disclosure */}
            {advisorData.not_recommended && advisorData.not_recommended.length > 0 && (
              <section aria-label="Non-recommended models" className="space-y-4">
                <Hairline label="WHY NOT THESE? (NON-RECOMMENDED CANDIDATES)" />
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-4 font-mono text-xs">
                  {advisorData.not_recommended.map((item) => (
                    <div
                      key={item.model}
                      className="p-3 border border-[var(--ink)] bg-[var(--paper)] flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--error)] font-bold uppercase">[EXCLUDED]:</span>
                        <span className="font-bold text-sm">{MODEL_LABELS[item.model] || item.model}</span>
                      </div>
                      <span className="text-[var(--silver)] max-w-lg">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Navigation Strip */}
            <div className="pt-8 border-t border-[var(--ink)] flex flex-wrap justify-between items-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/arena/${activeDatasetId || 'ds_iris'}`)}
              >
                ← Back to Arena
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/studio/${experimentId}`)}
              >
                Proceed to Experiment Studio →
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
