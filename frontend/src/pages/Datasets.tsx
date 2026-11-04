import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDatasets, uploadDataset } from '../api/services/datasets';
import type { Dataset, ApiError } from '../api/types';
import { useWorkspace } from '../app/WorkspaceContext';
import { fmtBytes } from '../lib/math';
import Hairline from '../components/ui/Hairline';
import Button from '../components/ui/Button';
import ErrorBand from '../components/ui/ErrorBand';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Footer from '../components/layout/Footer';

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytes, setUploadBytes] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { setActiveDataset } = useWorkspace();

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDatasets();
      setDatasets(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError({
        kind: 'validation',
        message: 'Invalid file format. Please upload a comma-separated values (.csv) file.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploaded = await uploadDataset(file, (pct, bytes) => {
        setUploadProgress(pct);
        setUploadBytes(bytes);
      });
      setActiveDataset(uploaded.dataset_id, uploaded.filename);
      navigate(`/datasets/${uploaded.dataset_id}`);
    } catch (err) {
      setError(err as ApiError);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-[var(--paper)] text-[var(--ink)] min-h-screen">
      <div className="p-6 md:p-14 max-w-[1440px] mx-auto space-y-12">
        {/* Header */}
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] block mb-2">
            SPECIMEN VAULT · REPOSITORY
          </span>
          <h1 className="font-display font-extrabold uppercase text-4xl md:text-6xl tracking-tight text-[var(--ink)]">
            Datasets
          </h1>
          <p className="font-sans text-lg text-[var(--silver)] mt-2 max-w-xl">
            Upload CSV specimens to inspect distributions, check missingness barcodes, and select targets.
          </p>
        </div>

        {error && <ErrorBand error={error} onRetry={fetchDatasets} />}

        {/* Perforated Dropzone ("Feed it a CSV") */}
        <section aria-label="Dataset Uploader">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed p-12 md:p-20 text-center cursor-pointer transition-all shadow-hard relative ${
              isDragging
                ? 'border-[var(--orange)] bg-[var(--paper)] scale-[1.01]'
                : 'border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />

            {isUploading ? (
              <div className="max-w-md mx-auto space-y-4 font-mono">
                <span className="text-xs uppercase tracking-widest text-[var(--orange)] font-bold block animate-pulse">
                  TRANSMITTING SPECIMEN DATA...
                </span>
                <div className="w-full bg-[var(--paper)] border border-[var(--ink)] h-4 p-0.5">
                  <div
                    className="h-full bg-[var(--cobalt)] transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--silver)]">
                  <span>{uploadProgress}% PROCESSED</span>
                  <span>{fmtBytes(uploadBytes)}</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 mx-auto mb-4 border border-[var(--ink)] bg-[var(--paper)] flex items-center justify-center font-mono font-bold text-2xl text-[var(--orange)]">
                  CSV
                </div>
                <h2 className="font-display font-bold uppercase text-2xl md:text-3xl text-[var(--ink)]">
                  {isDragging ? 'Release to upload CSV' : 'Drag & drop CSV file or click to browse'}
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--silver)] mt-2">
                  Max file size: 25 MB · Client-side schema validation
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Existing Specimens Table */}
        <section aria-label="Available Specimens" className="space-y-6">
          <Hairline label="AVAILABLE SPECIMENS" index="01" />

          {loading ? (
            <div className="space-y-3">
              <Skeleton height="3rem" />
              <Skeleton height="3rem" />
              <Skeleton height="3rem" />
            </div>
          ) : datasets.length === 0 ? (
            <EmptyState
              title="NO SPECIMENS RECORDED"
              description="Drop a CSV file in the zone above to profile your first dataset."
            />
          ) : (
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] overflow-x-auto shadow-hard">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--ink)] text-[var(--paper)] uppercase">
                  <tr>
                    <th className="p-4">Specimen ID</th>
                    <th className="p-4">Filename</th>
                    <th className="p-4">Rows</th>
                    <th className="p-4">Columns</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink)]">
                  {datasets.map((ds) => (
                    <tr
                      key={ds.dataset_id}
                      className="hover:bg-[var(--paper)] transition-colors"
                    >
                      <td className="p-4 font-bold text-[var(--orange)]">
                        {ds.dataset_id}
                      </td>
                      <td className="p-4 font-sans font-medium text-sm">
                        {ds.filename}
                      </td>
                      <td className="p-4 tabular-nums">
                        {ds.rows.toLocaleString()}
                      </td>
                      <td className="p-4 tabular-nums">
                        {ds.columns}
                      </td>
                      <td className="p-4 uppercase">
                        <span className="px-2 py-0.5 bg-[var(--lime)] text-[var(--ink)] border border-[var(--ink)] font-bold text-[10px]">
                          {ds.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActiveDataset(ds.dataset_id, ds.filename);
                            navigate(`/datasets/${ds.dataset_id}`);
                          }}
                        >
                          Inspect Specimen →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
