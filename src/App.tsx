import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { AppView, PlayerStats, SoloMode } from './types/game';
import { makeFactKey } from './data/tabelline';
import {
  computeDayStreaks,
  getLocalDateKey,
  syncUnlockedTrophies,
} from './data/trophies';
import { SoloGame } from './components/SoloGame';
import { ParentChildMode } from './components/ParentChildMode';
import { StudyAndTricks } from './components/StudyAndTricks';
import { ProgressNotebook } from './components/ProgressNotebook';

const STORAGE_KEY = 'atutta_tabellina_stats_v1';

const DEFAULT_STATS: PlayerStats = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestBlitzScore: 0,
  bestStreak: 0,
  sessionsCompleted: 0,
  practiceDates: [],
  currentDayStreak: 0,
  bestDayStreak: 0,
  duoAnswersCount: 0,
  unlockedTrophies: {},
  facts: {},
};

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    const practiceDates = Array.isArray(parsed.practiceDates) ? parsed.practiceDates : [];
    const streaks = computeDayStreaks(practiceDates);
    const hydrated: PlayerStats = {
      totalAnswered: parsed.totalAnswered ?? 0,
      totalCorrect: parsed.totalCorrect ?? 0,
      bestBlitzScore: parsed.bestBlitzScore ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
      sessionsCompleted: parsed.sessionsCompleted ?? 0,
      practiceDates,
      currentDayStreak: streaks.current,
      bestDayStreak: Math.max(parsed.bestDayStreak ?? 0, streaks.best),
      duoAnswersCount: parsed.duoAnswersCount ?? 0,
      unlockedTrophies: parsed.unlockedTrophies ?? {},
      facts: parsed.facts ?? {},
    };
    const synced = syncUnlockedTrophies(hydrated);
    return {
      ...hydrated,
      unlockedTrophies: synced.updated,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('gioca');
  const [stats, setStats] = useState<PlayerStats>(loadStats);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sessionUnlockedIds, setSessionUnlockedIds] = useState<string[]>([]);
  const [externalLaunch, setExternalLaunch] = useState<{
    nonce: number;
    mode: SoloMode;
    tables?: number[];
    customFacts?: Array<[number, number]>;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage quota errors
    }
  }, [stats]);

  const recordFactResult = useCallback(
    (
      a: number,
      b: number,
      isCorrect: boolean,
      _mode?: SoloMode,
      blitzScore?: number,
      currentStreak?: number,
      source: 'solo' | 'duo' = 'solo'
    ) => {
      const todayKey = getLocalDateKey();

      setStats((prev) => {
        const key = makeFactKey(a, b);
        const existing = prev.facts[key] ?? {
          attempts: 0,
          correct: 0,
          streak: 0,
          lastPracticedAt: Date.now(),
        };

        const updatedFacts = {
          ...prev.facts,
          [key]: {
            attempts: existing.attempts + 1,
            correct: existing.correct + (isCorrect ? 1 : 0),
            streak: isCorrect ? existing.streak + 1 : 0,
            lastPracticedAt: Date.now(),
          },
        };

        const updatedDates = prev.practiceDates.includes(todayKey)
          ? prev.practiceDates
          : [...prev.practiceDates, todayKey];
        const streaks = computeDayStreaks(updatedDates, todayKey);

        const nextStats: PlayerStats = {
          ...prev,
          totalAnswered: prev.totalAnswered + 1,
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          bestBlitzScore:
            blitzScore !== undefined ? Math.max(prev.bestBlitzScore, blitzScore) : prev.bestBlitzScore,
          bestStreak:
            currentStreak !== undefined ? Math.max(prev.bestStreak, currentStreak) : prev.bestStreak,
          practiceDates: updatedDates,
          currentDayStreak: streaks.current,
          bestDayStreak: Math.max(prev.bestDayStreak, streaks.best),
          duoAnswersCount: prev.duoAnswersCount + (source === 'duo' ? 1 : 0),
          facts: updatedFacts,
        };

        const synced = syncUnlockedTrophies(nextStats, todayKey);
        if (synced.newlyUnlockedIds.length > 0) {
          setSessionUnlockedIds((old) =>
            Array.from(new Set([...old, ...synced.newlyUnlockedIds]))
          );
        }

        return {
          ...nextStats,
          unlockedTrophies: synced.updated,
        };
      });
    },
    []
  );

  const handleSessionStart = useCallback(() => {
    setSessionUnlockedIds([]);
  }, []);

  const handleSessionComplete = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1,
    }));
  }, []);

  const handleResetStats = useCallback(() => {
    setStats(DEFAULT_STATS);
    setSessionUnlockedIds([]);
  }, []);

  const launchPractice = useCallback(
    (mode: SoloMode, tables?: number[], customFacts?: Array<[number, number]>) => {
      setView('gioca');
      setExternalLaunch({
        nonce: Date.now(),
        mode,
        tables,
        customFacts,
      });
    },
    []
  );

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'gioca', label: 'Gioca' },
    { id: 'sfida-due', label: 'Sfida a Due' },
    { id: 'studia', label: 'Studia e Trucchi' },
    { id: 'progressi', label: 'Progressi' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-notebook-grid text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setView('gioca')}
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            A tutta Tabellina!
          </button>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold">
            {navItems.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => launchPractice('lampo', [2, 3, 4, 5, 6, 7, 8, 9])}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 border-b-2 border-blue-800 active:translate-y-px rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sfida Lampo
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {view === 'gioca' && (
          <SoloGame
            stats={stats}
            soundEnabled={soundEnabled}
            onRecordAnswer={(a, b, ok, mode, blitz, streak) =>
              recordFactResult(a, b, ok, mode, blitz, streak, 'solo')
            }
            onSessionStart={handleSessionStart}
            onSessionComplete={handleSessionComplete}
            newlyUnlockedIds={sessionUnlockedIds}
            onOpenProgress={() => setView('progressi')}
            externalLaunch={externalLaunch}
          />
        )}

        {view === 'sfida-due' && (
          <ParentChildMode
            soundEnabled={soundEnabled}
            onRecordFact={(a, b, isCorrect) =>
              recordFactResult(a, b, isCorrect, undefined, undefined, undefined, 'duo')
            }
          />
        )}

        {view === 'studia' && (
          <StudyAndTricks
            soundEnabled={soundEnabled}
            onStartTablePractice={(tableNum) => launchPractice('allenamento', [tableNum])}
          />
        )}

        {view === 'progressi' && (
          <ProgressNotebook
            stats={stats}
            onResetStats={handleResetStats}
            onPracticeWeakFacts={(facts) => launchPractice('ripasso', undefined, facts)}
          />
        )}
      </main>

      {/* Clean Quiet Footer with Sound Toggle */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            A tutta Tabellina! · Palestra matematica per la classe terza primaria
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Suoni attivi</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Suoni disattivati</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
