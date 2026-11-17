import { neon } from '@neondatabase/serverless';
import { DEFAULT_KIDS, DEFAULT_REWARDS } from './defaults';

// Vercel's Neon integration sets DATABASE_URL. Without it the app still runs
// on a temporary in-memory store so you can try it, but nothing is saved.
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const dbConnected = !!url;
const sql = url ? neon(url) : null;

globalThis.__kidfunMem ||= {
  kids: structuredClone(DEFAULT_KIDS),
  sessions: [],
  settings: {},
};
const mem = globalThis.__kidfunMem;

let ready = null;
function init() {
  if (!sql) return Promise.resolve();
  ready ||= (async () => {
    await sql`create table if not exists kids (id text primary key, data jsonb not null)`;
    await sql`create table if not exists sessions (
      id serial primary key,
      kid_id text not null,
      game text not null,
      level int not null default 1,
      correct int not null default 0,
      total int not null default 0,
      duration_sec int not null default 0,
      coins int not null default 0,
      missed jsonb not null default '[]',
      created_at timestamptz not null default now()
    )`;
    await sql`create table if not exists settings (key text primary key, value jsonb not null)`;
    for (const k of DEFAULT_KIDS) {
      await sql`insert into kids (id, data) values (${k.id}, ${JSON.stringify(k)}::jsonb)
                on conflict (id) do nothing`;
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export async function getKids() {
  await init();
  if (!sql) return structuredClone(mem.kids);
  const rows = await sql`select id, data from kids order by id`;
  return rows.map((r) => ({ ...r.data, id: r.id }));
}

export async function getKid(id) {
  return (await getKids()).find((k) => k.id === id) || null;
}

export async function saveKid(kid) {
  await init();
  if (!sql) {
    const i = mem.kids.findIndex((k) => k.id === kid.id);
    if (i >= 0) mem.kids[i] = structuredClone(kid);
    return;
  }
  await sql`update kids set data = ${JSON.stringify(kid)}::jsonb where id = ${kid.id}`;
}

export async function addSession(s) {
  await init();
  if (!sql) {
    mem.sessions.unshift({ ...s, id: mem.sessions.length + 1, created_at: new Date().toISOString() });
    return;
  }
  await sql`insert into sessions (kid_id, game, level, correct, total, duration_sec, coins, missed)
            values (${s.kid_id}, ${s.game}, ${s.level}, ${s.correct}, ${s.total},
                    ${s.duration_sec}, ${s.coins}, ${JSON.stringify(s.missed)}::jsonb)`;
}

export async function getSessions(limit = 400) {
  await init();
  if (!sql) return mem.sessions.slice(0, limit);
  return await sql`select id, kid_id, game, level, correct, total, duration_sec, coins, missed, created_at
                   from sessions order by created_at desc limit ${limit}`;
}

// Has this kid already played today (Los Angeles time)? Used for the daily bonus.
export async function playedToday(kidId) {
  await init();
  const tz = 'America/Los_Angeles';
  if (!sql) {
    const day = (d) => new Date(d).toLocaleDateString('en-US', { timeZone: tz });
    return mem.sessions.some((s) => s.kid_id === kidId && day(s.created_at) === day(Date.now()));
  }
  const rows = await sql`select 1 from sessions where kid_id = ${kidId}
    and (created_at at time zone ${tz})::date = (now() at time zone ${tz})::date limit 1`;
  return rows.length > 0;
}

export async function getSetting(key, fallback) {
  await init();
  if (!sql) return key in mem.settings ? structuredClone(mem.settings[key]) : fallback;
  const rows = await sql`select value from settings where key = ${key}`;
  return rows.length ? rows[0].value : fallback;
}

export async function setSetting(key, value) {
  await init();
  if (!sql) {
    mem.settings[key] = structuredClone(value);
    return;
  }
  await sql`insert into settings (key, value) values (${key}, ${JSON.stringify(value)}::jsonb)
            on conflict (key) do update set value = excluded.value`;
}

export const getRewards = () => getSetting('rewards', DEFAULT_REWARDS);
