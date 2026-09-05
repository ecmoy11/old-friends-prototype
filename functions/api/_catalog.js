/* ── SQUARE CATALOG → PRODUCT OBJECTS ──
 *
 * The single place Square's shape is turned into ours. Imported by BOTH
 * functions/api/products.js (the live endpoint) and dev/snapshot.mjs (the
 * committed preview file), so the static preview and the live site cannot
 * drift into describing products differently. If you change a field here,
 * both change together. That is the whole reason this file exists.
 *
 * Filenames starting with "_" are not routed by Cloudflare Pages, so this
 * is a module and never an endpoint.
 *
 * NOTHING IN HERE INVENTS A VALUE. A field Lauren has not filled in comes
 * back null or absent, and the site renders that absence honestly.
 */

const CATALOG_PATH   = "/v2/catalog/search";
const INVENTORY_PATH = "/v2/inventory/counts/batch-retrieve";
const LIST_PATH      = "/v2/catalog/list";

/* The custom-attribute name Lauren toggles to put something on the
   homepage. Matched case-insensitively against the attribute DEFINITION
   name, so she creates "Featured" once in Dashboard > Custom attributes
   (type Toggle) and ticks it per item. It is deliberately an attribute
   and not a category: Square gives an item only ONE category, and
   spending it on "Featured" would cost her the real one. */
const FEATURED_ATTR = "featured";

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
   object, not on the value, so we fetch definitions and join by id.

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
    const page = await squareFetch(env, `${LIST_PATH}?${qs}`, null, "GET");
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
   anything blank. Never invents a row and never supplies a default.

   The Featured toggle is control data, not something a shopper reads, so
   it is pulled out here rather than rendering as a "Featured: Yes" row on
   the product page. */
function readAttributes(item, defs) {
  const rows = [];
  let featured = false;
  const values = item.custom_attribute_values || {};
  for (const key of Object.keys(values)) {
    const v = values[key] || {};
    const def = defs[v.custom_attribute_definition_id] || {};
    const label = def.name || v.name || key;

    if (String(label).trim().toLowerCase() === FEATURED_ATTR) {
      featured = v.boolean_value === true;
      continue;
    }

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
    rows.push({ name: label, value: out });
  }
  return { rows, featured };
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

export async function fetchCatalog(env) {
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

  /* WHAT BELONGS ON THE SITE.
     Square Online carries a per-item visibility setting, exposed as
     `ecom_visibility`. It is undocumented and read-only, but returned in
     ordinary catalog responses, and it means Lauren's existing curation
     becomes the site's curation with no extra work and nothing new for
     her to learn.

     Fallback: if NO item carries the field (Square dropped it), don't
     empty the shop — fall through to everything priced and photographed,
     and shout about it in `meta` so we notice. */
  const anyVisibility = objects.some((o) => o.item_data?.ecom_visibility);
  const publishable = anyVisibility
    ? objects.filter((o) => o.item_data?.ecom_visibility === "VISIBLE")
    : objects.filter((o) =>
        (o.item_data?.variations || []).some((v) => v.item_variation_data?.price_money?.amount) &&
        (o.item_data?.image_ids || []).length > 0);

  /* Only price what we're going to show. Asking for stock on 54 hidden
     items is 54 rows of nothing. */
  const variationIds = publishable.flatMap(
    (o) => (o.item_data?.variations || []).map((v) => v.id)
  );
  const stock = await fetchStock(env, variationIds);

  const products = publishable.map((o) => {
    const it = o.item_data || {};
    const attrs = readAttributes(it, attrDefs);

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

    /* A CHOICE, not just a count. Two variations named "Red" and "Blue"
       are a choice the shopper must make; a single unnamed default
       variation is Square's internal plumbing and must never produce a
       picker or block Add to Bag. Computed HERE, once, so the grid, the
       cart and the detail view can never disagree about it. */
    const named = variations.filter((v) => v.name);
    const requiresChoice = named.length > 1;

    return {
      id: o.id,
      name: it.name || "",
      /* Lauren's words, verbatim. Never synthesised here. */
      description: it.description || null,
      /* Whatever custom attributes she has filled in, in Square's order.
         Absent field => absent row. Nothing is defaulted or invented. */
      details: attrs.rows,
      featured: attrs.featured,
      images: (it.image_ids || []).map((id) => imageUrls[id]).filter(Boolean),
      category: categoryNames[it.category_id] || null,
      variations,
      requiresChoice,
      priceFromCents: prices.length ? Math.min(...prices) : null,
      priceToCents: prices.length ? Math.max(...prices) : null,
      /* SALE PRICES ARE NOT AVAILABLE. Square has no sale_price field and
         Lauren's discounts are cart-level, so there is no honest source
         for a struck-through original. This stays null until the
         CalculateOrder work lands; the grid renders one plain price.
         Do NOT hardcode a was/now pair back into the HTML to fill this. */
      compareAtCents: null,
      soldOut: variations.length > 0 && variations.every((v) => !v.available),
      /* Stock tracking off across the board means Square cannot tell us
         whether this is purchasable, so it is not offered for sale. */
      untracked: variations.length > 0 && variations.every((v) => !v.tracked),
    };
  });

  return {
    products,
    meta: {
      totalInCatalog: objects.length,
      shown: products.length,
      featured: products.filter((p) => p.featured).length,
      filter: anyVisibility ? "ecom_visibility=VISIBLE" : "FALLBACK-priced-and-photographed",
    },
  };
}
