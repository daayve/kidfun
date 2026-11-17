import { NextResponse } from 'next/server';
import { isFamily } from '@/lib/auth';
import { getKids, getRewards } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isFamily(req)) return NextResponse.json({ error: 'locked' }, { status: 401 });
  const [kids, rewards] = await Promise.all([getKids(), getRewards()]);
  return NextResponse.json({ kids, rewards });
}
