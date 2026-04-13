/**
 * PDFファイルをアップロードして解析するAPI（POST /api/pdf/upload）
 * @param {File} file - アップロードするPDFファイル
 * @returns {Promise<{ok: boolean, data?: object, message?: string}>}
 */
export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    const msg = error.message?.startsWith('HTTP ')
      ? error.message
      : 'PDFアップロードに失敗しました';
    return { ok: false, message: msg };
  }
};
// API ベース URL（環境変数から読み込む）
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

/** ヘルスチェックのタイムアウト時間（ミリ秒） */
const HEALTH_TIMEOUT_MS = 5000;

/**
 * バックエンドのヘルスチェックを行う。
 * @param {AbortSignal} [externalSignal] - 外部からのキャンセルシグナル（コンポーネントのアンマウント時などに使用）
 * @returns {Promise<{ok: boolean, data?: object, message?: string, cancelled?: boolean, timeout?: boolean}>}
 */
export const healthCheck = async (externalSignal) => {
  // 外部シグナルが既にキャンセル済みの場合は即座に戻る
  if (externalSignal?.aborted) {
    return { ok: false, cancelled: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  // 外部シグナルによるキャンセルを内部コントローラーに伝播する
  const abortHandler = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', abortHandler);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    clearTimeout(timer);

    if (controller.signal.aborted) {
      if (externalSignal && externalSignal.aborted) {
        // 外部からのキャンセル（画面遷移・コンポーネントのアンマウントなど）
        return { ok: false, cancelled: true };
      }
      // タイムアウトによるキャンセル
      return {
        ok: false,
        timeout: true,
        message: `タイムアウト（${HEALTH_TIMEOUT_MS / 1000}秒以上応答がありません）`,
      };
    }

    const msg = error.message?.startsWith('HTTP ')
      ? error.message
      : 'バックエンドに接続できません';
    return { ok: false, message: msg };
  } finally {
    // リスナーのクリーンアップ
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  }
};

/**
 * MEXT PDF取得APIを呼び出す（GET /api/mext/fetch）
 * @param {string} pdfUrl - 取得対象のPDF URL
 * @returns {Promise<{ok: boolean, data?: object, message?: string, timeout?: boolean}>}
 */
export const fetchMextPdf = async (pdfUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mext/fetch?url=${encodeURIComponent(pdfUrl)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    const msg = error.message?.startsWith('HTTP ')
      ? error.message
      : 'PDF取得に失敗しました';
    return { ok: false, message: msg };
  }
};

/**
 * PDF URLを指定して解析APIを呼び出す（POST /api/pdf/process）
 * @param {string} url - 解析対象のPDF URL
 * @returns {Promise<{ok: boolean, data?: object, message?: string, timeout?: boolean}>}
 */
export const processPdf = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      return { ok: false, message: 'PDF解析がタイムアウトしました', timeout: true };
    }
    const msg = error.message?.startsWith('HTTP ')
      ? error.message
      : 'PDF解析に失敗しました';
    return { ok: false, message: msg };
  }
};

/**
 * 問題生成APIを呼び出す（POST /api/question/generate）
 * @param {object} payload - 生成用データ（PDF解析結果など）
 * @returns {Promise<{ok: boolean, data?: object, message?: string, timeout?: boolean}>}
 */
export const generateQuestion = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/question/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    const msg = error.message?.startsWith('HTTP ')
      ? error.message
      : '問題生成に失敗しました';
    return { ok: false, message: msg };
  }
};

export { API_BASE_URL };
