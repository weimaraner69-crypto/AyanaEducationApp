import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

/** テスト用ラッパー：MemoryRouter で App を包む */
const renderApp = (initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
};

// ログイン画面にプロファイル選択ボタンが表示されることを確認
test('renders profile selection buttons on login screen', () => {
  renderApp('/login');
  const userAButton = screen.getByText(/ユーザーA/i);
  const userBButton = screen.getByText(/ユーザーB/i);
  expect(userAButton).toBeInTheDocument();
  expect(userBButton).toBeInTheDocument();
});

test('shows backend health status when health API succeeds', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'ok' }),
  });

  renderApp('/login');
  fireEvent.click(screen.getByText(/ユーザーA/i));

  await waitFor(() => {
    expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続成功: ok');
  });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://127.0.0.1:8000/api/health',
    expect.objectContaining({ method: 'GET' }),
  );
  fetchMock.mockRestore();
});

test('shows backend error message when health API fails', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));

  renderApp('/login');
  fireEvent.click(screen.getByText(/ユーザーA/i));

  await waitFor(() => {
    expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続失敗: バックエンドに接続できません');
  });

  fetchMock.mockRestore();
});

test('shows error message when health API returns HTTP 503', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
  });

  renderApp('/login');
  fireEvent.click(screen.getByText(/ユーザーA/i));

  await waitFor(() => {
    expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続失敗: HTTP 503');
  });

  fetchMock.mockRestore();
});

// --- ルーティング画面遷移テスト（N-005 追加） ---

describe('ルーティング画面遷移', () => {
  beforeEach(() => {
    // ヘルスチェック API をモック化する
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ルート "/" にアクセスするとログイン画面にリダイレクトされる', () => {
    renderApp('/');
    expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
  });

  test('未知のパスにアクセスするとログイン画面にリダイレクトされる', () => {
    renderApp('/unknown-path');
    expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
  });

  test('/login でログイン画面が表示される', () => {
    renderApp('/login');
    expect(screen.getByText('MiraStudy')).toBeInTheDocument();
    expect(screen.getByText(/ユーザーA/i)).toBeInTheDocument();
    expect(screen.getByText(/ユーザーB/i)).toBeInTheDocument();
  });

  test('未認証で /home にアクセスするとログイン画面にリダイレクトされる', () => {
    renderApp('/home');
    expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
  });

  test('未認証で /unit-input にアクセスするとログイン画面にリダイレクトされる', () => {
    renderApp('/unit-input');
    expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
  });

  test('未認証で /quiz にアクセスするとログイン画面にリダイレクトされる', () => {
    renderApp('/quiz');
    expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
  });

  test('ログイン後にホーム画面へ遷移する', async () => {
    renderApp('/login');
    fireEvent.click(screen.getByText(/ユーザーA/i));
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toBeInTheDocument();
    });
  });

  test('ホーム画面で教科を選択すると単元入力画面へ遷移する', async () => {
    renderApp('/login');
    fireEvent.click(screen.getByText(/ユーザーA/i));
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toBeInTheDocument();
    });
    // 教科選択（数学 or 算数）
    const mathButton = screen.getByText('数学') || screen.getByText('算数');
    fireEvent.click(mathButton);
    // 単元入力画面の要素が表示される
    await waitFor(() => {
      expect(screen.getByText('AI解析を開始')).toBeInTheDocument();
    });
  });

  test('ログアウトするとログイン画面に遷移する', async () => {
    renderApp('/login');
    fireEvent.click(screen.getByText(/ユーザーA/i));
    await waitFor(() => {
      expect(screen.getByTestId('api-health-message')).toBeInTheDocument();
    });
    // ログアウトボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    await waitFor(() => {
      expect(screen.getByText(/Select Profile/i)).toBeInTheDocument();
    });
  });

  test('保護者ダッシュボードに遷移できる', async () => {
    renderApp('/login');
    fireEvent.click(screen.getByText('保護者ダッシュボード'));
    await waitFor(() => {
      expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    });
  });
});
