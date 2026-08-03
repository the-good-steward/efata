import { test, expect } from "@playwright/test";

/**
 * Duplicate controls.
 *
 * A copy-paste slip left two "Build my questions" buttons on the
 * practice page and it shipped, because the only tests that cover
 * signed-in pages skip without credentials. Structural checks like this
 * catch a whole class of editing mistake and cost nothing to run.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("no duplicate controls", () => {
  test.skip(!email || !password, "set E2E_EMAIL and E2E_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(practice|onboarding)/, { timeout: 30_000 });
  });

  for (const path of ["/practice", "/progress", "/recall"]) {
    test(`${path} has no repeated button labels`, async ({ page }) => {
      await page.goto(path);

      const labels = await page
        .locator("button, a[href]")
        .evaluateAll((nodes) =>
          nodes
            .map((n) => (n.textContent ?? "").trim())
            .filter((t) => t.length > 3),
        );

      const seen = new Map<string, number>();
      for (const label of labels) {
        seen.set(label, (seen.get(label) ?? 0) + 1);
      }

      const repeated = [...seen.entries()].filter(([, n]) => n > 1);
      expect(
        repeated,
        `repeated controls: ${JSON.stringify(repeated)}`,
      ).toHaveLength(0);
    });
  }
});
