import { NextResponse } from 'next/server';
import { checkPin, cookieFor } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { kind, pin } = await req.json().catch(() => ({}));
  const k = kind === 'parent' ? 'parent' : 'family';
  if (!checkPin(k, pin)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const c = cookieFor(k);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
