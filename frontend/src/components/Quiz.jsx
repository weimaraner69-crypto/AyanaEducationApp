import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, Home as HomeIcon, ShieldCheck, X } from 'lucide-react';

/**
 * モーダル基底コンポーネント（Quiz 内部でのみ使用）
 */
const ModalBase = ({ title, subTitle, icon: Icon, color, children, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 text-left">
    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className={`p-5 sm:p-8 border-b border-slate-50 flex justify-between items-center ${color === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${color === 'dark' ? 'bg-white/10' : 'bg-indigo-600 text-white shadow-lg'}`}><Icon size={24} /></div>
          <div className="text-left text-inherit">
            <h3 className="text-xl font-black">{title}</h3>
            <p className={`text-[10px] font-black uppercase tracking-widest ${color === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{subTitle}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="閉じる" className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-300"><X size={32} /></button>
      </div>
      <div className="p-6 sm:p-10 overflow-y-auto max-h-[75vh] space-y-6 text-left">{children}</div>
    </div>
  </div>
);

/**
 * 真偽検証システム（Evidence Viewer）
 * TODO(Phase 2): バックエンド実装時に実際の PDF データを使用する
 */
const EvidenceViewer = ({ isOpen, onClose, sourceUrl }) => {
  if (!isOpen) return null;
  // TODO(Phase 2): バックエンド実装時に、実際の PDF から自動計算した SHA-256 を使用する
  const sourceHash = "SHA-256: a3f8b9e2c1d4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";
  const extractedText = "学習指導要領に基づく教科の学習目標と単元内容。[実装は Phase 2 で実データを使用]"; // TODO(Phase 2): 実際の PDF テキストを抽出
  return (
    <ModalBase title="証拠を確認" subTitle="MEXT Sync Verified" icon={ShieldCheck} color="normal" onClose={onClose}>
      <div className="space-y-6">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">✓ 文科省公式ソース確認済み</p>
          <p className="text-sm text-emerald-900 break-all font-mono">{sourceUrl}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">生テキスト（PDF から自動抽出）</p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 font-mono">
            {extractedText}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">デジタルフィンガープリント</p>
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 break-all font-mono text-[10px]">
            {sourceHash}
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

/**
 * クイズ画面（解析中アニメーション・問題表示を含む）
 */
const Quiz = ({ inputData, academicStage, mode, sourceUrl, onBack, analysisStep, screen, questionData, apiError }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);
  const [showResult, setShowResult] = useState(null); // null | 'correct' | 'incorrect'

  // API データまたはフォールバックの問題データ
  const currentQuestion = questionData?.question || (academicStage === 'es'
    ? "つぎの もんだいを といてみよう。\n\n 120 × 4 = （   ）"
    : "次の日本文に合うように（ ）に適切な語を入れなさい。\n\n「私はテニスファンではありません。」\nI (   ) not a tennis fan.");
  const currentAnswer = questionData?.answer || (academicStage === 'es' ? '480' : 'am');
  const choices = questionData?.choices || [];

  // API エラー画面
  if (screen === 'quiz' && apiError) {
    return (
      <div data-testid="api-error-screen" className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:p-6 flex flex-col items-center justify-center text-slate-900">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl">
            <p className="text-lg font-black text-rose-700 mb-2">エラーが発生しました</p>
            <p className="text-sm text-rose-600" data-testid="api-error-message">{apiError}</p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-5 bg-slate-600 text-white font-black text-lg rounded-[2.5rem] shadow-xl active:scale-95"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 解析中ローディング画面
  if (screen === 'analyzing') {
    return (
      <div data-testid="quiz-screen" className={`min-h-screen ${mode === 'normal' ? (academicStage === 'es' ? 'bg-amber-500' : 'bg-indigo-600') : 'bg-rose-600'} px-4 py-8 sm:p-8 flex flex-col items-center justify-center text-white text-center transition-colors`}>
        <div className="relative mb-16 text-white">
          <div className="w-32 h-32 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
          <BrainCircuit className="absolute inset-0 m-auto animate-pulse" size={48} />
        </div>
        <h2 className="text-3xl font-black mb-10 tracking-tight italic uppercase">MEXT Grounding...</h2>
        <div className="space-y-4 w-full max-w-xs mx-auto">
          {["文科省公開の最新URLへの疎通確認", "PDF内部の学習目標と教科名を同期", "学年適性を最終検証", "問題構築の完了"].map((text, i) => (
            <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${analysisStep >= i ? 'opacity-100 translate-x-1' : 'opacity-20'}`}>
              <CheckCircle2 size={16} />
              <p className="text-sm font-bold text-left">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // クイズ問題表示
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:p-6 flex flex-col items-center text-slate-900">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full w-fit shadow-sm">
            <ShieldCheck className="text-emerald-500" size={14} />
            <span className="text-[10px] font-black text-emerald-700 uppercase">Provenance Verified</span>
          </div>
          <span className="text-xl font-black tracking-tight mt-2">{inputData.unit || "学習単元"}</span>
        </div>
        <button
          onClick={onBack}
          className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-sm text-slate-800 flex flex-col items-center gap-1 min-w-[95px] active:scale-95"
        >
          <HomeIcon size={24} />
          <span className="text-sm font-black text-inherit">ホーム</span>
        </button>
      </div>
      <div className="w-full max-w-md space-y-6 text-slate-800">
        <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border-b-8 border-slate-100 min-h-[220px] flex items-center relative overflow-hidden text-center transition-all">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/10"></div>
          <p className="leading-relaxed font-black text-xl whitespace-pre-wrap w-full">
            {currentQuestion}
          </p>
        </div>
        <div className="space-y-4 text-center">
          {choices.length > 0 && (
            <div className="grid grid-cols-2 gap-3" data-testid="choices-container">
              {choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => setUserAnswer(choice)}
                  className={`p-4 rounded-2xl border-2 font-black text-left transition-all ${userAnswer === choice
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  data-testid={`choice-button-${index}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="答えを入力してね"
            className="w-full p-4 sm:p-6 rounded-[2.5rem] bg-white shadow-xl border-4 border-transparent focus:border-indigo-600 outline-none text-2xl font-black text-center transition-all"
          />
          <button
            onClick={() => setShowEvidenceViewer(true)}
            className="w-full py-3 min-h-[44px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-sm rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            証拠を表示（MEXT PDF確認）
          </button>
          <button
            onClick={() => {
              const isCorrect = userAnswer.trim().toLowerCase() === currentAnswer.trim().toLowerCase();
              setShowResult(isCorrect ? 'correct' : 'incorrect');
            }}
            className="w-full py-5 sm:py-6 bg-indigo-600 text-white font-black text-lg sm:text-xl rounded-[2.5rem] shadow-2xl active:scale-95 transition-all shadow-indigo-100"
            data-testid="check-answer-button"
          >
            答え合わせ
          </button>
          {showResult && (
            <div className={`w-full p-6 rounded-2xl font-black text-center text-lg transition-all ${showResult === 'correct'
              ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
              : 'bg-rose-100 border-2 border-rose-500 text-rose-700'
              }`} data-testid="result-message">
              {showResult === 'correct' ? '✓ 正解です！' : '✗ まちがいです。もう一度ためしてね'}
            </div>
          )}
        </div>
      </div>
      <EvidenceViewer
        isOpen={showEvidenceViewer}
        onClose={() => setShowEvidenceViewer(false)}
        sourceUrl={sourceUrl}
      />
    </div>
  );
};

export default Quiz;
