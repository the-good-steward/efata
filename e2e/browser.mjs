import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * Browser harness.
 *
 * Playwright's CDN and Ubuntu's snap-based browsers are both
 * unreachable from the build environment, so Chromium comes from an npm
 * package instead. It is a real browser: it lays out, it scrolls, it
 * fires events.
 *
 * This exists because every bug that reached a tester lived in the gap
 * between "the server responds" and "the page behaves" — a stuck
 * spinner, a page that did not scroll, a tap landing on the wrong
 * control. None of it is visible from curl.
 */
export async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-dev-shm-usage",
      // Grant the microphone without a prompt, and feed it a synthetic
      // tone so recording can be exercised end to end.
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/** iPhone-ish viewport: the app is used on phones, so test on one. */
export async function phonePage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  page.setDefaultTimeout(15000);

  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.problems = problems;

  return page;
}

export function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
  return ok;
}
