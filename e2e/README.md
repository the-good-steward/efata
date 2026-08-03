# Browser tests

Real Chromium, real layout, real events. These exist because every bug
that reached a tester lived in the gap between "the server responds"
and "the page behaves": a spinner that never stopped, a page that did
not scroll, a tap landing on a control that had just moved.

None of that is visible from curl, a build, or a unit test.

## Running

```bash
npm run build
npm run start -- -p 3100 &
npm run e2e
```

Against a deployed build:

```bash
E2E_BASE=https://efata-five.vercel.app npm run e2e
```

## Notes

Chromium comes from `@sparticuz/chromium` on npm, because Playwright's
CDN and Ubuntu's snap-based browsers are both unreachable from the
build sandbox.

The browser is launched with fake media devices, so the microphone is
granted without a prompt and recording can be exercised without a
human. Google Fonts is unreachable from the sandbox, so its 403 is
filtered from the console check.

## What is covered

- The landing page renders and logs no console errors
- Signed-out visitors are redirected rather than shown an error
- The login form has its fields and does not overflow sideways
- No tap target is under 44px
- Signup is either open with a form or closed with an explanation

## What is not covered yet

The signed-in flow: recording, submitting, feedback appearing, the
retry, scroll position, and the navigation lock. That needs a test
account and seeded data, and it is where the worst bugs have been. It
is the obvious next thing to add.
