import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatasetProfile } from '../api/services/datasets';
import type { DatasetProfile, ColumnProfile, ApiError } from '../api/types';
import { useWorkspace } from '../app/WorkspaceContext';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';
import Footer from '../components/layout/Footer';

export default function DatasetProfilePage() {
  const { id = 'ds_iris' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveDataset } = useWorkspace();

  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDatasetProfile(id);
      setProfile(data);
      setActiveDataset(data.dataset_id, data.filename);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header Strip */}
        <div className="flex flex-wrap justify-between items-start gap-6 border-b border-[var(--ink)] pb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
              SPECIMEN PROFILE SHEET · {id}
            </span>
            <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
              {profile ? profile.filename : 'Profiling Specimen...'}
            </h1>
          </div>

          <div className="flex gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/datasets/${id}/configure`)}
            >
              Configure Target & Task →
            </Button>
          </div>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchProfile} />}

        {loading ? (
          <div className="space-y-6">
            <Skeleton height="8rem" />
            <Skeleton height="14rem" />
            <Skeleton height="12rem" />
          </div>
        ) : profile ? (
          <>
            {/* Giant Mono Numerals: Rows and Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                <span className="text-[10px] uppercase text-[var(--silver)] block">TOTAL ROWS</span>
                <div className="text-4xl md:text-5xl font-bold tabular-nums text-[var(--cobalt)] mt-1">
                  {profile.row_count.toLocaleString()}
                </div>
              </div>
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                <span className="text-[10px] uppercase text-[var(--silver)] block">TOTAL COLUMNS</span>
                <div className="text-4xl md:text-5xl font-bold tabular-nums text-[var(--ink)] mt-1">
                  {profile.column_count}
                </div>
              </div>
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                <span className="text-[10px] uppercase text-[var(--silver)] block">TARGET CANDIDATES</span>
                <div className="text-lg font-bold text-[var(--orange)] mt-2 truncate">
                  {profile.target_candidates && profile.target_candidates.length > 0
                    ? profile.target_candidates.join(', ')
                    : 'Unassigned'}
                </div>
              </div>
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 shadow-hard">
                <span className="text-[10px] uppercase text-[var(--silver)] block">DUPLICATE ROWS</span>
                <div className="text-4xl md:text-5xl font-bold tabular-nums text-[var(--lime)] mt-1">
                  {profile.duplicate_rows ?? 0}
                </div>
              </div>
            </div>

            {/* Duplicate Rows Banner if any */}
            {(profile.duplicate_rows ?? 0) > 0 && (
              <div className="border-2 border-[var(--ink)] bg-[var(--lime)] p-4 font-mono text-xs text-[var(--ink)] flex items-center justify-between shadow-hard">
                <span className="font-bold">
                  NOTICE: {profile.duplicate_rows} duplicate observations detected in specimen.
                </span>
                <span className="uppercase text-[10px]">
                  Consider deduplication if rows represent identical trials.
                </span>
              </div>
            )}

            {/* Column Ribbon: Horizontal scrollable strips */}
            <section aria-label="Column Ribbon" className="space-y-4">
              <Hairline label="COLUMN RIBBON SPECIMENS" index="01" />
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {profile.columns.map((col) => {
                    const isHighMissing = (col.missing_pct ?? 0) > 15;
                    return (
                      <div
                        key={col.name}
                        className="w-56 border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 flex flex-col justify-between shadow-hard shrink-0"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[var(--paper)] border border-[var(--ink)] font-bold">
                              {col.type}
                            </span>
                            {col.unique_count !== undefined && (
                              <span className="font-mono text-[9px] text-[var(--silver)]">
                                {col.unique_count} unique
                              </span>
                            )}
                          </div>
                          <h3 className="font-mono text-sm font-bold truncate text-[var(--ink)]" title={col.name}>
                            {col.name}
                          </h3>

                          {/* Mini Distribution / Histogram */}
                          <div className="my-3 h-14 bg-[var(--paper)] border border-[var(--ink)] p-1 flex items-end gap-1">
                            {col.histogram && col.histogram.length > 0 ? (
                              col.histogram.map((bin, bIdx) => {
                                const maxCount = Math.max(...col.histogram!.map((h) => h.count)) || 1;
                                const heightPct = Math.max(10, (bin.count / maxCount) * 100);
                                return (
                                  <div
                                    key={bIdx}
                                    title={`Bin ${bin.bin}: ${bin.count}`}
                                    className="flex-1 bg-[var(--cobalt)] border-t border-[var(--ink)]"
                                    style={{ height: `${heightPct}%` }}
                                  />
                                );
                              })
                            ) : col.top_values && col.top_values.length > 0 ? (
                              <div className="w-full flex flex-col justify-around h-full font-mono text-[8px] leading-none">
                                {col.top_values.slice(0, 3).map((tv) => (
                                  <div key={tv.value} className="flex justify-between">
                                    <span className="truncate max-w-[80px]">{tv.value}</span>
                                    <span className="font-bold text-[var(--orange)]">{tv.count}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="font-mono text-[9px] text-[var(--silver)] m-auto">
                                No distribution
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Missing Meter */}
                        <div className="font-mono text-[10px] border-t border-[var(--ink)] pt-2 mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-[var(--silver)]">MISSING</span>
                            <span className={isHighMissing ? 'text-[var(--error)] font-bold' : ''}>
                              {col.missing_values} ({col.missing_pct?.toFixed(1) ?? 0}%)
                            </span>
                          </div>
                          <div className="w-full bg-[var(--paper)] h-1.5 border border-[var(--ink)]">
                            <div
                              className={`h-full ${isHighMissing ? 'bg-[var(--error)]' : 'bg-[var(--lime)]'}`}
                              style={{ width: `${Math.min(100, col.missing_pct ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Backend Warnings and Flags Panel */}
            {profile.flags && profile.flags.length > 0 && (
              <section aria-label="Specimen Flags" className="space-y-4">
                <Hairline label="ANOMALY AND DATA INTEGRITY FLAGS" index="02" />
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 shadow-hard space-y-2">
                  {profile.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 font-mono text-xs p-2 border border-[var(--ink)] bg-[var(--paper)]"
                    >
                      <Chip
                        label={flag.severity === 'blocking' ? 'BLOCKING' : 'SUSPECT'}
                        color={flag.severity === 'blocking' ? 'error' : 'orange'}
                        size="sm"
                      />
                      <span className="font-bold text-[var(--ink)]">{flag.column}:</span>
                      <span className="text-[var(--silver)]">{flag.message}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Descriptive Statistics Table */}
            <section aria-label="Descriptive Statistics" className="space-y-4">
              <Hairline label="NUMERIC DESCRIPTIVE STATISTICS" index="03" />
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] overflow-x-auto shadow-hard">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[var(--ink)] text-[var(--paper)] uppercase">
                    <tr>
                      <th className="p-3 sticky left-0 bg-[var(--ink)] z-10">Feature</th>
                      <th className="p-3">Mean</th>
                      <th className="p-3">Std</th>
                      <th className="p-3">Min</th>
                      <th className="p-3">Q25</th>
                      <th className="p-3">Median</th>
                      <th className="p-3">Q75</th>
                      <th className="p-3">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ink)]">
                    {profile.columns
                      .filter((c) => c.type === 'numerical')
                      .map((col) => (
                        <tr key={col.name} className="hover:bg-[var(--paper)] transition-colors">
                          <td className="p-3 font-bold sticky left-0 bg-[var(--paper-2)] z-10 border-r border-[var(--ink)]">
                            {col.name}
                          </td>
                          <td className="p-3 tabular-nums">{col.mean?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.std?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.min?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.q25?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.median?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.q75?.toFixed(2) ?? '—'}</td>
                          <td className="p-3 tabular-nums">{col.max?.toFixed(2) ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Specimen Preview Table */}
            {profile.preview && profile.preview.length > 0 && (
              <section aria-label="Specimen Preview" className="space-y-4">
                <Hairline label="RAW SPECIMEN SAMPLES (FIRST 10 ROWS)" index="04" />
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] overflow-x-auto shadow-hard">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--paper)] border-b border-[var(--ink)] uppercase">
                      <tr>
                        {Object.keys(profile.preview[0]).map((key) => (
                          <th key={key} className="p-3 border-r border-[var(--ink)] font-bold">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ink)]">
                      {profile.preview.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[var(--paper)] transition-colors">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-[var(--ink)] tabular-nums">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Bottom action button */}
            <div className="pt-8 border-t border-[var(--ink)] flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/datasets/${id}/configure`)}
              >
                Proceed to Target & Task Configuration →
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
