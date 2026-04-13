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
    jest.spyOn(console, 'log').mockImplementation(() => { });
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
      render(<Quiz {...baseProps} screen="quiz" />);
      fireEvent.click(screen.getByText(/証拠を表示/));
      expect(screen.getByText('証拠を確認')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: '閉じる' });
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

  describe('APIデータ表示（B-009）', () => {
    const apiQuestionData = {
      question: 'テスト問題: ____に基づく教科の学習',
      choices: ['学習指導要領', 'ダミー1', 'ダミー2', 'ダミー3'],
      answer: '学習指導要領',
      meta: { source: 'rule-based' },
    };

    test('正常系: questionData がある場合、API生成の問題文が表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={apiQuestionData} />);
      expect(screen.getByText(/テスト問題: ____に基づく/)).toBeInTheDocument();
    });

    test('正常系: questionData の選択肢ボタンが表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={apiQuestionData} />);
      expect(screen.getByTestId('choices-container')).toBeInTheDocument();
      expect(screen.getByText('学習指導要領')).toBeInTheDocument();
      expect(screen.getByText('ダミー1')).toBeInTheDocument();
      expect(screen.getByText('ダミー2')).toBeInTheDocument();
      expect(screen.getByText('ダミー3')).toBeInTheDocument();
    });

    test('インタラクション: 選択肢をクリックすると回答欄に反映される', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={apiQuestionData} />);
      fireEvent.click(screen.getByTestId('choice-button-0'));
      const input = screen.getByPlaceholderText('答えを入力してね');
      expect(input.value).toBe(apiQuestionData.choices[0]);
    });

    test('正常系: API生成の正答で答え合わせすると正解になる', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={apiQuestionData} />);
      const input = screen.getByPlaceholderText('答えを入力してね');
      fireEvent.change(input, { target: { value: '学習指導要領' } });
      fireEvent.click(screen.getByTestId('check-answer-button'));
      expect(screen.getByTestId('result-message')).toHaveTextContent('正解です');
    });

    test('正常系: API生成の問題で不正解の場合', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={apiQuestionData} />);
      const input = screen.getByPlaceholderText('答えを入力してね');
      fireEvent.change(input, { target: { value: 'ダミー1' } });
      fireEvent.click(screen.getByTestId('check-answer-button'));
      expect(screen.getByTestId('result-message')).toHaveTextContent('まちがいです');
    });

    test('境界値: questionData が null の場合はフォールバック問題が表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" questionData={null} />);
      expect(screen.getByText(/次の日本文に合うように/)).toBeInTheDocument();
    });

    test('境界値: choices が空配列の場合は選択肢ボタンが表示されない', () => {
      const noChoices = { ...apiQuestionData, choices: [] };
      render(<Quiz {...baseProps} screen="quiz" questionData={noChoices} />);
      expect(screen.queryByTestId('choices-container')).not.toBeInTheDocument();
    });
  });

  describe('APIエラー画面（B-009）', () => {
    test('エラー系: apiError がある場合、エラー画面が表示される', () => {
      render(<Quiz {...baseProps} screen="quiz" apiError="PDF解析に失敗しました" />);
      expect(screen.getByTestId('api-error-screen')).toBeInTheDocument();
      expect(screen.getByTestId('api-error-message')).toHaveTextContent('PDF解析に失敗しました');
    });

    test('エラー系: エラー画面の「ホームに戻る」ボタンで onBack が呼ばれる', () => {
      const handleBack = jest.fn();
      render(<Quiz {...baseProps} screen="quiz" apiError="エラー" onBack={handleBack} />);
      fireEvent.click(screen.getByText('ホームに戻る'));
      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    test('境界値: screen が analyzing の場合は apiError があっても解析画面が表示される', () => {
      render(<Quiz {...baseProps} screen="analyzing" apiError="エラー" />);
      expect(screen.getByText(/MEXT Grounding/i)).toBeInTheDocument();
      expect(screen.queryByTestId('api-error-screen')).not.toBeInTheDocument();
    });
  });
});
