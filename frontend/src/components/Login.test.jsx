import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

/** テスト用ダミーアイコンコンポーネント */
const MockIcon = () => null;

/** テスト用ダミープロファイルデータ */
const mockProfiles = [
  {
    id: 'user_a',
    name: 'ユーザーA',
    color: 'amber',
    icon: MockIcon,
    age: 14,
    gradeLabel: '中学校2年生',
    stage: 'jhs',
  },
  {
    id: 'user_b',
    name: 'ユーザーB',
    color: 'indigo',
    icon: MockIcon,
    age: 13,
    gradeLabel: '中学校1年生',
    stage: 'jhs',
  },
];

describe('Login コンポーネント', () => {
  test('正常系: プロファイルボタンが表示される', () => {
    render(
      <Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />
    );
    expect(screen.getByText('ユーザーA')).toBeInTheDocument();
    expect(screen.getByText('ユーザーB')).toBeInTheDocument();
  });

  test('正常系: プロファイル選択時に onLogin が正しい引数で呼ばれる', () => {
    const handleLogin = jest.fn();
    render(
      <Login profiles={mockProfiles} onLogin={handleLogin} onParentLogin={jest.fn()} />
    );
    fireEvent.click(screen.getByText('ユーザーA'));
    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(handleLogin).toHaveBeenCalledWith(mockProfiles[0]);
  });

  test('正常系: 2つ目のプロファイル選択で正しいプロファイルが渡される', () => {
    const handleLogin = jest.fn();
    render(
      <Login profiles={mockProfiles} onLogin={handleLogin} onParentLogin={jest.fn()} />
    );
    fireEvent.click(screen.getByText('ユーザーB'));
    expect(handleLogin).toHaveBeenCalledWith(mockProfiles[1]);
  });

  test('正常系: 保護者ダッシュボードボタンクリックで onParentLogin が呼ばれる', () => {
    const handleParentLogin = jest.fn();
    render(
      <Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={handleParentLogin} />
    );
    fireEvent.click(screen.getByText('保護者ダッシュボード'));
    expect(handleParentLogin).toHaveBeenCalledTimes(1);
  });

  test('境界値: プロファイルが空配列の場合はプロファイルボタンが表示されない', () => {
    render(<Login profiles={[]} onLogin={jest.fn()} onParentLogin={jest.fn()} />);
    expect(screen.queryByText('ユーザーA')).not.toBeInTheDocument();
    expect(screen.queryByText('ユーザーB')).not.toBeInTheDocument();
  });

  test('正常系: 各プロファイルの年齢と学年ラベルが表示される', () => {
    render(
      <Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />
    );
    expect(screen.getByText('14歳')).toBeInTheDocument();
    expect(screen.getByText('中学校2年生')).toBeInTheDocument();
    expect(screen.getByText('13歳')).toBeInTheDocument();
    expect(screen.getByText('中学校1年生')).toBeInTheDocument();
  });
});
