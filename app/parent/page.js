'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { GAMES } from '@/lib/defaults';
import PinPad from '@/components/PinPad';

const DAY = 24 * 60 * 60 * 1000;

function summarize(sessions, kidId) {
  const mine = sessions.filter((s) => s.kid_id === kidId);
  const week = mine.filter((s) => Date.now() - new Date(s.created_at).getTime() < 7 * DAY);
  const byGame = {};
  for (const g of Object.keys(GAMES)) {
    const gs = week.filter((s) => s.game === g);
    const total = gs.reduce((n, s) => n + s.total, 0);
    const correct = gs.reduce((n, s) => n + s.correct, 0);
    byGame[g] = { rounds: gs.length, accuracy: total ? Math.round((correct / total) * 100) : null };
  }
  const counts = {};
  for (const s of mine.slice(0, 40)) for (const m of s.missed || []) counts[m] = (counts[m] || 0) + 1;
  const missed = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return {
    rounds: week.length,
    minutes: Math.round(week.reduce((n, s) => n + s.duration_sec, 0) / 60),
    days: new Set(week.map((s) => new Date(s.created_at).toDateString())).size,
    byGame,
    missed,
    recent: mine.slice(0, 8),
  };
}

function KidEditor({ kid, sessions, rewards, onSave, onRedeem }) {
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft({ ...structuredClone(kid), wordsText: kid.config.words.join('\n') });
  }, [kid]);
  if (!draft) return null;

  const stats = summarize(sessions, kid.id);
  const m = draft.config.math;
  const set = (fn) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    setSaved(false);
  };

  async function save() {
    await onSave({ ...draft, config: { ...draft.config, words: draft.wordsText } });
    setSaved(true);
  }

  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <h2>
        {kid.emoji} {kid.name} <span className="muted" style={{ fontWeight: 400 }}>({kid.grade})</span>
      </h2>

      <div className="stats">
        <div className="box"><b>{kid.coins}</b>coins</div>
        <div className="box"><b>{stats.days}</b>days played (last 7)</div>
        <div className="box"><b>{stats.rounds}</b>rounds (last 7 days)</div>
        <div className="box"><b>{stats.minutes}</b>minutes (last 7 days)</div>
      </div>

      <label>Last 7 days by game</label>
      <ul>
        {Object.keys(GAMES).map((g) => (
          <li key={g}>
            {GAMES[g].name}: level {kid.levels[g]}, {stats.byGame[g].rounds} rounds
            {stats.byGame[g].accuracy !== null && `, ${stats.byGame[g].accuracy}% correct`}
          </li>
        ))}
      </ul>

      <label>Missed most often</label>
      {stats.missed.length ? (
        <ul>
          {stats.missed.map(([text, n]) => (
            <li key={text}>
              {text} <span className="muted">({n}x)</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nothing yet.</p>
      )}

      <label>Recent rounds</label>
      {stats.recent.length ? (
        <ul>
          {stats.recent.map((s) => (
            <li key={s.id}>
              {new Date(s.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}:{' '}
              {GAMES[s.game]?.name} level {s.level}, {s.correct}/{s.total}, +{s.coins} coins
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No rounds played yet.</p>
      )}

      <hr style={{ border: 0, borderTop: '2px solid var(--line)', margin: '18px 0' }} />
      <h3>Settings</h3>

      <label>Word list (spelling or sight words, one per line or comma separated)</label>
      <textarea value={draft.wordsText} onChange={(e) => set((d) => { d.wordsText = e.target.value; })} />
      <p className="muted" style={{ margin: '4px 0' }}>Used by Word Rain and Listen Up.</p>

      <label>Listen Up style</label>
      <select value={draft.config.wordsMode} onChange={(e) => set((d) => { d.config.wordsMode = e.target.value; })} style={{ maxWidth: 380 }}>
        <option value="pick">Hear the word, click the right one (reading)</option>
        <option value="spell">Hear the word, type it (spelling)</option>
      </select>

      <label>Math</label>
      {[['add', 'Addition'], ['sub', 'Subtraction'], ['mul', 'Multiplication']].map(([k, name]) => (
        <span className="inline" key={k}>
          <input type="checkbox" checked={!!m[k]} onChange={(e) => set((d) => { d.config.math[k] = e.target.checked; })} /> {name}
        </span>
      ))}
      <div>
        <span className="inline">
          Biggest number for adding and subtracting
          <input className="num" type="number" value={m.addMax} onChange={(e) => set((d) => { d.config.math.addMax = e.target.value; })} />
        </span>
      </div>
      <div>
        Times tables:{' '}
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => (
          <span className="inline" key={t} style={{ marginRight: 8 }}>
            <input
              type="checkbox"
              checked={m.tables.includes(t)}
              onChange={(e) => set((d) => {
                const cur = d.config.math.tables.filter((x) => x !== t);
                d.config.math.tables = e.target.checked ? [...cur, t] : cur;
              })}
            />
            {t}
          </span>
        ))}
        <p className="muted" style={{ margin: '4px 0' }}>
          Tables unlock in the order you tick them, a few more each level. Number ranges also grow with the level up to your max.
        </p>
      </div>

      <label>Games and levels (levels go from 1 to 10 and move up on their own)</label>
      {Object.keys(GAMES).map((g) => (
        <div key={g}>
          <span className="inline">
            <input type="checkbox" checked={!!draft.games[g]} onChange={(e) => set((d) => { d.games[g] = e.target.checked; })} /> {GAMES[g].name}
          </span>
          <span className="inline">
            level
            <input className="num" type="number" min="1" max="10" value={draft.levels[g]} onChange={(e) => set((d) => { d.levels[g] = e.target.value; })} />
          </span>
        </div>
      ))}

      <label>Coins</label>
      <input className="num" type="number" value={draft.coins} onChange={(e) => set((d) => { d.coins = e.target.value; })} />

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={save}>Save {kid.name}'s settings</button>
        {saved && <span style={{ color: 'var(--good)', fontWeight: 700 }}>Saved</span>}
      </div>

      {rewards.length > 0 && (
        <>
          <label>Cash in a prize</label>
          {rewards.map((r, i) => (
            <div key={i} className="row" style={{ margin: '6px 0' }}>
              <button className="btn small ghost" disabled={kid.coins < r.cost} onClick={() => onRedeem(kid, i, r)}>
                Redeem
              </button>
              <span>
                {r.name} ({r.cost} coins)
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function RewardsEditor({ rewards, onSave }) {
  const [list, setList] = useState(rewards);
  const [saved, setSaved] = useState(false);
  useEffect(() => setList(rewards), [rewards]);
  const update = (i, key, v) => {
    setList(list.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
    setSaved(false);
  };
  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <h2>🎁 Prizes</h2>
      <p className="muted">Kids see these with a progress bar. A round usually earns 10 to 30 coins.</p>
      {list.map((r, i) => (
        <div className="row" key={i} style={{ marginBottom: 8, flexWrap: 'nowrap' }}>
          <input type="text" value={r.name} placeholder="Prize" onChange={(e) => update(i, 'name', e.target.value)} />
          <input className="num" type="number" value={r.cost} onChange={(e) => update(i, 'cost', e.target.value)} />
          <button className="btn small ghost" onClick={() => { setList(list.filter((_, j) => j !== i)); setSaved(false); }}>
            Remove
          </button>
        </div>
      ))}
      <div className="row">
        <button className="btn small ghost" onClick={() => setList([...list, { name: '', cost: 100 }])}>
          Add a prize
        </button>
        <button className="btn" onClick={async () => { await onSave(list); setSaved(true); }}>
          Save prizes
        </button>
        {saved && <span style={{ color: 'var(--good)', fontWeight: 700 }}>Saved</span>}
      </div>
    </div>
  );
}

export default function ParentPage() {
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api('/api/parent'));
      setLocked(false);
    } catch (e) {
      if (e.status === 401) setLocked(true);
      else setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(body) {
    setError('');
    try {
      setData(await api('/api/parent', body));
    } catch (e) {
      setError(e.message);
    }
  }

  if (locked) return <PinPad kind="parent" title="Parent PIN" onUnlocked={load} />;
  if (!data) return <div className="wrap center muted">{error || 'Loading...'}</div>;

  return (
    <div className="wrap parent">
      <div className="row spread" style={{ marginBottom: 16 }}>
        <h1>Parent page</h1>
        <Link href="/" className="btn ghost small">
          ← Back to games
        </Link>
      </div>

      {!data.dbConnected && (
        <div className="notice">
          <b>No database connected yet.</b> Everything works, but progress and settings will reset. In Vercel, open the project, go to Storage, add a
          Neon Postgres database, then redeploy.
        </div>
      )}
      {data.parentPinIsDefault && (
        <div className="notice">
          <b>The parent PIN is still the default (0000).</b> Set PARENT_PIN in Vercel under Settings, Environment Variables, then redeploy.
        </div>
      )}
      {error && <div className="notice" style={{ borderColor: 'var(--bad)' }}>{error}</div>}

      {data.kids.map((k) => (
        <KidEditor
          key={k.id}
          kid={k}
          sessions={data.sessions}
          rewards={data.rewards}
          onSave={(kid) => act({ action: 'saveKid', kid })}
          onRedeem={(kid, index, r) => {
            if (window.confirm(`Take ${r.cost} coins from ${kid.name} for "${r.name}"?`)) act({ action: 'redeem', kidId: kid.id, index });
          }}
        />
      ))}

      <RewardsEditor rewards={data.rewards} onSave={(rewards) => act({ action: 'saveRewards', rewards })} />

      {data.redemptions.length > 0 && (
        <div className="card">
          <h2>Prizes cashed in</h2>
          <ul>
            {data.redemptions.slice(0, 15).map((r, i) => (
              <li key={i}>
                {new Date(r.at).toLocaleDateString()}: {data.kids.find((k) => k.id === r.kid_id)?.name} got {r.name} ({r.cost} coins)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
