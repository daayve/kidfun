'use client';
import { useCallback, useState } from 'react';
import { api } from '@/lib/client';

// Sends a finished round to the server and keeps the kid's coins/level fresh.
export function useRound(kid, game, setKid) {
  const [summary, setSummary] = useState(null); // { correct, total, missed }
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const finish = useCallback(
    async ({ correct, total, missed, durationSec }) => {
      setSummary({ correct, total, missed });
      setResult(null);
      setError('');
      try {
        const res = await api('/api/session', { kidId: kid.id, game, correct, total, missed, durationSec });
        setResult(res);
      } catch (e) {
        setError(e.message);
      }
    },
    [kid?.id, game]
  );

  const reset = useCallback(() => {
    if (result) setKid(result.kid);
    setSummary(null);
    setResult(null);
  }, [result, setKid]);

  return { summary, result, error, finish, reset };
}
