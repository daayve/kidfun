'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function PinPad({ kind, title, onUnlocked }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/unlock', { kind, pin });
      onUnlocked();
    } catch (err) {
      setError(err.message);
      setPin('');
    }
    setBusy(false);
  }

  return (
    <form className="card center" style={{ maxWidth: 420, margin: '80px auto' }} onSubmit={submit}>
      <h2>{title}</h2>
      <p>
        <input
          className="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-label="PIN"
        />
      </p>
      <button className="btn" disabled={busy || !pin}>Unlock</button>
      {error && <p style={{ color: 'var(--bad)', fontWeight: 700 }}>{error}</p>}
    </form>
  );
}
