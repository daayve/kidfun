'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useKid } from '@/lib/client';
import { shuffle } from '@/lib/content';
import GameShell from '@/components/GameShell';
import Results from '@/components/Results';
import { useRound } from '@/components/useRound';

const ROUNDS = 10;

function say(word) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.rate = 0.8;
  u.lang = 'en-US';
  window.speechSynthesis.speak(u);
}

export default function WordsGame() {
  const { kid: kidId } = useParams();
  const { kid, setKid } = useKid(kidId);
  const round = useRound(kid, 'words', setKid);
  const [playing, setPlaying] = useState(false);
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState(null);
  const [reveal, setReveal] = useState(false);
  const st = useRef(null);
  const inputRef = useRef(null);

  const spell = kid?.config.wordsMode === 'spell';
  const noSpeech = typeof window !== 'undefined' && !window.speechSynthesis;

  function start() {
    round.reset();
    const words = shuffle(kid.config.words).slice(0, ROUNDS);
    const nChoices = kid.levels.words <= 1 ? 3 : 4;
    st.current = {
      startedAt: Date.now(),
      correct: 0,
      missed: [],
      items: words.map((w) => ({
        word: w,
        choices: shuffle([w, ...shuffle(kid.config.words.filter((x) => x !== w)).slice(0, nChoices - 1)]),
      })),
    };
    setI(0);
    setValue('');
    setPicked(null);
    setReveal(false);
    setPlaying(true);
  }

  const item = playing ? st.current.items[i] : null;

  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => say(item.word), 300);
    inputRef.current?.focus();
    return () => clearTimeout(t);
  }, [item]);

  function answer(guess) {
    if (reveal) return;
    const s = st.current;
    const ok = guess.trim().toLowerCase() === item.word;
    if (ok) s.correct++;
    else s.missed.push(item.word);
    setPicked(guess);
    setReveal(true);
    setTimeout(
      () => {
        setReveal(false);
        setPicked(null);
        setValue('');
        if (i + 1 >= s.items.length) {
          setPlaying(false);
          round.finish({
            correct: s.correct,
            total: s.items.length,
            missed: s.missed,
            durationSec: Math.round((Date.now() - s.startedAt) / 1000),
          });
        } else setI(i + 1);
      },
      ok ? 800 : 2200
    );
  }

  if (!kid) return <div className="wrap center muted">Loading...</div>;

  return (
    <GameShell kid={kid} game="words">
      {round.summary ? (
        <Results kidId={kid.id} {...round.summary} result={round.result} error={round.error} onAgain={start} />
      ) : !playing ? (
        <div className="card center">
          <h1>🔊 Listen Up</h1>
          {kid.config.words.length < 4 ? (
            <p>Ask a parent to add more words first.</p>
          ) : (
            <>
              <p>{spell ? 'Listen to the word, then spell it.' : 'Listen to the word, then click the one you heard.'}</p>
              {noSpeech && <p style={{ color: 'var(--bad)' }}>This browser cannot read words out loud. Try Chrome or Safari.</p>}
              <button className="btn big" onClick={start} autoFocus>
                Start
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="card center">
          <div className="hud">
            <span className="stat">
              Word {i + 1} of {st.current.items.length}
            </span>
            <span className="stat">✅ {st.current.correct}</span>
          </div>
          <button className="speaker" onClick={() => { say(item.word); inputRef.current?.focus(); }} aria-label="Hear the word again">
            🔊
          </button>
          <p className="muted">Click the speaker to hear it again</p>

          {spell ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (value.trim()) answer(value);
              }}
            >
              <input
                ref={inputRef}
                className="answer"
                style={{ width: 420, maxWidth: '100%', fontSize: '2.4rem' }}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={reveal}
                aria-label="Spell the word"
              />
              <p>
                <button className="btn" disabled={reveal || !value.trim()}>
                  Check
                </button>
              </p>
              <div className={`feedback ${reveal ? (picked.trim().toLowerCase() === item.word ? 'good' : 'bad') : ''}`}>
                {reveal && (picked.trim().toLowerCase() === item.word ? 'Yes!' : `It is spelled: ${item.word}`)}
              </div>
            </form>
          ) : (
            <div className="choices">
              {item.choices.map((c) => (
                <button
                  key={c}
                  className={`choice${reveal && c === item.word ? ' right' : ''}${reveal && c === picked && c !== item.word ? ' wrong' : ''}`}
                  onClick={() => answer(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
