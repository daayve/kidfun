'use client';
import { useCallback, useEffect, useState } from 'react';

export async function api(path, body) {
  const res = await fetch(
    path,
    body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      : { cache: 'no-store' }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'Something went wrong'), { status: res.status });
  return json;
}

// Loads one kid's profile. Sends the browser home if the family PIN is needed.
export function useKid(id) {
  const [state, setState] = useState({ kid: null, rewards: [], loading: true });
  const load = useCallback(async () => {
    try {
      const data = await api('/api/state');
      const kid = data.kids.find((k) => k.id === id) || null;
      if (!kid) window.location.href = '/';
      setState({ kid, rewards: data.rewards, loading: false });
    } catch (e) {
      window.location.href = '/';
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load, setKid: (kid) => setState((s) => ({ ...s, kid })) };
}
