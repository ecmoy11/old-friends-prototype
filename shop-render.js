/* ── OLD FRIENDS — SHOP GRID ──
   Include AFTER catalog.js, cart.js, detail.js and search.js.

   Renders every product card on the site from window.OFCatalog. There are
   no hand-written product cards any more, on any page: if the store has no
   data, the grid is empty and says why. That is deliberate. Hardcoded
   cards used to make a broken shop look like a working one.

   It also owns the filter / sort / in-stock controls, which used to live
   inline in shop.html and read prices back out of the rendered HTML. They
   read the catalog now, so what a card is sorted by and what a shopper is
   charged are the same number by construction.

   The filter buttons are DERIVED FROM SQUARE'S OWN CATEGORIES. There is no
   alias table and no hardcoded list. Lauren adds a category in Square and
   the button appears; she empties one and it disappears. */
(function () {
  var C = window.OFCatalog;
  if (!C) { console.error('[Old Friends] catalog.js must load before shop-render.js'); return; }

  var shopGrid     = document.querySelector('.shop-grid');
  var featuredGrid = document.getElementById('featured-grid');
  if (!shopGrid && !featuredGrid) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function slug(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ── one card ──
     data-pid is the whole contract with the rest of the site. cart.js and
     detail.js look the product up by it; neither reads a word of what is
     rendered below. */
  function cardHTML(p) {
    var imgs = p.images && p.images.length ? p.images : [];
    var blocked = C.blockedReason(p);
    var needsChoice = p.requiresChoice;

    var tag = '';
    if (p.soldOut) tag = '<div class="product-tag product-tag--sold">Sold</div>';
    else if (p.untracked) tag = '<div class="product-tag product-tag--sold">Unavailable</div>';

    /* A product with options is never added from the grid. The button
       opens the picker instead, the same way the gift card asks for an
       amount. This is the bug that let a scrunchie reach the bag with no
       colourway and a guessed price. */
    var btn = blocked
      ? '<button class="add-to-bag" disabled>' + esc(blocked) + '</button>'
      : needsChoice
        ? '<button class="add-to-bag" data-choose>Choose an Option</button>'
        : '<button class="add-to-bag">Add to Bag</button>';

    var main = imgs.length
      ? '<img class="product-img" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" loading="lazy">'
      /* No photo in Square means no photo here. Nothing is substituted. */
      : '<div class="product-img product-img--none" aria-hidden="true"></div>';

    var hover = imgs.length > 1
      ? '<img class="product-img product-img-hover" src="' + esc(imgs[1]) + '" alt="" loading="lazy">'
      : '';

    /* An absent price renders as absent. It never falls back to a number. */
    var price = C.displayPrice(p);

    return '' +
      '<div class="product-card" data-pid="' + esc(p.id) + '" data-cat="' + esc(slug(p.category)) + '">' +
        '<div class="product-img-wrap">' + main + hover + tag + btn + '</div>' +
        '<div class="product-name">' + esc(p.name) + '</div>' +
        '<div class="product-price">' + esc(price) + '</div>' +
      '</div>';
  }

  function notice(grid, text) {
    var el = document.createElement('p');
    el.className = 'shop-api-notice';
    el.style.cssText =
      'font-family:"Cormorant Garamond",serif;font-style:italic;font-size:15px;' +
      'color:var(--walnut);text-align:center;margin:0 0 22px;grid-column:1/-1;';
    el.textContent = text;
    grid.parentNode.insertBefore(el, grid);
  }

  /* A dated snapshot is honest data, but it is not live availability, and
     a shopper looking at the Pages preview deserves to be told. */
  function stamp(grid, generatedAt) {
    var when = '';
    try {
      when = new Date(generatedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) { when = generatedAt || 'an earlier date'; }
    notice(grid, 'Preview of the shop as it stood on ' + when + '. Prices and availability are not live.');
  }

  /* ── the shop page: filters, sort, count ── */
  function initControls(products) {
    var cards   = Array.prototype.slice.call(shopGrid.querySelectorAll('.product-card'));
    var sortSel = document.getElementById('sort-select');
    var instock = document.getElementById('instock-only');
    var countEl = document.getElementById('shop-count');
    var filterRow = document.querySelector('.filter-row');
    var state = { filter: 'all', sort: 'featured', instock: false };

    cards.forEach(function (c, i) { c.dataset.order = i; });

    /* Catalog lookups, never DOM parsing. The gift card is not a catalog
       item, so it answers for itself through data attributes. */
    function prod(c) { return C.get(c.dataset.pid); }
    function priceOf(c) {
      var p = prod(c);
      if (p) return p.priceFromCents == null ? Infinity : p.priceFromCents;
      return c.hasAttribute('data-gift') ? Number(c.dataset.giftFrom || 0) * 100 : Infinity;
    }
    function nameOf(c) {
      var p = prod(c);
      return p ? p.name : ((c.querySelector('.product-name') || {}).textContent || '').trim();
    }
    function buyable(c) {
      var p = prod(c);
      return p ? !C.blockedReason(p) : true;
    }

    /* Filter buttons come from the categories actually on screen — Square's
       own names, plus the gift card's. Nothing hardcoded, nothing aliased,
       and a category with no products cannot produce a button. */
    function buildFilters() {
      if (!filterRow) return [];
      var seen = {}, order = [];
      cards.forEach(function (c) {
        var p = prod(c);
        var label = p ? p.category : (c.dataset.catLabel || null);
        var key = c.dataset.cat;
        if (!key || !label || seen[key]) return;
        seen[key] = true;
        order.push({ key: key, label: label });
      });
      order.sort(function (a, b) { return a.label.localeCompare(b.label); });

      filterRow.innerHTML =
        '<button class="filter-btn active" data-filter="all">Everything</button>' +
        order.map(function (o) {
          return '<button class="filter-btn" data-filter="' + esc(o.key) + '">' + esc(o.label) + '</button>';
        }).join('');
      return Array.prototype.slice.call(filterRow.querySelectorAll('.filter-btn'));
    }

    function apply() {
      var sorted = cards.slice();
      if (state.sort === 'price-asc')       sorted.sort(function (a, b) { return priceOf(a) - priceOf(b); });
      else if (state.sort === 'price-desc') sorted.sort(function (a, b) { return priceOf(b) - priceOf(a); });
      else if (state.sort === 'name')       sorted.sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
      else sorted.sort(function (a, b) { return a.dataset.order - b.dataset.order; });
      sorted.forEach(function (c) { shopGrid.appendChild(c); });

      var shown = 0;
      cards.forEach(function (c) {
        var matches = state.filter === 'all' || c.dataset.cat === state.filter;
        var show = matches && (!state.instock || buyable(c));
        c.classList.toggle('hide', !show);
        if (show) {
          shown++;
          c.classList.remove('in-view');
          void c.offsetWidth; /* restart the reveal */
          c.classList.add('in-view');
        }
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' piece' : ' pieces');
    }

    buildFilters().forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterRow.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        apply();
      });
    });
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(); });
    if (instock) instock.addEventListener('change', function () { state.instock = instock.checked; apply(); });

    window.__shopApply = apply;
    apply();
  }

  function renderShop(s) {
    /* The digital gift card is NOT a Square catalog item — it needs the
       Gift Cards API and its own email delivery, so its card is written by
       hand in shop.html and preserved here. It is the one hand-built card
       left on the site, and it sells nothing until checkout exists. */
    var gift = shopGrid.querySelector('.product-card[data-gift]');

    if (s.source === 'error') {
      shopGrid.innerHTML = '';
      notice(shopGrid, 'We can’t reach our inventory just now, so the shop is empty rather than out of date. Please check back shortly.');
      return;
    }
    if (s.source === 'none') {
      shopGrid.innerHTML = '';
      notice(shopGrid, 'The shop isn’t connected to any inventory on this preview.');
      return;
    }

    shopGrid.innerHTML = s.products.map(cardHTML).join('');
    if (gift) shopGrid.appendChild(gift);
    if (s.source === 'snapshot') stamp(shopGrid, s.generatedAt);
    initControls(s.products);
  }

  function renderFeatured(s) {
    /* Lauren decides what is featured, in Square, with the "Featured"
       toggle. No list of names lives in this repo. */
    var picks = s.products.filter(function (p) { return p.featured; });
    if (!picks.length) {
      /* An empty featured set hides the whole section rather than filling
         it with whatever happened to be first. */
      var section = featuredGrid.closest('section');
      if (section) section.style.display = 'none';
      if (s.source === 'live' || s.source === 'snapshot') {
        console.warn('[Old Friends] No product carries the Featured toggle in Square, so the homepage grid is hidden. ' +
                     'Fix: Dashboard > Custom attributes > create a Toggle named "Featured", then tick it on the items to show.');
      }
      return;
    }
    featuredGrid.innerHTML = picks.slice(0, 4).map(cardHTML).join('');
    featuredGrid.querySelectorAll('.product-card').forEach(function (c) { c.classList.add('in-view'); });
  }

  C.ready.then(function (s) {
    if (shopGrid) renderShop(s);
    if (featuredGrid) renderFeatured(s);
  });
})();
