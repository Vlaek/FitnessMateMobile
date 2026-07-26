import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { database } from '@/database/client';
import type { IDatabaseAdapter, TSqlParams } from '@/database/types';
import { parseBackup, type TFitnessMateBackup } from './backup-schema';

type TSections = { programs: boolean; history: boolean };
export async function buildBackup(
  sections: TSections,
  db: IDatabaseAdapter = database,
): Promise<TFitnessMateBackup> {
  const exercises =
    await db.getAllAsync<TFitnessMateBackup['exercises'][number]>('SELECT * FROM exercises');
  const workouts = sections.history
    ? await db.getAllAsync<TFitnessMateBackup['workouts'][number]>(
        "SELECT * FROM workouts WHERE status = 'completed'",
      )
    : [];

  return {
    format: 'fitnessmate-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    sections,
    exercises,
    programs: sections.programs ? await db.getAllAsync('SELECT * FROM programs') : [],
    programExercises: sections.programs
      ? await db.getAllAsync('SELECT * FROM program_exercises')
      : [],
    programSets: sections.programs ? await db.getAllAsync('SELECT * FROM program_sets') : [],
    workouts: sections.programs
      ? workouts
      : workouts.map((workout) => ({ ...workout, source_program_id: null })),
    workoutExercises: sections.history
      ? await db.getAllAsync(
          "SELECT we.* FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id WHERE w.status = 'completed'",
        )
      : [],
    workoutSets: sections.history
      ? await db.getAllAsync(
          "SELECT ws.* FROM workout_sets ws JOIN workout_exercises we ON we.id = ws.workout_exercise_id JOIN workouts w ON w.id = we.workout_id WHERE w.status = 'completed'",
        )
      : [],
  };
}

export async function exportBackup(sections: TSections): Promise<void> {
  const backup = await buildBackup(sections);
  const file = new File(
    Paths.cache,
    `fitnessmate-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'FitnessMate backup',
    });
  }
}

export async function readBackupFile(uri: string): Promise<TFitnessMateBackup> {
  return parseBackup(JSON.parse(await new File(uri).text()));
}

export async function restoreBackup(
  raw: unknown,
  mode: 'merge' | 'replace',
  db: IDatabaseAdapter = database,
): Promise<void> {
  const backup = parseBackup(raw);
  await db.withTransactionAsync(async () => {
    if (mode === 'replace') {
      if (backup.sections.programs) {
        await db.runAsync('DELETE FROM programs');
      }

      if (backup.sections.history) {
        await db.runAsync("DELETE FROM workouts WHERE status = 'completed'");
      }
    }

    for (const row of backup.exercises) {
      await insert(db, 'exercises', row);
    }

    if (backup.sections.programs) {
      for (const row of backup.programs) {
        await insert(db, 'programs', row);
      }

      for (const row of backup.programExercises) {
        await insert(db, 'program_exercises', row);
      }

      for (const row of backup.programSets) {
        await insert(db, 'program_sets', row);
      }
    }

    if (backup.sections.history) {
      for (const row of backup.workouts) {
        await insert(db, 'workouts', row);
      }

      for (const row of backup.workoutExercises) {
        await insert(db, 'workout_exercises', row);
      }

      for (const row of backup.workoutSets) {
        await insert(db, 'workout_sets', row);
      }
    }
  });
}

async function insert(db: IDatabaseAdapter, table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  const values = columns.map((key) => row[key]) as TSqlParams;
  await db.runAsync(
    `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values,
  );
}

export async function clearAllData(db: IDatabaseAdapter = database) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workouts');
    await db.runAsync('DELETE FROM programs');
    await db.runAsync('DELETE FROM exercises WHERE is_custom = 1');
  });
}
