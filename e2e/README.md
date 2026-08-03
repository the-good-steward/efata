# Browser tests

These drive a real Chromium against a real build. Every bug that
reached a tester lived in the click path — a screen stuck on "listening
back", answers silently lost, taps landing on the wrong control after a
reflow — and none of it is visible from the server side.

## Running

```bash
npm run e2e            # phone and desktop
npm run e2e:phone      # phone only, which is how users actually arrive
```

Playwright builds and serves the app itself. To test against something
already running, or against production:

```bash
E2E_BASE_URL=http://localhost:3000 npm run e2e
```

## Signed-in tests

The tests in `signed-in.spec.ts` skip unless credentials are provided:

```bash
E2E_EMAIL=qa@example.com E2E_PASSWORD=... npm run e2e:phone
```

Use a throwaway account rather than your own. These create sessions and
answers, which would otherwise pollute your progress figures.

## The browser

Playwright's own download host is not reachable from the build
sandbox, so Chromium comes from `@sparticuz/chromium` and is extracted
to `/tmp/chromium` on first use. Override with `CHROMIUM_PATH` if a
system browser is available.

## What is not covered yet

Recording itself. Chromium is launched with a fake microphone, so a
test can drive the recorder, but asserting on transcription and
evaluation needs the AI services stubbed. That is the next thing worth
adding, since it is where answers were being lost.
