import React from 'react';
import { CheckCircle2, ShieldCheck, User, Users, LogOut } from 'lucide-react';

export default function ResultView({ user, onLogout }) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 sm:px-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl text-center space-y-6">
        
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Спасибо за тестирование!
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Ваша работа успешно принята и отправлена экспертам компетенции «Облачные технологии».
          </p>
        </div>

        {/* Student card info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-left space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Данные участника
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            <User className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{user.fullName || user.username}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Users className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Учебная группа: <strong className="text-zinc-200">{user.groupName || '—'}</strong></span>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-zinc-300 leading-relaxed text-left flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            Результаты проверки и итоговые списки отобранных студентов будут опубликованы преподавателем после окончания отборочного этапа.
          </div>
        </div>

        {/* Exit Button */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Завершить сеанс и выйти
          </button>
        </div>

      </div>
    </div>
  );
}
