import { useEffect, useState } from 'react';

function secondsUntil(targetIso: string): number {
  return Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
}

function formatLabel(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Live "time left until targetIso" for phase-deadline countdowns — the
// first setInterval-driven UI in this app (everywhere else refetches on
// screen focus only), because a match session's countdown/roster is
// genuinely multi-user and time-sensitive in a way nothing else here is.
export function useCountdown(targetIso: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(() => (targetIso ? secondsUntil(targetIso) : 0));

  useEffect(() => {
    if (!targetIso) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(secondsUntil(targetIso));
    const id = setInterval(() => setSecondsLeft(secondsUntil(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return { secondsLeft, label: formatLabel(secondsLeft), expired: secondsLeft <= 0 };
}
