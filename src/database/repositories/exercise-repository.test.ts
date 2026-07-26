import { FakeDatabase } from '@/test/fake-database';

import { SqliteExerciseRepository } from './exercise-repository';

describe('SqliteExerciseRepository', () => {
  it('maps built-in and custom exercises', async () => {
    const db = new FakeDatabase();
    db.queueAll([
      {
        id: 'built-in',
        built_in_key: 'squat',
        custom_name: null,
        muscle_group: 'legs',
        is_custom: 0,
      },
      {
        id: 'custom',
        built_in_key: null,
        custom_name: 'Cable fly',
        muscle_group: 'chest',
        is_custom: 1,
      },
    ]);
    const repository = new SqliteExerciseRepository(db);

    await expect(repository.listAll()).resolves.toEqual([
      {
        id: 'built-in',
        builtInKey: 'squat',
        customName: null,
        muscleGroup: 'legs',
        isCustom: false,
      },
      {
        id: 'custom',
        builtInKey: null,
        customName: 'Cable fly',
        muscleGroup: 'chest',
        isCustom: true,
      },
    ]);
  });

  it('creates a trimmed custom exercise', async () => {
    const db = new FakeDatabase();
    const repository = new SqliteExerciseRepository(db, {
      createId: () => '11111111-1111-4111-8111-111111111111',
      now: () => '2026-07-20T10:00:00.000Z',
    });

    const created = await repository.createCustom({ name: '  Cable fly  ', muscleGroup: 'chest' });

    expect(created).toMatchObject({ customName: 'Cable fly', isCustom: true });
    expect(db.queries.at(-1)?.params).toEqual([
      '11111111-1111-4111-8111-111111111111',
      'Cable fly',
      'chest',
      '2026-07-20T10:00:00.000Z',
    ]);
  });

  it('rejects an empty custom name', async () => {
    const repository = new SqliteExerciseRepository(new FakeDatabase());
    await expect(repository.createCustom({ name: ' ', muscleGroup: 'chest' })).rejects.toThrow(
      'Exercise name is required',
    );
  });
});
