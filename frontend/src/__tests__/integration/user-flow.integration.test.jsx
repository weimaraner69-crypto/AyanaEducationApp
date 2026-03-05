/**
 * 統合テスト: ユーザー完全フロー（AC-1）・保護者モード切り替え（AC-2）
 *
 * - AC-1: ログイン→ホーム→教科選択→単元入力→クイズの一連フロー
 * - AC-2: 保護者モード切り替え時の画面状態変更を検証
 *
 * MemoryRouter を使用してルーティングをシミュレートし、
 * React 19 + React Router v6 環境で動作することを確認する。
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { healthCheck } from '../../services/api';

/** services/api をモック化してネットワークアクセスを排除する */
jest.mock('../../services/api', () => ({
  healthCheck: jest.fn(),
  API_BASE_URL: 'http://127.0.0.1:8000',
}));

/**
 * App コンポーネントを MemoryRouter でラップしてレンダリングするヘルパー
 * @param {string[]} initialEntries - 初期ルートパス（デフォルト: /login）
 */
const renderApp = (initialEntries = ['/login']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );

// ============================================================
// AC-1: ユーザー完全フロー
// ============================================================
describe('AC-1: ユーザー完全フロー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ローディング状態を維持するため、解決しない Promise を返す
    healthCheck.mockReturnValue(new Promise(() => {}));
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
      expect(screen.getByText(/MEXT Grounding/i)).toBeInTheDocument();
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
// AC-2: 保護者モード切り替え
// ============================================================
describe('AC-2: 保護者モード切り替え', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck.mockReturnValue(new Promise(() => {}));
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
