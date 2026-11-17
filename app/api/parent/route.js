import { NextResponse } from 'next/server';
import { isParent, parentPinIsDefault } from '@/lib/auth';
import { parseWords } from '@/lib/content';
import { dbConnected, getKid, getKids, getRewards, getSessions, getSetting, saveKid, setSetting } from '@/lib/store';

export const dynamic = 'force-dynamic';

const int = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

async function snapshot() {
  const [kids, rewards, sessions, redemptions] = await Promise.all([
    getKids(),
    getRewards(),
    getSessions(400),
    getSetting('redemptions', []),
  ]);
  return { kids, rewards, sessions, redemptions, dbConnected, parentPinIsDefault };
}

export async function GET(req) {
  if (!isParent(req)) return NextResponse.json({ error: 'locked' }, { status: 401 });
  return NextResponse.json(await snapshot());
}

export async function POST(req) {
  if (!isParent(req)) return NextResponse.json({ error: 'locked' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.action === 'saveKid') {
    const kid = await getKid(body.kid?.id);
    if (!kid) return NextResponse.json({ error: 'unknown kid' }, { status: 400 });
    const b = body.kid;
    const m = b.config?.math || {};
    kid.coins = int(b.coins, 0, 100000);
    for (const g of ['typing', 'math', 'words']) {
      kid.levels[g] = int(b.levels?.[g], 1, 10);
      kid.games[g] = !!b.games?.[g];
    }
    kid.config = {
      words: parseWords(Array.isArray(b.config?.words) ? b.config.words.join('\n') : b.config?.words).slice(0, 200),
      wordsMode: b.config?.wordsMode === 'spell' ? 'spell' : 'pick',
      math: {
        add: !!m.add,
        sub: !!m.sub,
        mul: !!m.mul,
        addMax: int(m.addMax, 5, 10000),
        tables: (Array.isArray(m.tables) ? m.tables : []).map((t) => int(t, 1, 12)).slice(0, 12),
      },
    };
    await saveKid(kid);
  } else if (body.action === 'saveRewards') {
    const rewards = (Array.isArray(body.rewards) ? body.rewards : [])
      .map((r) => ({ name: String(r.name || '').trim().slice(0, 80), cost: int(r.cost, 1, 100000) }))
      .filter((r) => r.name)
      .slice(0, 20);
    await setSetting('rewards', rewards);
  } else if (body.action === 'redeem') {
    const kid = await getKid(body.kidId);
    const reward = (await getRewards())[body.index];
    if (!kid || !reward) return NextResponse.json({ error: 'bad request' }, { status: 400 });
    if ((kid.coins || 0) < reward.cost) return NextResponse.json({ error: 'Not enough coins yet' }, { status: 400 });
    kid.coins -= reward.cost;
    await saveKid(kid);
    const list = await getSetting('redemptions', []);
    list.unshift({ kid_id: kid.id, name: reward.name, cost: reward.cost, at: new Date().toISOString() });
    await setSetting('redemptions', list.slice(0, 100));
  } else {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
  return NextResponse.json(await snapshot());
}
