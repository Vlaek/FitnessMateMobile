import { FakeDatabase } from '@/test/fake-database';
import { SqliteWorkoutRepository } from './workout-repository';
import { DatabaseSync } from 'node:sqlite';

describe('SqliteWorkoutRepository', () => {
  it('copies the latest workout for the selected program into a fresh draft', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    db.queueFirst({ id: 'last' });
    let nextId = 0;
    const repository = new SqliteWorkoutRepository(db, {
      createId: () => `new-${++nextId}`,
      now: () => 'today',
    });
    const previous = {
      id: 'last',
      sourceProgramId: 'program',
      name: 'Leg day',
      status: 'completed' as const,
      startedAt: 'yesterday',
      completedAt: 'yesterday',
      updatedAt: 'yesterday',
      exercises: [
        {
          id: 'old-e1',
          sourceExerciseId: null,
          exerciseName: 'Custom squat',
          muscleGroup: 'legs' as const,
          sets: [
            { id: 'old-s1', weightKg: 60, repetitions: 8, isCompleted: true },
            { id: 'skipped-set', weightKg: 100, repetitions: 5, isCompleted: false },
            { id: 'old-s3', weightKg: 65, repetitions: 6, isCompleted: true },
          ],
        },
        {
          id: 'old-e2',
          sourceExerciseId: 'press',
          exerciseName: 'Press',
          muscleGroup: 'chest' as const,
          sets: [{ id: 'old-s2', weightKg: 40, repetitions: 10, isCompleted: false }],
        },
      ],
    };
    jest.spyOn(repository, 'getById').mockResolvedValue(previous);

    const draft = await repository.startFromLastWorkout('program');

    expect(db.queries[1]?.params).toEqual(['program']);
    expect(db.queries[1]?.sql).toContain('ORDER BY julianday(completed_at) DESC');
    expect(draft).toMatchObject({
      id: 'new-1',
      sourceProgramId: 'program',
      status: 'draft',
      startedAt: 'today',
      completedAt: null,
    });
    expect(draft.exercises.map((exercise) => exercise.exerciseName)).toEqual(['Custom squat']);
    expect(draft.exercises[0]).toMatchObject({
      id: 'new-2',
      sourceExerciseId: null,
      sets: [
        { id: 'new-3', weightKg: 60, repetitions: 8, isCompleted: false },
        { id: 'new-4', weightKg: 65, repetitions: 6, isCompleted: false },
      ],
    });
    expect(previous.exercises[0]?.sets[0]?.isCompleted).toBe(true);
    expect(db.committedTransactions).toBe(1);
  });

  it('rejects a last workout with no completed sets instead of copying skipped exercises', async () => {
    const db = new FakeDatabase();
    db.queueFirst(null);
    db.queueFirst({ id: 'last' });
    const repository = new SqliteWorkoutRepository(db);
    jest.spyOn(repository, 'getById').mockResolvedValue({
      id: 'last',
      sourceProgramId: 'program',
      name: 'Skipped',
      status: 'completed',
      startedAt: 'yesterday',
      completedAt: 'yesterday',
      updatedAt: 'yesterday',
      exercises: [
        {
          id: 'e',
          sourceExerciseId: null,
          exerciseName: 'Press',
          muscleGroup: 'chest',
          sets: [{ id: 's', weightKg: 50, repetitions: 10, isCompleted: false }],
        },
      ],
    });
    await expect(repository.startFromLastWorkout('program')).rejects.toThrow('No previous workout');
    expect(db.executedSql.some((sql) => sql.startsWith('INSERT'))).toBe(false);
  });

  it('counts only exercises with completed sets in history summaries', async () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`
      CREATE TABLE workouts (id TEXT, name TEXT, started_at TEXT, completed_at TEXT, status TEXT);
      CREATE TABLE workout_exercises (id TEXT, workout_id TEXT);
      CREATE TABLE workout_sets (id TEXT, workout_exercise_id TEXT, weight_kg REAL, repetitions INTEGER, is_completed INTEGER);
      INSERT INTO workouts VALUES ('w', 'Workout', '2026-11-26', '2026-11-26', 'completed');
      INSERT INTO workout_exercises VALUES ('skipped', 'w'), ('mixed', 'w');
      INSERT INTO workout_sets VALUES ('s1', 'skipped', 100, 10, 0), ('s2', 'mixed', 200, 5, 0), ('s3', 'mixed', 50, 10, 1), ('s4', 'mixed', 55, 8, 1);
    `);
    const db = new FakeDatabase();
    db.getAllAsync = async <T>(sql: string, params = [] as (string | number | null)[]) =>
      sqlite.prepare(sql).all(...params) as T[];

    try {
      await expect(new SqliteWorkoutRepository(db).listCompleted()).resolves.toEqual([
        expect.objectContaining({ id: 'w', exerciseCount: 1, setCount: 2, volumeKg: 940 }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it('does not create a draft if a program has no history or a workout is already active', async () => {
    const db = new FakeDatabase();
    const repository = new SqliteWorkoutRepository(db);
    await expect(repository.startFromLastWorkout('no-history')).rejects.toThrow(
      'No previous workout',
    );
    db.queueFirst({ id: 'active' });
    await expect(repository.startFromLastWorkout('program')).rejects.toThrow(
      'Active workout already exists',
    );
    expect(db.executedSql.some((sql) => sql.startsWith('INSERT'))).toBe(false);
  });
  it('returns recent weights chronologically with the best repetitions in one completed set', async () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`
      CREATE TABLE workouts (id TEXT, status TEXT, completed_at TEXT);
      CREATE TABLE workout_exercises (id TEXT, workout_id TEXT, source_exercise_id TEXT, exercise_name TEXT, muscle_group TEXT, sort_order INTEGER);
      CREATE TABLE workout_sets (workout_exercise_id TEXT, weight_kg REAL, repetitions INTEGER, is_completed INTEGER, sort_order INTEGER);
      INSERT INTO workouts VALUES ('old', 'completed', '2026-01-01'), ('new', 'completed', '2026-02-01'), ('draft', 'draft', NULL);
      INSERT INTO workout_exercises VALUES ('e1', 'old', 'squat', 'Squat', 'legs', 0), ('e2', 'new', 'squat', 'Squat', 'legs', 0), ('e3', 'draft', 'squat', 'Squat', 'legs', 0), ('other', 'new', 'press', 'Press', 'chest', 1), ('legacy', 'old', NULL, 'Squat', 'legs', 1);
      INSERT INTO workout_sets VALUES ('e1', 10, 20, 1, 0), ('e1', 20, 12, 1, 1), ('e1', 30, 10, 1, 2), ('e1', 40, 8, 1, 3), ('e1', 50, 6, 1, 4), ('e2', 20, 8, 1, 0), ('e2', 60, 30, 0, 1), ('e3', 70, 40, 1, 0), ('other', 80, 50, 1, 0), ('legacy', 20, 10, 1, 0), ('e2', 20, 99, 0, 2), ('e3', 20, 100, 1, 1), ('other', 20, 101, 1, 1);
    `);
    const db = new FakeDatabase();
    db.getAllAsync = async <T>(sql: string, params = [] as (string | number | null)[]) =>
      sqlite.prepare(sql).all(...params) as T[];

    try {
      const repository = new SqliteWorkoutRepository(db);
      await expect(
        repository.getExerciseWeightHistory({
          sourceExerciseId: 'squat',
          exerciseName: 'Squat',
          muscleGroup: 'legs',
        }),
      ).resolves.toEqual([
        { weightKg: 30, maxRepetitions: 10 },
        { weightKg: 40, maxRepetitions: 8 },
        { weightKg: 50, maxRepetitions: 6 },
        { weightKg: 20, maxRepetitions: 12 },
      ]);
    } finally {
      sqlite.close();
    }
  });
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
