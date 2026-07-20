import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { bootstrapDatabase } from '@/database/bootstrap';

import { AppProviders } from './app-providers';

jest.mock('@/database/bootstrap', () => ({
  bootstrapDatabase: jest.fn(),
}));

const mockedBootstrap = jest.mocked(bootstrapDatabase);

describe('AppProviders', () => {
  it('shows loading and then renders children', async () => {
    let resolveBootstrap: () => void = () => undefined;
    mockedBootstrap.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveBootstrap = resolve; }),
    );

    await render(<AppProviders><Text>Ready</Text></AppProviders>);
    expect(screen.getByTestId('database-loading')).toBeTruthy();

    resolveBootstrap();
    expect(await screen.findByText('Ready')).toBeTruthy();
  });

  it('offers retry after bootstrap failure', async () => {
    mockedBootstrap
      .mockRejectedValueOnce(new Error('broken'))
      .mockResolvedValueOnce(undefined);

    await render(<AppProviders><Text>Recovered</Text></AppProviders>);
    expect(await screen.findByTestId('database-error')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(mockedBootstrap).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Recovered')).toBeTruthy();
  });
});
