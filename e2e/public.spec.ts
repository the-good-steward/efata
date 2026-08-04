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

test("password reset is reachable and does not leak account existence", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /forgotten your password/i }).click();
  await expect(page).toHaveURL(/\/forgot/);

  await page.locator('input[name="email"]').fill("nobody-here@example.com");
  await page.getByRole("button", { name: /send the link/i }).click();

  // The same reassurance regardless of whether the account exists —
  // otherwise this form becomes a way to discover who has signed up.
  const message = page.getByRole("status");
  await expect(message).toBeVisible();
  await expect(message).toContainText(/has an account/i);
});

test("an unauthenticated reset page explains itself", async ({ page }) => {
  await page.goto("/auth/reset");
  await expect(page.getByText(/link has expired/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /send a new link/i })).toBeVisible();
});

test("password can be shown and hidden", async ({ page }) => {
  await page.goto("/login");

  const input = page.locator('input[name="password"]');
  await input.fill("hunter2hunter2");

  // Hidden by default: practising somewhere public is common.
  await expect(input).toHaveAttribute("type", "password");

  const toggle = page.getByRole("button", { name: /show password/i });
  await toggle.click();
  await expect(input).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: /hide password/i }).click();
  await expect(input).toHaveAttribute("type", "password");

  // The value must survive toggling — losing it would be worse than
  // never offering the toggle.
  await expect(input).toHaveValue("hunter2hunter2");
});
