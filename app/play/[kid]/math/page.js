'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useKid } from '@/lib/client';
import { mathQuestion } from '@/lib/content';
import GameShell from '@/components/GameShell';
import Results from '@/components/Results';
import { useRound } from '@/components/useRound';

const DURATION = 60;
const FINISH = 15; // correct answers to reach the flag

export default function MathGame() {
  const { kid: kidId } = useParams();
  const { kid, setKid } = useKid(kidId);
  const round = useRound(kid, 'math', setKid);
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState(null);
  const [value, setValue] = useState('');
  const [left, setLeft] = useState(DURATION);
  const [feedback, setFeedback] = useState(null); // { ok, text }
  const [correct, setCorrect] = useState(0);
  const st = useRef({ correct: 0, total: 0, missed: [], locked: false });
  const inputRef = useRef(null);

  const nextQ = (prev) => {
    let n = mathQuestion(kid.config.math, kid.levels.math);
    for (let i = 0; i < 5 && prev && n.text === prev.text; i++) n = mathQuestion(kid.config.math, kid.levels.math);
    setQ(n);
    setValue('');
  };

  function start() {
    round.reset();
    st.current = { correct: 0, total: 0, missed: [], locked: false };
    setCorrect(0);
    setLeft(DURATION);
    setFeedback(null);
    nextQ(null);
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;
    const startedAt = Date.now();
    const t = setInterval(() => {
      const remaining = DURATION - Math.floor((Date.now() - startedAt) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(t);
        setPlaying(false);
        const s = st.current;
        round.finish({ correct: s.correct, total: s.total, missed: s.missed, durationSec: DURATION });
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    if (playing) inputRef.current?.focus();
  }, [playing, q]);

  function onChange(e) {
    const s = st.current;
    if (s.locked) return;
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue(v);
    // Checks itself as soon as enough digits are typed, no Enter needed.
    if (v.length < String(q.answer).length) return;
    s.total++;
    if (Number(v) === q.answer) {
      s.correct++;
      setCorrect(s.correct);
      setFeedback({ ok: true, text: 'Yes!' });
      nextQ(q);
    } else {
      s.missed.push(`${q.text} = ${q.answer}`);
      s.locked = true;
      setFeedback({ ok: false, text: `${q.text} = ${q.answer}` });
      setTimeout(() => {
        s.locked = false;
        setFeedback(null);
        nextQ(q);
      }, 1500);
    }
  }

  if (!kid) return <div className="wrap center muted">Loading...</div>;
  const progress = Math.min(1, correct / FINISH);

  return (
    <GameShell kid={kid} game="math">
      {round.summary ? (
        <Results kidId={kid.id} {...round.summary} result={round.result} error={round.error} onAgain={start} />
      ) : !playing ? (
        <div className="card center">
          <h1>🏎️ Math Race</h1>
          <p>
            Type the answer. Get {FINISH} right in {DURATION} seconds to reach the flag!
          </p>
          <button className="btn big" onClick={start} autoFocus>
            Start
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="hud">
            <span className="stat">⏱️ {left}</span>
            <span className="stat">
              ✅ {correct} {correct >= FINISH && '🏆'}
            </span>
          </div>
          <div className="track">
            <span className="car" style={{ left: `calc(${progress * 86}% + 4px)` }}>
              🏎️
            </span>
            <span className="flag">🏁</span>
          </div>
          <div className="question">{q.text} = ?</div>
          <input ref={inputRef} className="answer" inputMode="numeric" value={value} onChange={onChange} aria-label="Your answer" autoComplete="off" />
          <div className={`feedback ${feedback ? (feedback.ok ? 'good' : 'bad') : ''}`}>{feedback?.text}</div>
        </div>
      )}
    </GameShell>
  );
}
