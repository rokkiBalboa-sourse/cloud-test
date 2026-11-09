import React from 'react';
import { Cloud, Clock, CheckCircle2, LogOut, ShieldAlert, FileText } from 'lucide-react';

export default function Header({
  user,
  timeLeftSeconds,
  completedCount,
  totalCount,
  onSubmitClick,
  onLogout,
  currentView,
  setCurrentView
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeftSeconds < 300; // Less than 5 minutes

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                Облачные технологии
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/70 text-blue-400 border border-blue-800/40">
                45 минут
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Облегчённый отборочный практикум
            </p>
          </div>
        </div>

        {/* Center: Mathematically centered Timer & Progress for students */}
        {user?.role === 'student' && currentView === 'quiz' && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 z-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              isTimeCritical
                ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}>
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Осталось времени:</span>
              <span className="font-bold text-sm">{formatTime(timeLeftSeconds)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Выполнено: <strong className="text-zinc-200">{completedCount}</strong> из {totalCount}</span>
            </div>
          </div>
        )}

        {/* Right: User info & Action buttons */}
        <div className="flex items-center gap-3 z-10 shrink-0">
          {/* User profile tag */}
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-zinc-200">
              {user.fullName || user.username}
            </div>
            <div className="text-[10px] text-zinc-500">
              {user.role === 'admin' ? 'Эксперт / Преподаватель' : `Группа: ${user.groupName || '—'}`}
            </div>
          </div>

          {/* Admin Switcher */}
          {user.role === 'admin' && (
            <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
              <button
                onClick={() => setCurrentView('quiz')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentView === 'quiz' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Тест
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentView === 'admin' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Админка
              </button>
            </div>
          )}

          {/* Submit button (student mode) */}
          {user.role === 'student' && currentView === 'quiz' && (
            <button
              onClick={onSubmitClick}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Сдать работу
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="Выйти из аккаунта"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
