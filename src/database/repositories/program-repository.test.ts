import { FakeDatabase } from '@/test/fake-database';
import type { TProgramInput } from '@/domain/programs/types';
import { SqliteProgramRepository } from './program-repository';

const input: TProgramInput = {
  name: 'Upper body',
  description: 'Monday',
  exercises: [
    {
      exerciseId: '00000000-0000-4000-8000-000000000001',
      sets: [
        { weightKg: 60, repetitions: 8 },
        { weightKg: 65, repetitions: 6 },
      ],
    },
    {
      exerciseId: '00000000-0000-4000-8000-000000000005',
      sets: [{ weightKg: 50, repetitions: 10 }],
    },
  ],
};

function makeRepository(db: FakeDatabase) {
  const ids = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
  ];

  return new SqliteProgramRepository(db, {
    createId: () => ids.shift() ?? '77777777-7777-4777-8777-777777777777',
    now: () => '2026-07-20T10:00:00.000Z',
  });
}

describe('SqliteProgramRepository', () => {
  it('creates an ordered aggregate in one transaction', async () => {
    const db = new FakeDatabase();
    db.queueFirst({ next_sort_order: 0 });
    const repository = makeRepository(db);

    const created = await repository.create(input);

    expect(created).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      sortOrder: 0,
      name: 'Upper body',
    });
    expect(db.committedTransactions).toBe(1);
    expect(
      db.queries.filter((query) => query.sql.includes('INSERT INTO program_exercises')),
    ).toHaveLength(2);
    expect(
      db.queries.filter((query) => query.sql.includes('INSERT INTO program_sets')),
    ).toHaveLength(3);
  });

  it('does not commit when a child insert fails', async () => {
    const db = new FakeDatabase();
    db.queueFirst({ next_sort_order: 0 });
    db.failWhenSqlIncludes('INSERT INTO program_sets');
    const repository = makeRepository(db);

    await expect(repository.create(input)).rejects.toThrow('Forced SQL failure');
    expect(db.committedTransactions).toBe(0);
  });

  it('loads nested exercises and sets in order', async () => {
    const db = new FakeDatabase();
    db.queueFirst({
      id: 'program',
      name: 'Upper body',
      description: 'Monday',
      sort_order: 2,
      created_at: 'created',
      updated_at: 'updated',
    });
    db.queueAll([
      { id: 'pe-1', exercise_id: 'exercise-1', sort_order: 0 },
      { id: 'pe-2', exercise_id: 'exercise-2', sort_order: 1 },
    ]);
    db.queueAll([
      { program_exercise_id: 'pe-1', weight_kg: 60, repetitions: 8, sort_order: 0 },
      { program_exercise_id: 'pe-2', weight_kg: 50, repetitions: 10, sort_order: 0 },
    ]);
    const repository = makeRepository(db);

    await expect(repository.getById('program')).resolves.toMatchObject({
      id: 'program',
      exercises: [
        { exerciseId: 'exercise-1', sets: [{ weightKg: 60, repetitions: 8 }] },
        { exerciseId: 'exercise-2', sets: [{ weightKg: 50, repetitions: 10 }] },
      ],
    });
  });

  it('rejects duplicate IDs during reorder', async () => {
    const repository = makeRepository(new FakeDatabase());
    await expect(repository.reorder(['same', 'same'])).rejects.toThrow(
      'TProgram order contains duplicate IDs',
    );
  });
});
