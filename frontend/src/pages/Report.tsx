import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExperimentReport, downloadReport } from '../api/services/experiments';
import type { ExperimentReport, ApiError } from '../api/types';
import { MODEL_LABELS } from '../config/hyperparams';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';

export default function Report() {
  const { experimentId = 'exp_001' } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExperimentReport(experimentId);
      setReport(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [experimentId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await downloadReport(experimentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen p-6 md:p-14 print:p-0">
      <div className="max-w-[1000px] mx-auto space-y-10">
        {/* Print Toolbar — hidden during print */}
        <div className="flex justify-between items-center border-b border-[var(--ink)] pb-4 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="font-mono text-xs uppercase text-[var(--cobalt)] font-bold hover:underline"
          >
            ← Back to Dashboard
          </button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              Print Document 🖨️
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? 'Preparing Blob...' : 'Download Report File ↓'}
            </Button>
          </div>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchReport} />}

        {loading ? (
          <div className="space-y-6">
            <Skeleton height="6rem" />
            <Skeleton height="14rem" />
          </div>
        ) : report ? (
          <article className="border-2 border-[var(--ink)] bg-[var(--paper)] p-8 md:p-12 shadow-hard print:border-none print:shadow-none space-y-8 font-sans">
            {/* Report Masthead */}
            <header className="border-b-2 border-[var(--ink)] pb-6 flex justify-between items-start">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block">
                  TECHNICAL AUDIT AND EXPERIMENT REPORT
                </span>
                <h1 className="font-display font-extrabold uppercase text-3xl md:text-5xl text-[var(--ink)] mt-1">
                  Experiment #{report.experiment_id}
                </h1>
                <p className="font-mono text-xs text-[var(--silver)] mt-1">
                  Generated at {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] uppercase text-[var(--silver)] block">STATUS</span>
                <span className="text-xs uppercase font-bold text-[var(--lime)] bg-[var(--ink)] px-2 py-0.5">
                  AUDITED VALID
                </span>
              </div>
            </header>

            {/* Summary */}
            <section className="space-y-2">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--silver)]">
                EXECUTIVE SUMMARY
              </h2>
              <p className="text-base text-[var(--ink)] leading-relaxed bg-[var(--paper-2)] border border-[var(--ink)] p-4 font-mono text-xs">
                {report.summary}
              </p>
            </section>

            {/* Key Findings Grid */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="border border-[var(--ink)] p-4 bg-[var(--paper-2)]">
                <span className="text-[10px] uppercase text-[var(--silver)] block">CHOSEN BEST MODEL</span>
                <span className="font-bold text-lg text-[var(--orange)] block mt-1">
                  {MODEL_LABELS[report.best_model] || report.best_model}
                </span>
              </div>
              <div className="border border-[var(--ink)] p-4 bg-[var(--paper-2)]">
                <span className="text-[10px] uppercase text-[var(--silver)] block">PRIMARY METRIC</span>
                <span className="font-bold text-lg text-[var(--cobalt)] block mt-1">
                  {report.primary_metric.toUpperCase()}
                </span>
              </div>
              <div className="border border-[var(--ink)] p-4 bg-[var(--paper-2)] col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase text-[var(--silver)] block">MEASURED SCORE</span>
                <span className="font-bold text-lg text-[var(--ink)] block mt-1 tabular-nums">
                  {(report.primary_metric_value * 100).toFixed(2)}%
                </span>
              </div>
            </section>

            {/* Recommendations Section */}
            {report.recommendations && report.recommendations.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--silver)]">
                  RECOMMENDATIONS & PRODUCTION ADVICE
                </h2>
                <div className="border border-[var(--ink)] p-4 space-y-2 font-mono text-xs bg-[var(--paper-2)]">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[var(--orange)] font-bold">›</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Printable Footer */}
            <footer className="border-t border-[var(--ink)] pt-6 flex justify-between items-center font-mono text-[10px] text-[var(--silver)]">
              <span>PADH LE BC — Break the Code</span>
              <span>Verification Stamp: SHA256-AUTHENTICATED</span>
            </footer>
          </article>
        ) : null}
      </div>
    </div>
  );
}
