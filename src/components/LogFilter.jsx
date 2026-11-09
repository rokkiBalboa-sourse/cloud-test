import React, { useState } from 'react';
import { Terminal, Search, Play, CheckCircle2, RotateCcw } from 'lucide-react';

export default function LogFilter({ item, value, onChange, index }) {
  const [filterQuery, setFilterQuery] = useState(value || '');
  const [matchedLines, setMatchedLines] = useState(null);

  const logLines = (item.logData || '').split('\n').filter(Boolean);

  const executeFilter = (queryToRun) => {
    const raw = (queryToRun !== undefined ? queryToRun : filterQuery).trim();
    if (!raw) {
      setMatchedLines(null);
      return;
    }

    try {
      let pattern = raw;

      // Extract regex from grep command if student typed grep ... '...'
      const grepQuoted = raw.match(/grep(?:\s+-[A-Za-z]+)*\s+['"]([^'"]+)['"]/i);
      if (grepQuoted) {
        pattern = grepQuoted[1];
      } else if (raw.toLowerCase().startsWith('grep')) {
        // e.g. grep -E pattern filename
        const parts = raw.split(/\s+/).filter(p => !p.startsWith('-') && p.toLowerCase() !== 'grep' && !p.includes('/var/log'));
        if (parts.length > 0) {
          pattern = parts[0];
        } else {
          setMatchedLines([]);
          return;
        }
      }

      const re = new RegExp(pattern, 'i');
      const matches = logLines.filter(line => re.test(line));
      setMatchedLines(matches);
    } catch (e) {
      // If regex syntax error, fallback to case-insensitive substring search
      const q = raw.toLowerCase();
      const matches = logLines.filter(line => line.toLowerCase().includes(q));
      setMatchedLines(matches);
    }
  };

  const handleChange = (val) => {
    setFilterQuery(val);
    onChange(item.id, val);
    if (!val.trim()) {
      setMatchedLines(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeFilter();
    }
  };

  const handleReset = () => {
    setFilterQuery('');
    setMatchedLines(null);
    onChange(item.id, '');
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold">
            <Terminal className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {item.title}
            </h4>
            <span className="text-[11px] font-mono text-zinc-400">
              Файл: <strong className="text-emerald-400 font-semibold">/var/log/syslog</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Task Description */}
      <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
        {item.taskText}
      </div>

      {/* Input field for grep command or regex */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-300">
          Введите команду grep или регулярное выражение:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 flex items-center gap-1.5 text-zinc-500 font-mono text-xs select-none">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>$</span>
            </div>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="grep -E '<шаблон>' /var/log/syslog"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-12 pr-16 text-xs font-mono text-emerald-400 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2 top-2 px-2 py-1 rounded bg-zinc-800 text-[11px] text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Сброс
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => executeFilter()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Выполнить
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          Нажмите «Выполнить» или Enter для проверки работы фильтра на образце системного журнала.
        </p>
      </div>

      {/* Matched Preview if filter was executed */}
      {matchedLines !== null && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Результат выполнения фильтра (отобрано строк: {matchedLines.length}):
            </span>
          </div>
          {matchedLines.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-[11px] text-zinc-200">
              {matchedLines.map((line, idx) => (
                <div key={idx} className="p-1.5 rounded bg-zinc-900 border border-zinc-800/80 break-all text-emerald-300">
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400">
              По заданному выражению строк в логе не обнаружено.
            </p>
          )}
        </div>
      )}

      {/* Log Console Preview */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] text-zinc-400">
          <span className="font-mono">Журнал /var/log/syslog ({logLines.length} строк)</span>
          <span className="text-[10px] text-zinc-500">Просмотр исходного журнала событий</span>
        </div>
        <div className="max-h-56 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-zinc-400 space-y-1 select-text">
          {logLines.map((line, idx) => (
            <div key={idx} className="flex gap-3 px-1 py-0.5 rounded hover:bg-zinc-900/50">
              <span className="text-zinc-600 select-none w-6 text-right shrink-0">{idx + 1}</span>
              <span className="break-all">{line}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
