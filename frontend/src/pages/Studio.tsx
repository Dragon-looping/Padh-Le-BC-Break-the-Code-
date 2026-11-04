import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { tuneExperiment } from '../api/services/experiments';
import type { TrialResult, ApiError } from '../api/types';
import { DECISION_TREE_PARAMS } from '../config/hyperparams';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Slider from '../components/ui/Slider';
import Stepper from '../components/ui/Stepper';
import SegmentedControl from '../components/ui/SegmentedControl';
import ErrorBand from '../components/ui/ErrorBand';
import Footer from '../components/layout/Footer';

export default function Studio() {
  const { experimentId = 'exp_001' } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  // Hyperparameters control state
  const [params, setParams] = useState<Record<string, unknown>>({
    max_depth: 3,
    min_samples_split: 2,
    min_samples_leaf: 1,
    criterion: 'gini',
  });

  const [isRunningTrial, setIsRunningTrial] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Initial trials history
  const [trials, setTrials] = useState<TrialResult[]>([
    {
      trial_id: 'trial_01',
      model: 'decision_tree',
      parameters: { max_depth: 1, min_samples_split: 2, min_samples_leaf: 1, criterion: 'gini' },
      train_score: 0.75,
      val_score: 0.72,
      test_score: 0.70,
      complexity: { depth: 1, leaves: 2, nodes: 3 },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      trial_id: 'trial_02',
      model: 'decision_tree',
      parameters: { max_depth: 3, min_samples_split: 2, min_samples_leaf: 1, criterion: 'gini' },
      train_score: 0.94,
      val_score: 0.91,
      test_score: 0.90,
      complexity: { depth: 3, leaves: 8, nodes: 15 },
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const [selectedTrialsForDiff, setSelectedTrialsForDiff] = useState<string[]>([]);

  const handleParamChange = (key: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunTrial = async () => {
    setIsRunningTrial(true);
    setError(null);

    try {
      const resp = await tuneExperiment(experimentId, {
        model: 'decision_tree',
        parameters: params,
      });

      if (resp.trial) {
        setTrials((prev) => [...prev, resp.trial]);
      } else if (resp.trials) {
        setTrials(resp.trials);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsRunningTrial(false);
    }
  };

  const chartData = trials.map((t, idx) => ({
    name: `T${idx + 1}`,
    trialId: t.trial_id,
    train: Number(((t.train_score ?? 0) * 100).toFixed(1)),
    val: Number(((t.val_score ?? 0) * 100).toFixed(1)),
    test: Number(((t.test_score ?? 0) * 100).toFixed(1)),
    gap: Number((Math.max(0, (t.train_score ?? 0) - (t.val_score ?? 0)) * 100).toFixed(1)),
  }));

  const latestTrial = trials[trials.length - 1];

  const handleToggleDiff = (trialId: string) => {
    setSelectedTrialsForDiff((prev) =>
      prev.includes(trialId)
        ? prev.filter((id) => id !== trialId)
        : prev.length < 2
        ? [...prev, trialId]
        : [prev[1], trialId]
    );
  };

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header Strip */}
        <div className="border-b border-[var(--ink)] pb-8 flex flex-wrap justify-between items-end gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
              HYPERPARAMETER LABORATORY · CONTROL SURFACE
            </span>
            <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
              Experiment Studio
            </h1>
            <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-2xl">
              Precision tuning instrument. Adjust constraints, observe tree capacity scaling, and identify the exact boundary between underfitting and variance divergence.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/results/${experimentId}`)}
            >
              Inspect Dashboard Readout →
            </Button>
          </div>
        </div>

        {error && <ErrorBand error={error} onRetry={handleRunTrial} />}

        {/* Studio Dock: Left Controls, Right Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Instrument Dock */}
          <div className="lg:col-span-5 border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--ink)] pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--silver)] block">
                  ACTIVE SPECIMEN MODEL
                </span>
                <h3 className="font-display font-bold uppercase text-2xl text-[var(--ink)]">
                  Decision Tree
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase px-2 py-1 bg-[var(--lime)] text-[var(--ink)] border border-[var(--ink)] font-bold">
                SCHEMA DRIVEN
              </span>
            </div>

            {/* Parameter Sliders & Steppers */}
            <div className="space-y-6">
              {DECISION_TREE_PARAMS.map((p) => (
                <div key={p.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold uppercase">{p.label}</span>
                    {p.lessonSlug && (
                      <Link
                        to={`/lab/${p.lessonSlug}`}
                        className="font-mono text-[10px] text-[var(--cobalt)] uppercase underline"
                      >
                        Why? →
                      </Link>
                    )}
                  </div>

                  {p.type === 'slider' && (
                    <Slider
                      label=""
                      min={p.min ?? 1}
                      max={p.max ?? 20}
                      step={p.step ?? 1}
                      value={params[p.key] as number | null}
                      onChange={(v) => handleParamChange(p.key, v)}
                      unlimitedOption={p.unlimitedOption}
                    />
                  )}

                  {p.type === 'stepper' && (
                    <Stepper
                      label=""
                      min={p.min ?? 1}
                      max={p.max ?? 50}
                      step={p.step ?? 1}
                      value={(params[p.key] as number) ?? 1}
                      onChange={(v) => handleParamChange(p.key, v)}
                    />
                  )}

                  {p.type === 'segmented' && p.options && (
                    <SegmentedControl
                      options={p.options as { value: string; label: string }[]}
                      value={(params[p.key] as string) ?? 'gini'}
                      onChange={(v) => handleParamChange(p.key, v)}
                    />
                  )}

                  <p className="font-sans text-[11px] text-[var(--silver)] leading-tight">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--ink)]">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isRunningTrial}
                onClick={handleRunTrial}
              >
                {isRunningTrial ? 'Simulating Execution...' : 'Execute Trial Run →'}
              </Button>
            </div>
          </div>

          {/* Right Scoreboard & Complexity Readout */}
          <div className="lg:col-span-7 space-y-6">
            {/* Complexity Indicator Panel */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
              <Hairline label="TREE COMPLEXITY METRICS (CURRENT TRIAL)" className="mb-4" />
              <div className="grid grid-cols-3 gap-4 font-mono text-center">
                <div className="border border-[var(--ink)] p-3 bg-[var(--paper)]">
                  <span className="text-[10px] text-[var(--silver)] uppercase block">MAX DEPTH</span>
                  <div className="text-3xl font-bold text-[var(--cobalt)] mt-1">
                    {latestTrial?.complexity?.depth ?? String(params.max_depth ?? '∞')}
                  </div>
                </div>
                <div className="border border-[var(--ink)] p-3 bg-[var(--paper)]">
                  <span className="text-[10px] text-[var(--silver)] uppercase block">TOTAL LEAVES</span>
                  <div className="text-3xl font-bold text-[var(--ink)] mt-1">
                    {latestTrial?.complexity?.leaves ?? 8}
                  </div>
                </div>
                <div className="border border-[var(--ink)] p-3 bg-[var(--paper)]">
                  <span className="text-[10px] text-[var(--silver)] uppercase block">TOTAL NODES</span>
                  <div className="text-3xl font-bold text-[var(--orange)] mt-1">
                    {latestTrial?.complexity?.nodes ?? 15}
                  </div>
                </div>
              </div>
            </div>

            {/* Scoreboard Line Chart */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)]">
                  SCOREBOARD: TRIALS PROGRESSION (TRAIN VS VAL VS TEST)
                </span>
                <span className="font-mono text-[10px] text-[var(--orange)] font-bold">
                  ORANGE SHADING = OVERFIT SPREAD
                </span>
              </div>

              <div className="h-64 w-full bg-[var(--paper)] border border-[var(--ink)] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="var(--silver-light)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 11 }} />
                    <YAxis domain={[50, 100]} stroke="var(--ink)" tick={{ fontFamily: 'monospace', fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--paper)',
                        border: '1px solid var(--ink)',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}
                    />
                    <Area type="monotone" dataKey="train" fill="rgba(255, 91, 31, 0.15)" stroke="none" />
                    <Line type="monotone" dataKey="train" stroke="var(--cobalt)" strokeWidth={2} name="Train Score" />
                    <Line type="monotone" dataKey="val" stroke="var(--orange)" strokeWidth={2} name="Validation Score" />
                    <Line type="monotone" dataKey="test" stroke="var(--ink)" strokeWidth={2} strokeDasharray="3 3" name="Test Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Trial History Table & Comparison Diff */}
        <section aria-label="Trial History" className="space-y-4">
          <div className="flex justify-between items-center">
            <Hairline label="TRIAL HISTORY & PARAMETER DIFF" className="flex-1" />
            <span className="font-mono text-[10px] text-[var(--silver)] uppercase ml-4">
              Select 2 trials to diff
            </span>
          </div>

          <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] overflow-x-auto shadow-hard">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[var(--ink)] text-[var(--paper)] uppercase">
                <tr>
                  <th className="p-3 w-10 text-center">Diff</th>
                  <th className="p-3">Trial</th>
                  <th className="p-3">Parameters</th>
                  <th className="p-3">Train Score</th>
                  <th className="p-3">Val Score</th>
                  <th className="p-3">Test Score</th>
                  <th className="p-3">Overfit Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink)]">
                {trials.map((t) => {
                  const isChecked = selectedTrialsForDiff.includes(t.trial_id);
                  const train = (t.train_score ?? 0) * 100;
                  const val = (t.val_score ?? 0) * 100;
                  const gap = Math.max(0, train - val);

                  return (
                    <tr
                      key={t.trial_id}
                      className={`hover:bg-[var(--paper)] transition-colors ${
                        isChecked ? 'bg-[var(--paper)] font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDiff(t.trial_id)}
                          className="accent-[var(--orange)] cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-[var(--orange)] font-bold">{t.trial_id}</td>
                      <td className="p-3 truncate max-w-xs text-[var(--silver)]">
                        {JSON.stringify(t.parameters)}
                      </td>
                      <td className="p-3 tabular-nums">{train.toFixed(1)}%</td>
                      <td className="p-3 tabular-nums text-[var(--cobalt)] font-bold">{val.toFixed(1)}%</td>
                      <td className="p-3 tabular-nums">{((t.test_score ?? 0) * 100).toFixed(1)}%</td>
                      <td className="p-3 tabular-nums">
                        <span className={gap > 8 ? 'text-[var(--error)] font-bold' : ''}>
                          {gap.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Two Trials Diff View */}
          {selectedTrialsForDiff.length === 2 && (
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[var(--orange)] block mb-3">
                COMPARATIVE DIFF: {selectedTrialsForDiff[0]} VS {selectedTrialsForDiff[1]}
              </span>
              <div className="grid grid-cols-2 gap-4">
                {selectedTrialsForDiff.map((tId) => {
                  const tObj = trials.find((x) => x.trial_id === tId);
                  return (
                    <div key={tId} className="border border-[var(--ink)] bg-[var(--paper)] p-4 space-y-2">
                      <div className="font-bold text-sm text-[var(--cobalt)]">{tId}</div>
                      <div>Val Score: {((tObj?.val_score ?? 0) * 100).toFixed(2)}%</div>
                      <div>Train Score: {((tObj?.train_score ?? 0) * 100).toFixed(2)}%</div>
                      <div className="text-[10px] text-[var(--silver)]">
                        Parameters: {JSON.stringify(tObj?.parameters, null, 2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
