import React from 'react';
import {
  Sparkles,
  Trophy,
  Rocket,
  Calendar,
  Flame,
  Zap,
  Compass,
  Crown,
  Users,
} from 'lucide-react';
import type { TrophyIconKey } from '../types/game';

interface TrophyIconProps {
  icon: TrophyIconKey;
  className?: string;
}

export const TrophyIcon: React.FC<TrophyIconProps> = ({ icon, className = 'w-6 h-6' }) => {
  switch (icon) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'users':
      return <Users className={className} />;
  }
};
