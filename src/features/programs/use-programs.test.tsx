import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ProgramRepository } from '@/database/repositories/program-repository';
import type { ProgramSummary } from '@/domain/programs/types';

import { usePrograms } from './use-programs';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require('react') as typeof import('react');
    React.useEffect(callback, [callback]);
  },
}));

const programs: ProgramSummary[] = [
  { id: 'a', name: 'A', description: '', sortOrder: 0, exerciseCount: 1, setCount: 1 },
  { id: 'b', name: 'B', description: '', sortOrder: 1, exerciseCount: 1, setCount: 1 },
  { id: 'c', name: 'C', description: '', sortOrder: 2, exerciseCount: 1, setCount: 1 },
];

function createRepository(reorder: ProgramRepository['reorder']): ProgramRepository {
  return {
    list: jest.fn().mockResolvedValue(programs),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    duplicate: jest.fn(),
    reorder,
    delete: jest.fn(),
  };
}

describe('usePrograms', () => {
  it('persists a complete order after a drag', async () => {
    const repository = createRepository(jest.fn().mockResolvedValue(undefined));
    const { result } = await renderHook(() => usePrograms(repository));
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    await act(async () => result.current.reorder(0, 2));

    expect(repository.reorder).toHaveBeenCalledWith(['b', 'c', 'a']);
    expect(result.current.items.map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });

  it('rolls an optimistic order back when persistence fails', async () => {
    const repository = createRepository(jest.fn().mockRejectedValue(new Error('offline')));
    const { result } = await renderHook(() => usePrograms(repository));
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    await act(async () => result.current.reorder(0, 2));

    expect(result.current.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.error).toBe('offline');
  });
});
