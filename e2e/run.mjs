import { withBrowser, phonePage, check } from "./browser.mjs";

const BASE = process.env.E2E_BASE ?? "http://localhost:3100";

await withBrowser(async (browser) => {
  // --- Landing renders ---
  {
    const page = await phonePage(browser);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
    const h1 = await page.$eval("h1", (el) => el.textContent?.trim());
    check("landing renders the wordmark", h1 === "efata", `got ${h1}`);
    // Google Fonts is unreachable from the build sandbox, so its 403 is
    // an artefact of where this runs rather than a fault in the app.
    const real = page.problems.filter((p) => !p.includes("403"));
    check("no console errors on landing", real.length === 0, real[0] ?? "");
    await page.close();
  }

  // --- Protected routes redirect rather than erroring ---
  for (const path of ["/practice", "/progress", "/recall"]) {
    const page = await phonePage(browser);
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
    const url = page.url();
    check(
      `${path} sends a signed-out visitor to login`,
      url.includes("/login") && res.status() < 400,
      `landed on ${url} (${res.status()})`,
    );
    await page.close();
  }

  // --- Login form is usable on a phone ---
  {
    const page = await phonePage(browser);
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });

    const fields = await page.$$eval("input", (els) =>
      els.map((e) => ({ name: e.name, type: e.type })),
    );
    check(
      "login has email and password fields",
      fields.some((f) => f.name === "email") &&
        fields.some((f) => f.name === "password"),
      JSON.stringify(fields),
    );

    // Every tap target must clear 44px, which is the spec and also the
    // difference between usable and infuriating on a phone.
    const small = await page.$$eval("button, a", (els) =>
      els
        .map((e) => ({
          text: (e.textContent ?? "").trim().slice(0, 30),
          h: Math.round(e.getBoundingClientRect().height),
        }))
        .filter((e) => e.text && e.h > 0 && e.h < 44),
    );
    check(
      "no tap target under 44px on login",
      small.length === 0,
      small.map((s) => `${s.text}=${s.h}px`).join(", "),
    );

    // Nothing should overflow the viewport sideways on a phone.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    check("login does not scroll sideways", !overflow);

    await page.close();
  }

  // --- Signup honours the closed switch ---
  {
    const page = await phonePage(browser);
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0" });
    const body = await page.$eval("body", (el) => el.textContent ?? "");
    const hasForm = (await page.$('input[name="password"]')) !== null;
    const closed = body.includes("Paused");
    check(
      "signup is either open with a form or closed with an explanation",
      hasForm !== closed,
      `form=${hasForm} closed=${closed}`,
    );
    await page.close();
  }
});

console.log(
  process.exitCode === 1 ? "\nSOME CHECKS FAILED" : "\nall checks passed",
);
