import { test, expect } from "@playwright/test";

/**
 * Signed-out pages. These need no database, so they run anywhere and
 * catch the broadest class of breakage: a page that does not render.
 */
test("landing page shows the mark and the line", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("svg[aria-label='Efata']").first()).toBeVisible();
  await expect(page.getByText("Open the mouth")).toBeVisible();
});

test("login page has a usable form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  // Tap targets must clear 44px, which the brand spec requires and a
  // desktop-first layout quietly breaks.
  const button = page.getByRole("button", { name: /sign in/i });
  const box = await button.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("protected pages redirect when signed out", async ({ page }) => {
  for (const path of ["/practice", "/progress", "/recall", "/calibrate"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("signup validates before submitting", async ({ page }) => {
  await page.goto("/signup");
  const heading = await page.textContent("h1");

  // Skip when signups are paused — that is a valid state, not a failure.
  test.skip(/paused/i.test(heading ?? ""), "signups are closed");

  await page.locator('input[name="email"]').fill("not-an-email");
  await page.locator('input[name="password"]').fill("short");
  await page.getByRole("button", { name: /create account/i }).click();

  // The browser's own validation should stop this reaching the server.
  await expect(page).toHaveURL(/\/signup/);
});
