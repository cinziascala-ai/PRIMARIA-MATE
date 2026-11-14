import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Grid3X3,
  Zap,
  HeartHandshake,
  ArrowRight,
  RotateCcw,
  Delete,
  BookOpen,
  Trophy,
} from 'lucide-react';
import type { InputStyle, PlayerStats, QuestionItem, SoloMode } from '../types/game';
import {
  ENCOURAGE_MESSAGES,
  PRAISE_MESSAGES,
  buildDeck,
  buildQuestion,
  getMultiplicationTip,
  makeFactKey,
} from '../data/tabelline';
import { ArrayVisualizer } from './ArrayVisualizer';
import { AnimatedMascot, type MascotMood } from './AnimatedMascot';
import { playSound } from '../utils/sound';
import { TROPHY_DEFINITIONS } from '../data/trophies';
import { TrophyIcon } from './TrophyIcon';
import woodenBlocksImg from '../assets/images/wooden_math_blocks_1794666498474.jpg';
import owlMascotImg from '../assets/images/maestra_owl_mascot_1794666483359.jpg';

interface SoloGameProps {
  stats: PlayerStats;
  soundEnabled: boolean;
  onRecordAnswer: (a: number, b: number, isCorrect: boolean, mode: SoloMode, blitzScore?: number, streak?: number) => void;
  onSessionStart?: () => void;
  onSessionComplete?: () => void;
  newlyUnlockedIds?: string[];
  onOpenProgress?: () => void;
  externalLaunch?: {
    nonce: number;
    mode: SoloMode;
    tables?: number[];
    customFacts?: Array<[number, number]>;
  } | null;
}

type Stage = 'SETUP' | 'PLAYING' | 'SUMMARY';

interface AnswerLog {
  a: number;
  b: number;
  answer: number;
  chosen: number;
  isCorrect: boolean;
}

const PRESETS = [
  { id: 'facili', label: 'Facili (1, 2, 5, 10)', tables: [1, 2, 5, 10] },
  { id: 'medie', label: 'Medie (3, 4, 6)', tables: [3, 4, 6] },
  { id: 'toste', label: 'Le Toste (7, 8, 9)', tables: [7, 8, 9] },
  { id: 'tutte', label: 'Tutte (1–10)', tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
];

export const SoloGame: React.FC<SoloGameProps> = ({
  stats,
  soundEnabled,
  onRecordAnswer,
  onSessionStart,
  onSessionComplete,
  newlyUnlockedIds = [],
  onOpenProgress,
  externalLaunch,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>('SETUP');
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5]);
  const [mode, setMode] = useState<SoloMode>('allenamento');
  const [inputStyle, setInputStyle] = useState<InputStyle>('scelta');

  // Playing state
  const [deck, setDeck] = useState<QuestionItem[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [typedValue, setTypedValue] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    chosen: number;
    message: string;
  } | null>(null);
  const [showTip, setShowTip] = useState<boolean>(false);
  const [showArray, setShowArray] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestRunStreak, setBestRunStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [history, setHistory] = useState<AnswerLog[]>([]);
  const [heroImgError, setHeroImgError] = useState(false);
  const [owlImgError, setOwlImgError] = useState(false);

  const blitzTimerRef = useRef<number | null>(null);
  const autoNextRef = useRef<number | null>(null);
  const scoreRef = useRef<number>(0);
  const streakRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (blitzTimerRef.current !== null) {
      window.clearInterval(blitzTimerRef.current);
      blitzTimerRef.current = null;
    }
    if (autoNextRef.current !== null) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startSession = useCallback(
    (
      overrideMode?: SoloMode,
      overrideTables?: number[],
      customFacts?: Array<[number, number]>
    ) => {
      clearTimers();
      const activeMode = overrideMode ?? mode;
      const tablesToUse = overrideTables ?? selectedTables;

      let newDeck: QuestionItem[];
      if (customFacts && customFacts.length > 0) {
        newDeck = customFacts.map(([a, b]) => buildQuestion(a, b));
      } else if (activeMode === 'lampo') {
        newDeck = buildDeck(tablesToUse, 60);
      } else {
        newDeck = buildDeck(tablesToUse, 10);
      }

      setMode(activeMode);
      if (overrideTables) setSelectedTables(overrideTables);
      setDeck(newDeck);
      setQIndex(0);
      setTypedValue('');
      setFeedback(null);
      setShowTip(false);
      setShowArray(false);
      setScore(0);
      scoreRef.current = 0;
      setStreak(0);
      streakRef.current = 0;
      setBestRunStreak(0);
      setHistory([]);
      setTimeLeft(60);
      setStage('PLAYING');
      onSessionStart?.();
      playSound('click', soundEnabled);

      if (activeMode === 'lampo') {
        blitzTimerRef.current = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearTimers();
              playSound('victory', soundEnabled);
              onSessionComplete?.();
              setStage('SUMMARY');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    },
    [clearTimers, mode, onSessionComplete, onSessionStart, selectedTables, soundEnabled]
  );

  // Trigger launch from external tabs (e.g., Study "Allenala ora" or Progress "Allena queste!")
  useEffect(() => {
    if (!externalLaunch) return;
    startSession(externalLaunch.mode, externalLaunch.tables, externalLaunch.customFacts);
  }, [externalLaunch, startSession]);

  const currentQ = deck[qIndex];

  const goToNextQuestion = useCallback(() => {
    if (autoNextRef.current !== null) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
    if (qIndex + 1 >= deck.length) {
      clearTimers();
      playSound('victory', soundEnabled);
      onSessionComplete?.();
      setStage('SUMMARY');
    } else {
      setQIndex((prev) => prev + 1);
      setTypedValue('');
      setFeedback(null);
      setShowTip(false);
      setShowArray(false);
    }
  }, [clearTimers, deck.length, onSessionComplete, qIndex, soundEnabled]);

  const submitAnswer = useCallback(
    (chosen: number) => {
      if (!currentQ || feedback !== null) return;
      const isCorrect = chosen === currentQ.answer;

      const nextStreak = isCorrect ? streakRef.current + 1 : 0;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      setBestRunStreak((prev) => Math.max(prev, nextStreak));

      const pointsEarned = isCorrect ? 10 + Math.min(nextStreak - 1, 5) * 2 : 0;
      const nextScore = scoreRef.current + pointsEarned;
      scoreRef.current = nextScore;
      setScore(nextScore);

      const pool = isCorrect ? PRAISE_MESSAGES : ENCOURAGE_MESSAGES;
      const msg = pool[Math.floor(Math.random() * pool.length)];

      setFeedback({
        isCorrect,
        chosen,
        message: msg,
      });

      if (!isCorrect) {
        setShowTip(true);
      }

      setHistory((prev) => [
        ...prev,
        {
          a: currentQ.a,
          b: currentQ.b,
          answer: currentQ.answer,
          chosen,
          isCorrect,
        },
      ]);

      playSound(isCorrect ? 'correct' : 'wrong', soundEnabled);
      onRecordAnswer(
        currentQ.a,
        currentQ.b,
        isCorrect,
        mode,
        mode === 'lampo' ? nextScore : undefined,
        nextStreak
      );

      if (mode === 'lampo') {
        autoNextRef.current = window.setTimeout(
          () => {
            goToNextQuestion();
          },
          isCorrect ? 600 : 1500
        );
      }
    },
    [currentQ, feedback, goToNextQuestion, mode, onRecordAnswer, soundEnabled]
  );

  // Physical keyboard support during playing
  useEffect(() => {
    if (stage !== 'PLAYING' || !currentQ) return;

    const handleKey = (e: KeyboardEvent) => {
      if (feedback !== null) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToNextQuestion();
        }
        return;
      }

      if (inputStyle === 'scelta') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (currentQ.choices[idx] !== undefined) {
            submitAnswer(currentQ.choices[idx]);
          }
        }
      } else {
        if (/^[0-9]$/.test(e.key)) {
          setTypedValue((prev) => (prev.length < 3 ? prev + e.key : prev));
        } else if (e.key === 'Backspace') {
          setTypedValue((prev) => prev.slice(0, -1));
        } else if (e.key === 'Enter' && typedValue.length > 0) {
          submitAnswer(Number(typedValue));
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentQ, feedback, goToNextQuestion, inputStyle, stage, submitAnswer, typedValue]);

  const toggleTable = (n: number) => {
    playSound('click', soundEnabled);
    setSelectedTables((prev) => {
      if (prev.includes(n)) {
        return prev.length > 1 ? prev.filter((x) => x !== n) : prev;
      }
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const getTableMastery = (n: number) => {
    let mastered = 0;
    for (let m = 1; m <= 10; m++) {
      const rec = stats.facts[makeFactKey(n, m)];
      if (rec && rec.attempts > 0 && (rec.streak >= 2 || rec.correct / rec.attempts >= 0.85)) {
        mastered++;
      }
    }
    return mastered;
  };

  // ==================== SETUP STAGE ====================
  if (stage === 'SETUP') {
    return (
      <div className="space-y-8">
        {/* Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-600 mb-2">
                Classe Terza Primaria · Palestra delle Tabelline
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
                Pronto a diventare un asso delle tabelline?
              </h1>
              <p className="mt-3 text-slate-600 text-base leading-relaxed max-w-xl">
                Ciao! Sono la tua maestra virtuale. Scegli quali tabelline allenare oggi: se
                qualche numero ti fa venire il dubbio, usa subito il pulsante{' '}
                <span className="font-semibold text-slate-800">Trucco della Maestra</span> per
                scoprire il segreto e vedere i quadretti!
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <div>
                <div className="text-xs text-slate-500">Partite giocate</div>
                <div className="font-display font-bold text-xl text-slate-900 tabular-nums">
                  {stats.sessionsCompleted}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-500">Serie migliore</div>
                <div className="font-display font-bold text-xl text-slate-900 tabular-nums">
                  {stats.bestStreak} di fila
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-500">Record Lampo (60s)</div>
                <div className="font-display font-bold text-xl text-slate-900 tabular-nums">
                  {stats.bestBlitzScore} pt
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex">
            {!heroImgError ? (
              <img
                src={woodenBlocksImg}
                alt="Banco di scuola con cubetti colorati per contare le tabelline"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="w-full h-56 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-56 lg:h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
                <BookOpen className="w-10 h-10 text-blue-600 mb-2" />
                <span className="font-display font-bold text-slate-800">
                  Laboratorio di Matematica · 3ª Primaria
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Configurator */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Step 1: Tables */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  1. Quali tabelline vuoi allenare?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Puoi scegliere un gruppo veloce o toccare i singoli numeri
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESETS.map((preset) => {
                  const isExact =
                    preset.tables.length === selectedTables.length &&
                    preset.tables.every((t) => selectedTables.includes(t));
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setSelectedTables(preset.tables);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isExact
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((n) => {
                const active = selectedTables.includes(n);
                const mastered = getTableMastery(n);
                const activeTone =
                  [1, 2, 5, 10].includes(n)
                    ? 'bg-blue-600 text-white border-blue-700 shadow-[0_3px_0_0_#1D4ED8]'
                    : [3, 4, 6].includes(n)
                    ? 'bg-amber-500 text-white border-amber-600 shadow-[0_3px_0_0_#B45309]'
                    : 'bg-emerald-600 text-white border-emerald-700 shadow-[0_3px_0_0_#047857]';
                const subTextTone =
                  [1, 2, 5, 10].includes(n)
                    ? 'text-blue-100'
                    : [3, 4, 6].includes(n)
                    ? 'text-amber-50'
                    : 'text-emerald-100';

                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleTable(n)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer active:translate-y-[2px] active:shadow-none ${
                      active
                        ? activeTone
                        : 'bg-slate-50 text-slate-800 border-slate-200 shadow-[0_2px_0_0_#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-display font-extrabold text-xl tabular-nums">× {n}</div>
                    <div
                      className={`mt-1 text-[11px] font-mono tabular-nums ${
                        active ? subTextTone : 'text-slate-400'
                      }`}
                    >
                      {mastered}/10
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 2: Mode */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Scegli la modalità di gioco
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setMode('allenamento');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    mode === 'allenamento'
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Allenamento Sereno</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    10 domande senza timer. Perfetto per pensare con calma e usare i trucchi!
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setMode('lampo');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    mode === 'lampo'
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Sfida Lampo (60s)</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Un minuto di pura velocità per rispondere al volo e battere il tuo record!
                  </p>
                </button>
              </div>
            </div>

            {/* Step 3: Input Style */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Come vuoi rispondere?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setInputStyle('scelta');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    inputStyle === 'scelta'
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm">4 Risposte tra cui scegliere</div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Tocca il cartellino giusto tra 4 numeri (anche con i tasti 1–4).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setInputStyle('tastiera');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    inputStyle === 'tastiera'
                      ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm">Scrivi tu il risultato</div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Usa il tastierino numerico per dimostrare che lo sai a memoria!
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => startSession()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-lg rounded-xl border-b-4 border-blue-800 active:translate-y-[2px] active:border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Inizia a Giocare!</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PLAYING STAGE ====================
  if (stage === 'PLAYING' && currentQ) {
    const tip = getMultiplicationTip(currentQ.a, currentQ.b);
    const progressPct =
      mode === 'lampo'
        ? Math.round((timeLeft / 60) * 100)
        : Math.round(((qIndex + (feedback ? 1 : 0)) / deck.length) * 100);

    const mascotMood: MascotMood = feedback
      ? feedback.isCorrect
        ? 'celebrate'
        : 'encourage'
      : showTip || showArray
      ? 'thinking'
      : mode === 'lampo'
      ? 'blitz'
      : 'idle';

    const mascotMessage = feedback
      ? feedback.isCorrect
        ? streak >= 3
          ? `Uhu! ${streak} di fila senza errori! Sei un razzo!`
          : feedback.message
        : `Niente paura! ${currentQ.a} × ${currentQ.b} fa ${currentQ.answer}. Guardiamo il trucco qui sotto!`
      : showTip
      ? `Ecco il segreto della maestra per ${currentQ.a} × ${currentQ.b}!`
      : showArray
      ? `Conta i quadretti fila per fila: si vede subito quanto fa!`
      : mode === 'lampo'
      ? 'Occhi pronti! Rispondi al volo prima che scada il tempo!'
      : 'Tocca il gufetto se vuoi un incoraggiamento, oppure chiedi un trucco!';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Game HUD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            {mode === 'lampo' ? (
              <div
                className={`font-display font-bold text-lg tabular-nums ${
                  timeLeft <= 10 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                Tempo: {timeLeft}s
              </div>
            ) : (
              <div className="font-display font-bold text-base text-slate-900 tabular-nums">
                Domanda {qIndex + 1} / {deck.length}
              </div>
            )}
            <span className="text-slate-300" aria-hidden="true">·</span>
            <div className="text-slate-600 tabular-nums">
              Punti: <span className="font-bold text-slate-900">{score}</span>
            </div>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <div className="text-slate-600 tabular-nums">
              Serie: <span className="font-bold text-blue-600">{streak}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              clearTimers();
              setStage('SETUP');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Esci dalla partita
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              mode === 'lampo' && timeLeft <= 10 ? 'bg-rose-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Animated Companion */}
        <AnimatedMascot mood={mascotMood} message={mascotMessage} />

        {/* Main Question Card */}
        <motion.div
          key={qIndex}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm"
        >
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-500 mb-3">
              {mode === 'ripasso'
                ? 'Ripasso delle tabelline difficili'
                : mode === 'lampo'
                ? 'Sfida Lampo · Rispondi al volo!'
                : 'Quanto fa questa moltiplicazione?'}
            </div>

            <div className="font-display font-extrabold text-5xl sm:text-7xl text-slate-900 tracking-tight tabular-nums py-2">
              {currentQ.a} × {currentQ.b} ={' '}
              <span className="text-blue-600">
                {feedback
                  ? currentQ.answer
                  : inputStyle === 'tastiera'
                  ? typedValue || '?'
                  : '?'}
              </span>
            </div>
          </div>

          {/* Answer Controls */}
          {inputStyle === 'scelta' ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
              {currentQ.choices.map((choice, idx) => {
                let btnStyle =
                  'bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-900 border-slate-200 shadow-[0_3px_0_0_#CBD5E1] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none';
                if (feedback) {
                  if (choice === currentQ.answer) {
                    btnStyle =
                      'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500 shadow-[0_3px_0_0_#10B981]';
                  } else if (choice === feedback.chosen && !feedback.isCorrect) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 shadow-none';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 shadow-none';
                  }
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={feedback !== null}
                    onClick={() => submitAnswer(choice)}
                    className={`relative min-h-[76px] rounded-xl border-2 font-display font-extrabold text-2xl sm:text-3xl tabular-nums transition-all cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span className="absolute top-2 left-3 text-[11px] font-mono font-normal text-slate-400">
                      {idx + 1}
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 max-w-xs mx-auto space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    disabled={feedback !== null}
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setTypedValue((prev) => (prev.length < 3 ? prev + digit : prev));
                    }}
                    className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-[0_2px_0_0_#CBD5E1] active:translate-y-[1px] active:shadow-none font-display font-bold text-2xl text-slate-900 tabular-nums transition-all cursor-pointer disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => setTypedValue((prev) => prev.slice(0, -1))}
                  aria-label="Cancella cifra"
                  className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-[0_2px_0_0_#CBD5E1] active:translate-y-[1px] active:shadow-none flex items-center justify-center text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setTypedValue((prev) => (prev.length < 3 ? prev + '0' : prev));
                  }}
                  className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-[0_2px_0_0_#CBD5E1] active:translate-y-[1px] active:shadow-none font-display font-bold text-2xl text-slate-900 tabular-nums transition-all cursor-pointer disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={feedback !== null || typedValue.length === 0}
                  onClick={() => submitAnswer(Number(typedValue))}
                  className="h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 border-b-2 border-blue-800 disabled:border-transparent active:translate-y-px text-white font-bold text-sm transition-all cursor-pointer"
                >
                  Invia
                </button>
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              className={`mt-6 rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                feedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-base">
                    {feedback.isCorrect
                      ? feedback.message
                      : `${currentQ.a} × ${currentQ.b} fa ${currentQ.answer}!`}
                  </div>
                  {!feedback.isCorrect && (
                    <p className="text-sm text-rose-900 mt-0.5">{feedback.message}</p>
                  )}
                </div>
              </div>

              {mode !== 'lampo' && (
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{qIndex + 1 >= deck.length ? 'Vedi Risultato' : 'Prossima'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}

          {/* Help / Teacher Tips Trigger */}
          {mode !== 'lampo' && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!showTip) playSound('hint', soundEnabled);
                  setShowTip((v) => !v);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showTip
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>{showTip ? 'Nascondi il trucco' : 'Chiedi un Trucco alla Maestra'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setShowArray((v) => !v);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showArray
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4 text-blue-600" />
                <span>{showArray ? 'Nascondi i quadretti' : 'Guarda lo schieramento'}</span>
              </button>
            </div>
          )}

          {/* Tip Panel */}
          {showTip && mode !== 'lampo' && (
            <div className="mt-4 bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tip.title}</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">{tip.strategy}</p>
              {tip.commutativeNote && (
                <p className="text-xs text-slate-600">{tip.commutativeNote}</p>
              )}
              {feedback !== null && (
                <p className="text-xs font-semibold text-amber-900 pt-1">
                  Verifica: {tip.breakdownExample}
                </p>
              )}
            </div>
          )}

          {/* Visual Array */}
          {showArray && mode !== 'lampo' && (
            <div className="mt-4 flex justify-center">
              <ArrayVisualizer
                rows={currentQ.a}
                cols={currentQ.b}
                highlightSplitFive={currentQ.a > 5 && currentQ.a < 10}
              />
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ==================== SUMMARY STAGE ====================
  const correctCount = history.filter((h) => h.isCorrect).length;
  const totalCount = history.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const mistakes = history.filter((h) => !h.isCorrect);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-sky-50 flex items-center justify-center">
            {!owlImgError ? (
              <img
                src={owlMascotImg}
                alt="Gufetto maestro con gli occhiali che fa i complimenti"
                referrerPolicy="no-referrer"
                onError={() => setOwlImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Trophy className="w-12 h-12 text-amber-500" />
            )}
          </div>

          <div className="text-center sm:text-left">
            <div className="text-xs font-semibold text-blue-600">
              {mode === 'lampo' ? 'Sfida Lampo completata!' : 'Allenamento completato!'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {accuracy >= 90
                ? 'Evviva! Sei stato super veloce e preciso!'
                : accuracy >= 70
                ? 'Bravissimo! Stai migliorando a vista d’occhio!'
                : 'Ottimo allenamento! Ogni tentativo rende la mente più forte!'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Hai risposto esattamente a {correctCount} domande su {totalCount}
              {bestRunStreak >= 3 ? ` con una serie di ${bestRunStreak} risposte di fila!` : '.'}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 py-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-500">Punteggio</div>
            <div className="mt-1 font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tabular-nums">
              {score}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-500">Precisione</div>
            <div className="mt-1 font-display font-extrabold text-2xl sm:text-3xl text-emerald-700 tabular-nums">
              {accuracy}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-500">Serie migliore</div>
            <div className="mt-1 font-display font-extrabold text-2xl sm:text-3xl text-blue-600 tabular-nums">
              {bestRunStreak}
            </div>
          </div>
        </div>

        {/* Newly Unlocked Trophies */}
        {newlyUnlockedIds.length > 0 && (
          <div className="mt-2 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Nuovi Trofei sbloccati in questa partita!
              </h3>
              {onOpenProgress && (
                <button
                  type="button"
                  onClick={onOpenProgress}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Vedi Bacheca Trofei
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TROPHY_DEFINITIONS.filter((t) => newlyUnlockedIds.includes(t.id)).map((t) => (
                <div
                  key={t.id}
                  className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <TrophyIcon icon={t.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-600">{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Mistakes with Tips */}
        {mistakes.length > 0 && (
          <div className="mt-2 pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Ripassiamo insieme quelle scappate via:
            </h3>
            <div className="space-y-2.5">
              {mistakes.map((m, idx) => {
                const tip = getMultiplicationTip(m.a, m.b);
                return (
                  <div
                    key={`${m.a}x${m.b}-${idx}`}
                    className="bg-amber-50/60 border border-amber-200 rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display font-bold text-lg text-slate-900 tabular-nums">
                        {m.a} × {m.b} = {m.answer}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        Avevi scelto {m.chosen}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-700">
                      <span className="font-semibold text-amber-900">{tip.title}:</span>{' '}
                      {tip.strategy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setStage('SETUP')}
            className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Scegli altre tabelline
          </button>
          <button
            type="button"
            onClick={() => startSession()}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Gioca Ancora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
