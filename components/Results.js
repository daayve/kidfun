'use client';
import Link from 'next/link';

// End-of-round screen shared by every game.
export default function Results({ kidId, result, error, correct, total, missed = [], onAgain }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="card center results">
      <h1>{pct >= 90 ? 'Amazing!' : pct >= 70 ? 'Nice work!' : 'Good try!'}</h1>
      <p className="muted">
        {correct} right out of {total} ({pct}%)
      </p>
      {result ? (
        <>
          <div className="big-num">+{result.coins} 🪙</div>
          <p className="muted">
            {result.accuracyBonus > 0 && <>Sharp shooter bonus +{result.accuracyBonus}. </>}
            {result.dailyBonus > 0 && <>First game today +{result.dailyBonus}. </>}
          </p>
          {result.newLevel > result.level && <h2>⬆️ Level up! You are now level {result.newLevel}</h2>}
          <p>
            You have <b>{result.kid.coins}</b> coins
          </p>
        </>
      ) : error ? (
        <p style={{ color: 'var(--bad)' }}>Could not save this round: {error}</p>
      ) : (
        <p className="muted">Saving...</p>
      )}
      {missed.length > 0 && (
        <p className="muted">Practice these: {[...new Set(missed)].slice(0, 8).join(', ')}</p>
      )}
      <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
        <button className="btn big" onClick={onAgain} autoFocus>
          Play again
        </button>
        <Link className="btn big ghost" href={`/play/${kidId}`}>
          Done
        </Link>
      </div>
    </div>
  );
}
