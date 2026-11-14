import React, { useState } from 'react';
import { Eye, EyeOff, Lightbulb, Sparkles, BookOpen, Users } from 'lucide-react';
import { TABLES_INFO, PARENT_TIPS, getMultiplicationTip } from '../data/tabelline';
import { ArrayVisualizer } from './ArrayVisualizer';
import { playSound } from '../utils/sound';

interface StudyAndTricksProps {
  soundEnabled: boolean;
  onStartTablePractice: (tableNum: number) => void;
}

export const StudyAndTricks: React.FC<StudyAndTricksProps> = ({
  soundEnabled,
  onStartTablePractice,
}) => {
  const [studyTab, setStudyTab] = useState<'singola' | 'pitagorica' | 'genitori'>('singola');
  const [selectedTable, setSelectedTable] = useState<number>(7);
  const [hideAnswers, setHideAnswers] = useState<boolean>(false);
  const [revealedRows, setRevealedRows] = useState<Record<number, boolean>>({});
  const [activeMultiplier, setActiveMultiplier] = useState<number>(8);

  // Tavola Pitagorica state
  const [pitRow, setPitRow] = useState<number>(6);
  const [pitCol, setPitCol] = useState<number>(7);
  const [showSquares, setShowSquares] = useState<boolean>(false);
  const [showCommutative, setShowCommutative] = useState<boolean>(true);

  const tableInfo = TABLES_INFO.find((t) => t.num === selectedTable) ?? TABLES_INFO[0];
  const singleTip = getMultiplicationTip(selectedTable, activeMultiplier);
  const pitTip = getMultiplicationTip(pitRow, pitCol);

  const toggleRowReveal = (m: number) => {
    playSound('click', soundEnabled);
    setRevealedRows((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  return (
    <div className="space-y-8">
      {/* Header & Sub-tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              La Bacheca della Maestra: Studia e Scopri i Trucchi
            </h1>
            <p className="mt-1.5 text-slate-600 text-sm sm:text-base max-w-2xl">
              Prima di correre, scopriamo i segreti di ogni tabellina! Puoi coprire i risultati per
              metterti alla prova o esplorare la Tavola Pitagorica.
            </p>
          </div>

          {/* Interactive segmented filter control */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start">
            <button
              type="button"
              onClick={() => setStudyTab('singola')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                studyTab === 'singola'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tabelline 1–10</span>
            </button>
            <button
              type="button"
              onClick={() => setStudyTab('pitagorica')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                studyTab === 'pitagorica'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tavola Pitagorica</span>
            </button>
            <button
              type="button"
              onClick={() => setStudyTab('genitori')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                studyTab === 'genitori'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Consigli Genitori</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Single Table Study */}
      {studyTab === 'singola' && (
        <div className="space-y-6">
          {/* Table selector strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-slate-500 mb-3">
              Scegli la tabellina da studiare
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {TABLES_INFO.map((t) => {
                const active = t.num === selectedTable;
                const activeTone =
                  t.level === 'Facile'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-[0_3px_0_0_#1D4ED8]'
                    : t.level === 'Media'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-[0_3px_0_0_#B45309]'
                    : 'bg-emerald-600 text-white border-emerald-700 shadow-[0_3px_0_0_#047857]';
                return (
                  <button
                    key={t.num}
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSelectedTable(t.num);
                      setRevealedRows({});
                    }}
                    className={`h-12 rounded-xl font-display font-bold text-lg tabular-nums border transition-all cursor-pointer active:translate-y-[2px] active:shadow-none ${
                      active
                        ? activeTone
                        : 'bg-slate-50 text-slate-800 border-slate-200 shadow-[0_2px_0_0_#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    × {t.num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive 1..10 list with Cover & Guess */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Tabellina del {selectedTable}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Livello: {tableInfo.level} · {tableInfo.motto}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setHideAnswers((v) => !v);
                      setRevealedRows({});
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      hideAnswers
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hideAnswers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{hideAnswers ? 'Mostra tutte' : 'Copri e Indovina'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartTablePractice(selectedTable)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Allenala ora
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: 10 }, (_, idx) => idx + 1).map((m) => {
                  const isHidden = hideAnswers && !revealedRows[m];
                  const isActiveRow = activeMultiplier === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setActiveMultiplier(m);
                        if (hideAnswers) toggleRowReveal(m);
                        else playSound('click', soundEnabled);
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        isActiveRow
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-display font-bold text-lg text-slate-800 tabular-nums">
                        {selectedTable} × {m} =
                      </span>
                      <span
                        className={`font-display font-bold text-xl tabular-nums px-2.5 py-0.5 rounded-lg ${
                          isHidden
                            ? 'bg-amber-100 text-amber-800 text-sm'
                            : 'text-blue-700'
                        }`}
                      >
                        {isHidden ? 'Tocca!' : selectedTable * m}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Maestra Secret Tip + Visual Array */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                  <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Il segreto della tabellina del {selectedTable}: {tableInfo.motto}</span>
                </div>
                <p className="mt-2.5 text-sm sm:text-base text-slate-800 leading-relaxed">
                  {tableInfo.secretRule}
                </p>
                <div className="mt-3 pt-3 border-t border-amber-200/80 text-xs sm:text-sm text-amber-900 space-y-1">
                  <div>
                    <span className="font-semibold">Esempio veloce:</span> {tableInfo.example}
                  </div>
                  <div>
                    <span className="font-semibold">Trucco extra:</span> {tableInfo.fingerOrVisualTip}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Trucco specifico per {selectedTable} × {activeMultiplier}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {singleTip.title}
                  </h3>
                  <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                    {singleTip.strategy}
                  </p>
                  {singleTip.commutativeNote && (
                    <p className="text-xs text-slate-500 mt-2">{singleTip.commutativeNote}</p>
                  )}
                </div>

                <ArrayVisualizer
                  rows={selectedTable}
                  cols={activeMultiplier}
                  highlightSplitFive={selectedTable > 5 && selectedTable < 10}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Tavola Pitagorica */}
      {studyTab === 'pitagorica' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tavola Pitagorica Interattiva</h2>
                <p className="text-xs text-slate-500">
                  Tocca qualsiasi casella per illuminare riga, colonna e il trucco corrispondente
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSquares((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showSquares
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Quadrati Magici
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommutative((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showCommutative
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Specchio Commutativo
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full border-collapse min-w-[440px]">
                <thead>
                  <tr>
                    <th className="p-1.5 text-xs font-bold text-slate-400 text-center">×</th>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                      <th
                        key={c}
                        className={`p-1.5 text-xs font-bold text-center tabular-nums rounded-t-md ${
                          c === pitCol ? 'bg-blue-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, r) => r + 1).map((r) => (
                    <tr key={r}>
                      <th
                        className={`p-1.5 text-xs font-bold text-center tabular-nums rounded-l-md ${
                          r === pitRow ? 'bg-blue-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {r}
                      </th>
                      {Array.from({ length: 10 }, (_, c) => c + 1).map((c) => {
                        const isSelected = r === pitRow && c === pitCol;
                        const isMirror =
                          showCommutative && r === pitCol && c === pitRow && pitRow !== pitCol;
                        const isSquare = showSquares && r === c;
                        const inCross = r === pitRow || c === pitCol;

                        let cellClass = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
                        if (isSelected) {
                          cellClass = 'bg-blue-600 text-white border-blue-700 font-bold';
                        } else if (isMirror) {
                          cellClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                        } else if (isSquare) {
                          cellClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                        } else if (inCross) {
                          cellClass = 'bg-blue-50/80 text-blue-900 border-blue-200';
                        }

                        return (
                          <td key={c} className="p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                playSound('click', soundEnabled);
                                setPitRow(r);
                                setPitCol(c);
                              }}
                              className={`w-full h-9 rounded-md border text-xs font-mono tabular-nums flex items-center justify-center transition-colors cursor-pointer ${cellClass}`}
                            >
                              {r * c}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="text-3xl font-extrabold font-display text-slate-900 tabular-nums">
                  {pitRow} × {pitCol} = <span className="text-blue-600">{pitRow * pitCol}</span>
                </div>
                {showCommutative && pitRow !== pitCol && (
                  <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg tabular-nums">
                    Gemella: {pitCol} × {pitRow}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{pitTip.title}</h3>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{pitTip.strategy}</p>
                <p className="mt-2 text-xs text-slate-500">{pitTip.breakdownExample}</p>
              </div>

              <ArrayVisualizer
                rows={pitRow}
                cols={pitCol}
                highlightSplitFive={pitRow > 5 && pitRow < 10}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Parent Guide */}
      {studyTab === 'genitori' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              I 6 Consigli della Maestra per Mamma e Papà
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600">
              Imparare le tabelline in terza primaria può essere un momento sereno e divertente
              insieme. Ecco cosa funziona davvero in classe e a casa:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PARENT_TIPS.map((tip, index) => (
              <div
                key={tip.title}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-blue-600 mb-2">
                    0{index + 1}.
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{tip.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
