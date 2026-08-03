import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  executablePath: await chromium.executablePath(),
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:3100/", { waitUntil: "networkidle0" });
const h1 = await page.$eval("h1", (el) => el.textContent);
console.log("rendered h1:", JSON.stringify(h1));
await browser.close();
