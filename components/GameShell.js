'use client';
import Link from 'next/link';
import { GAMES } from '@/lib/defaults';

export default function GameShell({ kid, game, children }) {
  const g = GAMES[game];
  return (
    <div className="wrap">
      <div className="row spread" style={{ marginBottom: 18 }}>
        <Link href={`/play/${kid.id}`} className="btn ghost small">
          ← Back
        </Link>
        <h2 style={{ margin: 0 }}>
          {g.emoji} {g.name} <span className="pill">Level {kid.levels[game]}</span>
        </h2>
        <span className="coins">🪙 {kid.coins}</span>
      </div>
      {children}
    </div>
  );
}
