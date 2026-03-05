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

export { API_BASE_URL };
