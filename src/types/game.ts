export type AppView = 'gioca' | 'sfida-due' | 'studia' | 'progressi';

export type SoloMode = 'allenamento' | 'lampo' | 'ripasso';

export type InputStyle = 'scelta' | 'tastiera';

export type FactKey = `${number}x${number}`;

export interface FactProgress {
  attempts: number;
  correct: number;
  streak: number;
  lastPracticedAt: number;
}

export interface PlayerStats {
  totalAnswered: number;
  totalCorrect: number;
  bestBlitzScore: number;
  bestStreak: number;
  sessionsCompleted: number;
  practiceDates: string[];
  currentDayStreak: number;
  bestDayStreak: number;
  duoAnswersCount: number;
  unlockedTrophies: Record<string, string>;
  facts: Record<string, FactProgress>;
}

export type TrophyIconKey =
  | 'sparkles'
  | 'trophy'
  | 'rocket'
  | 'calendar'
  | 'flame'
  | 'zap'
  | 'compass'
  | 'crown'
  | 'users';

export type TrophyCategory = 'Precisione' | 'Costanza' | 'Velocità' | 'Squadra';

export interface TrophyDefinition {
  id: string;
  title: string;
  description: string;
  category: TrophyCategory;
  icon: TrophyIconKey;
  target: number;
  unit: string;
  getCurrent: (stats: PlayerStats) => number;
}

export interface EvaluatedTrophy extends TrophyDefinition {
  current: number;
  unlocked: boolean;
  unlockedDate: string | null;
  progressPct: number;
}

export interface QuestionItem {
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

export interface TableInfo {
  num: number;
  level: 'Facile' | 'Media' | 'Sfida';
  motto: string;
  secretRule: string;
  example: string;
  fingerOrVisualTip: string;
}

export interface FactTip {
  title: string;
  strategy: string;
  commutativeNote: string | null;
  breakdownExample: string;
}
