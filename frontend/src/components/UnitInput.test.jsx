import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UnitInput from './UnitInput';

/** テスト用ダミーアイコン */
const MockIcon = () => null;

/** ダミー教科設定 */
const mockSubjectsConfig = {
  math: { name: '数学', icon: MockIcon, color: 'blue', placeholder: '例：連立方程式' },
  english: { name: '英語', icon: MockIcon, color: 'indigo', placeholder: '例：be動詞' },
};

/** デフォルト props */
const baseProps = {
  subject: 'math',
  subjectsConfig: mockSubjectsConfig,
  mode: 'normal',
  academicStage: 'jhs',
  inputData: { unit: '', image: null },
  setInputData: jest.fn(),
  onGenerate: jest.fn(),
  onBack: jest.fn(),
};

describe('UnitInput コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常系: 単元入力フィールドが表示される', () => {
    render(<UnitInput {...baseProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('正常系: 教科名が画面に表示される', () => {
    render(<UnitInput {...baseProps} />);
    expect(screen.getByText('数学の学習')).toBeInTheDocument();
  });

  test('境界値: unit が空文字の場合、AI解析ボタンが無効化される', () => {
    render(<UnitInput {...baseProps} inputData={{ unit: '', image: null }} />);
    expect(screen.getByText('AI解析を開始')).toBeDisabled();
  });

  test('正常系: unit が入力済みの場合、AI解析ボタンが有効になる', () => {
    render(<UnitInput {...baseProps} inputData={{ unit: '連立方程式', image: null }} />);
    expect(screen.getByText('AI解析を開始')).toBeEnabled();
  });

  test('インタラクション: 有効な入力でボタンクリックすると onGenerate が呼ばれる', () => {
    const handleGenerate = jest.fn();
    render(
      <UnitInput
        {...baseProps}
        inputData={{ unit: '連立方程式', image: null }}
        onGenerate={handleGenerate}
      />
    );
    fireEvent.click(screen.getByText('AI解析を開始'));
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  test('インタラクション: ホームボタンクリックで onBack が呼ばれる', () => {
    const handleBack = jest.fn();
    render(<UnitInput {...baseProps} onBack={handleBack} />);
    fireEvent.click(screen.getByText('ホーム'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  test('インタラクション: テキスト入力で setInputData が正しい引数で呼ばれる', () => {
    const handleSetInputData = jest.fn();
    render(
      <UnitInput
        {...baseProps}
        inputData={{ unit: '', image: null }}
        setInputData={handleSetInputData}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '一次関数' } });
    expect(handleSetInputData).toHaveBeenCalledWith(
      expect.objectContaining({ unit: '一次関数' })
    );
  });

  test('境界値: 200文字の長い入力でもボタンが有効になる', () => {
    const longUnit = 'あ'.repeat(200);
    render(<UnitInput {...baseProps} inputData={{ unit: longUnit, image: null }} />);
    expect(screen.getByText('AI解析を開始')).toBeEnabled();
  });

  test('正常系: 通常学習モードのラベルが表示される', () => {
    render(<UnitInput {...baseProps} mode="normal" />);
    expect(screen.getByText('通常学習')).toBeInTheDocument();
  });

  test('正常系: テスト復習モードのラベルが表示される', () => {
    render(<UnitInput {...baseProps} mode="review" />);
    expect(screen.getByText('テスト復習')).toBeInTheDocument();
  });
});
