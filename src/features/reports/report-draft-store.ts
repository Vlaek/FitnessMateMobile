import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';

export interface IReportDraftState {
  workoutIds: string[];
  setWorkoutIds: (ids: string[]) => void;
  clear: () => void;
}

export function createReportDraftStore(): StoreApi<IReportDraftState> {
  return createStore<IReportDraftState>((set) => ({
    workoutIds: [],
    setWorkoutIds: (workoutIds) => set({ workoutIds: [...new Set(workoutIds)] }),
    clear: () => set({ workoutIds: [] }),
  }));
}

export const reportDraftStore = createReportDraftStore();

export function useReportDraftStore<T>(selector: (state: IReportDraftState) => T): T {
  return useStore(reportDraftStore, selector);
}
