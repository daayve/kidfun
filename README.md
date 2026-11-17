# Kid Fun

Learning games for Lucas (3rd grade) and Parker (1st grade). Next.js on Vercel with a Postgres database for progress.

## What's in it

- `/` : "Who is playing?" with a button per kid
- `/play/<kid>` : that kid's games, coins, and prize progress
  - Word Rain: typing game using the kid's word list
  - Math Race: 60 second math sprint
  - Listen Up: hear a word, then click it (reading) or type it (spelling)
- `/parent` : PIN protected page with progress, missed items, and all settings

Each game has levels 1 to 10 per kid. A strong round (85%+ and at least 8 right) moves up a level, a rough round (under 50%) moves down one.

Coins: 1 per right answer, +5 for a round at 90% or better, +10 for the first game of the day.

## Deploy on Vercel

1. vercel.com, Add New, Project, import the `kidfun` repo, Deploy.
2. In the project, open Storage, Create Database, pick Neon (Postgres), connect it to the project. This adds `DATABASE_URL` for you.
3. Settings, Environment Variables, add:
   - `PARENT_PIN` : PIN for the parent page (defaults to 0000 until you set it)
   - `FAMILY_PIN` : optional. If set, each device enters it once before the kid buttons show.
4. Deployments, Redeploy, so the new variables take effect.
5. Settings, Domains, to pick a `something.vercel.app` name or add your own domain.

Tables are created automatically on first load.

## Changing what the kids practice

Use `/parent`: paste this week's spelling or sight words, pick math operations, the biggest number, and which times tables. No code changes needed.

The first-time defaults live in `lib/defaults.js`. Game logic for word and question selection is in `lib/content.js`.

## Run locally

```
npm install
npm run dev
```

Without `DATABASE_URL` it uses a temporary in-memory store, so nothing is saved between restarts.
