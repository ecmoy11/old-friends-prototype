/* Why is "featured" 0? Prints what Square actually returns, so we stop
 * guessing. Run through dev/featured-check.sh, which supplies credentials.
 *
 * Three things go wrong here and they look identical from the outside:
 *   1. the definition was never created
 *   2. it exists under a different name than the code matches
 *   3. it exists but this app cannot SEE it -- catalog custom attributes
 *      are app-scoped, and one created by another app (the Dashboard
 *      included) is invisible unless its visibility allows reading.
 */
const env = {
  SQUARE_BASE:         process.env.SQUARE_BASE,
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_VERSION:      process.env.SQUARE_VERSION,
};
for (const [k, v] of Object.entries(env)) {
  if (!v) { console.error(`Missing ${k}. Run this through dev/featured-check.sh.`); process.exit(1); }
}

const call = async (path, body, method = "POST") => {
  const r = await fetch(env.SQUARE_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": env.SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
  const j = await r.json();
  if (!r.ok) { console.error(`Square ${path} ${r.status}:`, JSON.stringify(j.errors || j, null, 2)); process.exit(1); }
  return j;
};

/* ── 1. every custom attribute definition this token can see ── */
const defsPage = await call("/v2/catalog/list?types=CUSTOM_ATTRIBUTE_DEFINITION", null, "GET");
const defs = defsPage.objects || [];

console.log("\n=== CUSTOM ATTRIBUTE DEFINITIONS THIS TOKEN CAN SEE ===");
if (!defs.length) {
  console.log("  (none)");
} else {
  for (const o of defs) {
    const d = o.custom_attribute_definition_data || {};
    console.log(`  name=${JSON.stringify(d.name)}  key=${JSON.stringify(d.key)}  type=${d.type}`);
    console.log(`     id=${o.id}`);
    console.log(`     app_visibility=${d.app_visibility}  seller_visibility=${d.seller_visibility}`);
  }
}

const byId = {};
for (const o of defs) byId[o.id] = (o.custom_attribute_definition_data || {}).name || "";
const match = defs.find((o) =>
  String((o.custom_attribute_definition_data || {}).name || "").trim().toLowerCase() === "featured");

/* ── 2. what values actually ride along on the items ── */
const items = [];
let cursor;
do {
  const page = await call("/v2/catalog/search", {
    object_types: ["ITEM"],
    include_related_objects: true,
    ...(cursor ? { cursor } : {}),
  });
  items.push(...(page.objects || []));
  cursor = page.cursor;
} while (cursor);

console.log("\n=== CUSTOM ATTRIBUTE VALUES ON ITEMS ===");
let anyValues = false, anyTrue = 0;
for (const it of items) {
  const vals = it.custom_attribute_values || {};
  const keys = Object.keys(vals);
  if (!keys.length) continue;
  anyValues = true;
  console.log(`  ${(it.item_data || {}).name}`);
  for (const k of keys) {
    const v = vals[k] || {};
    const label = byId[v.custom_attribute_definition_id] || v.name || k;
    const shown = v.boolean_value ?? v.string_value ?? v.number_value ?? v.selection_uid_values;
    console.log(`     ${JSON.stringify(label)} = ${JSON.stringify(shown)}`);
    if (String(label).trim().toLowerCase() === "featured" && v.boolean_value === true) anyTrue++;
  }
}
if (!anyValues) console.log("  (no item carries any custom attribute value this token can read)");

/* ── 3. the verdict ── */
console.log("\n=== VERDICT ===");
console.log(`  items scanned: ${items.length}`);
if (!match) {
  console.log('  NO definition named exactly "Featured" is visible to this token.');
  console.log("  Either it was never created, it is named something else (see the list above),");
  console.log("  or it was created by another app and is hidden from this one.");
} else {
  const d = match.custom_attribute_definition_data || {};
  console.log(`  Found the definition: name=${JSON.stringify(d.name)} type=${d.type}`);
  if (d.type !== "BOOLEAN") console.log(`  WRONG TYPE. The code reads boolean_value, so it must be a Toggle (BOOLEAN), not ${d.type}.`);
  console.log(`  items with it ticked true: ${anyTrue}`);
  if (!anyTrue) console.log("  The definition exists but nothing is ticked, or the ticks are not saved.");
}
console.log("");
