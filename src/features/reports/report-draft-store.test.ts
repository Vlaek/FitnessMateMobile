import { createReportDraftStore } from './report-draft-store';

describe('createReportDraftStore', () => {
  it('keeps the first occurrence of selected workout ids', () => {
    const store = createReportDraftStore();

    store.getState().setWorkoutIds(['w2', 'w1', 'w2']);

    expect(store.getState().workoutIds).toEqual(['w2', 'w1']);
  });

  it('clears the transient selection', () => {
    const store = createReportDraftStore();
    store.getState().setWorkoutIds(['w1']);

    store.getState().clear();

    expect(store.getState().workoutIds).toEqual([]);
  });
});
