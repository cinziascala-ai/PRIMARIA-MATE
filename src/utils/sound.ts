let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.14) {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playSound(kind: 'correct' | 'wrong' | 'click' | 'victory' | 'hint', enabled: boolean) {
  if (!enabled) return;
  try {
    if (kind === 'correct') {
      playTone(523.25, 0, 0.14, 'triangle', 0.15);
      playTone(659.25, 0.08, 0.22, 'triangle', 0.16);
    } else if (kind === 'wrong') {
      playTone(260, 0, 0.16, 'sine', 0.12);
      playTone(210, 0.1, 0.22, 'sine', 0.1);
    } else if (kind === 'click') {
      playTone(440, 0, 0.06, 'sine', 0.06);
    } else if (kind === 'hint') {
      playTone(587.33, 0, 0.12, 'sine', 0.1);
      playTone(783.99, 0.07, 0.18, 'sine', 0.1);
    } else if (kind === 'victory') {
      playTone(523.25, 0, 0.14, 'triangle', 0.14);
      playTone(659.25, 0.1, 0.14, 'triangle', 0.14);
      playTone(783.99, 0.2, 0.16, 'triangle', 0.15);
      playTone(1046.5, 0.3, 0.35, 'triangle', 0.17);
    }
  } catch {
    // Ignore audio errors if autoplay policy blocks context
  }
}
