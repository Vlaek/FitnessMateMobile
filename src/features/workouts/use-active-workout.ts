import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Exercise } from '@/domain/exercises/types';
import type { Workout } from '@/domain/workouts/types';
import { exerciseRepository } from '@/database/repositories/exercise-repository';
import { workoutRepository } from '@/database/repositories/workout-repository';

export function useActiveWorkout() {
  const [workout, setWorkoutState] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const initialized = useRef(false);
  useEffect(() => {
    void Promise.all([workoutRepository.getActive(), exerciseRepository.listAll()])
      .then(([active, all]) => {
        setWorkoutState(active);
        setExercises(all);
        initialized.current = true;
      })
      .catch((cause) => setError(String(cause)))
      .finally(() => setLoading(false));
  }, []);
  const setWorkout = useCallback((next: Workout) => {
    setWorkoutState(next);

    if (!initialized.current) {
      return;
    }

    saveQueue.current = saveQueue.current
      .then(() => workoutRepository.save(next))
      .catch((cause) => setError(String(cause)));
  }, []);
  const addExercise = (exercise: Exercise, displayName: string) => {
    if (!workout) {
      return;
    }

    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: randomUUID(),
          sourceExerciseId: exercise.id,
          exerciseName: exercise.builtInKey ?? displayName,
          muscleGroup: exercise.muscleGroup,
          sets: [{ id: randomUUID(), weightKg: 0, repetitions: 10, isCompleted: false }],
        },
      ],
    });
  };

  return { workout, setWorkout, exercises, loading, error, addExercise };
}
