import { test, expect } from "@playwright/test";

/**
 * The real signed-in flow.
 *
 * Needs a throwaway account. Set E2E_EMAIL and E2E_PASSWORD and these
 * run against the actual app; without them they skip, so the suite
 * still passes in environments that have no credentials.
 *
 *   E2E_EMAIL=qa@example.com E2E_PASSWORD=... npm run e2e
 *
 * Use a dedicated account, not your own: these create sessions and
 * answers, which would pollute your progress figures.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "set E2E_EMAIL and E2E_PASSWORD to run these");

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(practice|onboarding)/, { timeout: 30_000 });
});

test("practice page loads with the job post form", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.locator('textarea[name="job_post"]')).toBeVisible();

  const submit = page.getByRole("button", { name: /build my questions/i });
  const box = await submit.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("progress page renders without dead space", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByText(/what.s changed/i)).toBeVisible();

  // A sparkline drawn against a flat series used to render as an
  // invisible line pinned to the bottom edge, leaving a large empty
  // gap. Any line that is present must sit inside its box.
  const lines = page.locator("svg polyline");
  const count = await lines.count();
  for (let i = 0; i < count; i++) {
    const points = await lines.nth(i).getAttribute("points");
    const ys = (points ?? "")
      .split(" ")
      .map((p) => Number(p.split(",")[1]))
      .filter((n) => !Number.isNaN(n));
    for (const y of ys) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(28);
    }
  }
});

test("navigation does not wrap or overflow on a phone", async ({ page }) => {
  await page.goto("/practice");
  const width = page.viewportSize()!.width;

  for (const label of ["Practice", "Progress", "Log an interview"]) {
    const link = page.getByRole("link", { name: label });
    const box = await link.boundingBox();
    // A wrapped link reads as two separate links, which is how the
    // header broke before.
    expect(box!.height).toBeLessThan(40);
    expect(box!.width).toBeLessThan(width);
  }
});

test("recall page accepts a job post first", async ({ page }) => {
  await page.goto("/recall");
  await expect(page.locator('textarea[name="job_post"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: /add the questions/i }),
  ).toBeVisible();
});
