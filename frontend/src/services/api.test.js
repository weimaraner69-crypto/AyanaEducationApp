import { healthCheck, API_BASE_URL } from './api';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('API_BASE_URL', () => {
  test('デフォルトで http://127.0.0.1:8000 が設定される', () => {
    expect(API_BASE_URL).toBe('http://127.0.0.1:8000');
  });
});

describe('healthCheck', () => {
  test('正常系: {ok: true, data} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const result = await healthCheck();
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: 'ok' });
  });

  test('エラー系: ネットワーク障害時に {ok: false, message} が返る', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));

    const result = await healthCheck();
    expect(result.ok).toBe(false);
    expect(result.message).toBe('バックエンドに接続できません');
  });

  test('エラー系: HTTP 503 のとき {ok: false, message: "HTTP 503"} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const result = await healthCheck();
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 503');
  });

  test('境界値: 外部シグナルが事前に abort 済みの場合 {cancelled: true} が返る', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await healthCheck(controller.signal);
    expect(result.ok).toBe(false);
    expect(result.cancelled).toBe(true);
  });

  test('エラー系: タイムアウト発生時に {ok: false, timeout: true} が返る', async () => {
    jest.useFakeTimers();

    jest.spyOn(global, 'fetch').mockImplementation((_url, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const resultPromise = healthCheck();
    // 5000ms のタイムアウトを超過させる
    jest.advanceTimersByTime(5001);

    const result = await resultPromise;
    expect(result.ok).toBe(false);
    expect(result.timeout).toBe(true);
    expect(result.message).toMatch(/タイムアウト/);

    jest.useRealTimers();
  });

  test('エラー系: 外部シグナルによるキャンセル時に {cancelled: true} が返る', async () => {
    const externalController = new AbortController();

    jest.spyOn(global, 'fetch').mockImplementation((_url, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const resultPromise = healthCheck(externalController.signal);
    // 外部からキャンセルする（コンポーネントアンマウント相当）
    externalController.abort();

    const result = await resultPromise;
    expect(result.ok).toBe(false);
    expect(result.cancelled).toBe(true);
  });

  test('正常系: リクエストが正しいエンドポイントに送信される', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    await healthCheck();
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/health',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
