import { NextResponse } from 'next/server';
import { isFamily } from '@/lib/auth';
import { GAMES } from '@/lib/defaults';
import { addSession, getKid, playedToday, saveKid } from '@/lib/store';

export const dynamic = 'force-dynamic';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

// A finished round comes in here. The server decides coins and level changes
// so the numbers can't be edited from the browser.
export async function POST(req) {
  if (!isFamily(req)) return NextResponse.json({ error: 'locked' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const kid = await getKid(body.kidId);
  if (!kid || !GAMES[body.game]) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const game = body.game;
  const total = clamp(body.total, 0, 300);
  const correct = clamp(body.correct, 0, total);
  const level = kid.levels?.[game] || 1;
  const accuracy = total ? correct / total : 0;

  const accuracyBonus = total >= 5 && accuracy >= 0.9 ? 5 : 0;
  const dailyBonus = correct > 0 && !(await playedToday(kid.id)) ? 10 : 0;
  const coins = correct + accuracyBonus + dailyBonus;

  let newLevel = level;
  if (correct >= 8 && accuracy >= 0.85) newLevel = Math.min(10, level + 1);
  else if (total >= 5 && accuracy < 0.5) newLevel = Math.max(1, level - 1);

  const missed = Array.isArray(body.missed) ? body.missed.slice(0, 40).map((m) => String(m).slice(0, 40)) : [];
  await addSession({
    kid_id: kid.id,
    game,
    level,
    correct,
    total,
    duration_sec: clamp(body.durationSec, 0, 1800),
    coins,
    missed,
  });

  kid.coins = (kid.coins || 0) + coins;
  kid.levels = { ...kid.levels, [game]: newLevel };
  await saveKid(kid);

  return NextResponse.json({ kid, coins, accuracyBonus, dailyBonus, level, newLevel });
}
