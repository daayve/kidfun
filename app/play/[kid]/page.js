'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useKid } from '@/lib/client';
import { GAMES } from '@/lib/defaults';

export default function KidHome() {
  const { kid: kidId } = useParams();
  const { kid, rewards } = useKid(kidId);
  if (!kid) return <div className="wrap center muted">Loading...</div>;

  const games = Object.keys(GAMES).filter((g) => kid.games[g]);

  return (
    <div className="wrap">
      <div className="row spread">
        <Link href="/" className="btn ghost small">
          ← Switch player
        </Link>
        <span className="coins" style={{ fontSize: '1.3rem' }}>🪙 {kid.coins} coins</span>
      </div>
      <h1 className="center" style={{ margin: '24px 0' }}>
        {kid.emoji} Hi {kid.name}! Pick a game
      </h1>

      <div className="grid">
        {games.map((g) => (
          <Link key={g} href={`/play/${kid.id}/${g}`} className="card game-card">
            <div className="icon">{GAMES[g].emoji}</div>
            <h2>{GAMES[g].name}</h2>
            <p className="muted">{GAMES[g].blurb}</p>
            <span className="pill">Level {kid.levels[g]}</span>
          </Link>
        ))}
      </div>

      {rewards.length > 0 && (
        <div className="card" style={{ marginTop: 26 }}>
          <h2>🎁 Prizes</h2>
          <p className="muted">Earn coins by playing. Ask a parent when you have enough!</p>
          {rewards.map((r, i) => {
            const pct = Math.min(100, Math.round((kid.coins / r.cost) * 100));
            return (
              <div key={i} style={{ margin: '14px 0' }}>
                <div className="row spread">
                  <b>{r.name}</b>
                  <span>{kid.coins >= r.cost ? '✅ Ready!' : `${r.cost - kid.coins} more coins`}</span>
                </div>
                <div className="bar">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
