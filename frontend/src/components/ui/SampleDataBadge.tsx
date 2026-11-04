// SampleDataBadge — persistent corner badge when VITE_USE_MOCKS=true
export default function SampleDataBadge() {
  return (
    <div
      className="fixed bottom-4 right-4 z-[500] font-mono text-[10px] uppercase tracking-widest px-2 py-1 border"
      style={{
        backgroundColor: 'var(--orange)',
        borderColor: 'var(--ink)',
        color: 'var(--ink)',
      }}
      aria-label="Sample data mode active — not real results"
      title="Sample data is active. Set VITE_USE_MOCKS=false to use the real API."
    >
      SAMPLE DATA
    </div>
  );
}
