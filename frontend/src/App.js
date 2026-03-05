import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calculator, FlaskConical, Globe, Hammer, HeartPulse,
  Languages, LayoutGrid, Library, Palette, Pencil, Scissors, Sun
} from 'lucide-react';
import { calculateStudentInfo } from './utils/gradeCalculator';
import Login from './components/Login';
import Home from './components/Home';
import UnitInput from './components/UnitInput';
import Quiz from './components/Quiz';

const App = () => {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [academicStage, setAcademicStage] = useState('jhs');
  const [subject, setSubject] = useState(null);
  const [mode, setMode] = useState('normal');
  const [inputData, setInputData] = useState({ unit: '', image: null });
  const [analysisStep, setAnalysisStep] = useState(0);
  const [masterSources, setMasterSources] = useState([
    { id: 1, name: "小学校学習指導要領解説_算数編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'es', url: "https://www.mext.go.jp/content/20220608-mxt_kyoiku01-100002607_04.pdf" },
    { id: 2, name: "中学校学習指導要領解説_外国語編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'jhs', url: "https://www.mext.go.jp/content/20210317-mxt_kyoiku01-100002608_010.pdf" },
    { id: 3, name: "中学校学習指導要領解説_数学編.pdf", pushedBy: "MEXT Auto", active: true, stage: 'jhs', url: "https://www.mext.go.jp/content/20210317-mxt_kyoiku01-100002608_005.pdf" }
  ]);

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

  /** プロファイル選択後のログイン処理 */
  const handleLogin = (profile) => {
    setCurrentUser(profile);
    setAcademicStage(profile.stage);
    setUserRole('student');
    setScreen('home');
  };

  /** ログアウト処理 */
  const handleLogout = () => {
    setCurrentUser(null);
    setScreen('login');
    setSubject(null);
  };

  /** AI 解析開始 */
  const handleGenerate = () => {
    setScreen('analyzing');
    setAnalysisStep(0);
  };

  /** ホーム画面へ戻る */
  const resetToHome = () => {
    setScreen('home');
    setSubject(null);
  };

  // 解析中アニメーションが完了したらクイズ画面へ遷移する
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

  if (screen === 'login') {
    return (
      <Login
        profiles={profiles}
        onLogin={handleLogin}
        onParentLogin={() => { setUserRole('parent'); setScreen('home'); }}
      />
    );
  }

  if (screen === 'home') {
    return (
      <Home
        currentUser={currentUser}
        userRole={userRole}
        academicStage={academicStage}
        mode={mode}
        onModeChange={setMode}
        subjectsConfig={subjectsConfig}
        onSelectSubject={(key) => { setSubject(key); setScreen('input'); }}
        onLogout={handleLogout}
        masterSources={masterSources}
        setMasterSources={setMasterSources}
      />
    );
  }

  if (screen === 'input') {
    return (
      <UnitInput
        subject={subject}
        subjectsConfig={subjectsConfig}
        mode={mode}
        academicStage={academicStage}
        inputData={inputData}
        setInputData={setInputData}
        onGenerate={handleGenerate}
        onBack={resetToHome}
      />
    );
  }

  if (screen === 'analyzing' || screen === 'quiz') {
    return (
      <Quiz
        inputData={inputData}
        academicStage={academicStage}
        mode={mode}
        sourceUrl={masterSources[0]?.url}
        onBack={resetToHome}
        analysisStep={analysisStep}
        screen={screen}
      />
    );
  }

  return null;
};

export default App;
