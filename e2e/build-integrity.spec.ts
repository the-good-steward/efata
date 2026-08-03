import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Source-level checks that need no browser and no account.
 *
 * These exist because the tests that would have caught a duplicated
 * button live behind a login, and so never run by default. A blunt scan
 * of the components catches the same mistake for free, on every run.
 */
function componentFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...componentFiles(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

test("no component renders the same button twice", () => {
  const offenders: string[] = [];

  for (const file of componentFiles("src")) {
    const source = readFileSync(file, "utf8");

    // Only <button> elements. A label appearing in both a button and a
    // link is fine and common; two buttons with the same label is the
    // copy-paste slip worth catching.
    const buttons = [...source.matchAll(/<button[\s\S]*?<\/button>/g)].map(
      (m) => m[0],
    );

    const counts = new Map<string, number>();

    for (const button of buttons) {
      // Labels within one button, deduped: a ternary naming the same
      // label in both branches is one button, not two.
      const labels = new Set<string>();

      for (const m of button.matchAll(/>\s*([A-Z][A-Za-z' ]{6,40})\s*</g)) {
        if (!m[1].includes("{")) labels.add(m[1].trim());
      }
      for (const m of button.matchAll(/"([A-Z][A-Za-z' ]{6,40})"/g)) {
        labels.add(m[1].trim());
      }

      for (const label of labels) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }

    for (const [label, n] of counts) {
      if (n > 1) offenders.push(`${file}: button "${label}" appears ${n} times`);
    }
  }

  expect(offenders, offenders.join("\n")).toHaveLength(0);
});
