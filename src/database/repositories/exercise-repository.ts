import { randomUUID } from 'expo-crypto';
import type { TExercise, TMuscleGroup } from '@/domain/exercises/types';
import { database } from '../client';
import type { IDatabaseAdapter } from '../types';

type TExerciseRow = {
  id: string;
  built_in_key: string | null;
  custom_name: string | null;
  muscle_group: TMuscleGroup;
  is_custom: 0 | 1;
};

type TRepositoryDependencies = {
  createId: () => string;
  now: () => string;
};

const defaultDependencies: TRepositoryDependencies = {
  createId: randomUUID,
  now: () => new Date().toISOString(),
};

export interface IExerciseRepository {
  listAll(): Promise<TExercise[]>;
  createCustom(input: { name: string; muscleGroup: TMuscleGroup }): Promise<TExercise>;
  deleteCustom(id: string): Promise<void>;
}

export class SqliteExerciseRepository implements IExerciseRepository {
  constructor(
    private readonly db: IDatabaseAdapter = database,
    private readonly dependencies: TRepositoryDependencies = defaultDependencies,
  ) {}

  async listAll(): Promise<TExercise[]> {
    const rows = await this.db.getAllAsync<TExerciseRow>(
      `SELECT id, built_in_key, custom_name, muscle_group, is_custom
       FROM exercises
       ORDER BY is_custom ASC, COALESCE(built_in_key, LOWER(custom_name)) ASC`,
    );

    return rows.map(mapExerciseRow);
  }

  async createCustom(input: { name: string; muscleGroup: TMuscleGroup }): Promise<TExercise> {
    const name = input.name.trim();

    if (!name) {
      throw new Error('TExercise name is required');
    }

    const exercise: TExercise = {
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

function mapExerciseRow(row: TExerciseRow): TExercise {
  return {
    id: row.id,
    builtInKey: row.built_in_key,
    customName: row.custom_name,
    muscleGroup: row.muscle_group,
    isCustom: row.is_custom === 1,
  };
}

export const exerciseRepository = new SqliteExerciseRepository();
