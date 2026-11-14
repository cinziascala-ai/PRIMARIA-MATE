import type { EvaluatedTrophy, FactProgress, PlayerStats, TrophyDefinition } from '../types/game';
import { makeFactKey } from './tabelline';

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function diffCalendarDays(earlierKey: string, laterKey: string): number {
  const d1 = parseLocalDateKey(earlierKey);
  const d2 = parseLocalDateKey(laterKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

export function computeDayStreaks(
  practiceDates: string[],
  todayKey: string = getLocalDateKey()
): { current: number; best: number } {
  if (practiceDates.length === 0) return { current: 0, best: 0 };

  const uniqueSorted = Array.from(new Set(practiceDates)).sort();

  let best = 1;
  let running = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const gap = diffCalendarDays(uniqueSorted[i - 1], uniqueSorted[i]);
    if (gap === 1) {
      running += 1;
      if (running > best) best = running;
    } else if (gap > 1) {
      running = 1;
    }
  }

  const latest = uniqueSorted[uniqueSorted.length - 1];
  const daysSinceLatest = diffCalendarDays(latest, todayKey);
  // Current streak stays active if practiced today (0) or yesterday (1)
  if (daysSinceLatest > 1) {
    return { current: 0, best };
  }

  let current = 1;
  for (let i = uniqueSorted.length - 1; i > 0; i--) {
    if (diffCalendarDays(uniqueSorted[i - 1], uniqueSorted[i]) === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, best: Math.max(best, current) };
}

export function countMasteredFacts(facts: Record<string, FactProgress>): number {
  let mastered = 0;
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const rec = facts[makeFactKey(a, b)];
      if (!rec || rec.attempts === 0) continue;
      const rate = rec.correct / rec.attempts;
      if (rec.streak >= 2 || (rec.attempts >= 2 && rate >= 0.85)) {
        mastered++;
      }
    }
  }
  return mastered;
}

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  {
    id: 'first-10',
    title: 'Primi Passi Matematici',
    description: 'Raggiungi le tue prime 10 risposte corrette.',
    category: 'Precisione',
    icon: 'sparkles',
    target: 10,
    unit: 'risposte',
    getCurrent: (s) => s.totalCorrect,
  },
  {
    id: 'correct-100',
    title: 'Cento Centro!',
    description: 'Raggiungi 100 risposte corrette in totale.',
    category: 'Precisione',
    icon: 'trophy',
    target: 100,
    unit: 'risposte',
    getCurrent: (s) => s.totalCorrect,
  },
  {
    id: 'streak-10',
    title: 'Razzo della Classe',
    description: 'Indovina 10 risposte di fila senza sbagliare.',
    category: 'Precisione',
    icon: 'rocket',
    target: 10,
    unit: 'di fila',
    getCurrent: (s) => s.bestStreak,
  },
  {
    id: 'days-3',
    title: 'Tre Giorni di Impegno',
    description: 'Allenati con le tabelline per 3 giorni di fila.',
    category: 'Costanza',
    icon: 'calendar',
    target: 3,
    unit: 'giorni',
    getCurrent: (s) => Math.max(s.bestDayStreak, s.currentDayStreak),
  },
  {
    id: 'days-5',
    title: 'Cinque Giorni da Campione',
    description: 'Allenati per 5 giorni consecutivi senza saltarne uno!',
    category: 'Costanza',
    icon: 'flame',
    target: 5,
    unit: 'giorni',
    getCurrent: (s) => Math.max(s.bestDayStreak, s.currentDayStreak),
  },
  {
    id: 'blitz-80',
    title: 'Lampo Matematico',
    description: 'Totalizza almeno 80 punti in una Sfida Lampo da 60 secondi.',
    category: 'Velocità',
    icon: 'zap',
    target: 80,
    unit: 'punti',
    getCurrent: (s) => s.bestBlitzScore,
  },
  {
    id: 'master-25',
    title: 'Esploratore della Tavola',
    description: 'Conquista almeno 25 tabelline nella tua mappa 10×10.',
    category: 'Precisione',
    icon: 'compass',
    target: 25,
    unit: 'tabelline',
    getCurrent: (s) => countMasteredFacts(s.facts),
  },
  {
    id: 'master-100',
    title: 'Maestro delle 100 Tabelline',
    description: 'Conquista tutte le 100 tabelline della Tavola Pitagorica!',
    category: 'Precisione',
    icon: 'crown',
    target: 100,
    unit: 'tabelline',
    getCurrent: (s) => countMasteredFacts(s.facts),
  },
  {
    id: 'team-duo',
    title: 'In Squadra a Casa',
    description: 'Rispondi a 10 domande nella modalità Sfida a Due con un genitore o compagno.',
    category: 'Squadra',
    icon: 'users',
    target: 10,
    unit: 'domande',
    getCurrent: (s) => s.duoAnswersCount,
  },
];

export function evaluateTrophies(stats: PlayerStats): EvaluatedTrophy[] {
  return TROPHY_DEFINITIONS.map((def) => {
    const rawCurrent = def.getCurrent(stats);
    const unlockedDate = stats.unlockedTrophies[def.id] ?? null;
    const unlocked = unlockedDate !== null || rawCurrent >= def.target;
    const clampedCurrent = unlocked ? def.target : Math.min(rawCurrent, def.target);
    const progressPct = Math.min(100, Math.round((clampedCurrent / def.target) * 100));

    return {
      ...def,
      current: clampedCurrent,
      unlocked,
      unlockedDate,
      progressPct,
    };
  });
}

export function syncUnlockedTrophies(
  stats: PlayerStats,
  todayKey: string = getLocalDateKey()
): { updated: Record<string, string>; newlyUnlockedIds: string[] } {
  const updated = { ...stats.unlockedTrophies };
  const newlyUnlockedIds: string[] = [];

  for (const def of TROPHY_DEFINITIONS) {
    if (!updated[def.id] && def.getCurrent(stats) >= def.target) {
      updated[def.id] = todayKey;
      newlyUnlockedIds.push(def.id);
    }
  }

  return { updated, newlyUnlockedIds };
}

export function formatItalianDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const months = [
    'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
    'lug', 'ago', 'set', 'ott', 'nov', 'dic',
  ];
  if (!y || !m || !d) return dateKey;
  return `${d} ${months[m - 1] ?? ''} ${y}`;
}
