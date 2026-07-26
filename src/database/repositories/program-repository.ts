import { randomUUID } from 'expo-crypto';

import { parseProgramInput } from '@/domain/programs/program-schema';
import type { Program, ProgramInput, ProgramSummary } from '@/domain/programs/types';

import { database } from '../client';
import type { DatabaseAdapter } from '../types';

type ProgramRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ProgramExerciseRow = {
  id: string;
  exercise_id: string;
  sort_order: number;
};

type ProgramSetRow = {
  program_exercise_id: string;
  weight_kg: number;
  repetitions: number;
  sort_order: number;
};

type Dependencies = {
  createId: () => string;
  now: () => string;
};

const defaultDependencies: Dependencies = {
  createId: randomUUID,
  now: () => new Date().toISOString(),
};

export interface ProgramRepository {
  list(): Promise<ProgramSummary[]>;
  getById(id: string): Promise<Program | null>;
  create(input: ProgramInput): Promise<Program>;
  update(id: string, input: ProgramInput): Promise<Program>;
  duplicate(id: string): Promise<Program>;
  reorder(orderedIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export class SqliteProgramRepository implements ProgramRepository {
  constructor(
    private readonly db: DatabaseAdapter = database,
    private readonly dependencies: Dependencies = defaultDependencies,
  ) {}

  async list(): Promise<ProgramSummary[]> {
    return this.db.getAllAsync<ProgramSummary>(
      `SELECT p.id, p.name, p.description, p.sort_order AS sortOrder,
              COUNT(DISTINCT pe.id) AS exerciseCount,
              COUNT(ps.id) AS setCount
       FROM programs p
       LEFT JOIN program_exercises pe ON pe.program_id = p.id
       LEFT JOIN program_sets ps ON ps.program_exercise_id = pe.id
       GROUP BY p.id
       ORDER BY p.sort_order ASC`,
    );
  }

  async getById(id: string): Promise<Program | null> {
    const row = await this.db.getFirstAsync<ProgramRow>(
      `SELECT id, name, description, sort_order, created_at, updated_at
       FROM programs WHERE id = ?`,
      [id],
    );

    if (!row) {
      return null;
    }

    const exerciseRows = await this.db.getAllAsync<ProgramExerciseRow>(
      `SELECT id, exercise_id, sort_order FROM program_exercises
       WHERE program_id = ? ORDER BY sort_order ASC`,
      [id],
    );
    const setRows = await this.db.getAllAsync<ProgramSetRow>(
      `SELECT ps.program_exercise_id, ps.weight_kg, ps.repetitions, ps.sort_order
       FROM program_sets ps
       INNER JOIN program_exercises pe ON pe.id = ps.program_exercise_id
       WHERE pe.program_id = ?
       ORDER BY pe.sort_order ASC, ps.sort_order ASC`,
      [id],
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      exercises: exerciseRows.map((exercise) => ({
        exerciseId: exercise.exercise_id,
        sets: setRows
          .filter((set) => set.program_exercise_id === exercise.id)
          .map((set) => ({ weightKg: set.weight_kg, repetitions: set.repetitions })),
      })),
    };
  }

  async create(rawInput: ProgramInput): Promise<Program> {
    const input = parseProgramInput(rawInput);
    const id = this.dependencies.createId();
    const timestamp = this.dependencies.now();
    const sortRow = await this.db.getFirstAsync<{ next_sort_order: number }>(
      'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort_order FROM programs',
    );
    const sortOrder = sortRow?.next_sort_order ?? 0;

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO programs (id, name, description, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.name, input.description, sortOrder, timestamp, timestamp],
      );
      await this.insertChildren(id, input);
    });

    return { id, sortOrder, createdAt: timestamp, updatedAt: timestamp, ...input };
  }

  async update(id: string, rawInput: ProgramInput): Promise<Program> {
    const input = parseProgramInput(rawInput);
    const existing = await this.getById(id);

    if (!existing) {
      throw new Error('Program not found');
    }

    const updatedAt = this.dependencies.now();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'UPDATE programs SET name = ?, description = ?, updated_at = ? WHERE id = ?',
        [input.name, input.description, updatedAt, id],
      );
      await this.db.runAsync('DELETE FROM program_exercises WHERE program_id = ?', [id]);
      await this.insertChildren(id, input);
    });

    return { ...existing, ...input, updatedAt };
  }

  async duplicate(id: string): Promise<Program> {
    const source = await this.getById(id);

    if (!source) {
      throw new Error('Program not found');
    }

    return this.create({
      name: `${source.name} Copy`.slice(0, 100),
      description: source.description,
      exercises: source.exercises,
    });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Program order contains duplicate IDs');
    }

    const rows = await this.db.getAllAsync<{ id: string }>('SELECT id FROM programs');
    const storedIds = new Set(rows.map((row) => row.id));

    if (storedIds.size !== orderedIds.length || orderedIds.some((id) => !storedIds.has(id))) {
      throw new Error('Program order must contain every program exactly once');
    }

    await this.db.withTransactionAsync(async () => {
      for (const [index, id] of orderedIds.entries()) {
        await this.db.runAsync('UPDATE programs SET sort_order = ? WHERE id = ?', [index, id]);
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM programs WHERE id = ?', [id]);
  }

  private async insertChildren(programId: string, input: ProgramInput): Promise<void> {
    for (const [exerciseIndex, exercise] of input.exercises.entries()) {
      const programExerciseId = this.dependencies.createId();
      await this.db.runAsync(
        `INSERT INTO program_exercises (id, program_id, exercise_id, sort_order)
         VALUES (?, ?, ?, ?)`,
        [programExerciseId, programId, exercise.exerciseId, exerciseIndex],
      );

      for (const [setIndex, set] of exercise.sets.entries()) {
        await this.db.runAsync(
          `INSERT INTO program_sets
           (id, program_exercise_id, weight_kg, repetitions, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [
            this.dependencies.createId(),
            programExerciseId,
            set.weightKg,
            set.repetitions,
            setIndex,
          ],
        );
      }
    }
  }
}

export const programRepository = new SqliteProgramRepository();
