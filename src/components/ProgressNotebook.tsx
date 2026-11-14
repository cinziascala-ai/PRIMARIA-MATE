import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Circle,
  RotateCcw,
  Play,
  Lock,
  Award,
} from 'lucide-react';
import type { PlayerStats } from '../types/game';
import { makeFactKey, getMultiplicationTip } from '../data/tabelline';
import { countMasteredFacts, evaluateTrophies, formatItalianDateKey } from '../data/trophies';
import { TrophyIcon } from './TrophyIcon';

interface ProgressNotebookProps {
  stats: PlayerStats;
  onResetStats: () => void;
  onPracticeWeakFacts: (facts: Array<[number, number]>) => void;
}

type MasteryStatus = 'mastered' | 'practicing' | 'review' | 'unseen';
type TrophyFilter = 'tutti' | 'sbloccati' | 'bloccati';

function getFactStatus(stats: PlayerStats, a: number, b: number): MasteryStatus {
  const rec = stats.facts[makeFactKey(a, b)];
  if (!rec || rec.attempts === 0) return 'unseen';
  const rate = rec.correct / rec.attempts;
  if (rec.streak >= 2 || (rec.attempts >= 2 && rate >= 0.85)) return 'mastered';
  if (rate < 0.6 || rec.streak === 0) return 'review';
  return 'practicing';
}

export const ProgressNotebook: React.FC<ProgressNotebookProps> = ({
  stats,
  onResetStats,
  onPracticeWeakFacts,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [trophyFilter, setTrophyFilter] = useState<TrophyFilter>('tutti');

  const masteredCount = countMasteredFacts(stats.facts);
  const weakFacts: Array<{ a: number; b: number; accuracy: number; attempts: number }> = [];

  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const status = getFactStatus(stats, a, b);
      const rec = stats.facts[makeFactKey(a, b)];
      if (rec && rec.attempts > 0 && status === 'review') {
        weakFacts.push({
          a,
          b,
          accuracy: Math.round((rec.correct / rec.attempts) * 100),
          attempts: rec.attempts,
        });
      }
    }
  }

  weakFacts.sort((x, y) => x.accuracy - y.accuracy);
  const overallAccuracy =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const evaluatedTrophies = evaluateTrophies(stats);
  const unlockedCount = evaluatedTrophies.filter((t) => t.unlocked).length;
  const visibleTrophies = evaluatedTrophies.filter((t) => {
    if (trophyFilter === 'sbloccati') return t.unlocked;
    if (trophyFilter === 'bloccati') return !t.unlocked;
    return true;
  });

  const selectedTip = selectedCell ? getMultiplicationTip(selectedCell[0], selectedCell[1]) : null;
  const selectedRec = selectedCell ? stats.facts[makeFactKey(selectedCell[0], selectedCell[1])] : null;

  return (
    <div className="space-y-8">
      {/* Header & Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Il tuo Quaderno dei Progressi
            </h1>
            <p className="mt-1.5 text-slate-600 text-sm sm:text-base max-w-2xl">
              Ogni risposta fa crescere la tua mappa delle 100 tabelline e ti avvicina ai nuovi
              trofei della classe!
            </p>
          </div>
          <div className="shrink-0">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Azzera quaderno</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetStats();
                    setConfirmReset(false);
                    setSelectedCell(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Conferma azzeramento
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5-column KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Tabelline conquistate</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums">
              {masteredCount} <span className="text-base font-normal text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Precisione totale</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums">
              {overallAccuracy}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Serie migliore</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums">
              {stats.bestStreak} <span className="text-base font-normal text-slate-500">di fila</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Giorni di fila</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums">
              {stats.currentDayStreak}{' '}
              <span className="text-base font-normal text-slate-500">
                {stats.currentDayStreak === 1 ? 'giorno' : 'giorni'}
              </span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="text-xs font-medium text-slate-500">Record Sfida Lampo</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums">
              {stats.bestBlitzScore} <span className="text-base font-normal text-slate-500">pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bacheca dei Trofei e Badge */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-900">Bacheca dei Trofei</h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 tabular-nums">
              Hai sbloccato <strong className="text-slate-900">{unlockedCount}</strong> trofei su{' '}
              <strong className="text-slate-900">{evaluatedTrophies.length}</strong> · Risposte
              esatte totali: <strong className="text-slate-900">{stats.totalCorrect}</strong>
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
            {(
              [
                { id: 'tutti', label: 'Tutti' },
                { id: 'sbloccati', label: 'Sbloccati' },
                { id: 'bloccati', label: 'Da sbloccare' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTrophyFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  trophyFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {visibleTrophies.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-600">
            {trophyFilter === 'sbloccati'
              ? 'Nessun trofeo sbloccato ancora: fai la tua prima partita per guadagnare il primo!'
              : 'Incredibile! Hai sbloccato tutti i trofei disponibili!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  trophy.unlocked
                    ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/60 border-amber-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                      trophy.unlocked
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <TrophyIcon icon={trophy.icon} className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-500">{trophy.category}</div>
                    <h3
                      className={`font-display font-bold text-base leading-snug mt-0.5 ${
                        trophy.unlocked ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {trophy.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {trophy.description}
                    </p>
                  </div>
                </div>

                {/* Explicit dual-coded status footer */}
                <div className="pt-3 border-t border-slate-200/70">
                  {trophy.unlocked ? (
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-emerald-800">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sbloccato</span>
                      </span>
                      {trophy.unlockedDate && (
                        <span className="font-normal text-slate-500 tabular-nums">
                          {formatItalianDateKey(trophy.unlockedDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>In corso</span>
                        </span>
                        <span className="font-mono font-semibold tabular-nums text-slate-700">
                          {trophy.current} / {trophy.target} {trophy.unit}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${trophy.progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Split: 10x10 Heatmap + Weak Facts / Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Mappa delle 100 Tabelline</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conquistata</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleDot className="w-3.5 h-3.5 text-amber-600" />
                <span>In allenamento</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Da ripassare</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Circle className="w-3.5 h-3.5 text-slate-300" />
                <span>Nuova</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="w-full border-collapse min-w-[420px]">
              <thead>
                <tr>
                  <th className="p-1 text-xs font-mono text-slate-400 text-center">×</th>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((col) => (
                    <th key={col} className="p-1 text-xs font-bold text-slate-600 text-center tabular-nums">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, r) => r + 1).map((row) => (
                  <tr key={row}>
                    <th className="p-1 text-xs font-bold text-slate-600 text-center tabular-nums">
                      {row}
                    </th>
                    {Array.from({ length: 10 }, (_, c) => c + 1).map((col) => {
                      const status = getFactStatus(stats, row, col);
                      const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;

                      const cellStyles: Record<MasteryStatus, string> = {
                        mastered: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
                        practicing: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
                        review: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
                        unseen: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100',
                      };

                      return (
                        <td key={col} className="p-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCell([row, col])}
                            title={`${row} × ${col} = ${row * col}`}
                            className={`w-full h-9 rounded-md border text-xs font-mono font-semibold tabular-nums flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                              cellStyles[status]
                            } ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                          >
                            <span>{row * col}</span>
                            {status === 'mastered' && <span className="sr-only">Conquistata</span>}
                            {status === 'review' && <span className="text-[10px] font-bold">!</span>}
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

        {/* Right Side: Inspector & Weak Facts */}
        <div className="lg:col-span-5 space-y-6">
          {selectedCell && selectedTip && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-xl font-bold font-display text-slate-900 tabular-nums">
                  {selectedCell[0]} × {selectedCell[1]} = {selectedCell[0] * selectedCell[1]}
                </h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  {selectedRec
                    ? `${selectedRec.correct}/${selectedRec.attempts} esatte`
                    : 'Non ancora provata'}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-blue-700">{selectedTip.title}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedTip.strategy}</p>
                <p className="text-xs text-slate-500">{selectedTip.breakdownExample}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tabelline da Ripassare</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allenati proprio su quelle dove serve un po’ di sprint in più
                </p>
              </div>
              {weakFacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onPracticeWeakFacts(weakFacts.slice(0, 10).map((f) => [f.a, f.b]))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Allena queste!</span>
                </button>
              )}
            </div>

            {weakFacts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <p className="text-sm font-medium text-slate-700">
                  {stats.totalAnswered === 0
                    ? 'Non hai ancora iniziato! Fai una partita nella sezione Gioca per vedere qui le tue tabelline.'
                    : 'Fantastico! Al momento non hai nessuna tabellina segnata da ripassare.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {weakFacts.slice(0, 8).map((item) => (
                  <div
                    key={`${item.a}x${item.b}`}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCell([item.a, item.b])}
                      className="text-left font-display font-bold text-slate-900 hover:text-blue-600 transition-colors tabular-nums cursor-pointer"
                    >
                      {item.a} × {item.b} = {item.a * item.b}
                    </button>
                    <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
                      <span>{item.accuracy}% esatte</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.attempts} prove</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
