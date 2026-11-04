import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatasetProfile, configureDataset } from '../api/services/datasets';
import type { DatasetProfile, ApiError } from '../api/types';
import { useWorkspace } from '../app/WorkspaceContext';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

export default function DatasetConfigure() {
  const { id = 'ds_iris' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setConfiguration, targetColumn: existingTarget, taskType: existingTask } = useWorkspace();

  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // NO target preselected by default! User must make explicit choice.
  const [selectedTarget, setSelectedTarget] = useState<string | null>(existingTarget || null);
  const [taskType, setTaskType] = useState<'classification' | 'regression' | null>(existingTask || null);
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDatasetProfile(id);
      setProfile(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const toggleExclude = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (colName === selectedTarget) return; // Cannot exclude chosen target

    setExcludedColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const handleExcludeFlagged = () => {
    if (!profile?.flags) return;
    const flagged = profile.flags
      .map((f) => f.column)
      .filter((c) => c !== selectedTarget);
    setExcludedColumns((prev) => Array.from(new Set([...prev, ...flagged])));
  };

  const handleSelectColumn = (colName: string) => {
    if (excludedColumns.includes(colName)) return;

    setSelectedTarget(colName);

    // Provide intelligent hint without forced preselection
    if (!taskType && profile) {
      const col = profile.columns.find((c) => c.name === colName);
      if (col?.type === 'categorical') {
        setTaskType('classification');
      } else if (col?.type === 'numerical' && (col.unique_count ?? 10) > 10) {
        setTaskType('regression');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedTarget || !taskType) return;

    setSubmitting(true);
    setError(null);

    try {
      await configureDataset(id, {
        target_column: selectedTarget,
        task_type: taskType,
        excluded_columns: excludedColumns,
      });

      setConfiguration({
        targetColumn: selectedTarget,
        taskType: taskType,
        excludedColumns: excludedColumns,
      });

      navigate(`/arena/${id}`);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = Boolean(selectedTarget && taskType);
  const disabledReason = !selectedTarget
    ? 'Choose a target variable by clicking any column strip below.'
    : !taskType
    ? 'Specify whether this prediction problem is Classification or Regression.'
    : null;

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-[var(--ink)] pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
            CONFIGURATION SURFACE · {id}
          </span>
          <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
            Target & Task Setup
          </h1>
          <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-2xl">
            Select the prediction target column. Exclude non-informative IDs or data leakage suspects before entering the Model Arena.
          </p>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchProfile} />}

        {loading ? (
          <div className="space-y-6">
            <Skeleton height="6rem" />
            <Skeleton height="14rem" />
          </div>
        ) : profile ? (
          <>
            {/* Flags reminder & quick exclude button */}
            {profile.flags && profile.flags.length > 0 && (
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 flex flex-wrap justify-between items-center gap-4 shadow-hard">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--orange)]" />
                  <span className="font-bold">
                    {profile.flags.length} suspect feature(s) flagged by the analyser:
                  </span>
                  <span className="text-[var(--silver)]">
                    {profile.flags.map((f) => f.column).join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExcludeFlagged}
                  className="font-mono text-xs uppercase px-3 py-1.5 border border-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--silver-light)]"
                >
                  Exclude Flagged Columns
                </button>
              </div>
            )}

            {/* Task Type Switcher */}
            <section aria-label="Task Type Selector" className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
              <Hairline label="STEP 1 · TASK FORMULATION" className="mb-4" />
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-xs uppercase font-bold text-[var(--silver)]">
                  PROBLEM TYPE:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskType('classification')}
                    className={`font-mono text-xs uppercase px-5 py-2.5 border border-[var(--ink)] transition-all ${
                      taskType === 'classification'
                        ? 'bg-[var(--cobalt)] text-[var(--paper)] shadow-hard font-bold'
                        : 'bg-[var(--paper)] hover:bg-[var(--silver-light)]'
                    }`}
                  >
                    Classification (Discrete Categories)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('regression')}
                    className={`font-mono text-xs uppercase px-5 py-2.5 border border-[var(--ink)] transition-all ${
                      taskType === 'regression'
                        ? 'bg-[var(--cobalt)] text-[var(--paper)] shadow-hard font-bold'
                        : 'bg-[var(--paper)] hover:bg-[var(--silver-light)]'
                    }`}
                  >
                    Regression (Continuous Numerics)
                  </button>
                </div>
              </div>
            </section>

            {/* Column Strips Selection Area */}
            <section aria-label="Select Target Column" className="space-y-4">
              <div className="flex justify-between items-end">
                <Hairline label="STEP 2 · CLICK TO SELECT TARGET COLUMN" className="flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {profile.columns.map((col) => {
                  const isTarget = selectedTarget === col.name;
                  const isExcluded = excludedColumns.includes(col.name);

                  return (
                    <div
                      key={col.name}
                      onClick={() => handleSelectColumn(col.name)}
                      className={`border-2 border-[var(--ink)] p-4 flex flex-col justify-between transition-all cursor-pointer relative ${
                        isTarget
                          ? 'bg-[var(--cobalt)] text-[var(--paper)] -translate-y-1 shadow-[4px_4px_0_var(--ink)]'
                          : isExcluded
                          ? 'bg-[var(--silver-light)] opacity-50 cursor-not-allowed'
                          : 'bg-[var(--paper-2)] hover:bg-[var(--paper)] hover:shadow-hard'
                      }`}
                      style={
                        isExcluded
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(10,16,51,0.08) 10px, rgba(10,16,51,0.08) 20px)',
                            }
                          : undefined
                      }
                    >
                      {/* Top strip */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${
                              isTarget
                                ? 'bg-[var(--paper)] text-[var(--ink)] border-[var(--paper)] font-bold'
                                : 'bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)]'
                            }`}
                          >
                            {col.type}
                          </span>
                          {isTarget && (
                            <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[var(--lime)] text-[var(--ink)] border border-[var(--ink)] font-bold">
                              TARGET
                            </span>
                          )}
                        </div>

                        {/* Exclude Button */}
                        {!isTarget && (
                          <button
                            type="button"
                            onClick={(e) => toggleExclude(col.name, e)}
                            className={`font-mono text-[9px] uppercase px-2 py-0.5 border border-[var(--ink)] transition-colors ${
                              isExcluded
                                ? 'bg-[var(--error)] text-[var(--paper)] font-bold'
                                : 'bg-[var(--paper)] hover:bg-[var(--silver-light)]'
                            }`}
                          >
                            {isExcluded ? 'Excluded' : 'Exclude'}
                          </button>
                        )}
                      </div>

                      {/* Name and unique count */}
                      <div>
                        <h3 className="font-mono text-base font-bold truncate" title={col.name}>
                          {col.name}
                        </h3>
                        <p
                          className={`font-mono text-[10px] mt-1 ${
                            isTarget ? 'text-[var(--paper-2)]' : 'text-[var(--silver)]'
                          }`}
                        >
                          {col.unique_count !== undefined
                            ? `${col.unique_count} distinct values`
                            : 'Continuous range'}
                        </p>
                      </div>

                      {/* Bottom status line */}
                      <div className="mt-4 pt-2 border-t border-current flex justify-between items-center font-mono text-[10px]">
                        <span>Missing: {col.missing_values}</span>
                        {isTarget ? (
                          <span className="font-bold underline uppercase">Chosen Target</span>
                        ) : isExcluded ? (
                          <span className="text-[var(--error)] font-bold uppercase">Excluded</span>
                        ) : (
                          <span className="opacity-60 uppercase">Click to target</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bottom Form Submission Strip */}
            <div className="border-t-2 border-[var(--ink)] pt-8 flex flex-wrap items-center justify-between gap-6">
              <div>
                {!isFormValid && (
                  <p className="font-mono text-xs text-[var(--orange)] font-bold">
                    [ACTION REQUIRED]: {disabledReason}
                  </p>
                )}
                {isFormValid && (
                  <p className="font-mono text-xs text-[var(--cobalt)] font-bold">
                    READY TO COMPETE: Target '{selectedTarget}' · Task: {taskType?.toUpperCase()} · {profile.columns.length - excludedColumns.length} active features
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={!isFormValid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Entering Tournament...' : 'Launch Starting Grid (Arena) →'}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
