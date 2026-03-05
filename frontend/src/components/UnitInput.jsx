import React from 'react';
import { Home as HomeIcon, Search, ShieldCheck } from 'lucide-react';

/**
 * 単元入力画面
 */
const UnitInput = ({ subject, subjectsConfig, mode, academicStage, inputData, setInputData, onGenerate, onBack }) => {
  const config = subject ? subjectsConfig[subject] : subjectsConfig.math;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-6 sm:mb-10 text-left">
        <button
          onClick={onBack}
          className="p-3 bg-white border-2 border-slate-300 rounded-2xl text-slate-800 active:scale-95 flex flex-col items-center gap-1 min-w-[95px] shadow-sm"
        >
          <HomeIcon size={24} />
          <span className="text-sm font-black">ホーム</span>
        </button>
        <div className="flex flex-col items-end text-slate-900">
          <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white mb-1 ${mode === 'normal' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
            {mode === 'normal' ? '通常学習' : 'テスト復習'}
          </span>
          <span className={`font-black text-xl text-${config.color}-600`}>{config.name}の学習</span>
        </div>
      </div>
      <div className="w-full max-w-md space-y-6 text-slate-900">
        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-black flex items-center gap-2">
              <Search className="text-indigo-600" size={18} /> 学習する単元名
            </label>
            <input
              type="text"
              placeholder={config.placeholder}
              className="w-full p-6 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-600 text-xl font-black transition-all"
              value={inputData.unit}
              onChange={(e) => setInputData({ ...inputData, unit: e.target.value })}
            />
            <div className="flex items-center gap-2 px-1 text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold italic text-left">
                文科省公式サイトの実在検証済みURLから、{academicStage === 'es' ? '小学校' : '中学校'}レベルのデータを取得します。
              </p>
            </div>
          </div>
        </div>
        <button
          disabled={!inputData.unit}
          onClick={onGenerate}
          className="w-full py-5 sm:py-7 bg-indigo-600 text-white font-black text-lg sm:text-xl rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 shadow-indigo-100"
        >
          AI解析を開始
        </button>
      </div>
    </div>
  );
};

export default UnitInput;
