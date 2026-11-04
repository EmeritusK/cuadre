// Captures screenshots of app routes for visual review and the README.
// Usage: node scripts/capture.mjs <outDir> <route> [route...]   (dev server on :3000)
import { chromium } from "@playwright/test";

const [outDir, ...routes] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const theme = process.env.THEME ?? "light";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto(`${base}/ingresar`);
  await page.fill("#email", process.env.DEMO_EMAIL ?? "demo@cuadre.app");
  await page.fill("#password", "cuadre-demo");
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/ingresar")),
    page.click("button[type=submit]"),
  ]);
  for (const route of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const slug = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
    await page.screenshot({
      path: `${outDir}/${slug}-${viewport.name}${theme === "dark" ? "-dark" : ""}.png`,
      fullPage: true,
    });
  }
  await context.close();
}
await browser.close();
console.log("captured", routes.length * viewports.length);
