interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="flex border-b"
      style={{ borderColor: 'var(--ink)' }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className="relative font-mono text-xs uppercase tracking-wider px-4 py-3 transition-colors"
            style={{ color: active ? 'var(--ink)' : 'var(--silver)' }}
          >
            {tab.label}
            {/* Orange underline indicator */}
            {active && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: 'var(--orange)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
    >
      {children}
    </div>
  );
}
