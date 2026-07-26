import { TelegramCredentialsRepository, type IAsyncKeyValueStorage } from './telegram-credentials';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

class MemoryStorage implements IAsyncKeyValueStorage {
  private readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('TelegramCredentialsRepository', () => {
  it('stores a trimmed token securely and a trimmed chat id separately', async () => {
    const secureStorage = new MemoryStorage();
    const localStorage = new MemoryStorage();
    const repository = new TelegramCredentialsRepository(secureStorage, localStorage);

    await repository.save({ token: ' bot-token ', chatId: ' -1001 ' });

    await expect(repository.load()).resolves.toEqual({
      token: 'bot-token',
      chatId: '-1001',
    });
    await expect(repository.isConfigured()).resolves.toBe(true);
  });

  it('requires both values to be configured', async () => {
    const repository = new TelegramCredentialsRepository(new MemoryStorage(), new MemoryStorage());

    await repository.save({ token: 'token', chatId: '   ' });

    await expect(repository.isConfigured()).resolves.toBe(false);
  });

  it('clears both credential stores', async () => {
    const repository = new TelegramCredentialsRepository(new MemoryStorage(), new MemoryStorage());
    await repository.save({ token: 'token', chatId: '-1001' });

    await repository.clear();

    await expect(repository.load()).resolves.toEqual({ token: '', chatId: '' });
  });
});
