import { render, screen } from '@testing-library/react';
import App from './App';

// ログイン画面にプロファイル選択ボタンが表示されることを確認
test('renders profile selection buttons on login screen', () => {
  render(<App />);
  // ユーザーA・ユーザーB のプロファイルボタンが存在することを検証
  const userAButton = screen.getByText(/ユーザーA/i);
  const userBButton = screen.getByText(/ユーザーB/i);
  expect(userAButton).toBeInTheDocument();
  expect(userBButton).toBeInTheDocument();
});
