import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/tomas",
  "/tomas/2",
  "/tomas/2/productos",
  "/tomas/2/equipos",
  "/tomas/nueva",
  "/configuracion",
];

async function signIn(page: Page) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill("demo@cuadre.app");
  await page.getByLabel("Contraseña").fill("cuadre-demo");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/ingresar"));
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    test("sign-in page has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/ingresar");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    for (const route of ROUTES) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
        await signIn(page);
        await page.goto(route, { waitUntil: "networkidle" });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
          })),
        ).toEqual([]);
      });
    }
  });
}
