import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type MascotMood = 'idle' | 'thinking' | 'celebrate' | 'encourage' | 'blitz';

interface AnimatedMascotProps {
  mood: MascotMood;
  message: string;
  compact?: boolean;
}

const TAP_CHEERS = [
  'Uhu! Forza campione, ci sei quasi!',
  'Ricorda: puoi girare i numeri (3×7 = 7×3)!',
  'Un passo alla volta si conquistano tutte!',
  'Che bello allenarsi insieme!',
];

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
  mood,
  message,
  compact = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);
  const [tapBurst, setTapBurst] = useState(0);
  const [tapNote, setTapNote] = useState<string | null>(null);

  // Natural blinking loop
  useEffect(() => {
    if (prefersReducedMotion) return;
    let blinkTimeout: number | null = null;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 160);
    }, 3600);

    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== null) window.clearTimeout(blinkTimeout);
    };
  }, [prefersReducedMotion]);

  // Reset temporary tap note when main message changes
  useEffect(() => {
    setTapNote(null);
  }, [message, mood]);

  const handleMascotClick = () => {
    setTapBurst((b) => b + 1);
    const cheer = TAP_CHEERS[Math.floor(Math.random() * TAP_CHEERS.length)];
    setTapNote(cheer);
  };

  const displayText = tapNote ?? message;

  // Motion targets using compositor-only transform properties
  const bodyAnimate = prefersReducedMotion
    ? {}
    : mood === 'celebrate'
    ? { y: [0, -10, 0, -6, 0], rotate: [0, -4, 4, -2, 0] }
    : mood === 'blitz'
    ? { y: [0, -5, 0], rotate: [0, 1.5, -1.5, 0] }
    : mood === 'thinking'
    ? { y: [0, -2, 0], rotate: [0, -4, -4, 0] }
    : mood === 'encourage'
    ? { y: [0, 2, 0], rotate: [-2, 2, 0] }
    : { y: [0, -4, 0], rotate: 0 };

  const bodyTransition =
    mood === 'celebrate'
      ? { duration: 0.75, ease: 'easeOut' as const }
      : mood === 'blitz'
      ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' as const }
      : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const };

  const leftWingAnimate = prefersReducedMotion
    ? {}
    : mood === 'celebrate'
    ? { rotate: [0, -32, 8, -28, 0] }
    : mood === 'blitz'
    ? { rotate: [0, -14, 0] }
    : { rotate: [0, -5, 0] };

  const rightWingAnimate = prefersReducedMotion
    ? {}
    : mood === 'celebrate'
    ? { rotate: [0, 32, -8, 28, 0] }
    : mood === 'thinking'
    ? { rotate: [0, 26, 26] }
    : mood === 'blitz'
    ? { rotate: [0, 14, 0] }
    : { rotate: [0, 5, 0] };

  const moodAccent =
    mood === 'celebrate'
      ? 'bg-emerald-50/70 border-emerald-200'
      : mood === 'encourage'
      ? 'bg-amber-50/70 border-amber-200'
      : mood === 'thinking'
      ? 'bg-blue-50/60 border-blue-200'
      : 'bg-slate-50 border-slate-200';

  const sizeClass = compact ? 'w-16 h-16' : 'w-20 h-20 sm:w-22 sm:h-22';

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:px-5 sm:py-3.5 flex items-center gap-4 transition-colors ${moodAccent}`}
    >
      <motion.button
        type="button"
        onClick={handleMascotClick}
        aria-label="Oli il gufetto: toccalo per un incoraggiamento"
        key={tapBurst}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
        initial={tapBurst > 0 && !prefersReducedMotion ? { rotate: -8, scale: 1.08 } : false}
        animate={prefersReducedMotion ? undefined : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`${sizeClass} shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl`}
      >
        <motion.svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible"
          animate={bodyAnimate}
          transition={bodyTransition}
        >
          {/* Soft drop shadow */}
          <ellipse cx="60" cy="110" rx="28" ry="5" fill="#CBD5E1" opacity="0.55" />

          {/* Left Wing */}
          <motion.path
            d="M25 60 C12 65, 13 88, 28 92 C33 84, 34 72, 31 60 Z"
            fill="#92400E"
            stroke="#451A03"
            strokeWidth="2.5"
            strokeLinejoin="round"
            style={{ originX: '30px', originY: '62px' }}
            animate={leftWingAnimate}
            transition={{
              duration: mood === 'celebrate' ? 0.65 : 2.2,
              repeat: mood === 'celebrate' ? 1 : Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Right Wing */}
          <motion.path
            d="M95 60 C108 65, 107 88, 92 92 C87 84, 86 72, 89 60 Z"
            fill="#92400E"
            stroke="#451A03"
            strokeWidth="2.5"
            strokeLinejoin="round"
            style={{ originX: '90px', originY: '62px' }}
            animate={rightWingAnimate}
            transition={{
              duration: mood === 'celebrate' ? 0.65 : 2.2,
              repeat: mood === 'celebrate' ? 1 : Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Feet */}
          <path
            d="M45 103 L42 109 M48 103 L48 110 M51 103 L54 109"
            stroke="#D97706"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M69 103 L66 109 M72 103 L72 110 M75 103 L78 109"
            stroke="#D97706"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Ear Tufts */}
          <path
            d="M32 34 L25 18 L44 26 Z"
            fill="#B45309"
            stroke="#451A03"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M88 34 L95 18 L76 26 Z"
            fill="#B45309"
            stroke="#451A03"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Main Owl Body */}
          <ellipse
            cx="60"
            cy="64"
            rx="34"
            ry="40"
            fill="#B45309"
            stroke="#451A03"
            strokeWidth="2.5"
          />

          {/* Cream Belly */}
          <ellipse cx="60" cy="76" rx="23" ry="25" fill="#FEF3C7" />
          {/* Little feather scallops on belly */}
          <path
            d="M49 72 Q53 76 57 72 M63 72 Q67 76 71 72 M54 82 Q60 87 66 82"
            fill="none"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* Blue Classroom Scarf / Collar */}
          <path
            d="M36 58 Q60 68 84 58 L81 67 Q60 76 39 67 Z"
            fill="#2563EB"
            stroke="#1E3A8A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Facial Disc */}
          <circle cx="46" cy="43" r="14" fill="#FFFBEB" />
          <circle cx="74" cy="43" r="14" fill="#FFFBEB" />

          {/* Rosy Cheeks */}
          <ellipse
            cx="33"
            cy="51"
            rx="4.5"
            ry="2.8"
            fill="#FB7185"
            opacity={mood === 'celebrate' ? 0.7 : 0.45}
          />
          <ellipse
            cx="87"
            cy="51"
            rx="4.5"
            ry="2.8"
            fill="#FB7185"
            opacity={mood === 'celebrate' ? 0.7 : 0.45}
          />

          {/* Eyes based on mood & blink */}
          {mood === 'celebrate' || isBlinking ? (
            <>
              <path
                d={
                  mood === 'celebrate'
                    ? 'M40 44 Q46 37 52 44'
                    : 'M40 43 Q46 46 52 43'
                }
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d={
                  mood === 'celebrate'
                    ? 'M68 44 Q74 37 80 44'
                    : 'M68 43 Q74 46 80 43'
                }
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <circle
                cx={mood === 'thinking' ? 47.5 : 46}
                cy={mood === 'thinking' ? 41.5 : 43}
                r="5.2"
                fill="#1E293B"
              />
              <circle
                cx={mood === 'thinking' ? 75.5 : 74}
                cy={mood === 'thinking' ? 41.5 : 43}
                r="5.2"
                fill="#1E293B"
              />
              {/* Eye catchlights */}
              <circle
                cx={mood === 'thinking' ? 49 : 48}
                cy={mood === 'thinking' ? 39.5 : 41}
                r="1.9"
                fill="#FFFFFF"
              />
              <circle
                cx={mood === 'thinking' ? 77 : 76}
                cy={mood === 'thinking' ? 39.5 : 41}
                r="1.9"
                fill="#FFFFFF"
              />
            </>
          )}

          {/* Round Glasses */}
          <circle
            cx="46"
            cy="43"
            r="12.5"
            fill="none"
            stroke="#451A03"
            strokeWidth="2.6"
          />
          <circle
            cx="74"
            cy="43"
            r="12.5"
            fill="none"
            stroke="#451A03"
            strokeWidth="2.6"
          />
          <path d="M58.5 43 L61.5 43" stroke="#451A03" strokeWidth="2.6" />

          {/* Beak */}
          <path
            d="M55 48 L65 48 L60 56 Z"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-500">
          Oli il Gufetto · Il tuo compagno di banco
        </div>
        <p className="mt-0.5 text-sm sm:text-base font-medium text-slate-800 leading-snug">
          {displayText}
        </p>
      </div>
    </div>
  );
};
