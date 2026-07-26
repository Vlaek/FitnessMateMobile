import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';

const TOKEN_KEY = 'fitnessmate-telegram-bot-token';
const CHAT_ID_KEY = 'fitnessmate-telegram-chat-id';

export interface ITelegramCredentials {
  token: string;
  chatId: string;
}

export interface IAsyncKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class TelegramCredentialsRepository {
  constructor(
    private readonly secureStorage: IAsyncKeyValueStorage,
    private readonly localStorage: IAsyncKeyValueStorage,
  ) {}

  async load(): Promise<ITelegramCredentials> {
    const [token, chatId] = await Promise.all([
      this.secureStorage.getItem(TOKEN_KEY),
      this.localStorage.getItem(CHAT_ID_KEY),
    ]);

    return { token: token ?? '', chatId: chatId ?? '' };
  }

  async save(credentials: ITelegramCredentials): Promise<void> {
    await Promise.all([
      this.secureStorage.setItem(TOKEN_KEY, credentials.token.trim()),
      this.localStorage.setItem(CHAT_ID_KEY, credentials.chatId.trim()),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.secureStorage.removeItem(TOKEN_KEY),
      this.localStorage.removeItem(CHAT_ID_KEY),
    ]);
  }

  async isConfigured(): Promise<boolean> {
    const credentials = await this.load();

    return Boolean(credentials.token.trim() && credentials.chatId.trim());
  }
}

const secureStorage: IAsyncKeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const localStorage: IAsyncKeyValueStorage = {
  getItem: async (key) => Storage.getItem(key),
  setItem: async (key, value) => {
    await Storage.setItem(key, value);
  },
  removeItem: async (key) => {
    await Storage.removeItem(key);
  },
};

export const telegramCredentials = new TelegramCredentialsRepository(secureStorage, localStorage);
