import type { ITelegramCredentials } from './telegram-credentials';
import { sendTelegramMessage, type TTelegramFetcher } from './telegram-service';

const credentials: ITelegramCredentials = { token: 'secret', chatId: '-1001' };

describe('sendTelegramMessage', () => {
  it('sends plain text without a Telegram parse mode', async () => {
    const fetcher = telegramFetcherMock().mockResolvedValue(response({ ok: true }, true));

    await expect(sendTelegramMessage(credentials, 'report', fetcher)).resolves.toEqual({
      ok: true,
    });
    expect(fetcher).toHaveBeenCalledWith('https://api.telegram.org/botsecret/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: '-1001', text: 'report' }),
    });
  });

  it('returns a sanitized Telegram rejection', async () => {
    const fetcher = telegramFetcherMock().mockResolvedValue(
      response({ ok: false, description: 'bad secret' }, true),
    );

    await expect(sendTelegramMessage(credentials, 'report', fetcher)).resolves.toEqual({
      ok: false,
      reason: 'rejected',
      message: 'bad [redacted]',
    });
  });

  it('distinguishes HTTP and invalid response failures', async () => {
    const httpFetcher = telegramFetcherMock().mockResolvedValue(response({ ok: false }, false));
    const invalidFetcher = telegramFetcherMock().mockResolvedValue(
      response({ unexpected: true }, true),
    );

    await expect(sendTelegramMessage(credentials, 'report', httpFetcher)).resolves.toEqual({
      ok: false,
      reason: 'rejected',
    });
    await expect(sendTelegramMessage(credentials, 'report', invalidFetcher)).resolves.toEqual({
      ok: false,
      reason: 'invalid-response',
    });
  });

  it('maps a thrown request to a network failure without exposing the token', async () => {
    const fetcher = telegramFetcherMock().mockRejectedValue(new Error('secret leaked'));

    const result = await sendTelegramMessage(credentials, 'report', fetcher);

    expect(result).toEqual({ ok: false, reason: 'network' });
    expect(JSON.stringify(result)).not.toContain(credentials.token);
  });
});

type TTelegramFetch = TTelegramFetcher;

function telegramFetcherMock() {
  return jest.fn<ReturnType<TTelegramFetch>, Parameters<TTelegramFetch>>();
}

function response(body: unknown, ok: boolean): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}
