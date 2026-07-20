import { parseBackup } from './backup-schema';

describe('backup schema', () => {
  it('accepts a versioned selective backup', () => {
    expect(parseBackup({ format: 'fitnessmate-backup', version: 1, exportedAt: '2026-07-20T00:00:00.000Z', sections: { programs: false, history: true }, exercises: [], programs: [], programExercises: [], programSets: [], workouts: [], workoutExercises: [], workoutSets: [] }).version).toBe(1);
  });
  it('rejects unknown formats', () => expect(() => parseBackup({ format: 'other' })).toThrow());
  it('rejects active drafts in an imported history', () => expect(() => parseBackup({ format: 'fitnessmate-backup', version: 1, exportedAt: 'now', sections: { programs: false, history: true }, exercises: [], programs: [], programExercises: [], programSets: [], workouts: [{ id: 'w', source_program_id: null, name: 'Draft', status: 'draft', started_at: 'now', completed_at: null, updated_at: 'now' }], workoutExercises: [], workoutSets: [] })).toThrow());
});
