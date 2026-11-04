import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { runExperiment, getExperiment } from '../api/services/experiments';
import type { ExperimentRun, ModelResult, ApiError } from '../api/types';
import { useWorkspace } from '../app/WorkspaceContext';
import { usePolling } from '../hooks/usePolling';
import { CLASSIFICATION_MODELS, REGRESSION_MODELS, MODEL_LABELS, MODEL_COLORS } from '../config/hyperparams';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import ErrorBand from '../components/ui/ErrorBand';
import Footer from '../components/layout/Footer';

export default function Arena() {
  const { datasetId = 'ds_iris' } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const { targetColumn, taskType, setActiveExperiment } = useWorkspace();

  const isClassification = taskType !== 'regression';
  const defaultContenders = isClassification
    ? [...CLASSIFICATION_MODELS]
    : [...REGRESSION_MODELS];

  const [selectedModels, setSelectedModels] = useState<string[]>(defaultContenders);
  const [activeMetric, setActiveMetric] = useState<string>(isClassification ? 'accuracy' : 'r2');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [experiment, setExperiment] = useState<ExperimentRun | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  // Poll experiment status when running
  usePolling(
    async () => {
      if (!experiment?.experiment_id) return true;
      try {
        const updated = await getExperiment(experiment.experiment_id);
        setExperiment(updated);
        if (updated.status === 'complete' || updated.status === 'failed') {
          setIsRunning(false);
          setActiveExperiment(updated.experiment_id);
          return true; // Stop polling
        }
        return false;
      } catch (err) {
        setError(err as ApiError);
        setIsRunning(false);
        return true;
      }
    },
    isRunning,
    { interval: 1200 }
  );

  const toggleModel = (modelKey: string) => {
    if (isRunning) return;
    setSelectedModels((prev) =>
      prev.includes(modelKey)
        ? prev.length > 1
          ? prev.filter((m) => m !== modelKey)
          : prev
        : [...prev, modelKey]
    );
  };

  const handleLaunchArena = async () => {
    setError(null);
    setIsRunning(true);

    try {
      const run = await runExperiment({
        dataset_id: datasetId,
        target_column: targetColumn || 'species',
        task_type: taskType || 'classification',
        models: selectedModels,
        test_size: 0.2,
        random_state: 42,
        cross_validation_folds: 5,
      });

      setExperiment(run);
      setActiveExperiment(run.experiment_id);

      // If run completes immediately in mock mode
      if (run.status === 'complete') {
        setIsRunning(false);
      }
    } catch (err) {
      setError(err as ApiError);
      setIsRunning(false);
    }
  };

  // Re-rank results based on chosen metric
  const sortedResults = React.useMemo(() => {
    if (!experiment?.results) return [];
    return [...experiment.results].sort((a, b) => {
      const getVal = (r: ModelResult) => {
        if (activeMetric === 'accuracy') return r.accuracy ?? 0;
        if (activeMetric === 'f1_score') return r.f1_score ?? 0;
        if (activeMetric === 'cv_mean') return r.cv_mean ?? 0;
        if (activeMetric === 'r2') return r.r2 ?? 0;
        return r.accuracy ?? 0;
      };
      return getVal(b) - getVal(a);
    });
  }, [experiment?.results, activeMetric]);

  const bestModelKey = sortedResults.length > 0 && sortedResults[0].status === 'done' ? sortedResults[0].model : null;

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-[var(--ink)] pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
            TOURNAMENT RING · STARTING GRID
          </span>
          <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
            Model Arena
          </h1>
          <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-2xl">
            Simultaneous multi-model trial. Every algorithm competes on identical test splits and uniform preprocessing.
          </p>
        </div>

        {/* Locked Rulebook Bar */}
        <section aria-label="Rulebook Bar" className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 shadow-hard">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[var(--orange)]" />
              <span className="font-bold uppercase tracking-wider">RULEBOOK CONDITIONS:</span>
            </div>
            <div className="flex flex-wrap gap-4 text-[var(--ink)]">
              <div>
                <span className="text-[var(--silver)]">DATASET:</span> {datasetId}
              </div>
              <div>
                <span className="text-[var(--silver)]">TARGET:</span> {targetColumn || 'species'}
              </div>
              <div>
                <span className="text-[var(--silver)]">SPLIT SEED:</span> 42
              </div>
              <div>
                <span className="text-[var(--silver)]">TEST SIZE:</span> 20%
              </div>
              <div>
                <span className="text-[var(--silver)]">CV FOLDS:</span> 5
              </div>
              <div>
                <span className="text-[var(--silver)]">PRIMARY METRIC:</span>{' '}
                <span className="text-[var(--orange)] font-bold uppercase">{activeMetric}</span>
              </div>
            </div>
          </div>
        </section>

        {error && <ErrorBand error={error} onRetry={handleLaunchArena} />}

        {/* Entrants Tokens Selection */}
        <section aria-label="Contender Entrants" className="space-y-4">
          <Hairline label="CONTENDER ENTRANTS (CLICK TO TOGGLE)" index="01" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {defaultContenders.map((modelKey) => {
              const isSelected = selectedModels.includes(modelKey);
              const label = MODEL_LABELS[modelKey] || modelKey;
              const color = MODEL_COLORS[modelKey] || 'var(--ink)';

              return (
                <div
                  key={modelKey}
                  onClick={() => toggleModel(modelKey)}
                  className={`border-2 border-[var(--ink)] p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--paper-2)] shadow-hard'
                      : 'bg-[var(--paper)] opacity-40 hover:opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className="w-3 h-3 rounded-full border border-[var(--ink)]"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-[9px] uppercase font-bold">
                      {isSelected ? 'ACTIVE' : 'EXCLUDED'}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold truncate text-[var(--ink)]">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              size="lg"
              disabled={isRunning || selectedModels.length === 0}
              onClick={handleLaunchArena}
            >
              {isRunning ? 'Tournament in Progress...' : 'Run Tournament on Starting Grid →'}
            </Button>
          </div>
        </section>

        {/* Live Race Comparison Lanes */}
        {experiment && (
          <section aria-label="Starting Grid Lanes" className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <Hairline label="RACE TRACK LANES" index="02" className="flex-1" />

              {/* Metric Switcher */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[var(--silver)] uppercase">SORT BY METRIC:</span>
                <div className="flex border border-[var(--ink)] bg-[var(--paper-2)]">
                  {(isClassification ? ['accuracy', 'f1_score', 'cv_mean'] : ['r2', 'cv_mean']).map(
                    (m) => (
                      <button
                        key={m}
                        onClick={() => setActiveMetric(m)}
                        className={`px-3 py-1 uppercase ${
                          activeMetric === m
                            ? 'bg-[var(--ink)] text-[var(--paper)] font-bold'
                            : 'hover:bg-[var(--paper)]'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* FLIP animated model lanes */}
            <div className="space-y-4">
              <AnimatePresence>
                {sortedResults.map((res) => {
                  const label = MODEL_LABELS[res.model] || res.model;
                  const color = MODEL_COLORS[res.model] || 'var(--ink)';
                  const isWinner = res.model === bestModelKey;

                  const metricScore =
                    activeMetric === 'accuracy'
                      ? res.accuracy
                      : activeMetric === 'f1_score'
                      ? res.f1_score
                      : activeMetric === 'r2'
                      ? res.r2
                      : res.cv_mean;

                  const trainScore = res.train_score ?? (metricScore ? metricScore + 0.02 : 0);
                  const valScore = res.val_score ?? (metricScore ?? 0);
                  const overfitGap = Math.max(0, trainScore - valScore);

                  return (
                    <motion.div
                      key={res.model}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className={`border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 shadow-hard relative ${
                        isWinner ? 'border-l-8 border-l-[var(--orange)]' : ''
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-[var(--ink)]"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-sm text-[var(--ink)]">{label}</span>
                          {isWinner && (
                            <span className="bg-[var(--orange)] text-[var(--ink)] font-bold text-[9px] px-2 py-0.5 border border-[var(--ink)] uppercase">
                              BEST ON {activeMetric}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {res.status !== 'done' ? (
                            <span className="uppercase text-[var(--orange)] font-bold animate-pulse">
                              {res.status}...
                            </span>
                          ) : (
                            <>
                              <div>
                                <span className="text-[var(--silver)] text-[10px] block">TEST SCORE</span>
                                <span className="font-bold text-base tabular-nums">
                                  {metricScore?.toFixed(3) ?? '—'}
                                </span>
                              </div>
                              <div className="w-px bg-[var(--silver)] h-6" />
                              <div>
                                <span className="text-[var(--silver)] text-[10px] block">TRAIN TIME</span>
                                <span className="tabular-nums">
                                  {res.training_time?.toFixed(2) ?? '<0.1'}s
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Main Metric Bar */}
                      <div className="w-full bg-[var(--paper)] h-6 border border-[var(--ink)] relative overflow-hidden flex items-center">
                        {res.status === 'done' ? (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, (metricScore ?? 0) * 100))}%` }}
                            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                            className="h-full"
                            style={{ backgroundColor: color }}
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--silver-light)] opacity-40 animate-pulse" />
                        )}
                      </div>

                      {/* Overfitting Gap bar indicator */}
                      {res.status === 'done' && (
                        <div className="mt-2 flex justify-between items-center font-mono text-[10px] text-[var(--silver)]">
                          <span>
                            Train: {trainScore.toFixed(2)} · Val: {valScore.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>Overfit Gap:</span>
                            <span
                              className={`font-bold tabular-nums ${
                                overfitGap > 0.08 ? 'text-[var(--error)]' : 'text-[var(--cobalt)]'
                              }`}
                            >
                              {(overfitGap * 100).toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* CTAs post-competition */}
            {experiment.status === 'complete' && (
              <div className="border-t-2 border-[var(--ink)] pt-6 flex flex-wrap gap-4 justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(`/studio/${experiment.experiment_id}`)}
                >
                  Tune in Experiment Studio
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(`/results/${experiment.experiment_id}`)}
                >
                  Open Full Readout Dashboard
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(`/advisor/${experiment.experiment_id}`)}
                >
                  Ask the Model Advisor (The Verdict) →
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
