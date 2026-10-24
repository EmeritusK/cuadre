// Generates the synthetic demo data: fixtures/inventory-sample.csv (an accounting
// export to try the importer) and supabase/seed.sql (a demo organization with a
// session in progress). Every supplier, product and person here is invented.
import { writeFileSync } from "node:fs";

let state = 20230601;
const random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (min, max) => Math.floor(random() * (max - min + 1)) + min;

const catalog = {
  "Alimentos Andinos S.A.": [["Arroz grano largo", ["1kg", "2kg", "5kg"], [10, 12]], ["Azúcar blanca", ["1kg", "2kg"], [10, 20]], ["Sal yodada", ["500g", "1kg"], [24, 30]]],
  "Pesquera del Pacífico": [["Atún en aceite", ["170g", "354g"], [24, 48]], ["Sardinas en tomate", ["155g", "425g"], [24, 48]]],
  "Lácteos de la Sierra": [["Leche entera", ["1L", "200ml"], [12, 24]], ["Yogur de frutilla", ["1L", "200g"], [6, 12]], ["Queso fresco", ["500g"], [10]]],
  "Molinos del Litoral": [["Harina de trigo", ["1kg", "2kg"], [10, 12]], ["Fideo tallarín", ["400g", "1kg"], [20, 24]], ["Avena en hojuelas", ["400g", "800g"], [12, 24]]],
  "Hogar Limpio Cía. Ltda.": [["Detergente en polvo", ["500g", "1kg", "2kg"], [10, 12]], ["Cloro", ["1L", "2L"], [6, 12]], ["Lavavajilla en crema", ["500g", "1kg"], [12, 24]]],
  "Bebidas Tropicales": [["Jugo de naranja", ["1L", "250ml"], [12, 24]], ["Agua sin gas", ["600ml", "1,5L"], [12, 24]], ["Bebida hidratante", ["500ml"], [12]]],
  "Confites La Costa": [["Galleta de chocolate", ["120g", "6 pack"], [12, 24]], ["Caramelo surtido", ["100u"], [12]], ["Chocolate en barra", ["50g", "100g"], [24, 48]]],
  "Cuidado Personal Andes": [["Champú", ["400ml", "750ml"], [12]], ["Jabón de tocador", ["3x110g"], [24]], ["Pasta dental", ["75ml", "150ml"], [24, 48]]],
  "Conservas Manabí": [["Mermelada de mora", ["300g", "600g"], [12, 24]], ["Salsa de tomate", ["200g", "400g"], [24]], ["Mayonesa", ["200g", "400g"], [24]]],
  "Granos del Valle": [["Lenteja", ["500g"], [24]], ["Fréjol rojo", ["500g"], [24]], ["Maíz tostado", ["500g"], [20]]],
  "Snacks Pichincha": [["Papas fritas", ["45g", "150g"], [24, 48]], ["Chifles", ["50g", "150g"], [24]], ["Maní salado", ["100g"], [24]]],
  "Café de Loja": [["Café molido", ["250g", "500g"], [12, 24]], ["Café soluble", ["50g", "170g"], [12]]],
  "Aceites del Oriente": [["Aceite vegetal", ["1L", "2L", "5L"], [6, 12]], ["Manteca vegetal", ["500g", "1kg"], [12, 24]]],
  "Papelera Austral": [["Papel higiénico", ["4 rollos", "12 rollos"], [6, 12]], ["Servilletas", ["100u", "300u"], [24]], ["Toalla de cocina", ["2 rollos"], [12]]],
  "Especias Amazonía": [["Comino molido", ["50g"], [48]], ["Achiote", ["100g"], [24]], ["Orégano", ["25g"], [48]]],
  "Mascotas Felices": [["Alimento para perro", ["2kg", "8kg"], [4, 10]], ["Alimento para gato", ["1kg", "3kg"], [6, 10]]],
};

const warehouses = ["Bodega Norte", "Bodega Norte", "Bodega Norte", "Bodega Sur"];
const products = [];
let sku = 7860100000000;
for (const [supplier, lines] of Object.entries(catalog)) {
  for (const [name, sizes, boxes] of lines) {
    for (const size of sizes) {
      const variants = int(2, 6);
      for (let v = 0; v < variants; v += 1) {
        const unitsPerBox = pick(boxes);
        const flavor = v === 0 ? "" : ` ${pick(["Clásico", "Light", "Familiar", "Económico", "Premium", "Natural", "Integral", "Promo"])}`;
        sku += int(7, 977);
        products.push({
          sku: String(sku),
          description: `${name}${flavor} ${size} C:${unitsPerBox}U`.toUpperCase(),
          supplier,
          warehouse: pick(warehouses),
          unitsPerBox,
          systemQty: unitsPerBox * int(2, 60) + (random() < 0.3 ? int(1, unitsPerBox - 1) : 0),
          unitCost: Math.round((0.35 + random() * 14) * 100000) / 100000,
        });
      }
    }
  }
}

// Dedupe descriptions so every product reads distinctly.
const seen = new Set();
const unique = products.filter((p) => !seen.has(p.description) && seen.add(p.description));

const decimal = (n) => String(n).replace(".", ",");
const csv = [
  "SALDO;CODIGO_PRODUCTO;DESCRIPCION_PRODUCTO;COSTO_PRODUCTO;NOMBRE_BODEGA;PROV;UNIDAD_X_CAJA",
  ...unique.map((p, i) =>
    [p.systemQty, p.sku, p.description, decimal(p.unitCost), p.warehouse, p.supplier, i % 97 === 13 ? "#DIV/0!" : p.unitsPerBox].join(";"),
  ),
].join("\r\n");
writeFileSync("fixtures/inventory-sample.csv", `﻿${csv}\r\n`);

const sql = (v) => (v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const people = [
  ["00000000-0000-4000-8000-000000000001", "demo@cuadre.app", "Andrea Salazar"],
  ["00000000-0000-4000-8000-000000000002", "supervisor@cuadre.app", "Marco Villacís"],
  ...["Luis Cedeño", "María Torres", "Jorge Vera", "Paola Mora", "Diego Alvarado", "Gabriela Ruiz", "Carlos Peña", "Daniela Castro", "Fernando León", "Sofía Andrade", "Pablo Ortiz", "Valeria Chávez"].map(
    (name, i) => [`00000000-0000-4000-8000-0000000001${String(i).padStart(2, "0")}`, `contador${i + 1}@cuadre.app`, name],
  ),
];

const lines = [];
lines.push("-- Synthetic demo data generated by scripts/generate-sample.mjs. Do not edit by hand.");
lines.push("-- Demo login: demo@cuadre.app / cuadre-demo");
lines.push("select setseed(0.42);");
for (const [id, email, name] of people) {
  lines.push(
    `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new) values ('00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', ${sql(email)}, extensions.crypt('cuadre-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', ${sql(JSON.stringify({ full_name: name }))}, now(), now(), '', '', '', '');`,
  );
  lines.push(
    `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '${id}', '${id}', ${sql(JSON.stringify({ sub: id, email }))}, 'email', now(), now(), now());`,
  );
}

const org = "10000000-0000-4000-8000-000000000001";
lines.push(`insert into public.organizations (id, name, created_by) values ('${org}', 'Distribuidora Demo (datos sintéticos)', '${people[0][0]}');`);
lines.push(`insert into public.memberships (org_id, user_id, role) values ('${org}', '${people[1][0]}', 'supervisor')${people
  .slice(2)
  .map(([id]) => `, ('${org}', '${id}', 'counter')`)
  .join("")};`);

const rowsJson = JSON.stringify(unique.map((p) => ({ ...p })));
lines.push("-- Two sessions: a closed one and one counting right now.");
lines.push("set local role postgres;");
lines.push(`select set_config('request.jwt.claims', '{"sub":"${people[0][0]}","role":"authenticated"}', true);`);
for (const name of ["Toma de cierre de semestre", "Toma mensual Bodega Norte"]) {
  lines.push(`select public.import_session('${org}', ${sql(name)}, 'inventario-sistema.csv', ${sql(rowsJson)}::jsonb);`);
}
lines.push(`update public.count_sessions set status = 'counting', created_at = now() - interval '9 hours' where org_id = '${org}';`);

const teamNames = ["Pasillo A", "Pasillo B", "Pasillo C", "Cámara fría", "Mezzanine", "Patio de carga"];
lines.push(`do $$
declare
  s record;
  t uuid;
  supplier_ids uuid[];
  member_ids uuid[] := array[${people.slice(2).map(([id]) => `'${id}'::uuid`).join(", ")}];
  i int;
begin
  for s in select id, code from public.count_sessions where org_id = '${org}' order by code loop
    select array_agg(id order by name) into supplier_ids from public.suppliers where org_id = '${org}';
    for i in 1..${teamNames.length} loop
      insert into public.teams (session_id, org_id, name)
      values (s.id, '${org}', (array[${teamNames.map(sql).join(", ")}])[i]) returning id into t;
      insert into public.team_members (team_id, user_id, org_id)
      values (t, member_ids[i * 2 - 1], '${org}'), (t, member_ids[i * 2], '${org}');
      insert into public.team_suppliers (team_id, supplier_id, session_id, org_id)
      select t, sid, s.id, '${org}'
      from unnest(supplier_ids) with ordinality u(sid, n)
      where (n - 1) % ${teamNames.length} = i - 1
        and (s.code = 1 or n <= array_length(supplier_ids, 1) - 2);
    end loop;

    -- Count events: every product of the first session, about 60% of the second.
    insert into public.counts (product_id, pallets, layers, boxes, units, expires_on, condition, counted_by, created_at)
    select
      p.id,
      1,
      1,
      greatest(0, floor(p.system_qty / p.units_per_box)::int + case when r < 0.10 then -2 when r < 0.16 then 1 else 0 end),
      (p.system_qty - floor(p.system_qty / p.units_per_box) * p.units_per_box)::int,
      current_date + (30 + floor(random() * 400))::int,
      case when random() < 0.03 then 'averiado'::public.product_condition else 'bueno' end,
      tm.user_id,
      now() - (random() * interval '8 hours')
    from public.session_products p
    cross join lateral (select random() as r) rr
    join public.team_suppliers ts on ts.session_id = p.session_id and ts.supplier_id = p.supplier_id
    join lateral (select user_id from public.team_members where team_id = ts.team_id limit 1) tm on true
    where p.session_id = s.id and (s.code = 1 or random() < 0.62);
  end loop;

  update public.count_sessions set status = 'closed' where org_id = '${org}' and code = 1;
end $$;`);
lines.push(`update public.session_products set recount_requested = true where id in (select id from public.session_product_status where status = 'faltante' and difference_value < -40 limit 6);`);
lines.push("reset role;");

writeFileSync("supabase/seed.sql", `${lines.join("\n")}\n`);
console.log(`products: ${unique.length}, suppliers: ${Object.keys(catalog).length}`);
