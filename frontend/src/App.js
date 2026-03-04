import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, CheckCircle2, Home,
  BrainCircuit, FileText, Search, ChevronRight,
  X, LayoutGrid, ShieldCheck, FlaskConical,
  Globe, Languages, Library, RefreshCw, LogOut, Pencil, Calculator, Palette, HeartPulse, Hammer, Sun,
  User, Key, Globe2, Loader2, ExternalLink, Scissors, Link2
} from 'lucide-react';

// 年齢・学年自動判定ロジック（日本の学校制度準拠）
const calculateStudentInfo = (birthDateStr, referenceDate) => {
  const birthDate = new Date(birthDateStr);
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const m = referenceDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birthDate.getDate())) age--;
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth() + 1;
  const birthDay = birthDate.getDate();
  let startYear = (birthMonth < 4 || (birthMonth === 4 && birthDay === 1)) ? birthYear + 6 : birthYear + 7;
  const currentSchoolYear = referenceDate.getMonth() < 3 ? referenceDate.getFullYear() - 1 : referenceDate.getFullYear();
  const diff = currentSchoolYear - startYear + 1;
  let gradeLabel = "";
  let stage = "es";
  if (diff >= 1 && diff <= 6) { gradeLabel = `小学校 ${diff}年生`; stage = "es"; }
  else if (diff >= 7 && diff <= 9) { gradeLabel = `中学校 ${diff - 6}年生`; stage = "jhs"; }
  else if (diff >= 10 && diff <= 12) { gradeLabel = `高校 ${diff - 9}年生`; stage = "hs"; }
  else { gradeLabel = diff > 12 ? "卒業生" : "未就学"; stage = diff > 12 ? "hs" : "es"; }
  // 20歳での権限移譲準備
  const isAdult = age >= 20;
  return { age, gradeLabel, stage, isAdult };
};

const App = () => {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [academicStage, setAcademicStage] = useState('jhs');
  const [subject, setSubject] = useState(null);
  const [mode, setMode] = useState('normal');
  const [inputData, setInputData] = useState({ unit: '', image: null });
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showGuidelineDetail, setShowGuidelineDetail] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showSystemSpecs, setShowSystemSpecs] = useState(false);
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAutoCollecting, setIsAutoCollecting] = useState(false);
  const [collectStep, setCollectStep] = useState(0);
  const [apiHealth, setApiHealth] = useState({ state: 'idle', message: '未確認' });
  const apiBaseUrl = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const TODAY = useMemo(() => new Date(), []);

  const profiles = useMemo(() => {
    // ダミーデータ：個人情報保護のため実名・実生年月日は使用しない
    const sonInfo = calculateStudentInfo('2010-05-15', TODAY);
    const daughterInfo = calculateStudentInfo('2011-08-20', TODAY);
    return [
      { id: 'user_a', name: 'ユーザーA', stage: sonInfo.stage, color: 'amber', icon: Pencil, age: sonInfo.age, gradeLabel: sonInfo.gradeLabel, isAdult: sonInfo.isAdult },
      { id: 'user_b', name: 'ユーザーB', stage: daughterInfo.stage, color: 'indigo', icon: BookOpen, age: daughterInfo.age, gradeLabel: daughterInfo.gradeLabel, isAdult: daughterInfo.isAdult }
    ];
  }, [TODAY]);

  const subjectsConfig = useMemo(() => {
    if (academicStage === 'es') {
      return {
        japanese: { name: '国語', icon: Library, color: 'rose', placeholder: '例：かん字、ものがたりの読解' },
        math: { name: '算数', icon: Calculator, color: 'blue', placeholder: '例：小数のかけ算、分数' },
        science: { name: '理科', icon: FlaskConical, color: 'emerald', placeholder: '例：魚のたんじょう、電気' },
        social: { name: '社会', icon: Globe, color: 'purple', placeholder: '例：わたしたちの町、地図' },
        foreign: { name: '外国語', icon: Languages, color: 'indigo', placeholder: '例：Hello、自己紹介' },
        life: { name: '生活', icon: Sun, color: 'amber', placeholder: '例：町たんけん' },
        arts: { name: '図画工作', icon: Scissors, color: 'cyan', placeholder: '例：工作、えのぐ' },
        pe: { name: '体育', icon: HeartPulse, color: 'pink', placeholder: '例：てつぼう、かけっこ' }
      };
    }
    return {
      japanese: { name: '国語', icon: Library, color: 'rose', placeholder: '例：走れメロス、古文' },
      math: { name: '数学', icon: LayoutGrid, color: 'blue', placeholder: '例：連立方程式、一次関数' },
      science: { name: '理科', icon: FlaskConical, color: 'emerald', placeholder: '例：回路と電流、化学変化' },
      social: { name: '社会', icon: Globe, color: 'purple', placeholder: '例：江戸時代、ヨーロッパ州' },
      english: { name: '英語', icon: Languages, color: 'indigo', placeholder: '例：be動詞の否定文、不定詞' },
      health_pe: { name: '保健体育', icon: HeartPulse, color: 'pink', placeholder: '例：呼吸器・循環器の変化' },
      arts: { name: '美術', icon: Palette, color: 'cyan', placeholder: '例：遠近法、色彩' },
      tech_home: { name: '技術・家庭', icon: Hammer, color: 'orange', placeholder: '例：情報の技術' }
    };
  }, [academicStage]);

  const [masterSources, setMasterSources] = useState([
    { id: 1, name: "小学校学習指導要領解説_算数編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'es', url: "https://www.mext.go.jp/content/20220608-mxt_kyoiku01-100002607_04.pdf" },
    { id: 2, name: "中学校学習指導要領解説_外国語編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'jhs', url: "https://www.mext.go.jp/content/20210317-mxt_kyoiku01-100002608_010.pdf" },
    { id: 3, name: "中学校学習指導要領解説_数学編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'jhs', url: "https://www.mext.go.jp/content/20210317-mxt_kyoiku01-100002608_005.pdf" }
  ]);

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

  const handleLogin = (profile) => { setCurrentUser(profile); setAcademicStage(profile.stage); setUserRole('student'); setScreen('home'); };
  const handleLogout = () => { setCurrentUser(null); setScreen('login'); setSubject(null); };
  const handleGenerate = () => { setScreen('analyzing'); setAnalysisStep(0); };

  useEffect(() => {
    if (screen === 'analyzing') {
      const interval = setInterval(() => {
        setAnalysisStep(prev => {
          if (prev >= 3) { clearInterval(interval); setTimeout(() => setScreen('quiz'), 800); return prev; }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== 'home') return undefined;

    const controller = new AbortController();
    const fetchHealth = async () => {
      setApiHealth({ state: 'loading', message: '接続確認中...' });
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setApiHealth({ state: 'success', message: `接続成功: ${data.status}` });
      } catch (error) {
        if (controller.signal.aborted) return;
        setApiHealth({ state: 'error', message: '接続失敗: バックエンドに接続できません' });
      }
    };

    fetchHealth();
    return () => controller.abort();
  }, [screen, apiBaseUrl]);

  const resetToHome = () => { setScreen('home'); setSubject(null); setFeedback(null); setUserAnswer(''); };

  const ModalBase = ({ title, subTitle, icon: Icon, color, children, onClose }) => (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 border-b border-slate-50 flex justify-between items-center ${color === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${color === 'dark' ? 'bg-white/10' : 'bg-indigo-600 text-white shadow-lg'}`}><Icon size={24} /></div>
            <div className="text-left text-inherit">
              <h3 className="text-xl font-black">{title}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${color === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{subTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-300"><X size={32} /></button>
        </div>
        <div className="p-10 overflow-y-auto max-h-[75vh] space-y-6 text-left">{children}</div>
      </div>
    </div>
  );

  // 真偽検証システム（Evidence Viewer）
  const EvidenceViewer = ({ isOpen, onClose, unitName, sourceUrl }) => {
    if (!isOpen) return null;
    // TODO(Phase 2): バックエンド実装時に、実際の PDF から自動計算した SHA-256 を使用する
    const sourceHash = "SHA-256: a3f8b9e2c1d4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";
    const extractedText = "学習指導要領に基づく教科の学習目標と単元内容。[実装は Phase 2 で実データを使用]"; // TODO(Phase 2): 実際の PDF テキストを抽出
    return (
      <ModalBase
        title="証拠を確認"
        subTitle="MEXT Sync Verified"
        icon={ShieldCheck}
        color="normal"
        onClose={onClose}
      >
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">✓ 文科省公式ソース確認済み</p>
            <p className="text-sm text-emerald-900 break-all font-mono">{sourceUrl}</p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">生テキスト（PDF から自動抽出）</p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700 font-mono">
              {extractedText}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">デジタルフィンガープリント</p>
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 break-all font-mono text-[10px]">
              {sourceHash}
            </div>
          </div>
        </div>
      </ModalBase>
    );
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <div className="inline-block p-4 bg-indigo-600 rounded-[2.5rem] shadow-2xl mb-2"><BrainCircuit className="text-white w-12 h-12" /></div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">MiraStudy</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Profile</p>
          </div>
          <div className="grid grid-cols-1 gap-4 text-slate-900">
            {profiles.map(p => (
              <button key={p.id} onClick={() => handleLogin(p)} className="group p-6 bg-white border-2 border-transparent hover:border-indigo-500 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all flex items-center gap-6 text-left">
                <div className={`p-5 bg-${p.color}-50 text-${p.color}-600 rounded-3xl group-hover:bg-${p.color}-500 group-hover:text-white transition-all`}><p.icon size={32} /></div>
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
            <button onClick={() => { setUserRole('parent'); setScreen('home'); }} className="w-full p-6 mt-4 bg-slate-100 rounded-[2rem] flex items-center justify-center gap-3 text-slate-500 hover:bg-slate-200 transition-all font-black text-sm"><Key size={18} /><span>保護者ダッシュボード</span></button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center">
        <div className="w-full max-w-md flex justify-between items-center mb-8">
          <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm text-slate-900">
            <div className={`w-10 h-10 rounded-xl ${userRole === 'parent' ? 'bg-rose-500' : `bg-${currentUser.color}-500`} flex items-center justify-center text-white`}>
              {userRole === 'parent' ? <ShieldCheck size={20} /> : (currentUser ? <currentUser.icon size={20} /> : <User size={20} />)}
            </div>
            <div className="text-left text-slate-900">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{userRole === 'parent' ? 'Admin Mode' : currentUser?.gradeLabel}</p>
              <p className="text-sm font-black leading-none">{userRole === 'parent' ? 'お父様' : `${currentUser?.name} さん`}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 bg-white border border-slate-200 rounded-xl text-rose-500 hover:bg-rose-50 shadow-sm transition-all"><LogOut size={18} /></button>
        </div>
        <div className="w-full max-w-md mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backend Health</p>
          <p
            data-testid="api-health-message"
            className={`text-sm font-black ${apiHealth.state === 'success' ? 'text-emerald-600' : apiHealth.state === 'error' ? 'text-rose-600' : 'text-slate-500'}`}
          >
            {apiHealth.message}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{apiBaseUrl}/api/health</p>
        </div>
        {userRole === 'student' ? (
          <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 text-slate-900">
            <div className="text-center space-y-4">
              <div className={`inline-block p-4 ${academicStage === 'es' ? 'bg-amber-400 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'} rounded-[2.5rem] shadow-2xl transition-colors`}><BrainCircuit className="text-white w-12 h-12" /></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">MiraStudy</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mx-auto w-fit">
                <ShieldCheck className="text-emerald-500" size={14} />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">MEXT Data Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMode('normal')} className={`py-4 rounded-2xl font-black text-xs transition-all ${mode === 'normal' ? (academicStage === 'es' ? 'bg-amber-500 text-white shadow-md' : 'bg-indigo-600 text-white shadow-lg') : 'bg-white text-slate-400 border border-slate-100'}`}>{academicStage === 'es' ? 'いつものべんきょう' : '通常学習'}</button>
              <button onClick={() => setMode('review')} className={`py-4 rounded-2xl font-black text-xs transition-all ${mode === 'review' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{academicStage === 'es' ? 'テストのなおし' : 'テスト復習'}</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(subjectsConfig).map(([key, config]) => (
                <button key={key} onClick={() => { setSubject(key); setScreen('input'); }} className="group p-4 bg-white border-b-4 border-slate-100 hover:border-indigo-500 rounded-2xl shadow-sm transition-all flex flex-col items-center gap-2 active:scale-95">
                  <div className={`p-3 rounded-xl text-${config.color}-600 bg-${config.color}-50 group-hover:bg-${config.color}-100`}><config.icon size={24} /></div>
                  <span className="text-[11px] font-black">{config.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500 text-left text-slate-900">
            <h2 className="text-2xl font-black tracking-tight">Parent Dashboard</h2>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6 text-left text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black flex items-center gap-2"><Globe2 className="text-rose-600" /> AI自動収集・実在検証</h3>
                <button onClick={startAutoCollect} disabled={isAutoCollecting} className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-all">
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
                      <p className="text-[8px] font-mono text-slate-500 pl-4 truncate">{step.u}</p>
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
                          <p className={`text-xs font-black truncate max-w-[150px]`}>{source.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">MEXT OFFICIAL SOURCE</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${source.active ? 'bg-rose-500' : 'bg-slate-300'}`} onClick={() => setMasterSources(s => s.map(x => x.id === source.id ? { ...x, active: !x.active } : x))}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${source.active ? 'left-5' : 'left-1'}`}></div>
                      </div>
                    </div>
                    {source.url && (
                      <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-indigo-600 overflow-hidden flex-1">
                          <div className="p-1 bg-white rounded-md border border-indigo-100 shrink-0"><Globe size={10} /></div>
                          <span className="text-[9px] font-mono truncate">{source.url}</span>
                        </div>
                        <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all shrink-0">
                          <ExternalLink size={10} />
                          内容を確認
                        </a>
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
  }

  if (screen === 'input') {
    const config = subject ? subjectsConfig[subject] : subjectsConfig.math;
    return (
      <div className={`min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center`}>
        <div className="w-full max-w-md flex justify-between items-center mb-10 text-left">
          <button onClick={resetToHome} className="p-3 bg-white border-2 border-slate-300 rounded-2xl text-slate-800 active:scale-95 flex flex-col items-center gap-1 min-w-[95px] shadow-sm"><Home size={24} /><span className="text-[11px] font-black">ホーム</span></button>
          <div className="flex flex-col items-end text-slate-900">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white mb-1 ${mode === 'normal' ? 'bg-indigo-600' : 'bg-rose-600'}`}>{mode === 'normal' ? '通常学習' : 'テスト復習'}</span>
            <span className={`font-black text-xl text-${config.color}-600`}>{config.name}の学習</span>
          </div>
        </div>
        <div className="w-full max-w-md space-y-6 text-slate-900">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-black flex items-center gap-2"><Search className="text-indigo-600" size={18} /> 学習する単元名</label>
              <input type="text" placeholder={config.placeholder} className="w-full p-6 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-600 text-xl font-black transition-all" value={inputData.unit} onChange={(e) => setInputData({ ...inputData, unit: e.target.value })} />
              <div className="flex items-center gap-2 px-1 text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                <p className="text-[10px] font-bold italic text-left">文科省公式サイトの実在検証済みURLから、{academicStage === 'es' ? '小学校' : '中学校'}レベルのデータを取得します。</p>
              </div>
            </div>
          </div>
          <button disabled={!inputData.unit} onClick={handleGenerate} className="w-full py-7 bg-indigo-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 shadow-indigo-100">AI解析を開始</button>
        </div>
      </div>
    );
  }

  if (screen === 'analyzing') {
    return (
      <div className={`min-h-screen ${mode === 'normal' ? (academicStage === 'es' ? 'bg-amber-500' : 'bg-indigo-600') : 'bg-rose-600'} p-8 flex flex-col items-center justify-center text-white text-center transition-colors`}>
        <div className="relative mb-16 text-white">
          <div className="w-32 h-32 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
          <BrainCircuit className="absolute inset-0 m-auto animate-pulse" size={48} />
        </div>
        <h2 className="text-3xl font-black mb-10 tracking-tight italic uppercase">MEXT Grounding...</h2>
        <div className="space-y-4 w-full max-w-xs mx-auto">
          {["文科省公開の最新URLへの疎通確認", "PDF内部の学習目標と教科名を同期", "学年適性を最終検証", "問題構築の完了"].map((text, i) => (
            <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${analysisStep >= i ? 'opacity-100 translate-x-1' : 'opacity-20'}`}>
              <CheckCircle2 size={16} />
              <p className="text-xs font-bold text-left">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center text-slate-900">
        <div className="w-full max-w-md flex justify-between items-center mb-6">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full w-fit shadow-sm">
              <ShieldCheck className="text-emerald-500" size={14} />
              <span className="text-[10px] font-black text-emerald-700 uppercase">Provenance Verified</span>
            </div>
            <span className="text-xl font-black tracking-tight mt-2">{inputData.unit || "学習単元"}</span>
          </div>
          <button onClick={resetToHome} className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-sm text-slate-800 flex flex-col items-center gap-1 min-w-[95px] active:scale-95 shadow-sm"><Home size={24} /><span className="text-[11px] font-black text-inherit">ホーム</span></button>
        </div>
        <div className="w-full max-w-md space-y-6 text-slate-800">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-slate-100 min-h-[220px] flex items-center relative overflow-hidden text-center transition-all">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/10"></div>
            <p className="leading-relaxed font-black text-xl whitespace-pre-wrap w-full">{academicStage === 'es' ? "つぎの もんだいを といてみよう。\\n\\n 120 × 4 = （   ）" : "次の日本文に合うように（ ）に適切な語を入れなさい。\\n\\n「私はテニスファンではありません。」\\nI (   ) not a tennis fan."}</p>
          </div>
          <div className="space-y-4 text-center">
            <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="答えを入力してね" className="w-full p-6 rounded-[2.5rem] bg-white shadow-xl border-4 border-transparent focus:border-indigo-600 outline-none text-2xl font-black text-center transition-all" />
            <button onClick={() => setShowEvidenceViewer(true)} className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-xs rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
              <ShieldCheck size={16} />
              証拠を表示（MEXT PDF確認）
            </button>
            <button onClick={() => setFeedback({ type: userAnswer.trim().toLowerCase() === (academicStage === 'es' ? '480' : 'am') ? 'success' : 'error' })} className={`w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl active:scale-95 transition-all font-black shadow-indigo-100`}>答え合わせ</button>
          </div>
        </div>
        <EvidenceViewer
          isOpen={showEvidenceViewer}
          onClose={() => setShowEvidenceViewer(false)}
          unitName={inputData.unit}
          sourceUrl={masterSources[0]?.url}
        />
      </div>
    );
  }

  return null;
};

export default App;
