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
