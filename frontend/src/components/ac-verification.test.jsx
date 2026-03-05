/**
 * Issue #13 (N-007) 受入条件（AC-090〜AC-095）検証テスト
 *
 * - AC-090: スマートフォン（375px 幅）で全画面が正常に表示される
 * - AC-091: タブレット（768px 幅）で全画面が正常に表示される
 * - AC-092: デスクトップ（1024px 幅以上）で全画面が正常に表示される
 * - AC-093: テキストが読みやすいサイズ（最小 14px）
 * - AC-094: タップ領域が最小 44×44px（ボタン・リンク）
 * - AC-095: ESLint エラーなし（別途 lint コマンドで確認済み）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';
import Home from './Home';
import SubjectSelector from './SubjectSelector';
import UnitInput from './UnitInput';
import Quiz from './Quiz';
import { healthCheck } from '../services/api';

/** API モック */
jest.mock('../services/api', () => ({
  healthCheck: jest.fn(),
  API_BASE_URL: 'http://127.0.0.1:8000',
}));

/** テスト用ダミーアイコン */
const MockIcon = () => null;

/** テスト用ダミープロファイル */
const mockProfiles = [
  {
    id: 'p1',
    name: 'テスト太郎',
    color: 'amber',
    icon: MockIcon,
    age: 14,
    gradeLabel: '中学校2年生',
    stage: 'jhs',
  },
];

/** テスト用ダミー教科設定 */
const mockSubjectsConfig = {
  math: { name: '数学', icon: MockIcon, color: 'blue', placeholder: '例：方程式' },
  english: { name: '英語', icon: MockIcon, color: 'indigo', placeholder: '例：be動詞' },
};

/** Home コンポーネントのデフォルト props */
const baseHomeProps = {
  currentUser: { id: 'p1', name: 'テスト太郎', color: 'amber', icon: MockIcon, gradeLabel: '中学校2年生' },
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

/** 保護者ダッシュボード用ダミーソース */
const mockMasterSources = [
  { id: 's1', name: 'テストソース', url: 'https://example.com/test.pdf', active: true },
];

// ============================================================
// AC-090〜092: レスポンシブデザイン
// ============================================================
describe('AC-090〜092: レスポンシブデザイン', () => {
  beforeEach(() => {
    healthCheck.mockReturnValue(new Promise(() => {}));
  });

  test('AC-090/091: Login - sm: ブレークポイントクラスがレンダリング済み HTML に存在する', () => {
    const { container } = render(
      <Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />
    );
    expect(container.innerHTML).toMatch(/sm:/);
  });

  test('AC-091/092: Home - md: ブレークポイントクラス（タブレット以上）が存在する', () => {
    const { container } = render(<Home {...baseHomeProps} />);
    expect(container.innerHTML).toMatch(/md:/);
  });

  test('AC-092: SubjectSelector - デスクトップ向け sm:grid-cols-3 が存在する', () => {
    const { container } = render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    expect(container.innerHTML).toContain('sm:grid-cols-3');
  });

  test('AC-090〜092: UnitInput - sm: ブレークポイントクラスが存在する', () => {
    const { container } = render(
      <UnitInput
        subject="math"
        subjectsConfig={mockSubjectsConfig}
        mode="normal"
        academicStage="jhs"
        inputData={{ unit: '' }}
        setInputData={jest.fn()}
        onGenerate={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(container.innerHTML).toMatch(/sm:/);
  });

  test('AC-090〜092: Quiz 解析中画面 - sm: ブレークポイントクラスが存在する', () => {
    const { container } = render(
      <Quiz
        inputData={{ unit: '連立方程式' }}
        academicStage="jhs"
        mode="normal"
        sourceUrl="https://example.com"
        onBack={jest.fn()}
        analysisStep={0}
        screen="analyzing"
      />
    );
    expect(container.innerHTML).toMatch(/sm:/);
  });

  test('AC-090〜092: Quiz クイズ画面 - sm: ブレークポイントクラスが存在する', () => {
    const { container } = render(
      <Quiz
        inputData={{ unit: '連立方程式' }}
        academicStage="jhs"
        mode="normal"
        sourceUrl="https://example.com"
        onBack={jest.fn()}
        analysisStep={3}
        screen="quiz"
      />
    );
    expect(container.innerHTML).toMatch(/sm:/);
  });

  test('AC-090〜092: Home - min-h-screen で全高表示が保証されている', () => {
    const { container } = render(<Home {...baseHomeProps} />);
    expect(container.innerHTML).toContain('min-h-screen');
  });

  test('AC-090〜092: Login - min-h-screen で全高表示が保証されている', () => {
    const { container } = render(
      <Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />
    );
    expect(container.innerHTML).toContain('min-h-screen');
  });
});

// ============================================================
// AC-093: テキストサイズ最小 14px
// ============================================================
describe('AC-093: テキストサイズ最小 14px', () => {
  beforeEach(() => {
    healthCheck.mockReturnValue(new Promise(() => {}));
  });

  test('AC-093: Login - プロファイル名が text-2xl（24px）以上で表示される', () => {
    render(<Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />);
    const nameEl = screen.getByText('テスト太郎');
    expect(nameEl.className).toMatch(/text-2xl/);
  });

  test('AC-093: Login - 保護者ボタンラベルが text-sm（14px）以上', () => {
    render(<Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />);
    const btn = screen.getByRole('button', { name: '保護者ダッシュボード' });
    expect(btn.className).toMatch(/text-sm/);
  });

  test('AC-093: SubjectSelector - モードボタンが text-sm（14px）', () => {
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: '通常学習' });
    expect(btn.className).toMatch(/text-sm/);
  });

  test('AC-093: SubjectSelector - 教科名テキストが text-sm（14px）', () => {
    render(
      <SubjectSelector
        academicStage="jhs"
        mode="normal"
        onModeChange={jest.fn()}
        subjectsConfig={mockSubjectsConfig}
        onSelectSubject={jest.fn()}
      />
    );
    const span = screen.getByText('数学');
    expect(span.className).toMatch(/text-sm/);
  });

  test('AC-093: Home 保護者ビュー - [最新URLを取得] ボタンに text-xs 未満のクラスを使用しない', () => {
    render(<Home {...baseHomeProps} userRole="parent" currentUser={null} masterSources={[]} />);
    const btn = screen.getByRole('button', { name: /最新URLを取得/ });
    // text-[10px] / text-[9px] / text-[8px] / text-xs は 14px 未満のためNG
    expect(btn.className).not.toMatch(/text-\[(?:8|9|10|11|12|13)px\]|text-xs\b/);
  });

  test('AC-093: Home 保護者ビュー - ソース名が text-xs 未満のサイズでない', () => {
    render(
      <Home
        {...baseHomeProps}
        userRole="parent"
        currentUser={null}
        masterSources={mockMasterSources}
      />
    );
    const sourceNameEl = screen.getByText('テストソース');
    // text-xs (12px) および任意値の小サイズクラスをすべて禁止する
    expect(sourceNameEl.className).not.toMatch(/text-\[(?:8|9|10|11|12|13)px\]|text-xs\b/);
  });

  test('AC-093: UnitInput - AI解析ボタンが text-lg（18px）以上', () => {
    render(
      <UnitInput
        subject="math"
        subjectsConfig={mockSubjectsConfig}
        mode="normal"
        academicStage="jhs"
        inputData={{ unit: 'テスト単元' }}
        setInputData={jest.fn()}
        onGenerate={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: 'AI解析を開始' });
    expect(btn.className).toMatch(/text-lg/);
  });

  test('AC-093: Quiz - 答え合わせボタンが text-lg（18px）以上', () => {
    render(
      <Quiz
        inputData={{ unit: '連立方程式' }}
        academicStage="jhs"
        mode="normal"
        sourceUrl="https://example.com"
        onBack={jest.fn()}
        analysisStep={3}
        screen="quiz"
      />
    );
    const btn = screen.getByTestId('check-answer-button');
    expect(btn.className).toMatch(/text-lg/);
  });
});

// ============================================================
// AC-094: タップ領域最小 44×44px
// ============================================================
describe('AC-094: タップ領域最小 44×44px', () => {
  beforeEach(() => {
    healthCheck.mockReturnValue(new Promise(() => {}));
  });

  test('AC-094: Home - ログアウトボタンが min-h-[44px] min-w-[44px] を持つ', () => {
    render(<Home {...baseHomeProps} />);
    const btn = screen.getByRole('button', { name: 'ログアウト' });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
    expect(btn.className).toMatch(/min-w-\[44px\]/);
  });

  test('AC-094: Home 保護者ビュー - [最新URLを取得] ボタンが min-h-[44px] を持つ', () => {
    render(<Home {...baseHomeProps} userRole="parent" currentUser={null} masterSources={[]} />);
    const btn = screen.getByRole('button', { name: /最新URLを取得/ });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  test('AC-094: Home 保護者ビュー - ソーストグルが button 要素で min-h-[44px] min-w-[44px] を持つ', () => {
    render(
      <Home
        {...baseHomeProps}
        userRole="parent"
        currentUser={null}
        masterSources={mockMasterSources}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /無効化|有効化/ });
    expect(toggleBtn.tagName).toBe('BUTTON');
    expect(toggleBtn.className).toMatch(/min-h-\[44px\]/);
    expect(toggleBtn.className).toMatch(/min-w-\[44px\]/);
  });

  test('AC-094: Home 保護者ビュー - 外部リンク "内容を確認" が min-h-[44px] を持つ', () => {
    render(
      <Home
        {...baseHomeProps}
        userRole="parent"
        currentUser={null}
        masterSources={mockMasterSources}
      />
    );
    const link = screen.getByTestId('external-link');
    expect(link.className).toMatch(/min-h-\[44px\]/);
  });

  test('AC-094: Quiz - [証拠を表示] ボタンが min-h-[44px] を持つ', () => {
    render(
      <Quiz
        inputData={{ unit: '連立方程式' }}
        academicStage="jhs"
        mode="normal"
        sourceUrl="https://example.com"
        onBack={jest.fn()}
        analysisStep={3}
        screen="quiz"
      />
    );
    const btn = screen.getByRole('button', { name: /証拠を表示/ });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  test('AC-094: UnitInput - ホームボタンが min-w-[95px] で幅を確保している', () => {
    render(
      <UnitInput
        subject="math"
        subjectsConfig={mockSubjectsConfig}
        mode="normal"
        academicStage="jhs"
        inputData={{ unit: '' }}
        setInputData={jest.fn()}
        onGenerate={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: 'ホーム' });
    expect(btn.className).toMatch(/min-w-\[95px\]/);
  });

  test('AC-094: Login - プロファイルボタンが p-5 以上（~72px 高さ）を持つ', () => {
    render(<Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /テスト太郎/ });
    // p-5 = 20px × 4 + コンテンツ高さ >> 44px
    expect(btn.className).toMatch(/p-5/);
  });

  test('AC-094: Login - 保護者ボタンが p-6 で十分なタップ領域を持つ', () => {
    render(<Login profiles={mockProfiles} onLogin={jest.fn()} onParentLogin={jest.fn()} />);
    const btn = screen.getByRole('button', { name: '保護者ダッシュボード' });
    expect(btn.className).toMatch(/p-6/);
  });
});
