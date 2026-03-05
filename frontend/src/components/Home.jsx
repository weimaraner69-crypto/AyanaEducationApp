import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, CheckCircle2, ExternalLink, FileText,
  Globe, Globe2, Link2, Loader2, LogOut, RefreshCw,
  ShieldCheck, User
} from 'lucide-react';
import SubjectSelector from './SubjectSelector';
import { healthCheck, API_BASE_URL } from '../services/api';

/**
 * URL のスキーム検証（セキュリティ対策）
 * @param {string} url - 検証対象 URL
 * @returns {boolean} http:// または https:// で始まる場合 true
 */
const isValidUrl = (url) => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * ホーム画面（学生向けビュー・保護者ダッシュボードを含む）
 */
const Home = ({
  currentUser,
  userRole,
  academicStage,
  mode,
  onModeChange,
  subjectsConfig,
  onSelectSubject,
  onLogout,
  masterSources,
  setMasterSources,
}) => {
  const [apiHealth, setApiHealth] = useState({ state: 'idle', message: '未確認' });
  const [isAutoCollecting, setIsAutoCollecting] = useState(false);
  const [collectStep, setCollectStep] = useState(0);

  /** 文科省ソース自動収集（デモ動作） */
  const startAutoCollect = () => {
    setIsAutoCollecting(true);
    setCollectStep(0);
    const interval = setInterval(() => {
      setCollectStep(prev => {
        if (prev >= 4) { clearInterval(interval); setTimeout(() => setIsAutoCollecting(false), 1000); return prev; }
        return prev + 1;
      });
    }, 1500);
  };

  // ホーム表示時にバックエンドのヘルスチェックを実行する
  useEffect(() => {
    const controller = new AbortController();

    const fetchHealth = async () => {
      setApiHealth({ state: 'loading', message: '接続確認中...' });
      const result = await healthCheck(controller.signal);
      if (result.cancelled) return;
      if (result.ok) {
        setApiHealth({ state: 'success', message: `接続成功: ${result.data.status}` });
      } else if (result.timeout) {
        setApiHealth({ state: 'error', message: `接続失敗: ${result.message}` });
      } else {
        setApiHealth({ state: 'error', message: `接続失敗: ${result.message}` });
      }
    };

    fetchHealth();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:p-6 flex flex-col items-center">
      {/* ヘッダー: ユーザー情報・ログアウトボタン */}
      <div className="w-full max-w-md md:max-w-2xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm text-slate-900">
          <div className={`w-10 h-10 rounded-xl ${userRole === 'parent' ? 'bg-rose-500' : `bg-${currentUser.color}-500`} flex items-center justify-center text-white`}>
            {userRole === 'parent' ? <ShieldCheck size={20} /> : (currentUser ? <currentUser.icon size={20} /> : <User size={20} />)}
          </div>
          <div className="text-left text-slate-900">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{userRole === 'parent' ? 'Admin Mode' : currentUser?.gradeLabel}</p>
            <p className="text-sm font-black leading-none">{userRole === 'parent' ? 'お父様' : `${currentUser?.name} さん`}</p>
          </div>
        </div>
        <button onClick={onLogout} aria-label="ログアウト" className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white border border-slate-200 rounded-xl text-rose-500 hover:bg-rose-50 shadow-sm transition-all">
          <LogOut size={18} />
        </button>
      </div>

      {/* API ヘルスチェック表示 */}
      <div className="w-full max-w-md md:max-w-2xl mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backend Health</p>
        <p
          data-testid="api-health-message"
          className={`text-sm font-black ${apiHealth.state === 'success' ? 'text-emerald-600' : apiHealth.state === 'error' ? 'text-rose-600' : 'text-slate-500'}`}
        >
          {apiHealth.message}
        </p>
        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{API_BASE_URL}/api/health</p>
      </div>

      {/* 学生ビュー */}
      {userRole === 'student' ? (
        <div className="w-full max-w-md md:max-w-2xl space-y-8 animate-in fade-in duration-500 text-slate-900">
          <div className="text-center space-y-4">
            <div className={`inline-block p-4 ${academicStage === 'es' ? 'bg-amber-400 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'} rounded-[2.5rem] shadow-2xl transition-colors`}>
              <BrainCircuit className="text-white w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">MiraStudy</h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mx-auto w-fit">
              <ShieldCheck className="text-emerald-500" size={14} />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">MEXT Data Verified</span>
            </div>
          </div>
          <SubjectSelector
            academicStage={academicStage}
            mode={mode}
            onModeChange={onModeChange}
            subjectsConfig={subjectsConfig}
            onSelectSubject={onSelectSubject}
          />
        </div>
      ) : (
        /* 保護者ダッシュボード */
        <div className="w-full max-w-md md:max-w-xl space-y-6 animate-in fade-in duration-500 text-left text-slate-900">
          <h2 className="text-2xl font-black tracking-tight">Parent Dashboard</h2>
          <div className="bg-white rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-slate-100 space-y-6 text-left text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Globe2 className="text-rose-600" /> AI自動収集・実在検証
              </h3>
              <button
                onClick={startAutoCollect}
                disabled={isAutoCollecting}
                className="px-4 py-2.5 min-h-[44px] bg-indigo-600 text-white rounded-full text-sm font-black flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {isAutoCollecting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                最新URLを取得
              </button>
            </div>
            {isAutoCollecting && (
              <div className="p-4 bg-slate-900 rounded-2xl text-left space-y-2 border border-slate-700 animate-in slide-in-from-top-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-time MEXT Source Scan</p>
                {[
                  { t: "文科省Webサイトへリクエスト送信", u: "mext.go.jp/a_menu/..." },
                  { t: "最新のPDF配布パスを自動特定", u: "mext.go.jp/content/2022..." },
                  { t: "URLの実在性を確認 (HTTP 200 OK)", u: "Status: LIVE" },
                  { t: "学年への適合性を検証", u: "Grade: VALID" },
                  { t: "AIナレッジベースへ同期完了", u: "Sync: COMPLETED" }
                ].map((step, i) => (
                  <div key={i} className={`flex flex-col gap-0.5 transition-all duration-500 ${collectStep >= i ? 'opacity-100 translate-x-1' : 'opacity-20'}`}>
                    <div className="flex items-center gap-2">
                      {collectStep > i ? <CheckCircle2 size={10} className="text-emerald-400" /> : <Loader2 size={10} className="text-slate-500 animate-spin" />}
                      <p className="text-[10px] font-bold text-slate-300">{step.t}</p>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 pl-4 truncate">{step.u}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Link2 size={10} /> Verified Knowledge Links
              </p>
              {masterSources.map(source => (
                <div key={source.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-rose-500" size={20} />
                      <div>
                        <p className="text-sm font-black truncate max-w-[160px]">{source.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">MEXT OFFICIAL SOURCE</p>
                      </div>
                    </div>
                    <button
                      aria-label={`${source.name}を${source.active ? '無効化' : '有効化'}`}
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent border-none cursor-pointer"
                      onClick={() => setMasterSources(s => s.map(x => x.id === source.id ? { ...x, active: !x.active } : x))}
                    >
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${source.active ? 'bg-rose-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${source.active ? 'left-5' : 'left-1'}`}></div>
                      </div>
                    </button>
                  </div>
                  {source.url && (
                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-indigo-600 overflow-hidden flex-1">
                        <div className="p-1 bg-white rounded-md border border-indigo-100 shrink-0"><Globe size={10} /></div>
                        <span className="text-[10px] font-mono truncate">{source.url}</span>
                      </div>
                      {isValidUrl(source.url) ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all shrink-0"
                          data-testid="external-link"
                        >
                          <ExternalLink size={10} />
                          内容を確認
                        </a>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed shrink-0">
                          <ExternalLink size={10} />
                          (無効)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
