/* ── OLD FRIENDS — SHARED MOBILE NAV ──
   Include on every page: <script src="nav.js"></script>
   On screens ≤ 800px the text links collapse into a hamburger menu;
   the search + basket icons stay visible in the bar. */
(function () {
  var LINKS = [
    { label: 'Shop', href: 'shop.html' },
    { label: 'Commission', href: 'commission.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Wholesale', href: 'wholesale.html' }
  ];

  var navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  var css = [
    '.nav-burger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }',
    '.nav-burger svg { width: 24px; height: 24px; stroke: var(--brown); stroke-width: 2; stroke-linecap: round; fill: none; display: block; transition: stroke .3s; }',
    '.nav-burger:hover svg { stroke: var(--terra); }',
    '@media (max-width: 1024px) {',
    '  .nav-right { gap: 20px; }',
    '  .nav-right > a { display: none; }',
    '  .nav-burger { display: inline-flex; }',
    '}',
    '.mnav-backdrop { position: fixed; inset: 0; background: rgba(62,42,26,0.45); opacity: 0; pointer-events: none; transition: opacity .35s ease; z-index: 9400; }',
    '.mnav-backdrop.open { opacity: 1; pointer-events: auto; }',
    '.mnav { position: fixed; top: 0; right: 0; bottom: 0; width: min(320px, 85vw); background: var(--cream); z-index: 9401; padding: 76px 36px 36px; transform: translateX(100%); transition: transform .45s cubic-bezier(.22,1,.36,1); box-shadow: -8px 0 30px rgba(62,42,26,0.2); display: flex; flex-direction: column; }',
    '.mnav.open { transform: none; }',
    '.mnav-close { position: absolute; top: 16px; right: 18px; background: none; border: none; font-size: 26px; line-height: 1; color: var(--brown); cursor: pointer; padding: 4px 8px; transition: color .3s; }',
    '.mnav-close:hover { color: var(--terra); }',
    '.mnav a { font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 28px; color: var(--brown); text-decoration: none; padding: 14px 0; border-bottom: 1px dashed var(--stone); transition: color .3s, padding-left .3s; }',
    '.mnav a:hover { color: var(--terra); padding-left: 6px; }',
    '.mnav a.active { color: var(--terra); }',
    '.mnav-foot { margin-top: auto; font-family: "DM Sans", sans-serif; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--walnut); opacity: .6; }',
    '@media (prefers-reduced-motion: reduce) { .mnav, .mnav-backdrop { transition: none; } }'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* burger button — sits after the basket icon */
  var burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Open menu');
  burger.innerHTML = '<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke-dasharray="4 3"/><line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="4 3"/><line x1="3" y1="18" x2="21" y2="18" stroke-dasharray="4 3"/></svg>';
  navRight.appendChild(burger);

  /* menu panel */
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var backdrop = document.createElement('div');
  backdrop.className = 'mnav-backdrop';
  var menu = document.createElement('div');
  menu.className = 'mnav';
  menu.setAttribute('aria-label', 'Menu');
  menu.innerHTML =
    '<button class="mnav-close" aria-label="Close menu">&times;</button>' +
    LINKS.map(function (l) {
      var active = page === l.href.toLowerCase() ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + active + '>' + l.label + '</a>';
    }).join('') +
    '<div class="mnav-foot">Old Friends &middot; Chattanooga, TN</div>';
  document.body.appendChild(backdrop);
  document.body.appendChild(menu);

  function openMenu() {
    menu.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', openMenu);
  backdrop.addEventListener('click', closeMenu);
  menu.querySelector('.mnav-close').addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
})();
