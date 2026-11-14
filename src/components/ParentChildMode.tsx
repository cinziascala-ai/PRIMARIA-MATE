import React, { useState } from 'react';
import {
  Users,
  MessageCircleQuestion,
  Swords,
  Lightbulb,
  Eye,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import type { QuestionItem } from '../types/game';
import { buildDeck, getMultiplicationTip } from '../data/tabelline';
import { ArrayVisualizer } from './ArrayVisualizer';
import { AnimatedMascot } from './AnimatedMascot';
import { playSound } from '../utils/sound';

interface ParentChildModeProps {
  soundEnabled: boolean;
  onRecordFact: (a: number, b: number, isCorrect: boolean) => void;
}

type DuoTab = 'interroga' | 'duello';

export const ParentChildMode: React.FC<ParentChildModeProps> = ({
  soundEnabled,
  onRecordFact,
}) => {
  const [duoTab, setDuoTab] = useState<DuoTab>('interroga');
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9]);

  // === MODE A: INTERROGA TU (Flashcard orale genitore-bimbo) ===
  const [oralDeck, setOralDeck] = useState<QuestionItem[]>(() => buildDeck([2, 3, 4, 5, 6, 7, 8, 9], 10));
  const [oralIdx, setOralIdx] = useState<number>(0);
  const [oralActive, setOralActive] = useState<boolean>(false);
  const [oralShowAnswer, setOralShowAnswer] = useState<boolean>(false);
  const [oralShowTip, setOralShowTip] = useState<boolean>(false);
  const [oralGotRight, setOralGotRight] = useState<number>(0);
  const [oralNeedsReview, setOralNeedsReview] = useState<Array<[number, number]>>([]);
  const [oralFinished, setOralFinished] = useState<boolean>(false);

  // === MODE B: BOTTA E RISPOSTA (2 Giocatori sullo stesso schermo) ===
  const [p1Name, setP1Name] = useState<string>('Bimbo/a');
  const [p2Name, setP2Name] = useState<string>('Mamma / Papà');
  const [kidBonus, setKidBonus] = useState<boolean>(true);
  const [duelPhase, setDuelPhase] = useState<'SETUP' | 'HANDOFF' | 'QUESTION' | 'FINISHED'>('SETUP');
  const [duelDeck, setDuelDeck] = useState<QuestionItem[]>([]);
  const [duelTurn, setDuelTurn] = useState<number>(0); // 0..9 (10 turns total, 5 each)
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [duelFeedback, setDuelFeedback] = useState<{
    isCorrect: boolean;
    chosen: number;
  } | null>(null);

  const toggleTable = (n: number) => {
    playSound('click', soundEnabled);
    setSelectedTables((prev) => {
      if (prev.includes(n)) {
        return prev.length > 1 ? prev.filter((x) => x !== n) : prev;
      }
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  // Start Oral Flashcard Session
  const startOralSession = () => {
    playSound('click', soundEnabled);
    setOralDeck(buildDeck(selectedTables, 10));
    setOralIdx(0);
    setOralShowAnswer(false);
    setOralShowTip(false);
    setOralGotRight(0);
    setOralNeedsReview([]);
    setOralFinished(false);
    setOralActive(true);
  };

  const handleOralMark = (isRight: boolean) => {
    const q = oralDeck[oralIdx];
    if (!q) return;

    onRecordFact(q.a, q.b, isRight);
    playSound(isRight ? 'correct' : 'hint', soundEnabled);

    if (isRight) {
      setOralGotRight((c) => c + 1);
    } else {
      setOralNeedsReview((prev) => [...prev, [q.a, q.b]]);
    }

    if (oralIdx + 1 >= oralDeck.length) {
      playSound('victory', soundEnabled);
      setOralFinished(true);
    } else {
      setOralIdx((i) => i + 1);
      setOralShowAnswer(false);
      setOralShowTip(false);
    }
  };

  // Start 2-Player Duel
  const startDuel = () => {
    playSound('click', soundEnabled);
    setDuelDeck(buildDeck(selectedTables, 10));
    setDuelTurn(0);
    setP1Score(0);
    setP2Score(0);
    setDuelFeedback(null);
    setDuelPhase('HANDOFF');
  };

  const currentPlayerIndex = duelTurn % 2; // 0 = P1, 1 = P2
  const currentPlayerName = currentPlayerIndex === 0 ? p1Name || 'Giocatore 1' : p2Name || 'Giocatore 2';
  const currentDuelQ = duelDeck[duelTurn];

  const handleDuelAnswer = (choice: number) => {
    if (!currentDuelQ || duelFeedback !== null) return;
    const isCorrect = choice === currentDuelQ.answer;
    setDuelFeedback({ isCorrect, chosen: choice });

    if (currentPlayerIndex === 0) {
      onRecordFact(currentDuelQ.a, currentDuelQ.b, isCorrect);
      if (isCorrect) setP1Score((s) => s + (kidBonus ? 12 : 10));
    } else {
      if (isCorrect) setP2Score((s) => s + 10);
    }

    playSound(isCorrect ? 'correct' : 'wrong', soundEnabled);
  };

  const nextDuelTurn = () => {
    if (duelTurn + 1 >= duelDeck.length) {
      playSound('victory', soundEnabled);
      setDuelPhase('FINISHED');
    } else {
      setDuelTurn((t) => t + 1);
      setDuelFeedback(null);
      setDuelPhase('HANDOFF');
    }
  };

  const currentOralQ = oralDeck[oralIdx];
  const currentOralTip = currentOralQ ? getMultiplicationTip(currentOralQ.a, currentOralQ.b) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sfida a Due: Insieme a Mamma, Papà o un Compagno
            </h1>
            <p className="mt-1.5 text-slate-600 text-sm sm:text-base max-w-2xl">
              Le tabelline si imparano ancora meglio in compagnia! Scegli se fare l’interrogazione
              a voce con i suggerimenti per il genitore, oppure una sfida amichevole a turni.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start">
            <button
              type="button"
              onClick={() => setDuoTab('interroga')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                duoTab === 'interroga'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircleQuestion className="w-4 h-4" />
              <span>Interroga Tu!</span>
            </button>
            <button
              type="button"
              onClick={() => setDuoTab('duello')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                duoTab === 'duello'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Botta e Risposta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shared Table Picker when in Setup */}
      {((duoTab === 'interroga' && !oralActive) || (duoTab === 'duello' && duelPhase === 'SETUP')) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              Scegliete insieme le tabelline per questa sfida
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((n) => {
                const active = selectedTables.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleTable(n)}
                    className={`h-12 rounded-xl font-display font-bold text-lg tabular-nums border transition-all cursor-pointer active:translate-y-[2px] active:shadow-none ${
                      active
                        ? 'bg-blue-600 text-white border-blue-700 shadow-[0_3px_0_0_#1D4ED8]'
                        : 'bg-slate-50 text-slate-800 border-slate-200 shadow-[0_2px_0_0_#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    × {n}
                  </button>
                );
              })}
            </div>
          </div>

          {duoTab === 'interroga' ? (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-slate-600 max-w-xl">
                <span className="font-semibold text-slate-900">Come funziona:</span> lo schermo
                mostra un cartellino per volta. Il genitore fa la domanda ad alta voce e può
                leggere un suggerimento guidato prima di mostrare la risposta!
              </div>
              <button
                type="button"
                onClick={startOralSession}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Inizia Interrogazione (10 carte)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nome Giocatore 1 (Bimbo/a)
                  </label>
                  <input
                    type="text"
                    value={p1Name}
                    maxLength={18}
                    onChange={(e) => setP1Name(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nome Giocatore 2 (Genitore / Compagno)
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    maxLength={18}
                    onChange={(e) => setP2Name(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kidBonus}
                    onChange={(e) => setKidBonus(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">Regola Amica:</span> {p1Name || 'Giocatore 1'} guadagna 12 punti a risposta giusta invece di 10!
                  </span>
                </label>

                <button
                  type="button"
                  onClick={startDuel}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Inizia la Sfida (10 turni)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE A ACTIVE: INTERROGA TU ==================== */}
      {duoTab === 'interroga' && oralActive && !oralFinished && currentOralQ && currentOralTip && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-display font-bold text-slate-900 tabular-nums">
              Cartellino {oralIdx + 1} / {oralDeck.length}
            </span>
            <button
              type="button"
              onClick={() => setOralActive(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cambia tabelline
            </button>
          </div>

          <AnimatedMascot
            compact
            mood={oralShowAnswer ? 'celebrate' : oralShowTip ? 'thinking' : 'idle'}
            message={
              oralShowAnswer
                ? `Esatto! ${currentOralQ.a} × ${currentOralQ.b} fa proprio ${currentOralQ.answer}!`
                : oralShowTip
                ? 'Ecco un indizio da leggere insieme a voce alta!'
                : 'Fai la domanda a voce: quando vuoi, scopri il trucco o la risposta!'
            }
          />

          <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs font-medium text-slate-500 mb-2">
              Domanda ad alta voce
            </div>
            <div className="font-display font-extrabold text-5xl sm:text-6xl text-slate-900 tabular-nums">
              {currentOralQ.a} × {currentOralQ.b} ={' '}
              <span className="text-blue-600">
                {oralShowAnswer ? currentOralQ.answer : '?'}
              </span>
            </div>
          </div>

          {/* Scaffolding buttons for Parent */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                playSound('hint', soundEnabled);
                setOralShowTip((v) => !v);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{oralShowTip ? 'Nascondi aiuto' : 'Suggerisci il trucco al bimbo'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setOralShowAnswer((v) => !v);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{oralShowAnswer ? 'Nascondi risposta' : 'Mostra Risposta'}</span>
            </button>
          </div>

          {oralShowTip && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold text-amber-900">
                Indizio per il genitore (da dire a voce senza svelare il risultato):
              </div>
              <div className="font-bold text-sm text-slate-900">{currentOralTip.title}</div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentOralTip.strategy}</p>
            </div>
          )}

          {oralShowAnswer && (
            <div className="flex justify-center">
              <ArrayVisualizer
                rows={currentOralQ.a}
                cols={currentOralQ.b}
                highlightSplitFive={currentOralQ.a > 5 && currentOralQ.a < 10}
                compact
              />
            </div>
          )}

          {/* Parent grading buttons */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOralMark(false)}
              className="py-3.5 px-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-sm transition-colors cursor-pointer"
            >
              Ci ha pensato un po’ · Da ripassare
            </button>
            <button
              type="button"
              onClick={() => handleOralMark(true)}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Risposta subito giusta!</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE A SUMMARY */}
      {duoTab === 'interroga' && oralActive && oralFinished && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-5">
          <Users className="w-10 h-10 text-blue-600 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">
            Bravissimi! Interrogazione completata!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Risposte dette subito giuste:{' '}
            <span className="font-bold text-emerald-700 tabular-nums">
              {oralGotRight} su {oralDeck.length}
            </span>
          </p>

          {oralNeedsReview.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-left">
              <div className="text-sm font-bold text-amber-950 mb-2">
                Quelle da ripetere insieme domani (bastano 2 minuti!):
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-display font-bold text-slate-900 tabular-nums">
                {oralNeedsReview.map(([a, b], i) => (
                  <span key={`${a}x${b}-${i}`}>
                    {a} × {b} = {a * b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOralActive(false)}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cambia tabelline
            </button>
            <button
              type="button"
              onClick={startOralSession}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nuovo giro insieme</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODE B ACTIVE: 2-PLAYER DUEL ==================== */}
      {duoTab === 'duello' && duelPhase !== 'SETUP' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`bg-white border rounded-2xl p-4 flex items-center justify-between ${
                duelPhase !== 'FINISHED' && currentPlayerIndex === 0
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="text-xs text-slate-500">Giocatore 1</div>
                <div className="font-bold text-slate-900 truncate max-w-[140px]">
                  {p1Name || 'Bimbo/a'}
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-blue-600 tabular-nums">
                {p1Score} pt
              </div>
            </div>

            <div
              className={`bg-white border rounded-2xl p-4 flex items-center justify-between ${
                duelPhase !== 'FINISHED' && currentPlayerIndex === 1
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="text-xs text-slate-500">Giocatore 2</div>
                <div className="font-bold text-slate-900 truncate max-w-[140px]">
                  {p2Name || 'Mamma / Papà'}
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-slate-900 tabular-nums">
                {p2Score} pt
              </div>
            </div>
          </div>

          {duelPhase === 'HANDOFF' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5">
              <div className="text-xs font-semibold text-blue-600 tabular-nums">
                Turno {duelTurn + 1} di {duelDeck.length}
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Tocca a {currentPlayerName}!
              </h2>
              <p className="text-sm text-slate-600">
                Quando sei pronto davanti allo schermo, premi il pulsante qui sotto.
              </p>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setDuelPhase('QUESTION');
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-lg rounded-xl transition-colors cursor-pointer"
              >
                Sono pronto!
              </button>
            </div>
          )}

          {duelPhase === 'QUESTION' && currentDuelQ && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sta giocando: <strong className="text-slate-900">{currentPlayerName}</strong></span>
                <span className="tabular-nums">Turno {duelTurn + 1} / {duelDeck.length}</span>
              </div>

              <AnimatedMascot
                compact
                mood={
                  duelFeedback
                    ? duelFeedback.isCorrect
                      ? 'celebrate'
                      : 'encourage'
                    : 'blitz'
                }
                message={
                  duelFeedback
                    ? duelFeedback.isCorrect
                      ? `Evviva ${currentPlayerName}! Punto guadagnato!`
                      : `Quasi! ${currentDuelQ.a} × ${currentDuelQ.b} fa ${currentDuelQ.answer}.`
                    : `Forza ${currentPlayerName}, tocca il numero giusto!`
                }
              />

              <div className="text-center font-display font-extrabold text-5xl sm:text-6xl text-slate-900 tabular-nums py-2">
                {currentDuelQ.a} × {currentDuelQ.b} ={' '}
                <span className="text-blue-600">
                  {duelFeedback ? currentDuelQ.answer : '?'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {currentDuelQ.choices.map((choice) => {
                  let btnStyle =
                    'bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border-slate-200 text-slate-900 shadow-[0_3px_0_0_#CBD5E1] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none';
                  if (duelFeedback) {
                    if (choice === currentDuelQ.answer) {
                      btnStyle =
                        'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-[0_3px_0_0_#10B981]';
                    } else if (choice === duelFeedback.chosen && !duelFeedback.isCorrect) {
                      btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 shadow-none';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 shadow-none';
                    }
                  }
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={duelFeedback !== null}
                      onClick={() => handleDuelAnswer(choice)}
                      className={`min-h-[72px] rounded-xl border-2 font-display font-extrabold text-2xl tabular-nums transition-all cursor-pointer disabled:cursor-default ${btnStyle}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {duelFeedback && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="text-sm font-semibold text-slate-800">
                    {duelFeedback.isCorrect
                      ? `Punto per ${currentPlayerName}!`
                      : `Peccato! ${currentDuelQ.a} × ${currentDuelQ.b} fa ${currentDuelQ.answer}.`}
                  </div>
                  <button
                    type="button"
                    onClick={nextDuelTurn}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{duelTurn + 1 >= duelDeck.length ? 'Risultato Finale' : 'Passa il turno'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {duelPhase === 'FINISHED' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {p1Score === p2Score
                  ? 'Pareggio perfetto! Siete entrambi campioni!'
                  : p1Score > p2Score
                  ? `Vince ${p1Name || 'Giocatore 1'}!`
                  : `Vince ${p2Name || 'Giocatore 2'}!`}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base tabular-nums">
                Risultato finale: <strong>{p1Score}</strong> a <strong>{p2Score}</strong>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDuelPhase('SETUP')}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cambia impostazioni
                </button>
                <button
                  type="button"
                  onClick={startDuel}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rivincita!</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
