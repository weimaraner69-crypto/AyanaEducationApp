/**
 * 統合テスト: ユーザー完全フロー（AC-1）・保護者モード切り替え（AC-2）
 *
 * - AC-1: ログイン→ホーム→教科選択→単元入力→クイズの一連フロー
 * - AC-2: 保護者モード切り替え時の画面状態変更を検証
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
// AC-1: ユーザー完全フロー
// ============================================================
describe('AC-1: ユーザー完全フロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ローディング状態を維持するため、解決しない Promise を返す
    healthCheck.mockReturnValue(new Promise(() => { }));
    // B-009: API統合用モック
    processPdf.mockResolvedValue({
      ok: true,
      data: { status: 'ok', data: { text: '学習指導要領に基づく教科の学習目標と単元内容。これはテストです。' } },
    });
    generateQuestion.mockResolvedValue({
      ok: true,
      data: { status: 'ok', data: { question: 'テスト問題: ____に基づく', choices: ['学習指導要領', 'ダミー1', 'ダミー2', 'ダミー3'], answer: '学習指導要領', meta: {} } },
    });
  });

  test('正常系: 初期表示でログイン画面（プロファイル選択）が表示される', () => {
    renderApp();

    expect(screen.getByText('MiraStudy')).toBeInTheDocument();
    expect(screen.getByText('Select Profile')).toBeInTheDocument();
    expect(screen.getByText('ユーザーA')).toBeInTheDocument();
    expect(screen.getByText('ユーザーB')).toBeInTheDocument();
  });

  test('正常系: プロファイル選択でホーム画面へ遷移し、ユーザー名が表示される', async () => {
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));

    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });
  });

  test('正常系: ホーム→教科選択（数学）→単元入力画面への遷移', async () => {
    renderApp();

    // ログイン
    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });

    // 教科（数学）を選択
    fireEvent.click(screen.getByText('数学'));

    await waitFor(() => {
      expect(screen.getByText('数学の学習')).toBeInTheDocument();
    });
  });

  test('正常系: ログイン→ホーム→教科選択→単元入力→クイズの完全フロー', async () => {
    renderApp();

    // ログイン
    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });

    // 教科選択
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => {
      expect(screen.getByText('数学の学習')).toBeInTheDocument();
    });

    // 単元名を入力
    const unitInput = screen.getByPlaceholderText('例：連立方程式、一次関数');
    fireEvent.change(unitInput, { target: { value: '連立方程式' } });

    // AI 解析開始（クイズ画面へ遷移）
    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(screen.getByTestId('quiz-screen')).toBeInTheDocument();
    });
  });

  test('正常系: ホーム画面のログアウトボタンでログイン画面に戻る', async () => {
    renderApp();

    // ログイン
    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => {
      expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
    });

    // ログアウト
    fireEvent.click(screen.getByLabelText('ログアウト'));

    await waitFor(() => {
      expect(screen.getByText('Select Profile')).toBeInTheDocument();
    });
  });
});

// ============================================================
// B-009: API統合フロー
// ============================================================
describe('B-009: API統合フロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    healthCheck.mockReturnValue(new Promise(() => { }));
    processPdf.mockResolvedValue({
      ok: true,
      data: { status: 'ok', data: { text: '学習指導要領に基づく教科の学習目標と単元内容。これはテストです。' } },
    });
    generateQuestion.mockResolvedValue({
      ok: true,
      data: { status: 'ok', data: { question: 'テスト問題: ____に基づく', choices: ['学習指導要領', 'ダミー1', 'ダミー2', 'ダミー3'], answer: '学習指導要領', meta: {} } },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('正常系: AI解析開始で解析画面が表示される', async () => {
    jest.useRealTimers();
    renderApp();

    // ログイン→教科選択→単元入力
    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    // AI解析開始
    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(screen.getByTestId('quiz-screen')).toBeInTheDocument();
    });
  });

  test('正常系: processPdf と generateQuestion が呼ばれる', async () => {
    jest.useRealTimers();
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    fireEvent.click(screen.getByText('AI解析を開始'));

    await waitFor(() => {
      expect(processPdf).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(generateQuestion).toHaveBeenCalled();
    });
  });

  test('エラー系: processPdf 失敗時にエラー画面が表示される', async () => {
    jest.useRealTimers();
    processPdf.mockResolvedValue({
      ok: false,
      message: 'PDF解析に失敗しました',
    });
    renderApp();

    fireEvent.click(screen.getByText('ユーザーA'));
    await waitFor(() => expect(screen.getByText('ユーザーA さん')).toBeInTheDocument());
    fireEvent.click(screen.getByText('数学'));
    await waitFor(() => expect(screen.getByText('数学の学習')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('例：連立方程式、一次関数'), { target: { value: '連立方程式' } });

    fireEvent.click(screen.getByText('AI解析を開始'));

    // アニメーション完了とAPI応答後にエラー画面が表示される
    await waitFor(() => {
      expect(screen.getByTestId('api-error-screen')).toBeInTheDocument();
    }, { timeout: 10000 });
    expect(screen.getByTestId('api-error-message')).toHaveTextContent('PDF解析に失敗しました');
  });

  test('エラー系: generateQuestion 失敗時にエラー画面が表示される', async () => {
    jest.useRealTimers();
    generateQuestion.mockResolvedValue({
      ok: false,
      message: '問題生成に失敗しました',
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
    expect(screen.getByTestId('api-error-message')).toHaveTextContent('問題生成に失敗しました');
  });
});

// ============================================================
// AC-2: 保護者モード切り替え
// ============================================================
describe('AC-2: 保護者モード切り替え', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck.mockReturnValue(new Promise(() => { }));
  });

  test('正常系: 保護者ダッシュボードボタンで保護者ビューへ遷移する', async () => {
    renderApp();

    fireEvent.click(screen.getByText('保護者ダッシュボード'));

    await waitFor(() => {
      expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    });
  });

  test('正常系: 保護者モードでは教科セレクター（通常学習ボタン等）が表示されない', async () => {
    renderApp();

    fireEvent.click(screen.getByText('保護者ダッシュボード'));

    await waitFor(() => {
      expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('通常学習')).not.toBeInTheDocument();
    expect(screen.queryByText('テスト復習')).not.toBeInTheDocument();
  });

  test('正常系: 保護者モードでログアウトするとログイン画面に戻る', async () => {
    renderApp();

    // 保護者ログイン
    fireEvent.click(screen.getByText('保護者ダッシュボード'));
    await waitFor(() => {
      expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    });

    // ログアウト
    fireEvent.click(screen.getByLabelText('ログアウト'));

    await waitFor(() => {
      expect(screen.getByText('Select Profile')).toBeInTheDocument();
    });
  });
});
