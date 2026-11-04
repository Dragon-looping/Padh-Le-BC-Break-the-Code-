import React, { createContext, useContext, useState, useCallback } from 'react';

interface WorkspaceState {
  activeDatasetId: string | null;
  activeExperimentId: string | null;
  datasetName: string | null;
  targetColumn: string | null;
  taskType: 'classification' | 'regression' | null;
  excludedColumns: string[];
}

interface WorkspaceContextValue extends WorkspaceState {
  setActiveDataset: (id: string, name?: string) => void;
  setActiveExperiment: (id: string) => void;
  setConfiguration: (config: {
    targetColumn: string;
    taskType: 'classification' | 'regression';
    excludedColumns?: string[];
  }) => void;
  clearWorkspace: () => void;
}

const STORAGE_KEY = 'padh-le-bc:workspace';

function readStorage(): Partial<WorkspaceState> {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

function writeStorage(state: WorkspaceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const defaultState: WorkspaceState = {
  activeDatasetId: null,
  activeExperimentId: null,
  datasetName: null,
  targetColumn: null,
  taskType: null,
  excludedColumns: [],
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => ({
    ...defaultState,
    ...readStorage(),
  }));

  const update = useCallback((patch: Partial<WorkspaceState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(next);
      return next;
    });
  }, []);

  const setActiveDataset = useCallback((id: string, name?: string) => {
    update({ activeDatasetId: id, datasetName: name ?? null });
  }, [update]);

  const setActiveExperiment = useCallback((id: string) => {
    update({ activeExperimentId: id });
  }, [update]);

  const setConfiguration = useCallback(
    (config: {
      targetColumn: string;
      taskType: 'classification' | 'regression';
      excludedColumns?: string[];
    }) => {
      update({
        targetColumn: config.targetColumn,
        taskType: config.taskType,
        excludedColumns: config.excludedColumns ?? [],
      });
    },
    [update]
  );

  const clearWorkspace = useCallback(() => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        setActiveDataset,
        setActiveExperiment,
        setConfiguration,
        clearWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
