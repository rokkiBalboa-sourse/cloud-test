import React from 'react';

export default function QuestionCard({ question, selectedValue, onChange, index }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm transition-all hover:border-zinc-700/80">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 font-mono text-xs font-semibold shrink-0 mt-0.5">
          {index + 1}
        </span>
        <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
          {question.question}
        </h4>
      </div>

      <div className="space-y-2.5 pl-9">
        {question.options.map((opt) => {
          const isSelected = selectedValue === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/60 text-white shadow-sm'
                  : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange(question.id, opt.id)}
                className="mt-0.5 h-4 w-4 border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 shrink-0"
              />
              <span className="leading-relaxed">{opt.text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
