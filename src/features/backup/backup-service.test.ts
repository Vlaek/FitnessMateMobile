import { FakeDatabase } from '@/test/fake-database';
import { buildBackup, clearAllData, restoreBackup } from './backup-service';

describe('backup service', () => {
  it('detaches history-only backups from programs', async () => {
    const db = new FakeDatabase();
    db.queueAll([]);
    db.queueAll([
      {
        id: 'w',
        source_program_id: 'program',
        name: 'TWorkout',
        status: 'completed' as const,
        started_at: 'start',
        completed_at: 'done',
        updated_at: 'done',
      },
    ]);
    db.queueAll([]);
    db.queueAll([]);
    const backup = await buildBackup({ programs: false, history: true }, db);
    expect(backup.workouts[0]?.source_program_id).toBeNull();
  });

  it('clears selected data before a replace import', async () => {
    const db = new FakeDatabase();
    await restoreBackup(
      {
        format: 'fitnessmate-backup',
        version: 1,
        exportedAt: 'now',
        sections: { programs: true, history: false },
        exercises: [],
        programs: [],
        programExercises: [],
        programSets: [],
        workouts: [],
        workoutExercises: [],
        workoutSets: [],
      },
      'replace',
      db,
    );
    expect(db.queries.some((query) => query.sql === 'DELETE FROM programs')).toBe(true);
    expect(db.queries.some((query) => query.sql.includes('DELETE FROM workouts'))).toBe(false);
  });

  it('clears Telegram credentials after clearing local data', async () => {
    const db = new FakeDatabase();
    const clearTelegram = jest.fn<Promise<void>, []>().mockResolvedValue();

    await clearAllData(db, clearTelegram);

    expect(db.committedTransactions).toBe(1);
    expect(clearTelegram).toHaveBeenCalledTimes(1);
  });
});
