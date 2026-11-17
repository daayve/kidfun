'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import PinPad from '@/components/PinPad';

export default function Home() {
  const router = useRouter();
  const [kids, setKids] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/api/state');
      setKids(data.kids);
      setLocked(false);
    } catch (e) {
      if (e.status === 401) setLocked(true);
      else setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (locked) return <PinPad kind="family" title="Family PIN" onUnlocked={load} />;

  return (
    <div className="wrap center">
      <h1 style={{ marginTop: 30 }}>Who is playing?</h1>
      {error && <p style={{ color: 'var(--bad)' }}>{error}</p>}
      <div className="who">
        {(kids || []).map((k) => (
          <button key={k.id} className="who-btn" style={{ background: k.color }} onClick={() => router.push(`/play/${k.id}`)}>
            <span className="face">{k.emoji}</span>
            <span className="name">{k.name}</span>
            <span className="sub">🪙 {k.coins} coins</span>
          </button>
        ))}
      </div>
      <p>
        <Link href="/parent" className="muted">
          Parents
        </Link>
      </p>
    </div>
  );
}
