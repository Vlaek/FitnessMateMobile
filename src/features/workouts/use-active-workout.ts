import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TExercise } from '@/domain/exercises/types';
import type { TWorkout } from '@/domain/workouts/types';
import { exerciseRepository } from '@/database/repositories/exercise-repository';
import { workoutRepository } from '@/database/repositories/workout-repository';
import { sanitizeWorkout } from './sanitize-workout';

export function useActiveWorkout() {
  const [workout, setWorkoutState] = useState<TWorkout | null>(null);
  const [exercises, setExercises] = useState<TExercise[]>([]);
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
  const setWorkout = useCallback((next: TWorkout) => {
    setWorkoutState(next);

    if (!initialized.current) {
      return;
    }

    const validWorkout = sanitizeWorkout(next);

    if (validWorkout) {
      saveQueue.current = saveQueue.current
        .then(() => workoutRepository.save(validWorkout))
        .catch((cause) => setError(String(cause)));
    }
  }, []);
  const addExercise = (exercise: TExercise, displayName: string) => {
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
