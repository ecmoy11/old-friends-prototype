/* GET /api/products
 *
 * The JavaScript port of dev/products.sh. Two Square calls, joined on
 * variation ID, shaped into exactly what the shop grid needs.
 *
 * The access token lives in Cloudflare's encrypted env vars and never
 * reaches the browser. This file is the only thing that ever sees it.
 */

const CATALOG_PATH   = "/v2/catalog/search";
const INVENTORY_PATH = "/v2/inventory/counts/batch-retrieve";

function squareFetch(env, path, body, method) {
  const verb = method || "POST";
  return fetch(env.SQUARE_BASE + path, {
    method: verb,
    headers: {
      "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": env.SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    ...(verb === "GET" ? {} : { body: JSON.stringify(body) }),
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok) throw new Error(`Square ${path} ${r.status}: ${JSON.stringify(json.errors || json)}`);
    return json;
  });
}

/* Square caps a page at 100 and hands back a cursor. Without this loop
   the site silently stops at 100 products, which is invisible today and
   appears the week Lauren's catalog grows past it. */
async function fetchAllItems(env) {
  const objects = [], related = [];
  let cursor;
  do {
    const page = await squareFetch(env, CATALOG_PATH, {
      object_types: ["ITEM"],
      include_related_objects: true,
      ...(cursor ? { cursor } : {}),
    });
    objects.push(...(page.objects || []));
    related.push(...(page.related_objects || []));
    cursor = page.cursor;
  } while (cursor);
  return { objects, related };
}

/* The human-readable name of a custom attribute lives on its DEFINITION
   object, not on the value, so we fetch definitions and join by id — the
   same shape as images and categories above.

   Deliberately generic: whatever attributes Lauren creates in Square
   ("Materials", "Dimensions", "Care", anything later) flow straight to
   the product detail view. Adding a field is a Dashboard action for her,
   never a code change for us. */
async function fetchAttributeDefs(env) {
  const defs = {};
  let cursor;
  do {
    const qs = new URLSearchParams({ types: "CUSTOM_ATTRIBUTE_DEFINITION" });
    if (cursor) qs.set("cursor", cursor);
    const page = await squareFetch(env, `/v2/catalog/list?${qs}`, null, "GET");
    for (const o of page.objects || []) {
      const d = o.custom_attribute_definition_data || {};
      const selections = {};
      for (const sel of d.selection_config?.allowed_selections || []) {
        selections[sel.uid] = sel.name;
      }
      defs[o.id] = { name: d.name || d.key || "", type: d.type, selections };
    }
    cursor = page.cursor;
  } while (cursor);
  return defs;
}

/* One item's custom attributes as ordered {name, value} rows, skipping
   anything blank. Never invents a row and never supplies a default. */
function detailRows(item, defs) {
  const rows = [];
  const values = item.custom_attribute_values || {};
  for (const key of Object.keys(values)) {
    const v = values[key] || {};
    const def = defs[v.custom_attribute_definition_id] || {};
    let out = null;
    if (v.string_value != null) out = String(v.string_value);
    else if (v.number_value != null) out = String(v.number_value);
    else if (v.boolean_value != null) out = v.boolean_value ? "Yes" : "No";
    else if (Array.isArray(v.selection_uid_values)) {
      out = v.selection_uid_values
        .map((uid) => (def.selections || {})[uid])
        .filter(Boolean).join(", ");
    }
    if (out == null) continue;
    out = out.trim();
    if (!out) continue;
    rows.push({ name: def.name || v.name || key, value: out });
  }
  return rows;
}

async function fetchStock(env, variationIds) {
  const counts = {};
  /* batch-retrieve takes up to 1000 ids; chunk anyway so this never
     becomes the thing that breaks at scale */
  for (let i = 0; i < variationIds.length; i += 500) {
    const chunk = variationIds.slice(i, i + 500);
    let cursor;
    do {
      const page = await squareFetch(env, INVENTORY_PATH, {
        catalog_object_ids: chunk,
        location_ids: [env.SQUARE_LOCATION_ID],
        ...(cursor ? { cursor } : {}),
      });
      for (const c of page.counts || []) {
        if (c.state === "IN_STOCK") counts[c.catalog_object_id] = Number(c.quantity);
      }
      cursor = page.cursor;
    } while (cursor);
  }
  return counts;
}

export async function onRequestGet({ env }) {
  try {
    const { objects, related } = await fetchAllItems(env);

    const imageUrls = {};
    for (const o of related) {
      if (o.type === "IMAGE" && o.image_data?.url) imageUrls[o.id] = o.image_data.url;
    }
    const categoryNames = {};
    for (const o of related) {
      if (o.type === "CATEGORY") categoryNames[o.id] = o.category_data?.name || null;
    }

    /* A missing/failed definitions call must not empty the shop — details
       are an enhancement, not a requirement. Degrade to no rows. */
    let attrDefs = {};
    try { attrDefs = await fetchAttributeDefs(env); }
    catch (e) { console.warn("custom attribute definitions unavailable:", e.message); }

    const variationIds = objects.flatMap(
      (o) => (o.item_data?.variations || []).map((v) => v.id)
    );
    const stock = await fetchStock(env, variationIds);

    /* WHAT BELONGS ON THE SITE.
       Square Online carries a per-item visibility setting, and Lauren
       already uses it — she publishes items to her store one at a time.
       `ecom_visibility` is that setting. It is undocumented and read-only,
       but it is returned in ordinary catalog responses and it means her
       existing curation becomes the site's curation with no extra work
       and nothing for her to learn.

       Fallback: if NO item carries the field (Square dropped it), don't
       empty the shop — fall through to everything priced and photographed,
       and shout about it in the response so we notice. */
    const anyVisibility = objects.some((o) => o.item_data?.ecom_visibility);
    const publishable = anyVisibility
      ? objects.filter((o) => o.item_data?.ecom_visibility === "VISIBLE")
      : objects.filter((o) =>
          (o.item_data?.variations || []).some((v) => v.item_variation_data?.price_money?.amount) &&
          (o.item_data?.image_ids || []).length > 0);

    const products = publishable.map((o) => {
      const it = o.item_data || {};

      const variations = (it.variations || []).map((v) => {
        const vd = v.item_variation_data || {};
        /* track_inventory absent or false means Square is not counting.
           We treat that as NOT purchasable rather than infinitely
           available — for one-of-one stock, failing closed is the honest
           direction to fail. See dev/checkout.sh, same rule. */
        const tracked = vd.track_inventory === true;
        const qty = stock[v.id];
        return {
          id: v.id,
          name: vd.name || null,
          priceCents: vd.price_money?.amount ?? null,
          tracked,
          quantity: tracked ? (qty ?? 0) : null,
          available: tracked && (qty ?? 0) > 0,
        };
      });

      const prices = variations.map((v) => v.priceCents).filter((n) => n != null);

      return {
        id: o.id,
        name: it.name || "",
        /* Lauren's words, verbatim. Never synthesised here. */
        description: it.description || null,
        /* Whatever custom attributes she has filled in, in Square's order.
           Absent field => absent row. Nothing is defaulted or invented. */
        details: detailRows(it, attrDefs),
        images: (it.image_ids || []).map((id) => imageUrls[id]).filter(Boolean),
        category: categoryNames[it.category_id] || it.category_id || null,
        variations,
        priceFromCents: prices.length ? Math.min(...prices) : null,
        multiVariant: variations.length > 1,
        soldOut: variations.length > 0 && variations.every((v) => !v.available),
      };
    });

    /* TODO — SALE PRICES. Square has no sale_price field; Lauren's
       discounts are cart-level coupons ("30% Off Applied in Cart"), so
       this endpoint can only report the list price. The struck-through
       .price-was / .price-now markup in shop.html has no source here yet.
       Needs a decision before the sale items render from the API. */

    return new Response(JSON.stringify({
      products,
      meta: {
        totalInCatalog: objects.length,
        shown: products.length,
        filter: anyVisibility ? "ecom_visibility=VISIBLE" : "FALLBACK-priced-and-photographed",
      },
    }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        /* Content is cheap to cache; availability is not. Short TTL keeps
           the grid honest during a pop-up without hammering Square. */
        "Cache-Control": "public, max-age=0, s-maxage=15",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
