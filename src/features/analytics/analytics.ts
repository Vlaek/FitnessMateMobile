export type CompletedSetRow = { workoutId: string; completedAt: string; exerciseName: string; weightKg: number; repetitions: number };
export type ExerciseRecord = { exerciseName: string; maxWeightKg: number; maxSetVolumeKg: number; trend: { date: string; maxWeightKg: number; volumeKg: number }[] };
export type Analytics = { totalWorkouts: number; weeklyVolumeKg: number; records: ExerciseRecord[] };

export function calculateAnalytics(rows: CompletedSetRow[], now = new Date()): Analytics {
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const workouts = new Set(rows.map((row) => row.workoutId));
  const grouped = new Map<string, CompletedSetRow[]>();
  for (const row of rows) grouped.set(row.exerciseName, [...(grouped.get(row.exerciseName) ?? []), row]);
  return {
    totalWorkouts: workouts.size,
    weeklyVolumeKg: rows.filter((row) => new Date(row.completedAt).getTime() >= weekStart).reduce((sum, row) => sum + row.weightKg * row.repetitions, 0),
    records: [...grouped.entries()].map(([exerciseName, sets]) => {
      const days = new Map<string, CompletedSetRow[]>();
      for (const set of sets) { const date = set.completedAt.slice(0, 10); days.set(date, [...(days.get(date) ?? []), set]); }
      return { exerciseName, maxWeightKg: Math.max(...sets.map((set) => set.weightKg)), maxSetVolumeKg: Math.max(...sets.map((set) => set.weightKg * set.repetitions)), trend: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, maxWeightKg: Math.max(...values.map((set) => set.weightKg)), volumeKg: values.reduce((sum, set) => sum + set.weightKg * set.repetitions, 0) })).slice(-5) };
    }).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
  };
}
