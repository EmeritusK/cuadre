import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test("anonymous visitors are sent to sign in", async ({ page }) => {
  await page.goto("/tomas");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Ftomas/);
  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
});

test("a new company imports its stock, forms teams and closes a live count", async ({ page }) => {
  const email = `jefe-${Date.now()}@prueba.ec`;
  const password = "contrasena-segura";

  // Sign up and create the organization.
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill("Jefa de Bodega");
  await page.getByLabel("Correo de trabajo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido a Cuadre" })).toBeVisible();
  await page.getByLabel("Nombre de la empresa").fill("Distribuidora de Prueba");
  await page.getByRole("button", { name: "Crear empresa y continuar" }).click();

  // Import the sample accounting export.
  await expect(page.getByRole("heading", { name: "Importar inventario" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles("fixtures/inventory-sample.csv");
  await expect(page.getByText("Productos aceptados")).toBeVisible();
  await expect(page.getByText(/valores corregidos/)).toBeVisible();
  await page.getByLabel("Nombre de la toma").fill("Toma de prueba");
  await page.getByRole("button", { name: "Crear toma" }).click();

  // Form two teams and balance the suppliers between them.
  await expect(page).toHaveURL(/\/tomas\/1\/equipos\?importada=1/);
  await expect(page.getByText("TOMA-0001 quedó creada")).toBeVisible();
  for (const name of ["Pasillo norte", "Pasillo sur"]) {
    await page.getByLabel("Nuevo equipo").fill(name);
    await page.getByRole("button", { name: "Crear equipo" }).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  await page.getByRole("button", { name: "Repartir automáticamente" }).click();
  await expect(page.getByText("Todos los proveedores tienen equipo.")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar conteo" }).click();
  await expect(page.getByText("Conteo iniciado")).toBeVisible();

  // The overview is live before any count arrives.
  await page.goto("/tomas/1");
  await expect(page.getByText(/Faltan \d+ de \d+ productos\./)).toBeVisible();
  await expect(page.getByText("En vivo")).toBeVisible();

  // A count arrives through the public API, the way the mobile app sends it.
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  await supabase.auth.signInWithPassword({ email, password });
  const { data: product } = await supabase
    .from("session_product_status")
    .select("id, description, units_per_box, system_qty")
    .order("sku")
    .limit(1)
    .single();
  const { error } = await supabase.from("counts").insert({
    product_id: product!.id,
    pallets: 1,
    layers: 1,
    boxes: 0,
    units: Number(product!.system_qty) - 1,
    units_per_box: 1,
  });
  expect(error).toBeNull();

  const latest = page.getByRole("region", { name: "Últimos conteos" });
  await expect(latest.getByText(product!.description)).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("region", { name: "Lo que más pesa" }).getByText(product!.description),
  ).toBeVisible();

  // Close the session and export the result.
  await page.getByRole("button", { name: "Cerrar toma" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar toma" }).click();
  await expect(page.getByText("TOMA-0001 cerrada.")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar CSV" }).click();
  expect((await download).suggestedFilename()).toBe("TOMA-0001-cierre.csv");
});
