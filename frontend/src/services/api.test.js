import { healthCheck, API_BASE_URL, fetchMextPdf, generateQuestion, processPdf, uploadPdf } from './api';

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
});

describe('fetchMextPdf', () => {
  test('正常系: PDF取得成功', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pdf: 'data', meta: { url: 'https://mext.go.jp/sample.pdf' } }),
    });
    const result = await fetchMextPdf('https://mext.go.jp/sample.pdf');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ pdf: 'data', meta: { url: 'https://mext.go.jp/sample.pdf' } });
  });
  test('失敗系: HTTP 404', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    const result = await fetchMextPdf('https://mext.go.jp/notfound.pdf');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 404');
  });
  test('失敗系: ネットワーク障害', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
    const result = await fetchMextPdf('https://mext.go.jp/sample.pdf');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('PDF取得に失敗しました');
  });
  test('境界値: 空URL', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
    });
    const result = await fetchMextPdf('');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 400');
  });
});

describe('generateQuestion', () => {
  test('正常系: 問題生成成功', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ question: 'Q1', choices: ['A', 'B'], answer: 'A' }),
    });
    const result = await generateQuestion({ pdf: 'data' });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ question: 'Q1', choices: ['A', 'B'], answer: 'A' });
  });
  test('失敗系: HTTP 500', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const result = await generateQuestion({ pdf: 'data' });
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 500');
  });
  test('失敗系: ネットワーク障害', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
    const result = await generateQuestion({ pdf: 'data' });
    expect(result.ok).toBe(false);
    expect(result.message).toBe('問題生成に失敗しました');
  });
  test('境界値: 空データ', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
    });
    const result = await generateQuestion({});
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 400');
  });
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

describe('processPdf', () => {
  test('正常系: {ok: true, data} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: { text: '解析結果', tables: [] } }),
    });
    const result = await processPdf('https://www.mext.go.jp/content/test.pdf');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: 'ok', data: { text: '解析結果', tables: [] } });
  });

  test('失敗系（HTTPエラー）: {ok: false, message: "HTTP 500"} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const result = await processPdf('https://www.mext.go.jp/content/test.pdf');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 500');
  });

  test('失敗系（ネットワークエラー）: {ok: false, message: "PDF解析に失敗しました"} が返る', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
    const result = await processPdf('https://www.mext.go.jp/content/test.pdf');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('PDF解析に失敗しました');
  });

  test('タイムアウト: {ok: false, message: "PDF解析がタイムアウトしました", timeout: true} が返る', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockImplementation((_url, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const resultPromise = processPdf('https://www.mext.go.jp/content/test.pdf');
    jest.advanceTimersByTime(30001);
    const result = await resultPromise;
    expect(result.ok).toBe(false);
    expect(result.timeout).toBe(true);
    expect(result.message).toBe('PDF解析がタイムアウトしました');

    jest.useRealTimers();
  });
});

describe('uploadPdf', () => {
  test('正常系: {ok: true, data} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: { text: 'アップロード結果', tables: [] } }),
    });
    const file = new File(['%PDF-1.0 test'], 'test.pdf', { type: 'application/pdf' });
    const result = await uploadPdf(file);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: 'ok', data: { text: 'アップロード結果', tables: [] } });
  });

  test('失敗系（HTTPエラー）: {ok: false, message: "HTTP 500"} が返る', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const file = new File(['%PDF-1.0 test'], 'test.pdf', { type: 'application/pdf' });
    const result = await uploadPdf(file);
    expect(result.ok).toBe(false);
    expect(result.message).toBe('HTTP 500');
  });

  test('失敗系（ネットワークエラー）: {ok: false, message: "PDFアップロードに失敗しました"} が返る', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'));
    const file = new File(['%PDF-1.0 test'], 'test.pdf', { type: 'application/pdf' });
    const result = await uploadPdf(file);
    expect(result.ok).toBe(false);
    expect(result.message).toBe('PDFアップロードに失敗しました');
  });
});

