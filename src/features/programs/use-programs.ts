import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ProgramSummary } from '@/domain/programs/types';
import { programRepository, type ProgramRepository } from '@/database/repositories/program-repository';

export function usePrograms(repository: ProgramRepository = programRepository) {
  const [items, setItems] = useState<ProgramSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const duplicate = useCallback(async (id: string) => { await repository.duplicate(id); await refresh(); }, [refresh, repository]);
  const remove = useCallback(async (id: string) => { await repository.delete(id); await refresh(); }, [refresh, repository]);
  const move = useCallback(async (id: string, direction: -1 | 1) => {
    const from = items.findIndex((item) => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setItems(next);
    try { await repository.reorder(next.map((program) => program.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Failed to reorder'); await refresh(); }
  }, [items, refresh, repository]);

  return { items, isLoading, error, refresh, duplicate, remove, move };
}
