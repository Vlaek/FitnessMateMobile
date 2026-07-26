import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { IProgramRepository } from '@/database/repositories/program-repository';
import type { TProgramSummary } from '@/domain/programs/types';
import { usePrograms } from './use-programs';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(callback, [callback]);
  },
}));

const programs: TProgramSummary[] = [
  { id: 'a', name: 'A', description: '', sortOrder: 0, exerciseCount: 1, setCount: 1 },
  { id: 'b', name: 'B', description: '', sortOrder: 1, exerciseCount: 1, setCount: 1 },
  { id: 'c', name: 'C', description: '', sortOrder: 2, exerciseCount: 1, setCount: 1 },
];

function createRepository(reorder: IProgramRepository['reorder']): IProgramRepository {
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

  it('ignores a second drag while an order is being persisted', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const repository = createRepository(jest.fn().mockReturnValue(pending));
    const { result } = await renderHook(() => usePrograms(repository));
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    await act(async () => {
      void result.current.reorder(0, 1);
    });
    await waitFor(() => expect(result.current.isReordering).toBe(true));
    await act(async () => result.current.reorder(1, 2));

    expect(repository.reorder).toHaveBeenCalledTimes(1);

    await act(async () => {
      release?.();
      await pending;
    });
  });

  it('shows a deletion error without losing the list', async () => {
    const repository = createRepository(jest.fn());
    jest.mocked(repository.delete).mockRejectedValue(new Error('delete failed'));
    const { result } = await renderHook(() => usePrograms(repository));
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    await act(async () => result.current.remove('a'));

    expect(result.current.items).toHaveLength(3);
    expect(result.current.error).toBe('delete failed');
  });
});
