import { randomUUID } from 'expo-crypto';

import type { MuscleGroup } from '@/domain/exercises/types';
import type { Workout, WorkoutSummary } from '@/domain/workouts/types';

import { database } from '../client';
import type { DatabaseAdapter } from '../types';

type Dependencies = { createId: () => string; now: () => string };
const dependencies: Dependencies = { createId: randomUUID, now: () => new Date().toISOString() };

type WorkoutRow = { id: string; source_program_id: string | null; name: string; status: 'draft' | 'completed'; started_at: string; completed_at: string | null; updated_at: string };
type ExerciseRow = { id: string; source_exercise_id: string | null; exercise_name: string; muscle_group: MuscleGroup; sort_order: number };
type SetRow = { id: string; workout_exercise_id: string; weight_kg: number; repetitions: number; is_completed: 0 | 1; sort_order: number };
type ProgramTemplateRow = { program_name: string; exercise_id: string; exercise_name: string; muscle_group: MuscleGroup; exercise_order: number; weight_kg: number; repetitions: number; set_order: number };

export interface WorkoutRepository {
  getActive(): Promise<Workout | null>;
  startEmpty(name: string): Promise<Workout>;
  startFromProgram(programId: string): Promise<Workout>;
  save(workout: Workout): Promise<void>;
  complete(id: string): Promise<void>;
  getById(id: string): Promise<Workout | null>;
  listCompleted(): Promise<WorkoutSummary[]>;
  delete(id: string): Promise<void>;
}

export class SqliteWorkoutRepository implements WorkoutRepository {
  constructor(private readonly db: DatabaseAdapter = database, private readonly deps: Dependencies = dependencies) {}

  async getActive() { const row = await this.db.getFirstAsync<{ id: string }>("SELECT id FROM workouts WHERE status = 'draft' LIMIT 1"); return row ? this.getById(row.id) : null; }

  async startEmpty(name: string): Promise<Workout> {
    await this.assertNoActive();
    const timestamp = this.deps.now();
    const workout: Workout = { id: this.deps.createId(), sourceProgramId: null, name: name.trim() || 'Workout', status: 'draft', startedAt: timestamp, completedAt: null, updatedAt: timestamp, exercises: [] };
    await this.db.withTransactionAsync(async () => { await this.insertWorkout(workout); });
    return workout;
  }

  async startFromProgram(programId: string): Promise<Workout> {
    await this.assertNoActive();
    const rows = await this.db.getAllAsync<ProgramTemplateRow>(
      `SELECT p.name AS program_name, e.id AS exercise_id,
              COALESCE(e.custom_name, e.built_in_key) AS exercise_name,
              e.muscle_group, pe.sort_order AS exercise_order,
              ps.weight_kg, ps.repetitions, ps.sort_order AS set_order
       FROM programs p
       JOIN program_exercises pe ON pe.program_id = p.id
       JOIN exercises e ON e.id = pe.exercise_id
       JOIN program_sets ps ON ps.program_exercise_id = pe.id
       WHERE p.id = ? ORDER BY pe.sort_order, ps.sort_order`, [programId]);
    if (!rows.length) throw new Error('Program not found or empty');
    const timestamp = this.deps.now();
    const workout: Workout = { id: this.deps.createId(), sourceProgramId: programId, name: rows[0]!.program_name, status: 'draft', startedAt: timestamp, completedAt: null, updatedAt: timestamp, exercises: [] };
    for (const row of rows) {
      let exercise = workout.exercises.find((item) => item.sourceExerciseId === row.exercise_id);
      if (!exercise) { exercise = { id: this.deps.createId(), sourceExerciseId: row.exercise_id, exerciseName: row.exercise_name, muscleGroup: row.muscle_group, sets: [] }; workout.exercises.push(exercise); }
      exercise.sets.push({ id: this.deps.createId(), weightKg: row.weight_kg, repetitions: row.repetitions, isCompleted: false });
    }
    await this.db.withTransactionAsync(async () => { await this.insertWorkout(workout); await this.insertChildren(workout); });
    return workout;
  }

  async save(workout: Workout): Promise<void> {
    const updatedAt = this.deps.now();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('UPDATE workouts SET name = ?, updated_at = ? WHERE id = ?', [workout.name, updatedAt, workout.id]);
      await this.db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', [workout.id]);
      await this.insertChildren({ ...workout, updatedAt });
    });
  }

  async complete(id: string): Promise<void> { const now = this.deps.now(); await this.db.runAsync("UPDATE workouts SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?", [now, now, id]); }
  async delete(id: string): Promise<void> { await this.db.runAsync('DELETE FROM workouts WHERE id = ?', [id]); }

  async getById(id: string): Promise<Workout | null> {
    const row = await this.db.getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?', [id]);
    if (!row) return null;
    const exercises = await this.db.getAllAsync<ExerciseRow>('SELECT id, source_exercise_id, exercise_name, muscle_group, sort_order FROM workout_exercises WHERE workout_id = ? ORDER BY sort_order', [id]);
    const sets = await this.db.getAllAsync<SetRow>('SELECT ws.* FROM workout_sets ws JOIN workout_exercises we ON we.id = ws.workout_exercise_id WHERE we.workout_id = ? ORDER BY we.sort_order, ws.sort_order', [id]);
    return { id: row.id, sourceProgramId: row.source_program_id, name: row.name, status: row.status, startedAt: row.started_at, completedAt: row.completed_at, updatedAt: row.updated_at, exercises: exercises.map((exercise) => ({ id: exercise.id, sourceExerciseId: exercise.source_exercise_id, exerciseName: exercise.exercise_name, muscleGroup: exercise.muscle_group, sets: sets.filter((set) => set.workout_exercise_id === exercise.id).map((set) => ({ id: set.id, weightKg: set.weight_kg, repetitions: set.repetitions, isCompleted: set.is_completed === 1 })) })) };
  }

  async listCompleted(): Promise<WorkoutSummary[]> {
    return this.db.getAllAsync<WorkoutSummary>(`SELECT w.id, w.name, w.started_at AS startedAt, w.completed_at AS completedAt,
      COUNT(DISTINCT we.id) AS exerciseCount, COUNT(ws.id) AS setCount,
      COALESCE(SUM(ws.weight_kg * ws.repetitions), 0) AS volumeKg
      FROM workouts w LEFT JOIN workout_exercises we ON we.workout_id = w.id
      LEFT JOIN workout_sets ws ON ws.workout_exercise_id = we.id AND ws.is_completed = 1
      WHERE w.status = 'completed' GROUP BY w.id ORDER BY w.completed_at DESC`);
  }

  private async assertNoActive() { if (await this.db.getFirstAsync("SELECT id FROM workouts WHERE status = 'draft' LIMIT 1")) throw new Error('Active workout already exists'); }
  private async insertWorkout(workout: Workout) { await this.db.runAsync('INSERT INTO workouts (id, source_program_id, name, status, started_at, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [workout.id, workout.sourceProgramId, workout.name, workout.status, workout.startedAt, workout.completedAt, workout.updatedAt]); }
  private async insertChildren(workout: Workout) {
    for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
      await this.db.runAsync('INSERT INTO workout_exercises (id, workout_id, source_exercise_id, exercise_name, muscle_group, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [exercise.id, workout.id, exercise.sourceExerciseId, exercise.exerciseName, exercise.muscleGroup, exerciseIndex]);
      for (const [setIndex, set] of exercise.sets.entries()) await this.db.runAsync('INSERT INTO workout_sets (id, workout_exercise_id, weight_kg, repetitions, is_completed, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [set.id, exercise.id, set.weightKg, set.repetitions, set.isCompleted ? 1 : 0, setIndex]);
    }
  }
}

export const workoutRepository = new SqliteWorkoutRepository();
