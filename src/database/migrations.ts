import type { DatabaseAdapter } from './types';

export const CURRENT_DATABASE_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  built_in_key TEXT UNIQUE,
  custom_name TEXT,
  muscle_group TEXT NOT NULL,
  is_custom INTEGER NOT NULL CHECK (is_custom IN (0, 1)),
  created_at TEXT NOT NULL,
  CHECK (
    (is_custom = 0 AND built_in_key IS NOT NULL AND custom_name IS NULL) OR
    (is_custom = 1 AND built_in_key IS NULL AND custom_name IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS program_sets (
  id TEXT PRIMARY KEY NOT NULL,
  program_exercise_id TEXT NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1),
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY NOT NULL,
  source_program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_draft
ON workouts(status) WHERE status = 'draft';

CREATE TABLE IF NOT EXISTS workout_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  source_exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY NOT NULL,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1),
  is_completed INTEGER NOT NULL CHECK (is_completed IN (0, 1)),
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_exercises_program
ON program_exercises(program_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_program_sets_exercise
ON program_sets(program_exercise_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workouts_status_completed
ON workouts(status, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
ON workout_exercises(workout_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise
ON workout_sets(workout_exercise_id, sort_order);
`;

export async function migrateDatabase(db: DatabaseAdapter): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const version = versionRow?.user_version ?? 0;

  if (version > CURRENT_DATABASE_VERSION) {
    throw new Error('Unsupported database version');
  }

  if (version === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_V1);
      await db.execAsync(`PRAGMA user_version = ${CURRENT_DATABASE_VERSION};`);
    });
  }
}
