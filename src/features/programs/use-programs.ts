import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ProgramSummary } from '@/domain/programs/types';
import {
  programRepository,
  type ProgramRepository,
} from '@/database/repositories/program-repository';
import { moveItem } from '@/shared/lib/reorder';

export function usePrograms(repository: ProgramRepository = programRepository) {
  const [items, setItems] = useState<ProgramSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reorderInFlight = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      setItems(await repository.list());
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await repository.delete(id);
        await refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Failed to delete program');
      }
    },
    [refresh, repository],
  );

  const reorder = useCallback(
    async (from: number, to: number) => {
      if (reorderInFlight.current) {
        return;
      }

      const previous = items;
      const reordered = moveItem(items, from, to);

      if (reordered === items) {
        return;
      }

      const next = [...reordered];
      reorderInFlight.current = true;
      setIsReordering(true);
      setItems(next);

      try {
        await repository.reorder(next.map((program) => program.id));
        setError(null);
      } catch (reason) {
        setItems(previous);
        setError(reason instanceof Error ? reason.message : 'Failed to reorder');
      } finally {
        reorderInFlight.current = false;
        setIsReordering(false);
      }
    },
    [items, repository],
  );

  return { items, isLoading, isReordering, error, refresh, remove, reorder };
}
