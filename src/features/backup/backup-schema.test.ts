import { parseBackup } from './backup-schema';

describe('backup schema', () => {
  it('accepts a versioned selective backup', () => {
    expect(parseBackup({ format: 'fitnessmate-backup', version: 1, exportedAt: '2026-07-20T00:00:00.000Z', sections: { programs: false, history: true }, exercises: [], programs: [], programExercises: [], programSets: [], workouts: [], workoutExercises: [], workoutSets: [] }).version).toBe(1);
  });
  it('rejects unknown formats', () => expect(() => parseBackup({ format: 'other' })).toThrow());
});
