import { useEffect, useState } from 'react';

import type { Exercise, MuscleGroup } from '@/domain/exercises/types';
import { parseProgramInput } from '@/domain/programs/program-schema';
import { exerciseRepository } from '@/database/repositories/exercise-repository';
import { programRepository } from '@/database/repositories/program-repository';

import { EMPTY_PROGRAM, type ProgramEditorDraft } from './program-editor-state';

export function useProgramEditor(programId?: string) {
  const [draft, setDraft] = useState<ProgramEditorDraft>(EMPTY_PROGRAM);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      exerciseRepository.listAll(),
      programId ? programRepository.getById(programId) : Promise.resolve(null),
    ])
      .then(([allExercises, program]) => {
        if (!active) {
          return;
        }

        setExercises(allExercises);

        if (program) {
          setDraft({
            name: program.name,
            description: program.description,
            exercises: program.exercises,
          });
        }

        if (programId && !program) {
          setError('not-found');
        }
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [programId]);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const input = parseProgramInput(draft);

      return programId
        ? await programRepository.update(programId, input)
        : await programRepository.create(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));

      return null;
    } finally {
      setSaving(false);
    }
  };

  const createExercise = async (name: string, muscleGroup: MuscleGroup) => {
    const exercise = await exerciseRepository.createCustom({ name, muscleGroup });
    setExercises((current) => [...current, exercise]);

    return exercise;
  };

  return { draft, setDraft, exercises, loading, saving, error, save, createExercise };
}
