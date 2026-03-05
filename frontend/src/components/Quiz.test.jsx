import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Quiz from './Quiz';

/** デフォルト props */
const baseProps = {
  inputData: { unit: '連立方程式', image: null },
  academicStage: 'jhs',
  mode: 'normal',
  sourceUrl: 'https://example.com/source.pdf',
  onBack: jest.fn(),
  analysisStep: 0,
  screen: 'analyzing',
};

describe('Quiz コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 答え合わせボタンの console.log を抑制する
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('解析中画面（screen="analyzing"）', () => {
    test('正常系: MEXT Grounding テキストが表示される', () => {
      render(<Quiz {...baseProps} screen="analyzing" />);
      expect(screen.getByText(/MEXT Grounding/i)).toBeInTheDocument();
    });

    test('正常系: analysisStep=0 で最初のステップが存在する', () => {
      render(<Quiz {...baseProps} screen="analyzing" analysisStep={0} />);
      expect(screen.getByText('文科省公開の最新URLへの疎通確認')).toBeInTheDocument();
    });

    test('正常系: すべての解析ステップテキストが DOM に含まれる', () => {
      render(<Quiz {...baseProps} screen="analyzing" analysisStep={3} />);
      expect(screen.getByText('PDF内部の学習目標と教科名を同期')).toBeInTheDocument();
      expect(screen.getByText('学年適性を最終検証')).toBeInTheDocument();
      expect(screen.getByText('問題構築の完了')).toBeInTheDocument();
    });
  });

  describe('クイズ画面（screen="quiz"）', () => {
    test('正常系: 中学生向け問題テキストが表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" academicStage="jhs" />);
      expect(screen.getByText(/次の日本文に合うように/)).toBeInTheDocument();
    });

    test('正常系: 小学生向け問題テキストが表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" academicStage="es" />);
      expect(screen.getByText(/つぎの もんだいを といてみよう/)).toBeInTheDocument();
    });

    test('インタラクション: 答え入力フィールドにテキストを入力できる', () => {
      render(<Quiz {...baseProps} screen="quiz" />);
      const input = screen.getByPlaceholderText('答えを入力してね');
      fireEvent.change(input, { target: { value: 'am' } });
      expect(input.value).toBe('am');
    });

    test('インタラクション: 「証拠を表示」ボタンクリックで Evidence Viewer が開く', () => {
      render(<Quiz {...baseProps} screen="quiz" />);
      fireEvent.click(screen.getByText(/証拠を表示/));
      expect(screen.getByText('証拠を確認')).toBeInTheDocument();
    });

    test('正常系: Evidence Viewer に sourceUrl が表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" />);
      fireEvent.click(screen.getByText(/証拠を表示/));
      expect(screen.getByText('https://example.com/source.pdf')).toBeInTheDocument();
    });

    test('インタラクション: Evidence Viewer の閉じるボタンで閉じる', () => {
      const { container } = render(<Quiz {...baseProps} screen="quiz" />);
      fireEvent.click(screen.getByText(/証拠を表示/));
      expect(screen.getByText('証拠を確認')).toBeInTheDocument();
      // X ボタンは rounded-full クラスを持つ唯一のボタン
      const closeBtn = container.querySelector('button.rounded-full');
      fireEvent.click(closeBtn);
      expect(screen.queryByText('証拠を確認')).not.toBeInTheDocument();
    });

    test('インタラクション: ホームボタンクリックで onBack が呼ばれる', () => {
      const handleBack = jest.fn();
      render(<Quiz {...baseProps} screen="quiz" onBack={handleBack} />);
      fireEvent.click(screen.getByText('ホーム'));
      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    test('正常系: 単元名がヘッダーに表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" inputData={{ unit: '連立方程式' }} />);
      expect(screen.getByText('連立方程式')).toBeInTheDocument();
    });

    test('境界値: unit が空文字の場合はフォールバックテキストが表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" inputData={{ unit: '' }} />);
      expect(screen.getByText('学習単元')).toBeInTheDocument();
    });
  });
});
