import React, { useState } from 'react';
import { Cloud, Lock, User, Users, ArrowRight } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { username, password, fullName, groupName }
      : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl shadow-black/60">
        
        {/* Header with Competency Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3">
            <Cloud className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Облачные технологии
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Отборочное тестирование к чемпионату «Профессионалы»
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-zinc-950/60 p-1 border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              !isRegister ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Вход в систему
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isRegister ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Регистрация студента
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  ФИО студента (полностью)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Учебная группа
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Например: ИСП-401 или ССА-421"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Логин
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? "Придумайте логин" : "Логин"}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Проверка...' : isRegister ? 'Зарегистрироваться и начать' : 'Войти в систему'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
