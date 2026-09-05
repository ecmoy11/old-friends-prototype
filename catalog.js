/* ── OLD FRIENDS — THE PRODUCT STORE ──
   Include FIRST, before cart.js / detail.js / search.js / shop-render.js.

   THIS IS THE ONLY SOURCE OF PRODUCT DATA ON THE SITE.

   Everything a shopper reads about a product — name, price, options,
   stock, description, detail rows, photos — comes from here, and here
   gets it from Square. Nothing in this file, and nothing in any HTML
   page, may carry product copy or a price.

   Why it exists: the site used to read product data back out of rendered
   HTML (parsing "$38.50" out of a <div>, testing tag text for the word
   "sold"). That made hand-written cards indistinguishable from live data,
   so hardcoded values looked like they worked right up until a shopper
   was charged the wrong amount. Cards now render FROM this store and
   carry data-pid; every consumer looks products up by id and never reads
   the DOM. Delete the store and the shop goes empty, which is the point:
   fake data has nowhere left to hide.

   Sources, in order:
     /api/products   live Square, via the Cloudflare Function
     products.json   a dated snapshot, committed for the static preview
                     (regenerate with ./dev/snapshot.sh — never by hand)

   A live API that ERRORS does not fall back to the snapshot. Stale prices
   dressed as live ones are the failure mode this whole file exists to
   prevent, so the shop says it cannot reach inventory and sells nothing. */
(function () {
  var state = {
    source: 'loading',   /* live | snapshot | none | error */
    generatedAt: null,
    products: [],
    byId: {},
    meta: null,
    error: null
  };

  function index(payload, source) {
    state.source = source;
    state.generatedAt = payload.generatedAt || null;
    state.products = payload.products || [];
    state.meta = payload.meta || null;
    state.byId = {};
    state.products.forEach(function (p) { state.byId[p.id] = p; });
    return state;
  }

  function fail(source, err) {
    state.source = source;
    state.error = err;
    state.products = [];
    state.byId = {};
    return state;
  }

  var ready = fetch('/api/products', { headers: { Accept: 'application/json' } })
    .then(function (r) {
      /* 404 means there is no API on this host at all — we are on plain
         static hosting (GitHub Pages, or a file:// preview). That is an
         expected deployment, not a fault. */
      if (r.status === 404) { var e = new Error('no-api'); e.noApi = true; throw e; }
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
        throw new Error(j.error || ('HTTP ' + r.status));
      });
      return r.json();
    })
    .then(function (data) { return index(data, 'live'); })
    .catch(function (err) {
      if (!err || !err.noApi) {
        /* A real failure against a real API. Do NOT substitute the
           snapshot: it would put yesterday's prices on today's shop with
           nothing on screen to say so. */
        console.error('[Old Friends] /api/products failed:', err);
        return fail('error', err);
      }
      return fetch('products.json', { headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          console.info(
            '[Old Friends] No /api/products on this host — showing the committed Square ' +
            'snapshot from ' + (data.generatedAt || 'an unknown date') + '. ' +
            'Refresh it with ./dev/snapshot.sh; run `npx wrangler pages dev .` for live data.'
          );
          return index(data, 'snapshot');
        })
        .catch(function (e2) {
          console.warn('[Old Friends] No /api/products and no products.json — the shop has no data. ' +
                       'Run ./dev/snapshot.sh to build the preview file.');
          return fail('none', e2);
        });
    });

  /* ── shared formatting and rules ──
     Every consumer uses these, so the grid, the modal and the cart can
     never disagree about what a product costs or whether it can be sold. */

  function money(cents) {
    if (cents == null) return '';
    return '$' + (cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2));
  }

  /* The options a shopper actually chooses between. An unnamed single
     variation is Square's internal plumbing, not a choice. */
  function options(p) {
    return (p && p.variations ? p.variations : []).filter(function (v) { return v && v.name; });
  }

  /* One place decides whether a thing can go in a bag, and why not.
     Returns null when it can. */
  function blockedReason(p) {
    if (!p) return 'Unavailable';
    if (p.soldOut) return 'Sold Out';
    if (p.untracked) return 'Unavailable';
    if (p.priceFromCents == null) return 'Unavailable';
    return null;
  }

  /* The price to charge. For a product with options this is null until
     one is picked — there is no "default" variant and guessing one is how
     a shopper gets charged for something they did not choose. */
  function priceCentsFor(p, variationId) {
    if (!p) return null;
    if (variationId) {
      var hit = (p.variations || []).filter(function (v) { return v.id === variationId; })[0];
      return hit ? hit.priceCents : null;
    }
    if (p.requiresChoice) return null;
    var only = (p.variations || [])[0];
    return only ? only.priceCents : p.priceFromCents;
  }

  /* What the card shows before anything is chosen. A range is stated as a
     range rather than flattened to its bottom end. */
  function displayPrice(p) {
    if (!p || p.priceFromCents == null) return '';
    if (p.priceToCents != null && p.priceToCents !== p.priceFromCents) {
      return money(p.priceFromCents) + '–' + money(p.priceToCents);
    }
    return money(p.priceFromCents);
  }

  window.OFCatalog = {
    ready: ready,
    get: function (id) { return state.byId[id] || null; },
    all: function () { return state.products.slice(); },
    featured: function () { return state.products.filter(function (p) { return p.featured; }); },
    state: function () { return state; },
    money: money,
    options: options,
    blockedReason: blockedReason,
    priceCentsFor: priceCentsFor,
    displayPrice: displayPrice
  };
})();
