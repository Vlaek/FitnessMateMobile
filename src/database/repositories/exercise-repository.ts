import { randomUUID } from 'expo-crypto';

import type { Exercise, MuscleGroup } from '@/domain/exercises/types';

import { database } from '../client';
import type { DatabaseAdapter } from '../types';

type ExerciseRow = {
  id: string;
  built_in_key: string | null;
  custom_name: string | null;
  muscle_group: MuscleGroup;
  is_custom: 0 | 1;
};

type RepositoryDependencies = {
  createId: () => string;
  now: () => string;
};

const defaultDependencies: RepositoryDependencies = {
  createId: randomUUID,
  now: () => new Date().toISOString(),
};

export interface ExerciseRepository {
  listAll(): Promise<Exercise[]>;
  createCustom(input: { name: string; muscleGroup: MuscleGroup }): Promise<Exercise>;
  deleteCustom(id: string): Promise<void>;
}

export class SqliteExerciseRepository implements ExerciseRepository {
  constructor(
    private readonly db: DatabaseAdapter = database,
    private readonly dependencies: RepositoryDependencies = defaultDependencies,
  ) {}

  async listAll(): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<ExerciseRow>(
      `SELECT id, built_in_key, custom_name, muscle_group, is_custom
       FROM exercises
       ORDER BY is_custom ASC, COALESCE(built_in_key, LOWER(custom_name)) ASC`,
    );

    return rows.map(mapExerciseRow);
  }

  async createCustom(input: { name: string; muscleGroup: MuscleGroup }): Promise<Exercise> {
    const name = input.name.trim();

    if (!name) {
      throw new Error('Exercise name is required');
    }

    const exercise: Exercise = {
      id: this.dependencies.createId(),
      builtInKey: null,
      customName: name,
      muscleGroup: input.muscleGroup,
      isCustom: true,
    };
    await this.db.runAsync(
      `INSERT INTO exercises
       (id, built_in_key, custom_name, muscle_group, is_custom, created_at)
       VALUES (?, NULL, ?, ?, 1, ?)`,
      [exercise.id, name, input.muscleGroup, this.dependencies.now()],
    );

    return exercise;
  }

  async deleteCustom(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
  }
}

function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    builtInKey: row.built_in_key,
    customName: row.custom_name,
    muscleGroup: row.muscle_group,
    isCustom: row.is_custom === 1,
  };
}

export const exerciseRepository = new SqliteExerciseRepository();
