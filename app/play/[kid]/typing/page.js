'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useKid } from '@/lib/client';
import { pick, typingPool } from '@/lib/content';
import GameShell from '@/components/GameShell';
import Results from '@/components/Results';
import { useRound } from '@/components/useRound';

const DURATION = 60;

export default function TypingGame() {
  const { kid: kidId } = useParams();
  const { kid, setKid } = useKid(kidId);
  const round = useRound(kid, 'typing', setKid);
  const [playing, setPlaying] = useState(false);
  const [, setTick] = useState(0);
  const [oops, setOops] = useState(false);
  const st = useRef(null);

  function start() {
    round.reset();
    const now = performance.now();
    st.current = { words: [], typed: '', correct: 0, missed: [], startedAt: now, last: now, nextSpawn: 0, id: 0, left: DURATION, done: false };
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing || !kid) return;
    const level = kid.levels.typing;
    const pool = typingPool(kid, level);
    const baseSecs = Math.max(5, 12 - level * 0.7);
    const gap = Math.max(1.3, 3.2 - level * 0.2);
    let raf;

    const end = () => {
      const s = st.current;
      if (s.done) return;
      s.done = true;
      setPlaying(false);
      round.finish({ correct: s.correct, total: s.correct + s.missed.length, missed: s.missed, durationSec: DURATION });
    };

    const loop = (now) => {
      const s = st.current;
      const dt = Math.min(0.1, (now - s.last) / 1000);
      s.last = now;
      const elapsed = (now - s.startedAt) / 1000;
      s.left = Math.max(0, Math.ceil(DURATION - elapsed));
      if (elapsed >= DURATION) return end();

      if (elapsed >= s.nextSpawn && s.words.length < 4) {
        // Avoid two words on screen that start with the same letter.
        let text = pick(pool);
        for (let i = 0; i < 12 && s.words.some((w) => w.text[0] === text[0]); i++) text = pick(pool);
        if (!s.words.some((w) => w.text[0] === text[0])) {
          s.words.push({ id: ++s.id, text, x: 4 + Math.random() * 66, y: 0, secs: baseSecs + text.length * 0.4 });
        }
        s.nextSpawn = elapsed + gap;
      }

      for (const w of s.words) w.y += (dt * 100) / w.secs;
      const landed = s.words.filter((w) => w.y >= 100);
      if (landed.length) {
        landed.forEach((w) => s.missed.push(w.text));
        s.words = s.words.filter((w) => w.y < 100);
        if (s.typed && !s.words.some((w) => w.text.startsWith(s.typed))) s.typed = '';
      }
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e) => {
      const s = st.current;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        s.typed = s.typed.slice(0, -1);
        return;
      }
      if (e.key.length !== 1) return;
      e.preventDefault();
      const next = s.typed + e.key.toLowerCase();
      const hit = s.words.find((w) => w.text === next);
      if (hit) {
        s.words = s.words.filter((w) => w !== hit);
        s.correct++;
        s.typed = '';
      } else if (s.words.some((w) => w.text.startsWith(next))) {
        s.typed = next;
      } else {
        setOops(true);
        setTimeout(() => setOops(false), 160);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  if (!kid) return <div className="wrap center muted">Loading...</div>;
  const s = st.current;

  return (
    <GameShell kid={kid} game="typing">
      {round.summary ? (
        <Results kidId={kid.id} {...round.summary} result={round.result} error={round.error} onAgain={start} />
      ) : !playing ? (
        <div className="card center">
          <h1>⌨️ Word Rain</h1>
          <p>Type each {kid.levels.typing <= 1 ? 'letter' : 'word'} before it hits the grass. You have {DURATION} seconds.</p>
          <button className="btn big" onClick={start} autoFocus>
            Start
          </button>
        </div>
      ) : (
        <>
          <div className="hud">
            <span className="stat">⏱️ {s.left}</span>
            <span className="stat">✅ {s.correct}</span>
          </div>
          <div className={`sky${oops ? ' oops' : ''}`}>
            {s.words.map((w) => {
              const active = s.typed && w.text.startsWith(s.typed);
              return (
                <div key={w.id} className={`drop${active ? ' active' : ''}`} style={{ left: `${w.x}%`, top: `${w.y * 0.88}%` }}>
                  {active ? (
                    <>
                      <span className="hit">{s.typed}</span>
                      {w.text.slice(s.typed.length)}
                    </>
                  ) : (
                    w.text
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </GameShell>
  );
}
