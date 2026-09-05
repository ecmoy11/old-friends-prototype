/* Write products.json — a dated snapshot of Lauren's real Square catalog,
 * committed to the repo so the GitHub Pages preview has something true to
 * render when there is no /api/products to call.
 *
 * Run it through dev/snapshot.sh, which supplies the credentials.
 *
 * This is NOT a place to edit product copy. Every word in the file comes
 * from Square, through the same _catalog.js the live endpoint uses. If a
 * product reads wrong here, it reads wrong in Square, and that is where
 * it gets fixed.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fetchCatalog } from "../functions/api/_catalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, "products.json");
const dryRun = process.argv.includes("--dry-run");

const env = {
  SQUARE_BASE:         process.env.SQUARE_BASE,
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_VERSION:      process.env.SQUARE_VERSION,
  SQUARE_LOCATION_ID:  process.env.SQUARE_LOCATION_ID,
};

for (const [k, v] of Object.entries(env)) {
  if (!v) { console.error(`Missing ${k}. Run this through dev/snapshot.sh.`); process.exit(1); }
}

const { products, meta } = await fetchCatalog(env);

/* An empty catalog is almost always a wrong-account or wrong-token
   problem, and writing it would blank the preview site. Refuse. */
if (!products.length) {
  console.error("Square returned 0 publishable products. Refusing to write an empty snapshot.");
  console.error("Check ./dev/env.sh — a sandbox token against an empty sandbox catalog looks exactly like this.");
  process.exit(1);
}

const payload = {
  source: "snapshot",
  generatedAt: new Date().toISOString(),
  squareEnv: process.env.SQUARE_ENV || "unknown",
  products,
  meta,
};

/* What Lauren still has to fix, surfaced at snapshot time so it is noticed
   here rather than by a shopper. None of this is patched over in code. */
const noPrice  = products.filter((p) => p.priceFromCents == null);
const noImage  = products.filter((p) => !p.images.length);
const noDesc   = products.filter((p) => !p.description);
const untracked = products.filter((p) => p.untracked);

console.log(`${products.length} products · ${meta.featured} featured · filter: ${meta.filter}`);
const warn = (list, msg) => { if (list.length) console.warn(`  ! ${list.length} ${msg}: ${list.map((p) => p.name).join(", ")}`); };
warn(noPrice, "with no price");
warn(noImage, "with no photo");
warn(noDesc, "with no description");
warn(untracked, "with stock tracking OFF (they will show as Unavailable)");
if (!meta.featured) console.warn("  ! No item carries the Featured toggle — the homepage grid will be empty.");

if (dryRun) { console.log("\n--dry-run: nothing written."); process.exit(0); }

writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
console.log(`\nWrote products.json (${meta.filter}).  Commit it to update the GitHub Pages preview.`);
