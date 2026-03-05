import React from 'react';

/**
 * 教科選択コンポーネント（学習モード選択 + 教科ボタングリッド）
 * Home コンポーネント内で使用される
 */
const SubjectSelector = ({ academicStage, mode, onModeChange, subjectsConfig, onSelectSubject }) => (
  <>
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <button
        onClick={() => onModeChange('normal')}
        className={`py-3 sm:py-4 rounded-2xl font-black text-sm transition-all ${
          mode === 'normal'
            ? academicStage === 'es' ? 'bg-amber-500 text-white shadow-md' : 'bg-indigo-600 text-white shadow-lg'
            : 'bg-white text-slate-400 border border-slate-100'
        }`}
      >
        {academicStage === 'es' ? 'いつものべんきょう' : '通常学習'}
      </button>
      <button
        onClick={() => onModeChange('review')}
        className={`py-3 sm:py-4 rounded-2xl font-black text-sm transition-all ${
          mode === 'review' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
        }`}
      >
        {academicStage === 'es' ? 'テストのなおし' : 'テスト復習'}
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Object.entries(subjectsConfig).map(([key, config]) => (
        <button
          key={key}
          onClick={() => onSelectSubject(key)}
          className="group p-3 sm:p-4 bg-white border-b-4 border-slate-100 hover:border-indigo-500 rounded-2xl shadow-sm transition-all flex flex-col items-center gap-2 active:scale-95"
        >
          <div className={`p-3 rounded-xl text-${config.color}-600 bg-${config.color}-50 group-hover:bg-${config.color}-100`}>
            <config.icon size={24} />
          </div>
          <span className="text-sm font-black">{config.name}</span>
        </button>
      ))}
    </div>
  </>
);

export default SubjectSelector;
