import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import AuthModal from './components/AuthModal.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import LogFilter from './components/LogFilter.jsx';
import PortMatching from './components/PortMatching.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import ResultView from './components/ResultView.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { 
  Terminal, Box, Cpu, ArrowLeft, ArrowRight, 
  Send, AlertCircle, FileCode, Check
} from 'lucide-react';

const QUIZ_DURATION_SECONDS = 45 * 60; // 45 minutes

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cloud_test_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('cloud_test_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === 'admin') return 'admin';
      if (u.hasSubmitted) return 'result';
      return 'quiz';
    }
    return 'login';
  });

  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSubTaskIndex, setActiveSubTaskIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load questions
  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        // Initialize templates if not present in draft
        setAnswers(prev => {
          const updated = { ...prev };
          data.questions?.forEach(sec => {
            sec.items?.forEach(q => {
              if (q.template && updated[q.id] === undefined) {
                updated[q.id] = q.template;
              }
              if (q.type === 'port_matching' && updated[q.id] === undefined) {
                updated[q.id] = {};
              }
            });
          });
          return updated;
        });
      })
      .catch(err => console.error('Ошибка загрузки заданий:', err));
  }, []);

  // Check server submission status on user login
  useEffect(() => {
    if (user && user.role === 'student') {
      fetch(`/api/submissions/status?username=${encodeURIComponent(user.username)}`)
        .then(res => res.json())
        .then(status => {
          if (status.hasSubmitted) {
            setUser(prev => ({ ...prev, hasSubmitted: true }));
            setCurrentView('result');
          }
        })
        .catch(err => console.error('Ошибка проверки статуса сдачи:', err));
    }
  }, [user?.username]);

  // Restore drafts & timer when user logs in
  useEffect(() => {
    if (user) {
      localStorage.setItem('cloud_test_user', JSON.stringify(user));

      if (user.role === 'student' && !user.hasSubmitted) {
        const savedAnswers = localStorage.getItem(`cloud_answers_${user.username}`);
        if (savedAnswers) {
          try {
            setAnswers(prev => ({ ...prev, ...JSON.parse(savedAnswers) }));
          } catch (e) {}
        }

        const startTimeKey = `cloud_start_time_${user.username}`;
        let startTime = localStorage.getItem(startTimeKey);
        if (!startTime) {
          startTime = Date.now().toString();
          localStorage.setItem(startTimeKey, startTime);
        }
        const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
        const remaining = Math.max(0, QUIZ_DURATION_SECONDS - elapsed);
        setTimeLeft(remaining);
      }
    }
  }, [user]);

  // Reset active sub-task when switching tabs
  useEffect(() => {
    setActiveSubTaskIndex(0);
  }, [activeTab]);

  // Timer countdown
  useEffect(() => {
    if (!user || user.role !== 'student' || currentView !== 'quiz') return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, currentView, timeLeft]);

  // Auto-save answers draft
  const handleAnswerChange = (qid, val) => {
    setAnswers(prev => {
      const updated = { ...prev, [qid]: val };
      if (user) {
        localStorage.setItem(`cloud_answers_${user.username}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setCurrentView('admin');
    } else if (loggedInUser.hasSubmitted) {
      setCurrentView('result');
    } else {
      setCurrentView('quiz');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cloud_test_user');
    setUser(null);
    setCurrentView('login');
    setAnswers({});
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    const timeSpent = QUIZ_DURATION_SECONDS - timeLeft;

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          groupName: user.groupName,
          answers,
          timeSpentSeconds: timeSpent
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки работы');

      const updatedUser = { ...user, hasSubmitted: true };
      setUser(updatedUser);
      localStorage.setItem('cloud_test_user', JSON.stringify(updatedUser));
      localStorage.removeItem(`cloud_answers_${user.username}`);
      localStorage.removeItem(`cloud_start_time_${user.username}`);
      setCurrentView('result');
    } catch (err) {
      alert('Ошибка при сдаче работы: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Check completion per item
  const isItemAnswered = (q) => {
    const val = answers[q.id];
    if (q.type === 'port_matching') {
      return val && Object.keys(val).length >= 5;
    }
    if (q.type === 'choice') {
      return !!val;
    }
    return val !== undefined && val !== null && val.toString().trim() !== '';
  };

  // Compute completed count
  const allQuestions = questions.flatMap(s => s.items);
  const completedCount = allQuestions.filter(isItemAnswered).length;

  const tabMeta = [
    { name: '1. Команды Linux', icon: Terminal },
    { name: '2. Nginx и логи', icon: FileCode },
    { name: '3. Docker & CI/CD', icon: Box },
    { name: '4. Ansible Playbook', icon: Cpu }
  ];

  if (!user || currentView === 'login') {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  const currentSection = questions[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-x-hidden">
      
      {/* Global Header */}
      <Header
        user={user}
        timeLeftSeconds={timeLeft}
        completedCount={completedCount}
        totalCount={allQuestions.length}
        onSubmitClick={() => setShowConfirmModal(true)}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Body */}
      <main className="flex-1 w-full">
        {currentView === 'admin' ? (
          <div className="w-full">
            <AdminPanel />
          </div>
        ) : currentView === 'result' ? (
          <ResultView 
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Top Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
              {questions.map((sec, idx) => {
                const TabIcon = tabMeta[idx]?.icon || Terminal;
                const isActive = activeTab === idx;
                const totalItems = sec.items.length;
                const answeredCount = sec.items.filter(isItemAnswered).length;
                const isComplete = answeredCount === totalItems && totalItems > 0;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold truncate">
                        {tabMeta[idx]?.name || sec.title}
                      </span>
                    </div>

                    <div className="flex items-center shrink-0">
                      {isComplete ? (
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {answeredCount}/{totalItems}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Section Card */}
            {currentSection && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-7 shadow-xl space-y-6">
                
                {/* Section Header */}
                <div className="pb-5 border-b border-zinc-800/80">
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    {currentSection.title}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {currentSection.description}
                  </p>

                  {/* Sub-task Switcher if section has multiple code/filter tasks (sec2, sec3) */}
                  {currentSection.id !== 'sec1' && currentSection.items.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-800/50">
                      {currentSection.items.map((subItem, sIdx) => {
                        const isSubActive = activeSubTaskIndex === sIdx;
                        const isAnswered = isItemAnswered(subItem);
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setActiveSubTaskIndex(sIdx)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm'
                                : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                            }`}
                          >
                            <FileCode className={`w-3.5 h-3.5 ${isSubActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                            <span>{subItem.title.split('. ')[1] || subItem.title}</span>
                            {isAnswered && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Task Item Renderer */}
                <div className="space-y-6">
                  {currentSection.id === 'sec1' ? (
                    /* Module 1: 12 randomized Linux CLI questions with randomized options */
                    <div className="space-y-4">
                      {currentSection.items.map((item, itemIdx) => (
                        <QuestionCard
                          key={item.id}
                          question={item}
                          selectedValue={answers[item.id]}
                          onChange={handleAnswerChange}
                          index={itemIdx}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Modules 2, 3, 4: Code & filter tasks */
                    currentSection.items.map((item, itemIdx) => {
                      if (currentSection.items.length > 1 && itemIdx !== activeSubTaskIndex) {
                        return null;
                      }

                      if (item.type === 'log_filter') {
                        return (
                          <LogFilter
                            key={item.id}
                            item={item}
                            value={answers[item.id]}
                            onChange={handleAnswerChange}
                            index={itemIdx}
                          />
                        );
                      }

                      if (item.type === 'port_matching') {
                        return (
                          <PortMatching
                            key={item.id}
                            item={item}
                            value={answers[item.id]}
                            onChange={handleAnswerChange}
                            index={itemIdx}
                          />
                        );
                      }

                      return (
                        <CodeEditor
                          key={item.id}
                          item={item}
                          value={answers[item.id]}
                          onChange={handleAnswerChange}
                          index={itemIdx}
                        />
                      );
                    })
                  )}
                </div>

                {/* Bottom Step Navigation */}
                <div className="flex items-center justify-between pt-5 border-t border-zinc-800/80">
                  <button
                    disabled={activeTab === 0}
                    onClick={() => setActiveTab(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Предыдущий раздел
                  </button>

                  {activeTab < questions.length - 1 ? (
                    <button
                      onClick={() => setActiveTab(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      Следующий раздел
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Завершить и отправить на проверку
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                Подтверждение сдачи работы
              </h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              Вы выполнили <strong className="text-white">{completedCount}</strong> из {allQuestions.length} заданий.
              После отправки работа будет зафиксирована в ведомости, а повторное прохождение заблокировано.
            </p>

            {completedCount < allQuestions.length && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                Внимание: в некоторых модулях остались незаполненные поля.
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Вернуться к заданиям
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {submitting ? 'Отправка...' : 'Да, сдать работу'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-800/60 py-4 text-center text-[11px] text-zinc-500">
        Система квалификационного отбора • Направление «Облачные технологии и DevOps»
      </footer>

    </div>
  );
}
