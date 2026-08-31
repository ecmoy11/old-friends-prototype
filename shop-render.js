/* ── OLD FRIENDS — LIVE SHOP GRID ──
   Include LAST, after detail.js and search.js.

   Swaps the hardcoded product cards for live ones from /api/products
   (Square catalog + inventory). The markup it emits is deliberately
   identical to the hand-written cards, so filters, sort, search, the
   cart and the detail modal all keep working untouched — cart.js and
   detail.js both delegate off document, so injected cards just work.

   If the API is unreachable the hardcoded cards stay put and the page
   says so rather than pretending. Stale-but-labelled beats empty. */
(function () {
  var grid = document.querySelector('.shop-grid');
  if (!grid) return;

  /* Square category name -> the data-cat the filter buttons use.
     Anything unmapped falls through as its own lowercased name, so a
     new Square category shows up rather than vanishing. */
  var CAT_ALIASES = {
    'bags': 'bags', 'tote bags': 'bags', 'market bags': 'bags',
    'scrunchies': 'scrunchies', 'hair': 'scrunchies',
    'clothing': 'clothing', 'apparel': 'clothing',
    'gift cards': 'gift', 'gifts': 'gift'
  };

  function catOf(p) {
    var raw = (p.category || '').trim().toLowerCase();
    return CAT_ALIASES[raw] || raw || 'bags';
  }

  function money(cents) {
    if (cents == null) return '';
    return '$' + (cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function priceHTML(p) {
    var now = p.priceFromCents;
    /* compare_at is only present if Square carries an original price for
       a sale item. Until that decision is made this is simply absent and
       the card renders one plain price. */
    var was = p.compareAtCents;
    if (was != null && now != null && was > now) {
      return '<span class="price-was">' + money(was) + '</span>' +
             '<span class="price-now">' + money(now) + '</span>';
    }
    return (p.multiVariant ? 'From ' : '') + money(now);
  }

  function cardHTML(p) {
    var imgs = p.images.length ? p.images : [''];
    var sold = p.soldOut;
    var untracked = p.variations.length > 0 && p.variations.every(function (v) { return !v.tracked; });
    var buyable = !sold && !untracked;

    var tag = '';
    if (sold) tag = '<div class="product-tag product-tag--sold">Sold</div>';
    else if (untracked) tag = '<div class="product-tag product-tag--sold">Unavailable</div>';
    else if (p.compareAtCents) tag = '<div class="product-tag product-tag--sale">On Sale</div>';

    var hover = imgs.length > 1
      ? '<img class="product-img product-img-hover" src="' + esc(imgs[1]) + '" alt="" loading="lazy">'
      : '';

    var btn = buyable
      ? '<button class="add-to-bag">Add to Bag</button>'
      : '<button class="add-to-bag" disabled>' + (sold ? 'Sold Out' : 'Unavailable') + '</button>';

    return '' +
      '<div class="product-card" data-cat="' + esc(catOf(p)) + '"' +
        (p.compareAtCents ? ' data-sale' : '') + '>' +
        '<div class="product-img-wrap">' +
          '<img class="product-img" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          hover + tag + btn +
        '</div>' +
        '<div class="product-name">' + esc(p.name) + '</div>' +
        '<div class="product-price">' + priceHTML(p) + '</div>' +
      '</div>';
  }

  /* Feed the detail modal and the search index. detail.js assigns
     window.OFProducts = PRODUCTS by reference, so writing here writes
     into the same object show() reads from. Lauren's descriptions come
     across verbatim; nothing is invented to fill a blank field. */
  function mergeCopy(products) {
    var map = window.OFProducts;
    if (!map) return;
    products.forEach(function (p) {
      var existing = map[p.name] || {};
      map[p.name] = {
        story: p.description || existing.story || '',
        materials: existing.materials || '',
        dimensions: existing.dimensions || '',
        care: existing.care || '',
        note: existing.note || '',
        images: p.images.slice()
      };
    });
  }

  function notice(text) {
    var el = document.createElement('p');
    el.className = 'shop-api-notice';
    el.style.cssText =
      'font-family:"Cormorant Garamond",serif;font-style:italic;font-size:15px;' +
      'color:var(--walnut);text-align:center;margin:0 0 22px;';
    el.textContent = text;
    grid.parentNode.insertBefore(el, grid);
  }

  fetch('/api/products', { headers: { 'Accept': 'application/json' } })
    .then(function (r) {
      /* 404 means there is no API here at all — we're on plain static
         hosting (GitHub Pages, or a file:// preview). That's expected,
         not a fault: keep the built-in cards, stay quiet, leave the
         buttons alone. Only a real failure gets the warning. */
      if (r.status === 404) { var e = new Error('no-api'); e.noApi = true; throw e; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var products = (data && data.products) || [];
      if (!products.length) throw new Error('empty catalog');

      /* The gift card is not a normal catalog item — it needs Square's
         Gift Cards API and its own delivery. Keep the hand-built card. */
      var giftCard = grid.querySelector('.product-card[data-gift]');

      grid.innerHTML = products.map(cardHTML).join('');
      if (giftCard) grid.appendChild(giftCard);

      mergeCopy(products);
      if (window.initShopGrid) window.initShopGrid();

      var untracked = products.filter(function (p) {
        return p.variations.length && p.variations.every(function (v) { return !v.tracked; });
      });
      if (untracked.length) {
        console.warn(
          '[Old Friends] Stock tracking is OFF in Square for: ' +
          untracked.map(function (p) { return p.name; }).join(', ') +
          '. These show as Unavailable. Fix: Items & services > Items > the item > Inventory > Track stock.'
        );
      }
    })
    .catch(function (err) {
      if (err && err.noApi) {
        console.info('[Old Friends] No /api/products on this host — showing the built-in catalog. ' +
                     'Run `npx wrangler pages dev .` or deploy to Cloudflare for live Square data.');
        return;
      }
      console.error('[Old Friends] /api/products failed:', err);
      notice('We’re having trouble reaching our inventory just now — prices and availability below may be out of date.');
      grid.querySelectorAll('.add-to-bag').forEach(function (b) {
        b.disabled = true;
        b.textContent = 'Unavailable';
      });
    });
})();
