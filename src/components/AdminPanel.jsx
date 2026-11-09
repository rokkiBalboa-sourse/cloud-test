import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Download, Trash2, Eye, Search, RefreshCw, 
  CheckCircle, AlertTriangle, XCircle, Code, X, UserPlus, 
  Key, Copy, Check, BookOpen, FileSpreadsheet, Terminal, 
  Box, Cpu, FileCode, CheckCircle2
} from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'students' | 'answers'
  
  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [searchSubmissions, setSearchSubmissions] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Student accounts state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [batchGroup, setBatchGroup] = useState('');
  const [batchNames, setBatchNames] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchStudents, setSearchStudents] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Answers key state
  const [answersKey, setAnswersKey] = useState(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // Load submissions
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Ошибка загрузки результатов:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Load students
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setStudents(data.users || []);
    } catch (err) {
      console.error('Ошибка загрузки списка студентов:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load answers key
  const fetchAnswersKey = async () => {
    if (answersKey) return;
    setLoadingAnswers(true);
    try {
      const res = await fetch('/api/admin/answers-key');
      const data = await res.json();
      setAnswersKey(data.answersKey);
    } catch (err) {
      console.error('Ошибка загрузки ключей ответов:', err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'answers') {
      fetchAnswersKey();
    }
  }, [activeTab]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeleteSubmission = async (id, name) => {
    if (!confirm(`Удалить результат студента ${name}? Попытка будет стёрта, и студент сможет сдать заново.`)) return;
    try {
      await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!confirm(`Удалить учетную запись студента ${name}?`)) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      alert('Ошибка при удалении студента: ' + err.message);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`);
      const data = await res.json();
      setSelectedSubmission(data.submission);
    } catch (err) {
      alert('Ошибка загрузки деталей: ' + err.message);
    }
  };

  // Handle batch student account generation
  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    if (!batchGroup.trim()) {
      alert('Пожалуйста, введите название группы (например, ИСП-401).');
      return;
    }
    if (!batchNames.trim()) {
      alert('Пожалуйста, введите список ФИО студентов построчно.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: batchGroup.trim(),
          namesText: batchNames
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка генерации');

      alert(`Успешно создано учетных записей: ${data.count}`);
      setBatchNames('');
      fetchStudents();
    } catch (err) {
      alert('Ошибка при генерации: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Export students to CSV
  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      alert('Список студентов пуст.');
      return;
    }

    const headers = ['ID', 'ФИО', 'Группа', 'Логин', 'Пароль', 'Дата создания'];
    const lines = [headers.join(';')];

    students.forEach(s => {
      lines.push([
        s.id,
        `"${s.full_name}"`,
        `"${s.group_name}"`,
        `"${s.username}"`,
        `"${s.password}"`,
        `"${s.created_at || ''}"`
      ].join(';'));
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_logins_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPwd !== confirmPwd) {
      setPwdError('Новые пароли не совпадают');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (!res.ok) {
          throw new Error(`Ошибка сервера (${res.status} ${res.statusText}). Выполните на сервере: docker compose up -d --build`);
        }
        throw new Error('Некорректный ответ сервера');
      }

      if (!res.ok) throw new Error(data.error || 'Ошибка смены пароля');

      setPwdSuccess('Пароль администратора успешно изменен!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess('');
      }, 1500);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  // Filters
  const filteredSubmissions = submissions.filter(s => 
    s.full_name.toLowerCase().includes(searchSubmissions.toLowerCase()) ||
    s.group_name.toLowerCase().includes(searchSubmissions.toLowerCase()) ||
    s.username.toLowerCase().includes(searchSubmissions.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchStudents.toLowerCase()) ||
    s.group_name.toLowerCase().includes(searchStudents.toLowerCase()) ||
    s.username.toLowerCase().includes(searchStudents.toLowerCase())
  );

  const totalCount = submissions.length;
  const avgScore = totalCount > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + s.total_score, 0) / totalCount)
    : 0;
  const recommendedCount = submissions.filter(s => s.verdict === 'recommended').length;
  const reserveCount = submissions.filter(s => s.verdict === 'reserve').length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Панель преподавателя / эксперта
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Управление квалификационным отбором «Облачные технологии»
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ведомость результатов</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
              {submissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Генератор студентов</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'answers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Эталонные ответы к тесту</span>
          </button>

          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPwdError('');
              setPwdSuccess('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer border border-transparent hover:border-zinc-700/50"
            title="Сменить пароль администратора"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Сменить пароль</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMISSIONS & RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Top Actions & Stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-zinc-200">
              Сводная статистика сдачи работ
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchSubmissions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Обновить
              </button>
              <a
                href="/api/admin/export"
                download
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Выгрузить ведомость (CSV)
              </a>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Всего участников
              </div>
              <div className="mt-2 text-2xl font-bold text-white font-mono">
                {totalCount}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Средний балл
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-400 font-mono">
                {avgScore} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                В основной состав
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                {recommendedCount}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                В резерв
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">
                {reserveCount}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchSubmissions}
              onChange={(e) => setSearchSubmissions(e.target.value)}
              placeholder="Поиск по ФИО, группе или логину..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submissions Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Студент</th>
                    <th className="py-3 px-4">Группа</th>
                    <th className="py-3 px-4">Итог (из 100)</th>
                    <th className="py-3 px-4">Модуль 1 (Команды Linux)</th>
                    <th className="py-3 px-4">Модуль 2 (Nginx/Логи)</th>
                    <th className="py-3 px-4">Модуль 3 (Docker/CI)</th>
                    <th className="py-3 px-4">Модуль 4 (Ansible)</th>
                    <th className="py-3 px-4">Вердикт</th>
                    <th className="py-3 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {loadingSubmissions ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        Загрузка ведомости...
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        Пока нет сданных работ.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(s => {
                      const sec = s.section_scores || {};
                      return (
                        <tr key={s.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-100">{s.full_name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{s.username}</div>
                          </td>
                          <td className="py-3 px-4 font-mono">{s.group_name}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              s.total_score >= 80 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : s.total_score >= 60
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {s.total_score} / {s.max_score}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{sec.sec1 ?? '—'} / 25</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{sec.sec2 ?? '—'} / 25</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{sec.sec3 ?? '—'} / 25</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{sec.sec4 ?? '—'} / 25</td>
                          <td className="py-3 px-4">
                            {s.verdict === 'recommended' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" /> Основной состав
                              </span>
                            )}
                            {s.verdict === 'reserve' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" /> Резерв
                              </span>
                            )}
                            {s.verdict === 'not_recommended' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                                <XCircle className="w-3.5 h-3.5" /> Не рекомендован
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openDetails(s.id)}
                                title="Посмотреть код и ответы"
                                className="p-1.5 rounded-md hover:bg-zinc-800 text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubmission(s.id, s.full_name)}
                                title="Удалить попытку"
                                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCH STUDENT GENERATION */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Top Form: Batch Add */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-semibold">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Массовое добавление студентов по списку
                </h3>
                <p className="text-xs text-zinc-400">
                  Введите название учебной группы и вставьте список ФИО построчно. Логины и пароли сгенерируются автоматически.
                </p>
              </div>
            </div>

            <form onSubmit={handleBatchGenerate} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Учебная группа <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchGroup}
                    onChange={(e) => setBatchGroup(e.target.value)}
                    placeholder="Например: ИСП-401 или ССА-421"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Будет присвоена всем студентам из списка ниже.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Список студентов (ФИО построчно) <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={batchNames}
                    onChange={(e) => setBatchNames(e.target.value)}
                    placeholder={`Иванов Алексей Сергеевич\nПетров Дмитрий Владимирович\nСмирнова Екатерина Андреевна`}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    По одному человеку на строку. Лишние пробелы и пустые строки автоматически фильтруются.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-xs text-zinc-400">
                  Строк в списке:{' '}
                  <strong className="text-white">
                    {batchNames.split('\n').map(s => s.trim()).filter(Boolean).length}
                  </strong>
                </span>

                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  {generating ? 'Генерация аккаунтов...' : 'Сгенерировать логины и пароли'}
                </button>
              </div>
            </form>
          </div>

          {/* Student Accounts Table & CSV Export */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Зарегистрированные студенты ({students.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  Учетные данные для раздачи студентам перед началом тестирования.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchStudents}
                    onChange={(e) => setSearchStudents(e.target.value)}
                    placeholder="Поиск по ФИО или логину..."
                    className="w-56 rounded-lg border border-zinc-800 bg-zinc-900/80 py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportStudentsCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Выгрузить в CSV для раздачи
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">ФИО студента</th>
                      <th className="py-3 px-4">Группа</th>
                      <th className="py-3 px-4">Логин</th>
                      <th className="py-3 px-4">Пароль</th>
                      <th className="py-3 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">
                          Загрузка списка студентов...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">
                          Студентов пока нет. Добавьте их через форму выше.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(st => (
                        <tr key={st.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-zinc-100">
                            {st.full_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400">
                            {st.group_name}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-400 font-semibold">{st.username}</span>
                              <button
                                onClick={() => copyToClipboard(st.username, `user_${st.id}`)}
                                title="Скопировать логин"
                                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                              >
                                {copiedKey === `user_${st.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 font-bold tracking-wider">
                                {st.password}
                              </span>
                              <button
                                onClick={() => copyToClipboard(st.password, `pwd_${st.id}`)}
                                title="Скопировать пароль"
                                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                              >
                                {copiedKey === `pwd_${st.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStudent(st.id, st.full_name)}
                              title="Удалить студента"
                              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANSWERS KEY & REFERENCE SOLUTIONS */}
      {activeTab === 'answers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Эталонные ключи ответов и критерии проверки
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Официальные критерии автопроверщика и правильные ответы на все 4 модуля тестирования.
              </p>
            </div>

            <button
              onClick={fetchAnswersKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Обновить ключи
            </button>
          </div>

          {loadingAnswers || !answersKey ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Загрузка ключей ответов...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Module 1: Linux CLI */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-semibold">
                      <Terminal className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {answersKey.module1.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Максимум: {answersKey.module1.maxScore} баллов
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3.5 w-10">№</th>
                        <th className="py-2.5 px-3.5">Вопрос</th>
                        <th className="py-2.5 px-3.5">Правильный ответ / Команда</th>
                        <th className="py-2.5 px-3.5 w-16 text-center">Балл</th>
                        <th className="py-2.5 px-3.5">Пояснение</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {answersKey.module1.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3.5 font-mono text-zinc-500">{idx + 1}</td>
                          <td className="py-2.5 px-3.5 font-medium text-zinc-200">{item.question}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-400">
                            {item.correctCommand}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-center text-blue-400">
                            {item.score} б.
                          </td>
                          <td className="py-2.5 px-3.5 text-zinc-400 text-[11px] leading-relaxed">
                            {item.explanation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Module 2: Nginx & Logs */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold">
                      <FileCode className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {answersKey.module2.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Максимум: {answersKey.module2.maxScore} баллов
                  </span>
                </div>

                {/* Task 2.1 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {answersKey.module2.task2_1.title} ({answersKey.module2.task2_1.score} баллов)
                    </h4>
                    <button
                      onClick={() => copyToClipboard(answersKey.module2.task2_1.code, 'nginx')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'nginx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Копировать код
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {answersKey.module2.task2_1.fixes.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f.text} — <strong className="text-zinc-200">{f.points} б.</strong></span>
                      </li>
                    ))}
                  </ul>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                    {answersKey.module2.task2_1.code}
                  </pre>
                </div>

                {/* Task 2.2 */}
                <div className="space-y-2 pt-4 border-t border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-200">
                    {answersKey.module2.task2_2.title} ({answersKey.module2.task2_2.score} баллов)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {answersKey.module2.task2_2.explanation}
                  </p>
                  <div className="space-y-1 text-xs font-mono text-emerald-400">
                    {answersKey.module2.task2_2.validCommands.map((cmd, i) => (
                      <div key={i} className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                        {cmd}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Module 3: Dockerfile & CI/CD */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-semibold">
                      <Box className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {answersKey.module3.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Максимум: {answersKey.module3.maxScore} баллов
                  </span>
                </div>

                {/* Task 3.1 Dockerfile */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {answersKey.module3.task3_1.title} ({answersKey.module3.task3_1.score} баллов)
                    </h4>
                    <button
                      onClick={() => copyToClipboard(answersKey.module3.task3_1.code, 'dockerfile')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'dockerfile' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Копировать код
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {answersKey.module3.task3_1.criteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{c.text} — <strong className="text-zinc-200">{c.points} б.</strong></span>
                      </li>
                    ))}
                  </ul>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-purple-400 overflow-x-auto whitespace-pre">
                    {answersKey.module3.task3_1.code}
                  </pre>
                </div>

                {/* Task 3.2 GitLab CI */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {answersKey.module3.task3_2.title} ({answersKey.module3.task3_2.score} баллов)
                    </h4>
                    <button
                      onClick={() => copyToClipboard(answersKey.module3.task3_2.code, 'gitlabci')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'gitlabci' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Копировать код
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {answersKey.module3.task3_2.explanation}
                  </p>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-purple-400 overflow-x-auto whitespace-pre">
                    {answersKey.module3.task3_2.code}
                  </pre>
                </div>
              </div>

              {/* Module 4: Ansible */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-semibold">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {answersKey.module4.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Максимум: {answersKey.module4.maxScore} баллов
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-200">
                      {answersKey.module4.task4_1.title} ({answersKey.module4.task4_1.score} баллов)
                    </h4>
                    <button
                      onClick={() => copyToClipboard(answersKey.module4.task4_1.code, 'ansible')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'ansible' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Копировать код
                    </button>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {answersKey.module4.task4_1.criteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{c.text} — <strong className="text-zinc-200">{c.points} б.</strong></span>
                      </li>
                    ))}
                  </ul>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-amber-400 overflow-x-auto whitespace-pre">
                    {answersKey.module4.task4_1.code}
                  </pre>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Детальный протокол: {selectedSubmission.full_name} ({selectedSubmission.group_name})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Итоговый балл: <strong className="text-blue-400 font-mono">{selectedSubmission.total_score} из {selectedSubmission.max_score}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {Object.entries(selectedSubmission.grading_details || {}).map(([qid, details]) => {
                const answerText = selectedSubmission.answers?.[qid];
                return (
                  <div key={qid} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-zinc-300">
                        Элемент: {qid}
                      </span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        details.score === details.maxScore
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : details.score > 0
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {details.score} / {details.maxScore} баллов
                      </span>
                    </div>

                    {details.checks && (
                      <div className="space-y-1">
                        {details.checks.map((chk, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px]">
                            {chk.passed ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className={chk.passed ? 'text-zinc-300' : 'text-rose-300'}>
                              {chk.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {details.feedback && (
                      <div className="text-xs text-zinc-400">
                        {details.feedback}
                      </div>
                    )}

                    {answerText && (
                      <div className="mt-2">
                        <div className="text-[10px] font-mono text-zinc-500 mb-1">
                          Ответ студента:
                        </div>
                        <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre">
                          {typeof answerText === 'object' ? JSON.stringify(answerText, null, 2) : answerText}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition-all cursor-pointer"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-semibold">
                  <Key className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">
                  Смена пароля администратора
                </h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdError && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Текущий пароль <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Новый пароль <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Минимум 4 символа"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Повторите новый пароль <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
