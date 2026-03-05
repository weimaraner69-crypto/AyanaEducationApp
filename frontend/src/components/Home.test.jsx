import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from './Home';
import { healthCheck } from '../services/api';

/** services/api をモック化してネットワークアクセスを排除する */
jest.mock('../services/api', () => ({
  healthCheck: jest.fn(),
  API_BASE_URL: 'http://127.0.0.1:8000',
}));

/** テスト用ダミーアイコン */
const MockIcon = () => null;

/** 学生ユーザーのダミーデータ */
const mockCurrentUser = {
  id: 'user_a',
  name: 'ユーザーA',
  color: 'amber',
  icon: MockIcon,
  gradeLabel: '中学校2年生',
};

/** ダミー教科設定 */
const mockSubjectsConfig = {
  math: { name: '数学', icon: MockIcon, color: 'blue', placeholder: '例：連立方程式' },
  english: { name: '英語', icon: MockIcon, color: 'indigo', placeholder: '例：be動詞' },
};

/** デフォルト props */
const baseProps = {
  currentUser: mockCurrentUser,
  userRole: 'student',
  academicStage: 'jhs',
  mode: 'normal',
  onModeChange: jest.fn(),
  subjectsConfig: mockSubjectsConfig,
  onSelectSubject: jest.fn(),
  onLogout: jest.fn(),
  masterSources: [],
  setMasterSources: jest.fn(),
};

describe('Home コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常系: 初期状態で "接続確認中..." が表示される', () => {
    // 永遠に解決しない Promise でローディング状態を維持する
    healthCheck.mockReturnValue(new Promise(() => { }));
    render(<Home {...baseProps} />);
    expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続確認中...');
  });

  test('正常系: ヘルスチェック成功時に接続成功メッセージが表示される', async () => {
    healthCheck.mockResolvedValue({ ok: true, data: { status: 'ok' } });
    render(<Home {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続成功: ok');
    });
  });

  test('エラー系: ヘルスチェック失敗時に接続失敗メッセージが表示される', async () => {
    healthCheck.mockResolvedValue({ ok: false, message: 'バックエンドに接続できません' });
    render(<Home {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent(
        '接続失敗: バックエンドに接続できません'
      );
    });
  });

  test('エラー系: ヘルスチェックタイムアウト時にエラーメッセージが表示される', async () => {
    healthCheck.mockResolvedValue({
      ok: false,
      timeout: true,
      message: 'タイムアウト（5秒以上応答がありません）',
    });
    render(<Home {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続失敗: タイムアウト');
    });
  });

  test('正常系: 学生ビューでは教科セレクターが表示される', () => {
    healthCheck.mockReturnValue(new Promise(() => { }));
    render(<Home {...baseProps} userRole="student" />);
    expect(screen.getByText('数学')).toBeInTheDocument();
    expect(screen.getByText('英語')).toBeInTheDocument();
  });

  test('正常系: 保護者ビューでは Parent Dashboard が表示される', () => {
    healthCheck.mockReturnValue(new Promise(() => { }));
    render(<Home {...baseProps} userRole="parent" currentUser={null} />);
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
  });

  test('インタラクション: ログアウトボタンクリックで onLogout が呼ばれる', () => {
    healthCheck.mockReturnValue(new Promise(() => { }));
    const handleLogout = jest.fn();
    const { container } = render(<Home {...baseProps} onLogout={handleLogout} />);
    // ログアウトボタンは text-rose-500 クラスを持つ唯一のボタン
    const logoutBtn = container.querySelector('button.text-rose-500');
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  test('正常系: ユーザー名がヘッダーに表示される', () => {
    healthCheck.mockReturnValue(new Promise(() => { }));
    render(<Home {...baseProps} />);
    expect(screen.getByText('ユーザーA さん')).toBeInTheDocument();
  });

  test('エラー系: ヘルスチェックがキャンセルされた場合、setState が呼ばれない', async () => {
    healthCheck.mockResolvedValue({ ok: false, cancelled: true });
    render(<Home {...baseProps} />);
    // cancelled: true の場合、api-health-message の内容が "接続確認中..." のままで変更されないことを確認
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続確認中...');
    });
  });

  test('エラー系: ヘルスチェックで HTTP 503 エラーが返される', async () => {
    healthCheck.mockResolvedValue({
      ok: false,
      message: 'HTTP 503',
    });
    render(<Home {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続失敗: HTTP 503');
    });
  });
});
