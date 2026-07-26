import { FakeDatabase } from '@/test/fake-database';
import { SqliteWorkoutRepository } from './workout-repository';

describe('SqliteWorkoutRepository', () => {
  it('starts an empty workout in a transaction', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    const repository = new SqliteWorkoutRepository(db, {
      createId: () => 'workout-1',
      now: () => 'now',
    });
    const workout = await repository.startEmpty('My workout');
    expect(workout).toMatchObject({ id: 'workout-1', name: 'My workout', status: 'draft' });
    expect(db.committedTransactions).toBe(1);
  });

  it('prevents starting a second active workout', async () => {
    const db = new FakeDatabase();
    db.queueFirst({ id: 'active' });
    const repository = new SqliteWorkoutRepository(db, { createId: () => 'id', now: () => 'now' });
    await expect(repository.startEmpty('Other')).rejects.toThrow('Active workout already exists');
  });

  it('uses the unprefixed default workout name', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    const repository = new SqliteWorkoutRepository(db, {
      createId: () => 'workout-1',
      now: () => 'now',
    });

    await expect(repository.startEmpty('   ')).resolves.toMatchObject({ name: 'Workout' });
  });

  it('uses the unprefixed missing program error', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    db.queueAll([]);
    const repository = new SqliteWorkoutRepository(db, {
      createId: () => 'workout-1',
      now: () => 'now',
    });

    await expect(repository.startFromProgram('missing')).rejects.toEqual(
      new Error('Program not found or empty'),
    );
  });

  it('loads completed workouts in the first requested order', async () => {
    const db = new FakeDatabase();
    db.queueFirst(completedRow('w2'));
    db.queueAll([]);
    db.queueAll([]);
    db.queueFirst(completedRow('w1'));
    db.queueAll([]);
    db.queueAll([]);
    const repository = new SqliteWorkoutRepository(db);

    const workouts = await repository.getCompletedByIds(['w2', 'w1', 'w2']);

    expect(workouts.map((workout) => workout.id)).toEqual(['w2', 'w1']);
  });

  it('rejects a requested workout that is missing or not completed', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    const repository = new SqliteWorkoutRepository(db);

    await expect(repository.getCompletedByIds(['w1'])).rejects.toThrow(
      'Completed workout not found: w1',
    );
  });

  it('only counts completed sets in history summaries', async () => {
    const db = new FakeDatabase();
    db.queueAll([
      {
        id: 'w',
        name: 'A',
        startedAt: 's',
        completedAt: 'c',
        exerciseCount: 1,
        setCount: 2,
        volumeKg: 120,
      },
    ]);
    const repository = new SqliteWorkoutRepository(db);
    await repository.listCompleted();
    expect(db.queries[0]?.sql).toContain('ws.is_completed = 1');
  });
});

function completedRow(id: string) {
  return {
    id,
    source_program_id: null,
    name: id,
    status: 'completed',
    started_at: '2026-07-20T10:00:00.000Z',
    completed_at: '2026-07-20T11:00:00.000Z',
    updated_at: '2026-07-20T11:00:00.000Z',
  };
}
