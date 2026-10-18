# Product

## Platform

web

## Stack

Next.js 14.2 (App Router, Server Actions), React 18, TypeScript strict, Tailwind CSS 3.4 with Radix primitives, TanStack Table, Recharts, react-hook-form + zod. Supabase (Postgres with Row Level Security, Auth, Realtime) with SQL migrations. pnpm, Vitest, Playwright, GitHub Actions.

## Users

- **Admin / jefe de bodega** of a consumer-goods distributor in Ecuador. Runs the physical stock count (toma física): imports the accounting system's stock file, splits suppliers across counting teams, watches the count progress live and closes the session.
- **Supervisor**: follows the count of one or more teams, decides what gets recounted.
- **Counter**: counts on the warehouse floor using a separate mobile app (planned, not part of this web product). The web shows their work but never captures counts.

Typical scene: count day, office beside the warehouse, desktop or tablet, several teams counting at once and pressure to close the session the same day.

## Product Purpose

Reconcile the accounting system's stock against what is physically on the shelves, product by product, while the count is happening. Success means closing a session with every supplier counted and every difference located, valued in dollars and either explained or recounted.

## Positioning

Built around the way these warehouses actually count: pallets (planchas) × layers (filas) × boxes × units per box plus loose units, suppliers grouped into teams, and a live "cuadre" of system vs counted stock with a dollar value on every difference. Not a generic inventory or ERP module.

## Operating Context

- Source data is a semicolon-separated CSV exported from the accounting system: `SALDO;CODIGO_PRODUCTO;DESCRIPCION_PRODUCTO;COSTO_PRODUCTO;NOMBRE_BODEGA;PROV;UNIDAD_X_CAJA`, decimal comma, UTF-8 with BOM, occasional `#DIV/0!` in units per box (treated as 1).
- A session holds 50–5,000 products, 5–120 suppliers, 1–15 teams.
- Counts arrive continuously from the mobile app; each count records planchas, filas, cajas, unidades, expiry date and product condition. Several counts for one product add up.
- Product status per session: CUADRADO (counted = system), FALTANTE (counted < system), SOBRANTE (counted > system).
- Money and numbers in USD, `es-EC` formatting.

## Capabilities and Constraints

- Multi-organization; roles admin, supervisor, counter; data isolated per organization through RLS.
- Count formula: `total = planchas × filas × cajas × unidad_x_caja + unidades`.
- Sessions move `draft → counting → closed`; closed sessions are read-only and exportable.
- The schema is the contract for the future mobile counting app.
- UI language: Spanish (Ecuador). Code and commits: English.

## Brand Commitments

Product name: **Cuadre**. New, neutral product; not tied to any real client. Voice: plain, operational Spanish, warehouse vocabulary (toma, bodega, proveedor, saldo, faltante, sobrante), no hype.

## Evidence on Hand

- Real stock file layout from the previous project (anonymized into a synthetic sample at `fixtures/inventory-sample.csv`). All demo data is synthetic and labeled as such.
- No customers, testimonials, metrics or benchmarks exist; none may be invented.

## Product Principles

1. The difference is the product: every screen leads with what does not match and how much it is worth.
2. Live, not reported: progress and differences update as counts arrive, without reloading.
3. Built for the count day: dense, scannable, fast to operate under time pressure.
4. Trust the numbers: imports validate every row and show exactly what was accepted or fixed.

## Accessibility & Inclusion

WCAG 2.1 AA. Status is never conveyed by color alone. Usable on tablets in bright or dim offices.
