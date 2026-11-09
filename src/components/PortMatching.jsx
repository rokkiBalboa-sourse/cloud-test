import React from 'react';
import { Network, Server, ArrowRight } from 'lucide-react';

export default function PortMatching({ item, value = {}, onChange, index }) {
  const handleSelect = (serviceId, port) => {
    const updated = { ...value, [serviceId]: port };
    onChange(item.id, updated);
  };

  const services = item.services || [];
  const availablePorts = item.availablePorts || [
    '3000', '3100', '4317', '4318', '6443', '7443', '8080', '9009', '9090', '9100'
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-xs font-semibold">
            <Network className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {item.title}
            </h4>
            <span className="text-[11px] text-zinc-400">
              Сопоставление сетевых портов и облачных сервисов
            </span>
          </div>
        </div>
      </div>

      {/* Task Description */}
      <div className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
        {item.taskText}
      </div>

      {/* Matching Grid */}
      <div className="grid gap-2.5">
        {services.map((svc) => {
          const selectedPort = value[svc.id] || '';
          return (
            <div
              key={svc.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                selectedPort
                  ? 'bg-zinc-900 border-blue-500/40 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300">
                  <Server className="w-4 h-4 text-blue-400" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">
                    {svc.name}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Стандартный порт службы
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ArrowRight className="w-4 h-4 text-zinc-600 hidden sm:block" />
                <select
                  value={selectedPort}
                  onChange={(e) => handleSelect(svc.id, e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-medium text-emerald-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" className="text-zinc-500">
                    Выберите порт...
                  </option>
                  {availablePorts.map((port) => (
                    <option key={port} value={port} className="text-zinc-100 bg-zinc-900">
                      Порт {port}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

