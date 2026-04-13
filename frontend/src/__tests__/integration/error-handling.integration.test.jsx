/**
 * 統合テスト: エラー処理（AC-3）・境界ケース
 *
 * - AC-3: API失敗時のエラーハンドリング（接続失敗・タイムアウト・HTTP エラー）
 * - 境界ケース: 未認証アクセス・入力バリデーション
 *
 * MemoryRouter を使用してルーティングをシミュレートし、
 * React 19 + React Router v6 環境で動作することを確認する。
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { healthCheck, processPdf, generateQuestion } from '../../services/api';
import { renderApp } from '../../test-utils';

/** services/api をモック化してネットワークアクセスを排除する */
jest.mock('../../services/api', () => ({
  healthCheck: jest.fn(),
  processPdf: jest.fn(),
  generateQuestion: jest.fn(),
  fetchMextPdf: jest.fn(),
  uploadPdf: jest.fn(),
  API_BASE_URL: 'http://127.0.0.1:8000',
}));

// ============================================================
// AC-3: API 失敗時のエラー処理
// ============================================================
describe('AC-3: API 失敗時のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('エラー系: API 接続失敗時にエラーメッセージがホーム画面に表示される', async () => {
    healthCheck.mockResolvedValue({
      ok: false,
      message: 'バックエンドに接続できません',
    });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));

    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent(
        '接続失敗: バックエンドに接続できません'
      );
    });
  });

  test('エラー系: API タイムアウト時にタイムアウトエラーメッセージが表示される', async () => {
    healthCheck.mockResolvedValue({
      ok: false,
      timeout: true,
      message: 'タイムアウト（5秒以上応答がありません）',
    });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));

    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent(
        '接続失敗: タイムアウト'
      );
    });
  });

  test('正常系: API 接続成功時に成功メッセージが表示される', async () => {
    healthCheck.mockResolvedValue({ ok: true, data: { status: 'healthy' } });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));

    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent(
        '接続成功: healthy'
      );
    });
  });

  test('エラー系: HTTP 500 エラー時に接続失敗メッセージが表示される', async () => {
    healthCheck.mockResolvedValue({ ok: false, message: 'HTTP 500' });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));

    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent(
        '接続失敗: HTTP 500'
      );
    });
  });
});

// ============================================================
// 境界ケース: 未認証アクセス・入力バリデーション
// ============================================================
describe('境界ケース: 未認証アクセスとバリデーション', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck.mockReturnValue(new Promise(() => { }));
    // B-009: API統合用モック
    processPdf.mockResolvedValue({ ok: true, data: { status: 'ok', data: { text: 'テスト' } } });
    generateQuestion.mockResolvedValue({ ok: true, data: { status: 'ok', data: { question: 'Q', choices: [], answer: 'A', meta: {} } } });
  });

  test('境界値: 未認証でホーム (/home) に直接アクセスするとログイン画面にリダイレクトされる', () => {
    renderApp(['/home']);

    expect(screen.getByText('Select Profile')).toBeInTheDocument();
    expect(screen.queryByText('ユーザーA さん')).not.toBeInTheDocument();
  });

  test('境界値: 未認証で単元入力 (/unit-input) に直接アクセスするとログイン画面にリダイレクトされる', () => {
    renderApp(['/unit-input']);

    expect(screen.getByText('Select Profile')).toBeInTheDocument();
    expect(screen.queryByText('AI解析を開始')).not.toBeInTheDocument();
  });

  test('境界値: 未認証でクイズ (/quiz) に直接アクセスするとログイン画面にリダイレクトされる', () => {
    renderApp(['/quiz']);

    expect(screen.getByText('Select Profile')).toBeInTheDocument();
    expect(screen.queryByText(/MEXT Grounding/i)).not.toBeInTheDocument();
  });

  test('境界値: UnitInput で単元を未入力の場合は AI 解析ボタンが無効化される', async () => {
    renderApp();

    // ログイン→教科選択
    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => {
      expect(screen.getByText('数学の学習')).toBeInTheDocument();
    });

    // 単元未入力の状態でボタンが disabled であることを確認
    const generateButton = screen.getByRole('button', { name: 'AI解析を開始' });
    expect(generateButton).toBeDisabled();
  });
});

// ============================================================
// B-009: API統合エラー処理
// ============================================================
describe('B-009: API統合エラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck.mockReturnValue(new Promise(() => { }));
    processPdf.mockResolvedValue({ ok: true, data: { status: 'ok', data: { text: 'テスト' } } });
    generateQuestion.mockResolvedValue({ ok: true, data: { status: 'ok', data: { question: 'Q', choices: [], answer: 'A', meta: {} } } });
  });

  test('エラー系: バックエンドがステータス fail を返した場合にエラー画面が表示される', async () => {
    processPdf.mockResolvedValue({
      ok: true,
      data: { status: 'fail', reason_code: 'C001_INVALID_SOURCE_URL', message: '許可されていないURLです' },
    });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(screen.getByTestId('api-error-screen')).toBeInTheDocument();
    }, { timeout: 10000 });
    expect(screen.getByTestId('api-error-message')).toHaveTextContent('許可されていないURLです');
  });

  test('エラー系: ネットワークエラー時にエラー画面が表示される', async () => {
    processPdf.mockRejectedValue(new Error('Network Error'));
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(screen.getByTestId('api-error-screen')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('エラー系: エラー画面から「ホームに戻る」でホーム画面に戻れる', async () => {
    processPdf.mockResolvedValue({ ok: false, message: 'PDF解析に失敗しました' });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(screen.getByTestId('api-error-screen')).toBeInTheDocument();
    }, { timeout: 10000 });

    fireEvent.click(screen.getByText('ホームに戻る'));
    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });
  });
});
