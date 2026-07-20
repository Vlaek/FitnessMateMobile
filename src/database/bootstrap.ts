import { database } from './client';
import { migrateDatabase } from './migrations';
import { BUILT_IN_EXERCISES } from './seed/built-in-exercises';
import type { DatabaseAdapter } from './types';

export async function bootstrapDatabase(db: DatabaseAdapter = database): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrateDatabase(db);
  await db.withTransactionAsync(async () => {
    for (const exercise of BUILT_IN_EXERCISES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises
         (id, built_in_key, custom_name, muscle_group, is_custom, created_at)
         VALUES (?, ?, NULL, ?, 0, ?)`,
        [exercise.id, exercise.builtInKey, exercise.muscleGroup, exercise.createdAt],
      );
    }
  });
}
