import type { ITelegramCredentials } from './telegram-credentials';

export type TTelegramFetcher = (input: string, init: RequestInit) => Promise<Response>;

export type TTelegramSendResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'network' | 'rejected' | 'invalid-response';
      message?: string;
    };

type TTelegramResponse = {
  ok: boolean;
  description?: string;
};

export async function sendTelegramMessage(
  credentials: ITelegramCredentials,
  text: string,
  fetcher: TTelegramFetcher = fetch,
): Promise<TTelegramSendResult> {
  try {
    const response = await fetcher(`https://api.telegram.org/bot${credentials.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: credentials.chatId, text }),
    });

    if (!response.ok) {
      return { ok: false, reason: 'rejected' };
    }

    const body: unknown = await response.json();

    if (!isTelegramResponse(body)) {
      return { ok: false, reason: 'invalid-response' };
    }

    if (!body.ok) {
      const message = body.description
        ? body.description.replaceAll(credentials.token, '[redacted]')
        : undefined;

      return { ok: false, reason: 'rejected', ...(message ? { message } : {}) };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

function isTelegramResponse(value: unknown): value is TTelegramResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean' &&
    (!('description' in value) || typeof value.description === 'string')
  );
}
