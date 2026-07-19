/* ── OLD FRIENDS — SEARCH OVERLAY ──
   Include AFTER detail.js: <script src="search.js"></script>
   Wires the nav search icon to a live product search.
   Picking a result opens the product detail — on the shop page
   directly, from any other page via shop.html?open=<name>. */
(function () {
  var searchIcon = document.querySelector('.search-icon');
  if (!searchIcon) return;

  var css = [
    '.srch-backdrop { position: fixed; inset: 0; background: rgba(106,70,48,0.45); opacity: 0; pointer-events: none; transition: opacity .35s ease; z-index: 9600; }',
    '.srch-backdrop.open { opacity: 1; pointer-events: auto; }',
    '.srch-panel { position: fixed; top: 0; left: 0; right: 0; background: var(--cream); z-index: 9601; padding: 46px min(8vw, 80px) 40px; transform: translateY(-100%); transition: transform .45s cubic-bezier(.22,1,.36,1); box-shadow: 0 8px 30px rgba(106,70,48,0.2); }',
    '.srch-panel.open { transform: none; }',
    '.srch-close { position: absolute; top: 16px; right: 20px; background: none; border: none; font-size: 26px; line-height: 1; color: var(--brown); cursor: pointer; padding: 4px 8px; transition: color .3s; }',
    '.srch-close:hover { color: var(--terra); }',
    '.srch-label { font-family: "DM Sans", sans-serif; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: var(--terra); font-weight: 500; margin-bottom: 10px; }',
    '.srch-input { width: 100%; background: none; border: none; border-bottom: 2px dashed var(--stone); padding: 8px 2px 14px; font-family: "Cormorant Garamond", serif; font-style: italic; font-size: clamp(24px, 4vw, 36px); color: var(--brown); outline: none; }',
    '.srch-input::placeholder { color: var(--stone); }',
    '.srch-input:focus { border-color: var(--terra); }',
    '.srch-results { margin-top: 22px; max-height: 40vh; overflow-y: auto; }',
    '.srch-hit { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; width: 100%; text-align: left; background: none; border: none; border-bottom: 1px dashed var(--stone); padding: 13px 2px; cursor: pointer; transition: padding-left .25s ease; }',
    '.srch-hit:hover { padding-left: 8px; }',
    '.srch-hit-name { font-family: "Cormorant Garamond", serif; font-size: 19px; font-weight: 500; color: var(--brown); }',
    '.srch-hit:hover .srch-hit-name { color: var(--terra); }',
    '.srch-hit-go { font-family: "DM Sans", sans-serif; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--walnut); white-space: nowrap; }',
    '.srch-none { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 17px; color: var(--walnut); padding: 16px 2px; }',
    '@media (prefers-reduced-motion: reduce) { .srch-panel, .srch-backdrop { transition: none; } }'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var backdrop = document.createElement('div');
  backdrop.className = 'srch-backdrop';
  var panel = document.createElement('div');
  panel.className = 'srch-panel';
  panel.setAttribute('role', 'search');
  panel.innerHTML =
    '<button class="srch-close" aria-label="Close search">&times;</button>' +
    '<div class="srch-label">Search the shop</div>' +
    '<input class="srch-input" type="text" placeholder="quilt, tote, linen..." aria-label="Search products">' +
    '<div class="srch-results"></div>';
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  var input = panel.querySelector('.srch-input');
  var results = panel.querySelector('.srch-results');

  /* searchable index from the shared product copy in detail.js */
  function buildIndex() {
    var products = window.OFProducts || {};
    return Object.keys(products).map(function (name) {
      var p = products[name];
      return {
        name: name,
        hay: (name + ' ' + (p.story || '') + ' ' + (p.materials || '') + ' ' + (p.note || '')).toLowerCase()
      };
    });
  }
  var index = null;

  function openSearch() {
    if (!index) index = buildIndex();
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 80);
  }
  function closeSearch() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    input.value = '';
    results.innerHTML = '';
  }

  function goTo(name) {
    closeSearch();
    if (window.OFDetail && window.OFDetail.showByName(name)) return;
    location.href = 'shop.html?open=' + encodeURIComponent(name);
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    var hits = index.filter(function (item) { return item.hay.indexOf(q) !== -1; }).slice(0, 8);
    results.innerHTML = hits.length
      ? hits.map(function (h) {
          return '<button class="srch-hit" data-name="' + h.name.replace(/"/g, '&quot;') + '">' +
            '<span class="srch-hit-name">' + h.name + '</span>' +
            '<span class="srch-hit-go">View piece &rarr;</span>' +
          '</button>';
        }).join('')
      : '<div class="srch-none">Nothing found for &ldquo;' + q + '&rdquo; &mdash; try &ldquo;quilt&rdquo;, &ldquo;tote&rdquo;, or &ldquo;linen&rdquo;.</div>';
  }

  searchIcon.addEventListener('click', openSearch);
  backdrop.addEventListener('click', closeSearch);
  panel.querySelector('.srch-close').addEventListener('click', closeSearch);
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var first = results.querySelector('.srch-hit');
      if (first) goTo(first.dataset.name);
    }
  });
  results.addEventListener('click', function (e) {
    var hit = e.target.closest('.srch-hit');
    if (hit) goTo(hit.dataset.name);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeSearch();
  });
})();
