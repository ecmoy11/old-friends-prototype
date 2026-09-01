/* ── OLD FRIENDS — PRODUCT DETAIL OVERLAY ──
   Include AFTER cart.js: <script src="detail.js"></script>
   Clicking any .product-card (outside its Add to Bag button) opens a
   detail view. ALL PRODUCT COPY LIVES IN THE MAP BELOW — edit freely.
   Fields: story, materials, dimensions, care, note, images[] */
(function () {

  /* ═══════════ EDIT PRODUCT INFO HERE ═══════════ */
  /* ── OFFLINE CACHE ONLY — NOT A SOURCE OF TRUTH ──
     Square is authoritative for every word a shopper reads. This map is a
     mirror of Lauren's own Square descriptions, kept so the static
     GitHub Pages preview is not blank; the moment /api/products answers,
     everything here is replaced (see mergeCopy in shop-render.js).

     RULES, because this has gone wrong before:
       - Verbatim from Square or absent. Never paraphrased, never written
         to fill a gap, never "improved".
       - No materials / dimensions / care / notes. Those are Square custom
         attributes now and render from the API only. If Lauren has not
         filled one in, the row simply does not appear.
       - A blank field is the correct output for a blank field. */
  var PRODUCTS = {
    'Whimsy Quilt Tote Bag': {
      story: 'Sustainably made from a vintage quilt, this tote gives new life to beautiful details of butterflies and florals. With a magnetic clasp and front pocket for easy storage, it\u2019s the perfect mix of form and function.',
      images: ['images/whimsy-quilt-tote.jpg', 'images/whimsy-quilt-tote-2.jpg']
    },
    'Coffee Bean Tote Bag': {
      story: 'Crafted from repurposed coffee bean bags, this tote blends sustainability with style. Fully lined for durability, it features a magnetic clasp for easy closure and a handy front pocket for quick grabs. A perfect everyday bag with a story worth carrying.',
      images: ['images/coffee-bean-tote.jpg']
    },
    'Chocolate Covered Starberry Quilted Tote': {
      story: '**Imperfection on the front top left of the body of the tote, where the strap meets the bag (shown in third photo)**',
      images: ['images/starberry-tote.jpg', 'images/starberry-tote-2.jpg', 'images/starberry-tote-3.jpg', 'images/starberry-tote-4.jpg']
    },
    'Large Origami Tote Bag': {
      images: ['images/origami-tote.jpg', 'images/origami-tote-2.jpg']
    },
    'Green Gingham Market Bag with Pouch': {
      images: ['images/gingham-market-bag.jpg', 'images/gingham-market-bag-2.jpg', 'images/gingham-market-bag-3.jpg']
    },
    'Upcycled Lace Tablecloth Market Bags': {
      story: 'This handmade lace market bag is inspired by the feelings of a sunny day at the farmers market picking up fresh fruit or a reading day on the beach when you have nothing else to do but romanticize your days. Made with vintage lace linens these bags vary in color and design making for a unique one-of-a-kind piece that will be treasured for years to come!**Due to the nature of vintage linens each bag will vary in texture, design, and in color.**',
      images: ['images/lace-market-bag.jpg', 'images/lace-market-bag-2.jpg']
    },
    'Handmade Scrunchies': {
      story: 'Handmade from a mix of old and new fabrics, this oversized lace scrunchie brings a timeless cottagecore touch to your winter wardrobe. Designed to add texture and charm to cozy layers, it\u2019s the perfect accessory to elevate your everyday messy bun or low pony when the jackets start piling on. We like to plop this over an already secured bun to add some whimsy to our outfit!',
      images: ['images/scrunchies.jpg', 'images/scrunchies-2.jpg', 'images/scrunchies-3.jpg',
               'images/scrunchies-4.jpg', 'images/scrunchies-5.jpg', 'images/scrunchies-6.jpg',
               'images/scrunchies-7.jpg', 'images/scrunchies-8.jpg', 'images/scrunchies-9.jpg']
    },
    'Digital Gift Card': {
      story: 'For when you know they\u2019d love something handmade, but the choosing should be theirs. Pick an amount, write a little note, and we\u2019ll email it to them \u2014 no shipping, no packaging, no waiting.'
    }
  };

  var css = [
    '.pd-backdrop { position: fixed; inset: 0; background: rgba(106,70,48,0.5); opacity: 0; pointer-events: none; transition: opacity .35s ease; z-index: 8000; }',
    '.pd-backdrop.open { opacity: 1; pointer-events: auto; }',
    '.pd-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, 48%); width: min(920px, calc(100vw - 32px)); max-height: min(640px, calc(100vh - 48px)); background: var(--cream); z-index: 8001; display: none; grid-template-columns: 1fr 1fr; opacity: 0; transition: opacity .4s ease, transform .45s cubic-bezier(.22,1,.36,1); box-shadow: 0 20px 60px rgba(106,70,48,0.35); overflow: hidden; }',
    '.pd-modal.open { display: grid; opacity: 1; transform: translate(-50%, -50%); }',
    '.pd-close { position: absolute; top: 12px; right: 14px; z-index: 2; background: var(--cream); border: none; font-size: 24px; line-height: 1; color: var(--brown); cursor: pointer; padding: 6px 10px; transition: color .3s; }',
    '.pd-close:hover { color: var(--terra); }',
    /* min-width:0 is load-bearing: without it the thumb strip's min-content
       width forces this grid column wider than its 1fr share and squeezes
       the copy column. With it, the strip scrolls instead. */
    '.pd-gallery { background: var(--linen); display: flex; flex-direction: column; min-height: 0; min-width: 0; }',
    '.pd-main { flex: 1; min-height: 0; position: relative; display: flex; align-items: center; justify-content: center; font-family: "Cormorant Garamond", serif; font-style: italic; color: var(--walnut); opacity: 1; }',
    '.pd-main .pd-ph { opacity: .4; font-size: 15px; }',
    '.pd-main img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; will-change: transform; }',
    '.pd-main { overflow: hidden; }',
    '.pd-main.has-img { cursor: zoom-in; }',
    '.pd-main.zoomed { cursor: zoom-out; }',
    '.pd-main.zoomed img { transform: scale(2.4); }',
    /* Gallery arrows. z-index 2 puts them over the zoom hint (1) and the
       image; they must stop propagation or the click also toggles zoom. */
    '.pd-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 38px; height: 52px; display: none; align-items: center; justify-content: center; border: none; cursor: pointer; background: rgba(246,237,216,0.82); color: var(--brown); font-size: 20px; line-height: 1; padding: 0; transition: background .25s, opacity .25s; opacity: 0; }',
    '.pd-main.has-multi .pd-nav { display: flex; }',
    '.pd-gallery:hover .pd-nav, .pd-nav:focus-visible { opacity: 1; }',
    '.pd-nav:hover { background: var(--cream); }',
    '.pd-nav--prev { left: 0; }',
    '.pd-nav--next { right: 0; }',
    /* While zoomed the arrows would fight the pan, so hide them. */
    '.pd-main.zoomed .pd-nav { display: none; }',
    /* Touch has no hover — keep them visible there. */
    '@media (hover: none) { .pd-nav { opacity: 1; } }',
    '.pd-zoom-hint { position: absolute; bottom: 10px; right: 10px; z-index: 1; background: rgba(106,70,48,0.75); color: var(--cream-text); font-family: "DM Sans", sans-serif; font-size: 9px; letter-spacing: .15em; text-transform: uppercase; padding: 5px 10px; pointer-events: none; opacity: .85; }',
    '.pd-main.zoomed .pd-zoom-hint { display: none; }',
    /* Products can carry up to 9 shots (scrunchie colourways), which is wider
       than the gallery column — scroll the strip rather than squashing the
       thumbs, and keep them from shrinking out of square. */
    '.pd-thumbs { display: flex; gap: 6px; padding: 10px; background: var(--linen); overflow-x: auto; scrollbar-width: thin; }',
    '.pd-thumbs button { width: 56px; height: 56px; flex: 0 0 56px; padding: 0; border: 2px solid transparent; cursor: pointer; background: var(--stone); overflow: hidden; }',
    '.pd-thumbs button.active { border-color: var(--terra); }',
    '.pd-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }',
    '.pd-info { padding: 40px 36px 32px; overflow-y: auto; }',
    '.pd-tag { display: inline-block; background: var(--terra); color: var(--cream-text); font-size: 9px; letter-spacing: .15em; text-transform: uppercase; padding: 4px 10px; margin-bottom: 14px; }',
    '.pd-name { font-family: "Cormorant Garamond", serif; font-size: 30px; font-weight: 500; font-style: italic; color: var(--brown); line-height: 1.15; margin-bottom: 6px; }',
    '.pd-price { font-size: 15px; color: var(--walnut); margin-bottom: 18px; }',
    '.pd-story { font-size: 14px; line-height: 1.75; color: var(--walnut); margin-bottom: 22px; }',
    '.pd-dl { margin-bottom: 22px; }',
    '.pd-dl h4 { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: var(--terra); font-weight: 500; margin-bottom: 10px; }',
    '.pd-row { display: flex; gap: 12px; font-size: 13px; padding: 7px 0; border-bottom: 1px dashed var(--stone); }',
    '.pd-row dt { width: 92px; flex-shrink: 0; color: var(--brown); font-weight: 400; }',
    '.pd-row dd { color: var(--walnut); }',
    '.pd-note { font-size: 12.5px; font-style: italic; font-family: "Cormorant Garamond", serif; font-size: 15px; color: var(--brown); margin-bottom: 24px; padding-left: 12px; border-left: 2px solid var(--terra); }',
    '.pd-add { display: block; width: 100%; padding: 15px; background: var(--terra); color: var(--cream-text); border: 2px dashed var(--terra); font-family: "DM Sans", sans-serif; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .3s, border-color .3s; }',
    '.pd-add:hover { background: #7A0F26; border-color: #7A0F26; }',
    '.pd-add[disabled] { background: var(--walnut); border-color: var(--walnut); opacity: .55; cursor: default; }',
    /* ── gift card mode ── */
    '.pd-main img.pd-env { inset: auto; left: 50%; top: 47%; width: 74%; height: auto; border-radius: 8px; transform: translate(-50%, -50%); box-shadow: 0 16px 36px rgba(106,70,48,0.4); }',
    '.pd-gift { display: none; margin-bottom: 22px; }',
    '.pd-modal.pd-is-gift .pd-gift { display: block; }',
    '.pd-modal.pd-is-gift .pd-dl { display: none; }',
    '.pd-gift h4 { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: var(--terra); font-weight: 500; margin-bottom: 10px; }',
    '.pd-amounts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }',
    '.pd-amt { background: none; border: 1px dashed var(--stone); color: var(--brown); font-family: "DM Sans", sans-serif; font-size: 12px; letter-spacing: .06em; padding: 9px 15px; cursor: pointer; transition: border-color .25s, color .25s, background .25s; }',
    '.pd-amt:hover { border-color: var(--terra); color: var(--terra); }',
    '.pd-amt.active { border: 1px solid var(--terra); color: var(--terra); background: rgba(158,20,49,0.06); }',
    '.pd-amt-custom { width: 86px; background: none; border: 1px dashed var(--stone); color: var(--brown); font-family: "DM Sans", sans-serif; font-size: 12px; padding: 9px 10px; outline: none; transition: border-color .25s; }',
    '.pd-amt-custom:focus, .pd-amt-custom.active { border-color: var(--terra); }',
    '.pd-amt-custom::placeholder { color: var(--walnut); opacity: .55; }',
    '.pd-gift-field { margin-bottom: 12px; }',
    '.pd-gift-field label { display: block; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--walnut); font-weight: 500; margin-bottom: 5px; }',
    '.pd-gift-field input, .pd-gift-field textarea { width: 100%; background: var(--white); border: 1px dashed var(--stone); padding: 10px 12px; font-family: "DM Sans", sans-serif; font-size: 13px; color: var(--brown); outline: none; transition: border-color .25s; box-sizing: border-box; }',
    '.pd-gift-field textarea { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 16px; min-height: 64px; resize: vertical; }',
    '.pd-gift-field input:focus, .pd-gift-field textarea:focus { border-color: var(--terra); }',
    '.pd-gift-field input.pd-invalid { border-color: var(--terra); border-style: solid; background: rgba(158,20,49,0.05); }',
    '.pd-gift-hint { font-size: 11px; color: var(--walnut); opacity: .75; margin-top: 2px; }',
    '.pd-toast { position: fixed; bottom: 26px; left: 50%; transform: translate(-50%, 10px); background: var(--brown); color: var(--cream-text); font-family: "DM Sans", sans-serif; font-size: 12px; letter-spacing: .08em; padding: 13px 22px; z-index: 9700; opacity: 0; transition: opacity .35s ease, transform .35s ease; box-shadow: 0 10px 30px rgba(106,70,48,0.35); pointer-events: none; max-width: calc(100vw - 48px); text-align: center; }',
    '.pd-toast.show { opacity: 1; transform: translate(-50%, 0); }',
    '@media (max-width: 760px) { .pd-modal { grid-template-columns: 1fr; max-height: calc(100vh - 24px); overflow-y: auto; } .pd-gallery { min-height: 300px; max-height: 42vh; } .pd-info { padding: 28px 24px 24px; } }',
    '@media (prefers-reduced-motion: reduce) { .pd-modal, .pd-backdrop, .pd-main img { transition: none; } }'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var backdrop = document.createElement('div');
  backdrop.className = 'pd-backdrop';
  var modal = document.createElement('div');
  modal.className = 'pd-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Product details');
  modal.innerHTML =
    '<button class="pd-close" aria-label="Close">&times;</button>' +
    '<div class="pd-gallery">' +
      '<div class="pd-main"></div>' +
      '<div class="pd-thumbs"></div>' +
    '</div>' +
    '<div class="pd-info">' +
      '<span class="pd-tag"></span>' +
      '<h2 class="pd-name"></h2>' +
      '<div class="pd-price"></div>' +
      '<p class="pd-story"></p>' +
      /* Rows are built at render time from whatever Square returns, so a new
         custom attribute in her Dashboard appears here with no code change. */
      '<div class="pd-dl"><h4>The Details</h4><div class="pd-rows"></div></div>' +
      '<div class="pd-gift">' +
        '<h4>Choose an Amount</h4>' +
        '<div class="pd-amounts">' +
          '<button class="pd-amt" data-amt="25">$25</button>' +
          '<button class="pd-amt" data-amt="50">$50</button>' +
          '<button class="pd-amt" data-amt="75">$75</button>' +
          '<button class="pd-amt" data-amt="100">$100</button>' +
          '<input class="pd-amt-custom" type="number" min="5" max="500" placeholder="Custom" aria-label="Custom amount">' +
        '</div>' +
        '<div class="pd-gift-field"><label for="pd-gift-email">To — Their Email</label>' +
          '<input id="pd-gift-email" class="pd-gift-email" type="email" placeholder="friend@example.com"></div>' +
        '<div class="pd-gift-field"><label for="pd-gift-from">From</label>' +
          '<input id="pd-gift-from" class="pd-gift-from" type="text" placeholder="Your name"></div>' +
        '<div class="pd-gift-field"><label for="pd-gift-note">A Little Note</label>' +
          '<textarea id="pd-gift-note" class="pd-gift-note" placeholder="Happy birthday, old friend…"></textarea></div>' +
        '<p class="pd-gift-hint">Emailed within the hour. Never expires.</p>' +
      '</div>' +
      '<p class="pd-note"></p>' +
      '<button class="pd-add">Add to Bag</button>' +
    '</div>';
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  var els = {
    main: modal.querySelector('.pd-main'),
    thumbs: modal.querySelector('.pd-thumbs'),
    tag: modal.querySelector('.pd-tag'),
    name: modal.querySelector('.pd-name'),
    price: modal.querySelector('.pd-price'),
    story: modal.querySelector('.pd-story'),
    dl: modal.querySelector('.pd-dl'),
    rows: modal.querySelector('.pd-rows'),
    note: modal.querySelector('.pd-note'),
    add: modal.querySelector('.pd-add'),
    giftAmts: modal.querySelectorAll('.pd-amt'),
    giftCustom: modal.querySelector('.pd-amt-custom'),
    giftEmail: modal.querySelector('.pd-gift-email'),
    giftFrom: modal.querySelector('.pd-gift-from'),
    giftNote: modal.querySelector('.pd-gift-note')
  };
  var current = null;
  var giftAmount = 0;

  /* ── gift card helpers ── */
  var GIFT_IMG = 'floral.jpg';

  function updateGiftUI() {
    els.price.textContent = giftAmount ? '$' + giftAmount : 'From $25';
    els.add.disabled = !giftAmount;
    els.add.textContent = giftAmount ? 'Add to Bag — $' + giftAmount : 'Choose an Amount';
  }
  function resetGiftForm() {
    giftAmount = 0;
    els.giftAmts.forEach(function (b) { b.classList.remove('active'); });
    els.giftCustom.value = '';
    els.giftCustom.classList.remove('active');
    els.giftEmail.value = '';
    els.giftEmail.classList.remove('pd-invalid');
    els.giftFrom.value = '';
    els.giftNote.value = '';
    updateGiftUI();
  }
  els.giftAmts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      els.giftAmts.forEach(function (b) { b.classList.remove('active'); });
      els.giftCustom.classList.remove('active');
      els.giftCustom.value = '';
      btn.classList.add('active');
      giftAmount = parseInt(btn.dataset.amt, 10);
      updateGiftUI();
    });
  });
  els.giftCustom.addEventListener('input', function () {
    els.giftAmts.forEach(function (b) { b.classList.remove('active'); });
    var v = Math.round(parseFloat(els.giftCustom.value));
    giftAmount = (v >= 5 && v <= 500) ? v : 0;
    els.giftCustom.classList.toggle('active', !!giftAmount);
    updateGiftUI();
  });

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'pd-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 400);
    }, 3200);
  }

  function openModal() {
    modal.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
    els.main.classList.remove('zoomed');
    document.body.style.overflow = '';
  }
  backdrop.addEventListener('click', closeModal);
  modal.querySelector('.pd-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    /* Don't hijack arrows while someone is typing in the gift-card form. */
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  /* The gallery the modal is currently showing, and where we are in it.
     step() and the arrow keys both work off this, so thumbs, arrows and
     the keyboard can never disagree about which photo is showing. */
  var gallery = [];
  var galleryIndex = 0;

  function setMainImage(src) {
    els.main.classList.remove('zoomed');
    els.main.classList.toggle('has-img', !!src);
    var idx = gallery.indexOf(src);
    if (idx > -1) galleryIndex = idx;
    var multi = gallery.length > 1;
    els.main.innerHTML = (src
      ? '<img src="' + src + '" alt=""><span class="pd-zoom-hint">Click to zoom</span>'
      : '<span class="pd-ph">product photography coming soon</span>')
      + '<button class="pd-nav pd-nav--prev" type="button" aria-label="Previous photo">&#8249;</button>'
      + '<button class="pd-nav pd-nav--next" type="button" aria-label="Next photo">&#8250;</button>';
    els.main.classList.toggle('has-multi', multi);
    els.thumbs.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.src === src);
    });
    var active = els.thumbs.querySelector('button.active');
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  /* Wraps at both ends so the arrows never dead-end. */
  function step(delta) {
    if (gallery.length < 2) return;
    galleryIndex = (galleryIndex + delta + gallery.length) % gallery.length;
    setMainImage(gallery[galleryIndex]);
  }

  /* ── zoom: click to magnify at that spot, move to pan, click to zoom out ── */
  function zoomOrigin(clientX, clientY) {
    var img = els.main.querySelector('img');
    if (!img) return;
    var r = els.main.getBoundingClientRect();
    var x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    var y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    img.style.transformOrigin = x + '% ' + y + '%';
  }
  els.main.addEventListener('click', function (e) {
    /* An arrow click is navigation, not a zoom toggle. Check first. */
    var nav = e.target.closest('.pd-nav');
    if (nav) {
      e.stopPropagation();
      step(nav.classList.contains('pd-nav--next') ? 1 : -1);
      return;
    }
    if (modal.classList.contains('pd-is-gift')) return;
    if (!els.main.querySelector('img')) return;
    zoomOrigin(e.clientX, e.clientY);
    els.main.classList.toggle('zoomed');
  });
  els.main.addEventListener('mousemove', function (e) {
    if (els.main.classList.contains('zoomed')) zoomOrigin(e.clientX, e.clientY);
  });
  els.main.addEventListener('touchmove', function (e) {
    if (els.main.classList.contains('zoomed')) {
      e.preventDefault();
      zoomOrigin(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  function show(card) {
    var name = (card.querySelector('.product-name') || {}).textContent || '';
    name = name.trim();
    var priceBlock = card.querySelector('.product-price');
    var priceHTML = priceBlock ? priceBlock.innerHTML.trim() : '';
    var priceEl = card.querySelector('.price-now') || priceBlock;
    var priceText = ((priceEl || {}).textContent || '').trim();
    var tagText = ((card.querySelector('.product-tag') || {}).textContent || '').trim();
    var sold = /sold/i.test(tagText);
    var isGift = card.hasAttribute('data-gift');
    var info = PRODUCTS[name] || {};
    modal.classList.toggle('pd-is-gift', isGift);

    els.name.textContent = name;
    els.tag.textContent = tagText;
    els.tag.style.display = tagText ? 'inline-block' : 'none';
    /* No story, no paragraph. The old placeholder promised something about
       Lauren's process that nobody had actually committed to. */
    els.story.textContent = info.story || '';
    els.story.style.display = info.story ? '' : 'none';
    /* Details come from Square custom attributes and nowhere else. No
       row for a field Lauren has not filled in, and no default text — an
       empty details block hides itself rather than printing dashes. */
    var rows = info.details || [];
    els.rows.innerHTML = rows.map(function (r) {
      return '<div class="pd-row"><dt></dt><dd></dd></div>';
    }).join('');
    els.rows.querySelectorAll('.pd-row').forEach(function (el, i) {
      el.querySelector('dt').textContent = rows[i].name;
      el.querySelector('dd').textContent = rows[i].value;
    });
    els.dl.style.display = rows.length ? '' : 'none';

    /* The ✂ line is Lauren's note if she wrote one, and otherwise nothing.
       It used to fall back to a hardcoded house line, which put words in
       her mouth on every product that had no note. */
    els.note.textContent = info.note ? '✂ ' + info.note : '';
    els.note.style.display = info.note ? '' : 'none';

    if (isGift) {
      current = { name: name, price: 0, img: GIFT_IMG, sold: false, gift: true };
      els.main.classList.remove('has-img', 'zoomed');
      els.main.innerHTML =
        '<img src="' + GIFT_IMG + '" alt="">' +
        '<img class="pd-env" src="envolope.png" alt="">';
      els.thumbs.innerHTML = '';
      els.thumbs.style.display = 'none';
      gallery = [];
      galleryIndex = 0;
      resetGiftForm();
      openModal();
      return;
    }

    /* Gallery = the card's own images first (so the thumb you clicked leads),
       then any extra shots from the map. Deduped, order preserved. Cards carry
       at most two images; detail shots (interior, flaws, labels) live in the
       map and only surface here. */
    var images = [];
    card.querySelectorAll('.product-img-wrap img').forEach(function (im) {
      var src = im.getAttribute('src');
      if (src && images.indexOf(src) === -1) images.push(src);
    });
    if (info.images) info.images.forEach(function (src) {
      if (src && images.indexOf(src) === -1) images.push(src);
    });

    current = { name: name, price: parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0, img: images[0] || null, sold: sold };

    /* keep the struck-through original visible in the detail view */
    els.price.innerHTML = priceHTML;

    els.thumbs.innerHTML = images.length > 1
      ? images.map(function (src) {
          return '<button data-src="' + src + '"><img src="' + src + '" alt=""></button>';
        }).join('')
      : '';
    els.thumbs.style.display = images.length > 1 ? 'flex' : 'none';
    gallery = images.slice();
    galleryIndex = 0;
    setMainImage(images[0] || null);

    els.add.disabled = sold;
    els.add.textContent = sold ? 'Sold Out' : 'Add to Bag';

    openModal();
  }

  els.thumbs.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-src]');
    if (b) setMainImage(b.dataset.src);
  });

  els.add.addEventListener('click', function () {
    if (!current || current.sold) return;

    /* gift card: needs an amount + a valid recipient email */
    if (current.gift) {
      if (!giftAmount) return;
      var email = els.giftEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        els.giftEmail.classList.add('pd-invalid');
        els.giftEmail.focus();
        return;
      }
      els.giftEmail.classList.remove('pd-invalid');
      if (window.OFCart) {
        window.OFCart.add('Digital Gift Card — $' + giftAmount, giftAmount, GIFT_IMG);
        closeModal();
        window.OFCart.open();
      }
      toast('✂ We’ll email your gift to ' + email + (els.giftNote.value.trim() ? ', note and all.' : '.'));
      return;
    }

    if (window.OFCart) {
      window.OFCart.add(current.name, current.price, current.img);
      closeModal();
      window.OFCart.open();
    }
  });

  /* open on card click — but not when the click was the Add to Bag button */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.add-to-bag')) return;
    var card = e.target.closest('.product-card');
    if (card) show(card);
  });

  /* open a product by name if its card exists on this page */
  function showByName(name) {
    var cards = document.querySelectorAll('.product-card');
    for (var i = 0; i < cards.length; i++) {
      var n = ((cards[i].querySelector('.product-name') || {}).textContent || '').trim();
      if (n === name) { show(cards[i]); return true; }
    }
    return false;
  }

  /* expose for search + deep links */
  window.OFDetail = { showByName: showByName };
  window.OFProducts = PRODUCTS;

  /* deep link: shop.html?open=Product Name */
  try {
    var openParam = new URLSearchParams(location.search).get('open');
    if (openParam) showByName(openParam);
  } catch (e) { /* older browsers: no deep link, no harm */ }
})();
