# Efata

**Ephphatha, "be opened."**

A communication practice app for freelancers and professionals. Paste a
job post, get interview questions back, record your spoken answers, and
get an evaluation with concrete feedback, plus daily drills to keep
improving between real client calls.

## Status

Early build. This commit is the initial scaffold only: project
structure, Supabase auth wiring, and a placeholder landing page. No
product features yet.

## Roadmap

1. **Question generation** from a pasted job post, personal and
   technical.
2. **Audio evaluation** of recorded answers, with a forced retry so a
   session never ends on a score.
3. **Daily drills**, same evaluation engine.
4. **English proficiency levels** tuning question difficulty and
   feedback tone.
5. *(Future)* AI video interviewer.

Questions are scored against one of three rubrics depending on type
(STAR for experience, situational judgment for hypotheticals, technical
accuracy against an answer key), with a delivery layer scored across all
three.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel |
| Database, auth, storage | Supabase |
| Question generation and evaluation | Anthropic API |
| Speech to text | Deepgram |
| Text to speech | ElevenLabs |

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open http://localhost:3000.

Without Supabase env vars the app still runs; auth checks are skipped
and a warning is logged. See `.env.example` for the full list of keys.

## Deployment

Vercel, via the GitHub integration. Every push to `main` deploys.
