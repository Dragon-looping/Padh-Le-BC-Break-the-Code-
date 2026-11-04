import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import { getExperiment } from '../api/services/experiments';
import type { ExperimentRun, ModelResult, ApiError } from '../api/types';
import { MODEL_LABELS, MODEL_COLORS } from '../config/hyperparams';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

export default function Results() {
  const { experimentId = 'exp_001' } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState<ExperimentRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Active chart & model tabs
  const [activeMetric, setActiveMetric] = useState<'accuracy' | 'f1_score' | 'cv_mean'>('accuracy');
  const [selectedModelTab, setSelectedModelTab] = useState<string>('decision_tree');
  const [cmDisplayMode, setCmDisplayMode] = useState<'counts' | 'percent'>('counts');

  const fetchExperiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExperiment(experimentId);
      setExperiment(data);
      if (data.results && data.results.length > 0) {
        setSelectedModelTab(data.results[0].model);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiment();
  }, [experimentId]);

  const results = experiment?.results ?? [];
  const isClassification = experiment?.task_type !== 'regression';

  // Find best model
  const bestModel = results.reduce<ModelResult | null>((best, cur) => {
    if (!best) return cur;
    return (cur.accuracy ?? 0) > (best.accuracy ?? 0) ? cur : best;
  }, null);

  // Data for Metric Comparison Bar Chart
  const chartData = results.map((r) => ({
    name: MODEL_LABELS[r.model] || r.model,
    score: Number(((activeMetric === 'accuracy' ? r.accuracy : activeMetric === 'f1_score' ? r.f1_score : r.cv_mean) ?? 0) * 100).toFixed(1),
    cvMean: Number(((r.cv_mean ?? 0) * 100).toFixed(1)),
    cvStd: Number(((r.cv_std ?? 0.02) * 100).toFixed(1)),
    trainTime: Number((r.training_time ?? 0.1).toFixed(2)),
    predictTime: Number(((r.predict_time ?? 0.01) * 1000).toFixed(1)),
    fill: MODEL_COLORS[r.model] || 'var(--ink)',
  }));

  const activeModelResult = results.find((r) => r.model === selectedModelTab) || results[0];

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header Strip */}
        <div className="border-b border-[var(--ink)] pb-8 flex flex-wrap justify-between items-end gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
              EVALUATION ENGINE · THE READOUT
            </span>
            <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
              Results Dashboard
            </h1>
            <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-2xl">
              Tournament metrics synthesis. Inspect confusion matrix densities, cross-validation variance bars, and feature importance distributions.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/results/${experimentId}/report`)}
            >
              Printable Report View ↗
            </Button>
          </div>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchExperiment} />}

        {loading ? (
          <div className="space-y-6">
            <Skeleton height="8rem" />
            <Skeleton height="16rem" />
            <Skeleton height="14rem" />
          </div>
        ) : experiment ? (
          <>
            {/* Instrument-Panel Summary Strip (Inverted Ink Background) */}
            <section
              aria-label="Summary Readout"
              className="border-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] p-6 md:p-8 shadow-hard"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs">
                <div>
                  <span className="text-[var(--silver)] text-[10px] uppercase block mb-1">
                    STARTING GRID WINNER
                  </span>
                  <div className="font-display font-bold uppercase text-2xl md:text-3xl text-[var(--lime)]">
                    {bestModel ? MODEL_LABELS[bestModel.model] || bestModel.model : '—'}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--silver)] text-[10px] uppercase block mb-1">
                    PRIMARY METRIC
                  </span>
                  <div className="font-display font-bold uppercase text-2xl md:text-3xl text-[var(--orange)]">
                    {((bestModel?.accuracy ?? 0) * 100).toFixed(1)}% ACC
                  </div>
                </div>
                <div>
                  <span className="text-[var(--silver)] text-[10px] uppercase block mb-1">
                    INPUT SPECIMEN
                  </span>
                  <div className="font-bold text-xl text-[var(--paper)] truncate">
                    {experiment.dataset_id}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--silver)] text-[10px] uppercase block mb-1">
                    TARGET COLUMN
                  </span>
                  <div className="font-bold text-xl text-[var(--paper)] truncate">
                    {experiment.target_column}
                  </div>
                </div>
              </div>
            </section>

            {/* Model Comparison Table */}
            <section aria-label="Comparison Table" className="space-y-4">
              <Hairline label="TOURNAMENT MODEL COMPARISON MATRIX" index="01" />
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] overflow-x-auto shadow-hard">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[var(--ink)] text-[var(--paper)] uppercase">
                    <tr>
                      <th className="p-3 sticky left-0 bg-[var(--ink)] z-10">Algorithm</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Recall</th>
                      <th className="p-3">F1 Score</th>
                      <th className="p-3">5-Fold CV Mean ± Std</th>
                      <th className="p-3">Train Latency</th>
                      <th className="p-3">Predict Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ink)]">
                    {results.map((r) => {
                      const isWinner = r.model === bestModel?.model;
                      return (
                        <tr
                          key={r.model}
                          className={`hover:bg-[var(--paper)] transition-colors ${
                            isWinner ? 'bg-[var(--paper)] font-bold' : ''
                          }`}
                        >
                          <td className="p-3 sticky left-0 bg-[var(--paper-2)] z-10 border-r border-[var(--ink)] flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-[var(--ink)]"
                              style={{ backgroundColor: MODEL_COLORS[r.model] || 'var(--ink)' }}
                            />
                            <span>{MODEL_LABELS[r.model] || r.model}</span>
                            {isWinner && (
                              <span className="bg-[var(--orange)] text-[var(--ink)] text-[8px] font-bold px-1.5 py-0.2 border border-[var(--ink)]">
                                BEST
                              </span>
                            )}
                          </td>
                          <td className="p-3 tabular-nums font-bold text-[var(--cobalt)]">
                            {r.accuracy !== undefined ? `${(r.accuracy * 100).toFixed(2)}%` : '—'}
                          </td>
                          <td className="p-3 tabular-nums">
                            {r.precision !== undefined ? `${(r.precision * 100).toFixed(2)}%` : '—'}
                          </td>
                          <td className="p-3 tabular-nums">
                            {r.recall !== undefined ? `${(r.recall * 100).toFixed(2)}%` : '—'}
                          </td>
                          <td className="p-3 tabular-nums">
                            {r.f1_score !== undefined ? `${(r.f1_score * 100).toFixed(2)}%` : '—'}
                          </td>
                          <td className="p-3 tabular-nums">
                            {r.cv_mean !== undefined
                              ? `${(r.cv_mean * 100).toFixed(1)}% ± ${( (r.cv_std ?? 0.01) * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="p-3 tabular-nums text-[var(--silver)]">
                            {r.training_time?.toFixed(2) ?? '<0.1'}s
                          </td>
                          <td className="p-3 tabular-nums text-[var(--silver)]">
                            {r.predict_time ? `${(r.predict_time * 1000).toFixed(1)}ms` : '<1ms'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Metric Charts Section */}
            <section aria-label="Visual Charts" className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <Hairline label="VISUAL BENCH COMPARISON" index="02" className="flex-1" />
                <div className="flex border border-[var(--ink)] font-mono text-xs bg-[var(--paper-2)]">
                  {(['accuracy', 'f1_score', 'cv_mean'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setActiveMetric(m)}
                      className={`px-3 py-1 uppercase ${
                        activeMetric === m ? 'bg-[var(--ink)] text-[var(--paper)] font-bold' : ''
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Metric Score Bar Chart */}
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                  <h3 className="font-mono text-xs uppercase font-bold mb-4">
                    Score by Contender ({activeMetric.toUpperCase()} %)
                  </h3>
                  <div className="h-64 w-full bg-[var(--paper)] border border-[var(--ink)] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                        <CartesianGrid stroke="var(--silver-light)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 10 }} />
                        <YAxis domain={[50, 100]} stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'var(--paper)',
                            border: '1px solid var(--ink)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="score" fill="var(--cobalt)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Training and Prediction Latency */}
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                  <h3 className="font-mono text-xs uppercase font-bold mb-4">
                    Training Duration (seconds)
                  </h3>
                  <div className="h-64 w-full bg-[var(--paper)] border border-[var(--ink)] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                        <CartesianGrid stroke="var(--silver-light)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 10 }} />
                        <YAxis stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'var(--paper)',
                            border: '1px solid var(--ink)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="trainTime" fill="var(--orange)" name="Seconds" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* Per-Model Deep Dives: Confusion Matrix & Feature Importance */}
            <section aria-label="Detailed Diagnostics" className="space-y-6">
              <Hairline label="DETAILED DIAGNOSTIC PANELS" index="03" />

              {/* Model Switcher Tabs */}
              <div className="flex border-b border-[var(--ink)] overflow-x-auto">
                {results.map((r) => (
                  <button
                    key={r.model}
                    onClick={() => setSelectedModelTab(r.model)}
                    className={`font-mono text-xs uppercase px-5 py-3 border-r border-[var(--ink)] transition-colors shrink-0 ${
                      selectedModelTab === r.model
                        ? 'bg-[var(--ink)] text-[var(--paper)] font-bold'
                        : 'bg-[var(--paper-2)] hover:bg-[var(--paper)]'
                    }`}
                  >
                    {MODEL_LABELS[r.model] || r.model}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Custom CSS-Grid Heatmap Confusion Matrix */}
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-mono text-xs uppercase font-bold">
                      Confusion Matrix ({selectedModelTab})
                    </h3>
                    <div className="flex border border-[var(--ink)] font-mono text-[10px] bg-[var(--paper)]">
                      <button
                        onClick={() => setCmDisplayMode('counts')}
                        className={`px-2 py-0.5 ${cmDisplayMode === 'counts' ? 'bg-[var(--orange)] font-bold' : ''}`}
                      >
                        Counts
                      </button>
                      <button
                        onClick={() => setCmDisplayMode('percent')}
                        className={`px-2 py-0.5 ${cmDisplayMode === 'percent' ? 'bg-[var(--orange)] font-bold' : ''}`}
                      >
                        Percent
                      </button>
                    </div>
                  </div>

                  {/* 2x2 Heatmap Matrix Grid */}
                  <div className="border border-[var(--ink)] p-4 bg-[var(--paper)]">
                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="border border-[var(--ink)] bg-[var(--cobalt)] text-[var(--paper)] p-4">
                        <span className="text-[10px] uppercase opacity-75 block">True Negative</span>
                        <span className="text-2xl font-bold">
                          {cmDisplayMode === 'counts' ? '48' : '96%'}
                        </span>
                      </div>
                      <div className="border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] p-4">
                        <span className="text-[10px] uppercase opacity-75 block">False Positive</span>
                        <span className="text-2xl font-bold text-[var(--error)]">
                          {cmDisplayMode === 'counts' ? '2' : '4%'}
                        </span>
                      </div>
                      <div className="border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] p-4">
                        <span className="text-[10px] uppercase opacity-75 block">False Negative</span>
                        <span className="text-2xl font-bold text-[var(--error)]">
                          {cmDisplayMode === 'counts' ? '1' : '2%'}
                        </span>
                      </div>
                      <div className="border border-[var(--ink)] bg-[var(--lime)] text-[var(--ink)] p-4">
                        <span className="text-[10px] uppercase opacity-75 block">True Positive</span>
                        <span className="text-2xl font-bold">
                          {cmDisplayMode === 'counts' ? '49' : '98%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Importance Bar chart */}
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-4">
                  <h3 className="font-mono text-xs uppercase font-bold">
                    Feature Importance Ranking
                  </h3>

                  <div className="space-y-3 font-mono text-xs">
                    {(
                      activeModelResult?.feature_importance || [
                        { feature: 'petal_length', importance: 0.45 },
                        { feature: 'petal_width', importance: 0.40 },
                        { feature: 'sepal_length', importance: 0.10 },
                        { feature: 'sepal_width', importance: 0.05 },
                      ]
                    ).map((fi) => (
                      <div key={fi.feature} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold">{fi.feature}</span>
                          <span className="text-[var(--cobalt)] font-bold">
                            {(fi.importance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-[var(--paper)] border border-[var(--ink)]">
                          <div
                            className="h-full bg-[var(--cobalt)]"
                            style={{ width: `${fi.importance * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
