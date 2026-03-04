import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

// ログイン画面にプロファイル選択ボタンが表示されることを確認
test('renders profile selection buttons on login screen', () => {
  render(<App />);
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

  render(<App />);
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

  render(<App />);
  fireEvent.click(screen.getByText(/ユーザーA/i));

  await waitFor(() => {
    expect(screen.getByTestId('api-health-message')).toHaveTextContent('接続失敗: バックエンドに接続できません');
  });

  fetchMock.mockRestore();
});
