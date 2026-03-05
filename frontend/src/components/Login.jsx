import React from 'react';
import { BrainCircuit, ChevronRight, Key } from 'lucide-react';

/**
 * ログイン画面（プロファイル選択）
 */
const Login = ({ profiles, onLogin, onParentLogin }) => (
  <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center justify-center text-center">
    <div className="w-full max-w-md space-y-12">
      <div className="space-y-4">
        <div className="inline-block p-4 bg-indigo-600 rounded-[2.5rem] shadow-2xl mb-2">
          <BrainCircuit className="text-white w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">MiraStudy</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Profile</p>
      </div>
      <div className="grid grid-cols-1 gap-4 text-slate-900">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onLogin(p)}
            className="group p-6 bg-white border-2 border-transparent hover:border-indigo-500 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all flex items-center gap-6 text-left"
          >
            <div className={`p-5 bg-${p.color}-50 text-${p.color}-600 rounded-3xl group-hover:bg-${p.color}-500 group-hover:text-white transition-all`}>
              <p.icon size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black">{p.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.age}歳</span>
                <span className={`text-[11px] font-black ${p.stage === 'es' ? 'text-amber-600' : 'text-indigo-600'} uppercase tracking-widest`}>{p.gradeLabel}</span>
              </div>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
          </button>
        ))}
        <button
          onClick={onParentLogin}
          className="w-full p-6 mt-4 bg-slate-100 rounded-[2rem] flex items-center justify-center gap-3 text-slate-500 hover:bg-slate-200 transition-all font-black text-sm"
        >
          <Key size={18} />
          <span>保護者ダッシュボード</span>
        </button>
      </div>
    </div>
  </div>
);

export default Login;
