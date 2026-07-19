/* ── OLD FRIENDS — SHARED CART DRAWER ──
   Include on any page with: <script src="cart.js"></script>
   Wires up .add-to-bag buttons + the nav basket icon.
   Cart persists across pages via localStorage (falls back to memory). */
(function () {
  var FREE_SHIP = 75;
  var KEY = 'of-cart';
  var memory = [];

  function readCart() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return memory; }
  }
  function writeCart(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); }
    catch (e) { memory = items; }
  }

  /* ── styles ── */
  var css = [
    '.cart-backdrop { position: fixed; inset: 0; background: rgba(106,70,48,0.45); opacity: 0; pointer-events: none; transition: opacity .35s ease; z-index: 9000; }',
    '.cart-backdrop.open { opacity: 1; pointer-events: auto; }',
    '.cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100vw); background: var(--cream); z-index: 9001; display: flex; flex-direction: column; transform: translateX(100%); transition: transform .45s cubic-bezier(.22,1,.36,1); box-shadow: -8px 0 30px rgba(106,70,48,0.2); }',
    '.cart-drawer.open { transform: none; }',
    '.cart-head { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px 18px; }',
    '.cart-head h3 { font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 26px; color: var(--brown); }',
    '.cart-head-count { font-family: "DM Sans", sans-serif; font-style: normal; font-size: 11px; letter-spacing: .15em; color: var(--walnut); margin-left: 8px; vertical-align: 3px; }',
    '.cart-close { background: none; border: none; font-size: 26px; line-height: 1; color: var(--brown); cursor: pointer; padding: 4px 8px; transition: color .3s; }',
    '.cart-close:hover { color: var(--terra); }',
    '.cart-stitch { background-image: url("data:image/svg+xml,%3Csvg width=\'12\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'0\' y1=\'1\' x2=\'6\' y2=\'1\' stroke=\'%236A4630\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E"); background-repeat: repeat-x; height: 2px; opacity: .3; margin: 0 28px; }',
    '.cart-ship { padding: 18px 28px 6px; }',
    '.cart-ship-msg { font-size: 12px; color: var(--walnut); margin-bottom: 10px; letter-spacing: .04em; }',
    '.cart-ship-msg strong { color: var(--brown); font-weight: 500; }',
    '.cart-ship-track { height: 4px; background: var(--linen); overflow: hidden; }',
    '.cart-ship-fill { height: 100%; background: var(--dusty); width: 0; transition: width .5s ease; }',
    '.cart-items { flex: 1; overflow-y: auto; padding: 14px 28px; }',
    '.cart-empty { text-align: center; padding: 60px 20px; color: var(--walnut); }',
    '.cart-empty p { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 20px; margin-bottom: 18px; color: var(--brown); }',
    '.cart-empty a { color: var(--terra); text-decoration: none; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; border-bottom: 2px dashed var(--terra); padding-bottom: 3px; }',
    '.cart-item { display: flex; gap: 14px; align-items: flex-start; padding: 16px 0; border-bottom: 1px dashed var(--stone); }',
    '.cart-item-thumb { width: 64px; height: 64px; flex-shrink: 0; background: var(--linen); display: flex; align-items: center; justify-content: center; font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 9px; color: var(--walnut); opacity: .6; overflow: hidden; }',
    '.cart-item-thumb img { width: 100%; height: 100%; object-fit: cover; }',
    '.cart-item-thumb.has-img { opacity: 1; }',
    '.cart-item-info { flex: 1; }',
    '.cart-item-name { font-family: "Cormorant Garamond", serif; font-size: 17px; font-weight: 500; color: var(--brown); line-height: 1.3; }',
    '.cart-item-price { font-size: 12px; color: var(--walnut); margin-top: 2px; }',
    '.cart-qty { display: inline-flex; align-items: center; gap: 12px; margin-top: 10px; border: 1px solid var(--stone); padding: 3px 10px; }',
    '.cart-qty button { background: none; border: none; color: var(--brown); font-size: 14px; cursor: pointer; padding: 0 4px; line-height: 1; transition: color .3s; }',
    '.cart-qty button:hover { color: var(--terra); }',
    '.cart-qty span { font-size: 12px; color: var(--brown); min-width: 14px; text-align: center; }',
    '.cart-item-remove { background: none; border: none; color: var(--walnut); opacity: .5; font-size: 16px; cursor: pointer; padding: 2px 6px; transition: opacity .3s, color .3s; }',
    '.cart-item-remove:hover { opacity: 1; color: var(--terra); }',
    '.cart-item-line { font-size: 13px; color: var(--brown); font-weight: 400; margin-left: auto; padding-top: 2px; }',
    '.cart-foot { padding: 18px 28px 26px; background: var(--white); }',
    '.cart-subtotal { display: flex; justify-content: space-between; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: var(--brown); margin-bottom: 6px; }',
    '.cart-subtotal-amt { font-weight: 500; }',
    '.cart-note { font-size: 11px; color: var(--walnut); opacity: .7; margin-bottom: 16px; }',
    '.cart-checkout { display: block; width: 100%; padding: 15px; background: var(--brown); color: var(--cream); border: 2px dashed var(--brown); font-family: "DM Sans", sans-serif; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .3s, border-color .3s; }',
    '.cart-checkout:hover { background: var(--terra); border-color: var(--terra); }',
    '.basket-wrap { position: relative; display: inline-flex; }',
    '.cart-badge { position: absolute; top: -7px; right: -9px; background: var(--terra); color: var(--cream); font-size: 9px; font-weight: 500; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 50%; display: none; align-items: center; justify-content: center; pointer-events: none; }',
    '.cart-badge.show { display: inline-flex; }',
    '@media (prefers-reduced-motion: reduce) { .cart-drawer, .cart-backdrop, .cart-ship-fill { transition: none; } }'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── drawer markup ── */
  var backdrop = document.createElement('div');
  backdrop.className = 'cart-backdrop';

  var drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-label', 'Shopping bag');
  drawer.innerHTML =
    '<div class="cart-head">' +
      '<h3>Your Bag<span class="cart-head-count"></span></h3>' +
      '<button class="cart-close" aria-label="Close bag">&times;</button>' +
    '</div>' +
    '<div class="cart-stitch"></div>' +
    '<div class="cart-ship">' +
      '<div class="cart-ship-msg"></div>' +
      '<div class="cart-ship-track"><div class="cart-ship-fill"></div></div>' +
    '</div>' +
    '<div class="cart-items"></div>' +
    '<div class="cart-foot">' +
      '<div class="cart-subtotal"><span>Subtotal</span><span class="cart-subtotal-amt"></span></div>' +
      '<p class="cart-note">Shipping &amp; taxes calculated at checkout.</p>' +
      '<button class="cart-checkout">Checkout</button>' +
    '</div>';

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  var itemsEl = drawer.querySelector('.cart-items');
  var headCount = drawer.querySelector('.cart-head-count');
  var shipMsg = drawer.querySelector('.cart-ship-msg');
  var shipFill = drawer.querySelector('.cart-ship-fill');
  var subtotalAmt = drawer.querySelector('.cart-subtotal-amt');
  var checkoutBtn = drawer.querySelector('.cart-checkout');
  var badge = null;

  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ''); }

  function render() {
    var cart = readCart();
    var count = cart.reduce(function (t, i) { return t + i.qty; }, 0);
    var subtotal = cart.reduce(function (t, i) { return t + i.price * i.qty; }, 0);

    headCount.textContent = count ? '(' + count + ')' : '';
    subtotalAmt.textContent = money(subtotal);

    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('show', count > 0);
    }

    var pct = Math.min(100, (subtotal / FREE_SHIP) * 100);
    shipFill.style.width = pct + '%';
    shipMsg.innerHTML = subtotal >= FREE_SHIP
      ? '<strong>You’ve unlocked free shipping.</strong>'
      : 'You’re <strong>' + money(FREE_SHIP - subtotal) + '</strong> away from free shipping.';

    if (!cart.length) {
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
          '<p>Your bag is empty.</p>' +
          '<a href="shop.html">Shop the Collection</a>' +
        '</div>';
      return;
    }

    itemsEl.innerHTML = cart.map(function (item, idx) {
      var thumb = item.img
        ? '<div class="cart-item-thumb has-img"><img src="' + item.img + '" alt=""></div>'
        : '<div class="cart-item-thumb">photo</div>';
      return '<div class="cart-item" data-idx="' + idx + '">' +
        thumb +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-price">' + money(item.price) + '</div>' +
          '<div class="cart-qty">' +
            '<button data-act="dec" aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button data-act="inc" aria-label="Increase quantity">+</button>' +
          '</div>' +
        '</div>' +
        '<span class="cart-item-line">' + money(item.price * item.qty) + '</span>' +
        '<button class="cart-item-remove" data-act="remove" aria-label="Remove item">&times;</button>' +
      '</div>';
    }).join('');
  }

  /* ── open / close ── */
  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  backdrop.addEventListener('click', closeDrawer);
  drawer.querySelector('.cart-close').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  /* ── item actions (event delegation) ── */
  itemsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var row = btn.closest('.cart-item');
    var idx = parseInt(row.dataset.idx, 10);
    var cart = readCart();
    if (!cart[idx]) return;
    if (btn.dataset.act === 'inc') cart[idx].qty += 1;
    if (btn.dataset.act === 'dec') cart[idx].qty -= 1;
    if (btn.dataset.act === 'remove' || cart[idx].qty < 1) cart.splice(idx, 1);
    writeCart(cart);
    render();
  });

  checkoutBtn.addEventListener('click', function () {
    var old = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Checkout coming soon ✂';
    setTimeout(function () { checkoutBtn.textContent = old; }, 1800);
  });

  /* ── add to bag ── */
  function addItem(name, price, img) {
    var cart = readCart();
    var existing = cart.filter(function (i) { return i.name === name; })[0];
    if (existing) existing.qty += 1;
    else cart.push({ name: name, price: price, qty: 1, img: img || null });
    writeCart(cart);
    render();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-to-bag');
    if (!btn || btn.disabled) return;
    var card = btn.closest('.product-card');
    if (!card) return;
    var name = (card.querySelector('.product-name') || {}).textContent || 'Item';
    /* gift cards need an amount first — hand off to the detail view */
    if (card.hasAttribute('data-gift')) {
      if (window.OFDetail) window.OFDetail.showByName(name.trim());
      return;
    }
    var priceText = (card.querySelector('.product-price') || {}).textContent || '$0';
    var price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    var imgEl = card.querySelector('.product-img');
    addItem(name.trim(), price, imgEl ? imgEl.getAttribute('src') : null);

    var old = btn.textContent;
    btn.textContent = 'Added ✓';
    setTimeout(function () { btn.textContent = old; }, 900);
    openDrawer();
  });

  /* ── basket icon: badge + open ── */
  var basket = document.querySelector('.basket-icon');
  if (basket) {
    var wrap = document.createElement('span');
    wrap.className = 'basket-wrap';
    basket.parentNode.insertBefore(wrap, basket);
    wrap.appendChild(basket);
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    wrap.appendChild(badge);
    wrap.addEventListener('click', function () {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  render();

  /* expose a tiny API so other scripts (e.g. product detail view) can add items */
  window.OFCart = { add: addItem, open: openDrawer, close: closeDrawer };
})();
