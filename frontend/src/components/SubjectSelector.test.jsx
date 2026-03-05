import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubjectSelector from './SubjectSelector';

/** テスト用ダミーアイコン */
const MockIcon = () => null;

/** ダミー教科設定（中学校） */
const mockSubjectsConfig = {
  math: { name: '数学', icon: MockIcon, color: 'blue', placeholder: '例：連立方程式' },
  english: { name: '英語', icon: MockIcon, color: 'indigo', placeholder: '例：be動詞' },
  science: { name: '理科', icon: MockIcon, color: 'emerald', placeholder: '例：回路と電流' },
};

describe('SubjectSelector コンポーネント', () => {
  test('正常系: 通常学習・テスト復習ボタンが表示される（中学校ステージ）', () => {
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    expect(screen.getByText('通常学習')).toBeInTheDocument();
    expect(screen.getByText('テスト復習')).toBeInTheDocument();
  });

  test('正常系: 小学校ステージでは日本語ラベルが表示される', () => {
    render(
      <SubjectSelector
        academicStage="es"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    expect(screen.getByText('いつものべんきょう')).toBeInTheDocument();
    expect(screen.getByText('テストのなおし')).toBeInTheDocument();
  });

  test('インタラクション: 通常学習ボタンクリックで onModeChange("normal") が呼ばれる', () => {
    const handleModeChange = jest.fn();
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="review"
        onModeChange={handleModeChange}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('通常学習'));
    expect(handleModeChange).toHaveBeenCalledWith('normal');
  });

  test('インタラクション: テスト復習ボタンクリックで onModeChange("review") が呼ばれる', () => {
    const handleModeChange = jest.fn();
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={handleModeChange}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('テスト復習'));
    expect(handleModeChange).toHaveBeenCalledWith('review');
  });

  test('正常系: subjectsConfig のすべての教科ボタンが表示される', () => {
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    expect(screen.getByText('数学')).toBeInTheDocument();
    expect(screen.getByText('英語')).toBeInTheDocument();
    expect(screen.getByText('理科')).toBeInTheDocument();
  });

  test('インタラクション: 教科ボタンクリックで onSelectSubject が正しいキーで呼ばれる', () => {
    const handleSelectSubject = jest.fn();
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={handleSelectSubject}
      />
    );
    fireEvent.click(screen.getByText('数学'));
    expect(handleSelectSubject).toHaveBeenCalledWith('math');
  });

  test('境界値: 教科設定が空オブジェクトの場合は教科ボタンが表示されない', () => {
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={{}}
        onSelectSubject={jest.fn()}
      />
    );
    expect(screen.queryByText('数学')).not.toBeInTheDocument();
  });
});
