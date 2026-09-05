/* GET /api/products
 *
 * Thin wrapper. All the Square work and all the shaping lives in
 * _catalog.js, which dev/snapshot.mjs imports too — so the live endpoint
 * and the committed preview file can never describe a product differently.
 *
 * The access token lives in Cloudflare's encrypted env vars and never
 * reaches the browser. This function is the only thing that ever sees it.
 */

import { fetchCatalog } from "./_catalog.js";

export async function onRequestGet({ env }) {
  try {
    const { products, meta } = await fetchCatalog(env);

    return new Response(JSON.stringify({
      source: "live",
      generatedAt: new Date().toISOString(),
      products,
      meta,
    }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        /* Content is cheap to cache; availability is not. Short TTL keeps
           the grid honest during a pop-up without hammering Square. */
        "Cache-Control": "public, max-age=0, s-maxage=15",
      },
    });
  } catch (err) {
    /* Fail loudly and emptily. Returning stale or invented products here
       would be exactly the bug this refactor exists to kill. */
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
