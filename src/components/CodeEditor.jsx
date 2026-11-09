import React from 'react';
import { FileCode, Trash2, RotateCcw } from 'lucide-react';

export default function CodeEditor({ item, value, onChange, index }) {
  const handleClear = () => {
    if (confirm('Очистить поле ввода?')) {
      onChange(item.id, '');
    }
  };

  const handleResetToTemplate = () => {
    if (confirm('Сбросить код к исходному состоянию? Все текущие правки будут удалены.')) {
      onChange(item.id, item.template || '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const currentValue = value !== undefined ? value : (item.template || '');
      const newValue = currentValue.substring(0, start) + '  ' + currentValue.substring(end);
      onChange(item.id, newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const textVal = value !== undefined ? value : (item.template || '');
  const linesCount = textVal.split('\n').length;

  const getFileLabel = (id) => {
    if (id === 't2_1') return '/etc/nginx/nginx.conf';
    if (id === 't3_1') return 'Dockerfile';
    if (id === 't3_2') return '.gitlab-ci.yml';
    if (id === 't4_1') return 'prepare.yml';
    return item.language ? item.language.toUpperCase() : 'CODE';
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-mono text-xs font-semibold">
            <FileCode className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {item.title}
            </h4>
            <span className="inline-block text-[11px] font-mono text-zinc-400">
              Файл: <strong className="text-purple-400 font-semibold">{getFileLabel(item.id)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Task instruction */}
      <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
        {item.taskText}
      </div>

      {/* Editor Container with simulated IDE tab bar */}
      <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80"></span>
            <span className="font-mono text-zinc-300">{getFileLabel(item.id)}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">{linesCount} строк</span>
          </div>
          <div className="flex items-center gap-2">
            {item.template && (
              <button
                type="button"
                onClick={handleResetToTemplate}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Сбросить к исходному коду с ошибками"
              >
                <RotateCcw className="w-3 h-3" />
                Сброс к исходному
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-red-300 hover:bg-red-950/50 transition-all cursor-pointer"
              title="Очистить поле ввода"
            >
              <Trash2 className="w-3 h-3" />
              Очистить
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          rows={Math.max(10, Math.min(22, linesCount + 2))}
          value={textVal}
          onChange={(e) => onChange(item.id, e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="code-font w-full bg-zinc-950 p-4 text-xs text-emerald-400 leading-relaxed resize-y focus:outline-none placeholder-zinc-700 selection:bg-blue-600 selection:text-white"
          placeholder="Напишите или исправьте конфигурацию здесь..."
        />
      </div>
    </div>
  );
}
