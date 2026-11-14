import React from 'react';

interface ArrayVisualizerProps {
  rows: number;
  cols: number;
  highlightSplitFive?: boolean;
  compact?: boolean;
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  rows,
  cols,
  highlightSplitFive = false,
  compact = false,
}) => {
  const safeRows = Math.min(Math.max(rows, 1), 10);
  const safeCols = Math.min(Math.max(cols, 1), 10);
  const dotSize = compact ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6';
  const showSplit = highlightSplitFive && safeRows > 5;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">
          Schieramento: {safeRows} {safeRows === 1 ? 'riga' : 'righe'} da {safeCols} quadretti
        </span>
        <span className="tabular-nums font-semibold text-slate-700">
          Totale: {safeRows * safeCols}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1.5">
          {Array.from({ length: safeRows }).map((_, rIdx) => {
            const isSecondGroup = showSplit && rIdx >= 5;
            const runningTotal = (rIdx + 1) * safeCols;
            return (
              <div
                key={rIdx}
                className={`flex items-center gap-1.5 ${
                  showSplit && rIdx === 5 ? 'pt-2 mt-1 border-t border-dashed border-slate-300' : ''
                }`}
              >
                <span className="w-5 text-right text-[11px] font-mono tabular-nums text-slate-400 select-none">
                  {rIdx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: safeCols }).map((__, cIdx) => (
                    <div
                      key={cIdx}
                      className={`${dotSize} rounded-md shadow-[inset_0_-2px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] ${
                        isSecondGroup
                          ? 'bg-amber-500 border border-amber-600/40'
                          : 'bg-blue-600 border border-blue-700/40'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-xs font-mono tabular-nums font-semibold text-slate-600 select-none">
                  {runningTotal}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showSplit && (
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block shadow-[inset_0_-1px_0_rgba(0,0,0,0.2)]" />
            <span>5 × {safeCols} = {5 * safeCols}</span>
          </span>
          <span aria-hidden="true">+</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block shadow-[inset_0_-1px_0_rgba(0,0,0,0.2)]" />
            <span>{safeRows - 5} × {safeCols} = {(safeRows - 5) * safeCols}</span>
          </span>
          <span aria-hidden="true">=</span>
          <span className="font-semibold text-slate-900 tabular-nums">{safeRows * safeCols}</span>
        </div>
      )}
    </div>
  );
};
