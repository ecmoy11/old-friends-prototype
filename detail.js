/* ── OLD FRIENDS — PRODUCT DETAIL OVERLAY ──
   Include AFTER cart.js: <script src="detail.js"></script>
   Clicking any .product-card (outside its Add to Bag button) opens a
   detail view. ALL PRODUCT COPY LIVES IN THE MAP BELOW — edit freely.
   Fields: story, materials, dimensions, care, note, images[] */
(function () {

  /* ═══════════ EDIT PRODUCT INFO HERE ═══════════ */
  var PRODUCTS = {
    'Patchwork Tote — Garden': {
      story: 'Pieced from three vintage floral prints — a 1970s daisy chain, a red meadow calico, and a brushed brown rose — with sturdy cream cotton straps. Roomy enough for a library haul or a farmers market run.',
      materials: 'Reclaimed vintage cotton, quilted; new cotton webbing straps',
      dimensions: '14" W × 15" H × 4" D, 11" strap drop',
      care: 'Machine wash cold, gentle. Lay flat to dry.',
      note: 'One of one — the fabrics that made this bag are gone for good, so no two will ever match.',
      images: ['images/bag1.jpg', 'images/bag2.jpg']
    },
    'Vintage Quilt Jacket': {
      story: 'Cut from a hand-tied quilt found at an estate sale in Signal Mountain. Boxy fit, patch pockets, and decades of softness already worked in.',
      materials: 'Vintage cotton quilt, cotton batting',
      dimensions: 'Fits like a modern M/L — 24" chest flat, 26" length',
      care: 'Spot clean or hand wash cold. Line dry.',
      note: 'One of one — sold to a good home. The archive stays up so you can see where pieces end up.'
    },
    'Quilted Hoodie — Floral': {
      story: 'Our signature silhouette in a faded floral quilt top. Deep hood, kangaroo pocket, and a drape that feels more heirloom than loungewear.',
      materials: 'Vintage quilt top, new cotton jersey lining and ribbing',
      dimensions: 'Fits like a relaxed M — 23" chest flat, 25" length',
      care: 'Hand wash cold. Lay flat to dry.',
      note: 'One of one — made from a single quilt, and there was only ever one of those.'
    },
    'Linen Scrunchie Set': {
      story: 'Three oversized scrunchies sewn from linen offcuts, so nothing from the cutting table goes to waste. Colors vary with whatever the current batch of remnants allows.',
      materials: '100% linen remnants, elastic core',
      dimensions: 'Set of 3, approx. 4.5" diameter',
      care: 'Hand wash cold. Air dry.',
      note: 'Small batch — each set is cut from the week’s remnants, so your trio will be its own little family.'
    },
    '70s Corduroy Shirt': {
      story: 'A honey-brown snap-front corduroy shirt from the 1970s, broken in exactly the way you want it to be. Minor wear at the cuffs adds to the story.',
      materials: 'Cotton corduroy',
      dimensions: 'Tagged L, fits like a modern M — 22" chest flat',
      care: 'Machine wash cold, inside out. Hang dry.',
      note: 'Pre-loved — inspected, laundered, and mended by hand where needed.'
    },
    'Memory Quilt Throw': {
      story: 'A commission-style throw pieced from a mix of feed sacks and shirting scraps, hand-tied with terracotta thread. Made to be dragged to the couch, the porch, the yard.',
      materials: 'Vintage cotton, new cotton batting, embroidery thread ties',
      dimensions: '50" × 65"',
      care: 'Machine wash cold, gentle. Tumble dry low.',
      note: 'One of one — want one made from your own fabrics? See our commission page.'
    },
    'Wool Fisherman Sweater': {
      story: 'A cream cable-knit fisherman sweater with real heft. Sourced pre-loved, de-pilled, and ready for another few decades of wear.',
      materials: '100% wool',
      dimensions: 'Fits like a modern M/L — 23" chest flat',
      care: 'Hand wash cold with wool wash. Lay flat to dry.',
      note: 'Pre-loved — inspected, laundered, and mended by hand where needed.'
    },
    'Hand-Stitched Hair Ribbons': {
      story: 'Long cotton ribbons finished with hand-rolled hems and a single embroidered folk star at each end. Tie them in hair, on bags, around gifts.',
      materials: 'Cotton voile remnants, embroidery thread',
      dimensions: 'Set of 2, each 1.5" × 34"',
      care: 'Hand wash cold. Iron on low.',
      note: 'Small batch — embroidered one at a time, no two stars quite alike.'
    },
    'Floral Prairie Dress': {
      story: 'A late-70s prairie dress in a tiny wildflower print — ruffled yoke, full skirt, and a matching fabric belt still with it after all these years.',
      materials: 'Cotton blend',
      dimensions: 'Tagged 10, fits like a modern S/M — 19" chest flat, 46" length',
      care: 'Machine wash cold, gentle. Hang dry.',
      note: 'Pre-loved — inspected, laundered, and mended by hand where needed.'
    },
    'Upcycled Chore Coat': {
      story: 'A classic chore coat rebuilt from heavyweight canvas drop cloths, lined at the collar with a strip of vintage quilt. Gets better with every wear and wash.',
      materials: 'Upcycled cotton canvas, vintage quilt trim, corozo buttons',
      dimensions: 'Fits like a modern L — 24" chest flat, 30" length',
      care: 'Machine wash cold. Hang dry.',
      note: 'One of one — the quilt trim on this coat came from a single worn quilt corner.'
    },
    'Patch Kit — Folk Motifs': {
      story: 'Five iron-on patches in our folk motifs — star, flower, cat, leaf, and circle — screen printed on quilted scrap and edged by hand. Mend something and make it yours.',
      materials: 'Quilted cotton scrap, iron-on backing',
      dimensions: 'Set of 5, each approx. 2" – 3"',
      care: 'Iron on medium, 30 seconds. Wash inside out.',
      note: 'Small batch — printed and cut in runs of twenty.'
    },
    'Broken-In Levi’s 501s': {
      story: 'A pair of 501s with the kind of fade you can’t fake — high rise, straight leg, hemmed once and worn well.',
      materials: '100% cotton denim',
      dimensions: 'Tagged 32 × 32, measures 31" waist, 30" inseam',
      care: 'Machine wash cold, inside out. Hang dry.',
      note: 'Pre-loved — inspected, laundered, and mended by hand where needed.'
    },
    'Digital Gift Card': {
      story: 'For when you know they’d love something handmade, but the choosing should be theirs. Pick an amount, write a little note, and we’ll email it to them — no shipping, no packaging, no waiting.',
      materials: 'Delivered by email — zero waste',
      note: 'Gift cards never expire, and they work on everything: pre-loved, handmade, and commissions alike.'
    }
  };
  var DEFAULT_NOTE = 'Handmade in Chattanooga with reclaimed materials.';
  /* ═══════════ END PRODUCT INFO ═══════════ */

  var css = [
    '.pd-backdrop { position: fixed; inset: 0; background: rgba(106,70,48,0.5); opacity: 0; pointer-events: none; transition: opacity .35s ease; z-index: 8000; }',
    '.pd-backdrop.open { opacity: 1; pointer-events: auto; }',
    '.pd-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, 48%); width: min(920px, calc(100vw - 32px)); max-height: min(640px, calc(100vh - 48px)); background: var(--cream); z-index: 8001; display: none; grid-template-columns: 1fr 1fr; opacity: 0; transition: opacity .4s ease, transform .45s cubic-bezier(.22,1,.36,1); box-shadow: 0 20px 60px rgba(106,70,48,0.35); overflow: hidden; }',
    '.pd-modal.open { display: grid; opacity: 1; transform: translate(-50%, -50%); }',
    '.pd-close { position: absolute; top: 12px; right: 14px; z-index: 2; background: var(--cream); border: none; font-size: 24px; line-height: 1; color: var(--brown); cursor: pointer; padding: 6px 10px; transition: color .3s; }',
    '.pd-close:hover { color: var(--terra); }',
    '.pd-gallery { background: var(--linen); display: flex; flex-direction: column; min-height: 0; }',
    '.pd-main { flex: 1; min-height: 0; position: relative; display: flex; align-items: center; justify-content: center; font-family: "Cormorant Garamond", serif; font-style: italic; color: var(--walnut); opacity: 1; }',
    '.pd-main .pd-ph { opacity: .4; font-size: 15px; }',
    '.pd-main img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; will-change: transform; }',
    '.pd-main { overflow: hidden; }',
    '.pd-main.has-img { cursor: zoom-in; }',
    '.pd-main.zoomed { cursor: zoom-out; }',
    '.pd-main.zoomed img { transform: scale(2.4); }',
    '.pd-zoom-hint { position: absolute; bottom: 10px; right: 10px; z-index: 1; background: rgba(106,70,48,0.75); color: var(--cream); font-family: "DM Sans", sans-serif; font-size: 9px; letter-spacing: .15em; text-transform: uppercase; padding: 5px 10px; pointer-events: none; opacity: .85; }',
    '.pd-main.zoomed .pd-zoom-hint { display: none; }',
    '.pd-thumbs { display: flex; gap: 6px; padding: 10px; background: var(--linen); }',
    '.pd-thumbs button { width: 56px; height: 56px; padding: 0; border: 2px solid transparent; cursor: pointer; background: var(--stone); overflow: hidden; }',
    '.pd-thumbs button.active { border-color: var(--terra); }',
    '.pd-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }',
    '.pd-info { padding: 40px 36px 32px; overflow-y: auto; }',
    '.pd-tag { display: inline-block; background: var(--terra); color: var(--cream); font-size: 9px; letter-spacing: .15em; text-transform: uppercase; padding: 4px 10px; margin-bottom: 14px; }',
    '.pd-name { font-family: "Cormorant Garamond", serif; font-size: 30px; font-weight: 500; font-style: italic; color: var(--brown); line-height: 1.15; margin-bottom: 6px; }',
    '.pd-price { font-size: 15px; color: var(--walnut); margin-bottom: 18px; }',
    '.pd-story { font-size: 14px; line-height: 1.75; color: var(--walnut); margin-bottom: 22px; }',
    '.pd-dl { margin-bottom: 22px; }',
    '.pd-dl h4 { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: var(--terra); font-weight: 500; margin-bottom: 10px; }',
    '.pd-row { display: flex; gap: 12px; font-size: 13px; padding: 7px 0; border-bottom: 1px dashed var(--stone); }',
    '.pd-row dt { width: 92px; flex-shrink: 0; color: var(--brown); font-weight: 400; }',
    '.pd-row dd { color: var(--walnut); }',
    '.pd-note { font-size: 12.5px; font-style: italic; font-family: "Cormorant Garamond", serif; font-size: 15px; color: var(--brown); margin-bottom: 24px; padding-left: 12px; border-left: 2px solid var(--terra); }',
    '.pd-add { display: block; width: 100%; padding: 15px; background: var(--brown); color: var(--cream); border: 2px dashed var(--brown); font-family: "DM Sans", sans-serif; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; cursor: pointer; transition: background .3s, border-color .3s; }',
    '.pd-add:hover { background: var(--terra); border-color: var(--terra); }',
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
    '.pd-toast { position: fixed; bottom: 26px; left: 50%; transform: translate(-50%, 10px); background: var(--brown); color: var(--cream); font-family: "DM Sans", sans-serif; font-size: 12px; letter-spacing: .08em; padding: 13px 22px; z-index: 9700; opacity: 0; transition: opacity .35s ease, transform .35s ease; box-shadow: 0 10px 30px rgba(106,70,48,0.35); pointer-events: none; max-width: calc(100vw - 48px); text-align: center; }',
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
      '<div class="pd-dl">' +
        '<h4>The Details</h4>' +
        '<div class="pd-row"><dt>Materials</dt><dd data-f="materials"></dd></div>' +
        '<div class="pd-row"><dt>Dimensions</dt><dd data-f="dimensions"></dd></div>' +
        '<div class="pd-row"><dt>Care</dt><dd data-f="care"></dd></div>' +
      '</div>' +
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
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  function setMainImage(src) {
    els.main.classList.remove('zoomed');
    els.main.classList.toggle('has-img', !!src);
    els.main.innerHTML = src
      ? '<img src="' + src + '" alt=""><span class="pd-zoom-hint">Click to zoom</span>'
      : '<span class="pd-ph">product photography coming soon</span>';
    els.thumbs.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.src === src);
    });
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
    var priceText = ((card.querySelector('.product-price') || {}).textContent || '').trim();
    var tagText = ((card.querySelector('.product-tag') || {}).textContent || '').trim();
    var sold = /sold/i.test(tagText);
    var isGift = card.hasAttribute('data-gift');
    var info = PRODUCTS[name] || {};
    modal.classList.toggle('pd-is-gift', isGift);

    els.name.textContent = name;
    els.tag.textContent = tagText;
    els.tag.style.display = tagText ? 'inline-block' : 'none';
    els.story.textContent = info.story || 'Description coming soon — every piece gets its own story before it ships.';
    els.note.textContent = '✂ ' + (info.note || DEFAULT_NOTE);
    modal.querySelector('[data-f="materials"]').textContent = info.materials || '—';
    modal.querySelector('[data-f="dimensions"]').textContent = info.dimensions || '—';
    modal.querySelector('[data-f="care"]').textContent = info.care || '—';

    if (isGift) {
      current = { name: name, price: 0, img: GIFT_IMG, sold: false, gift: true };
      els.main.classList.remove('has-img', 'zoomed');
      els.main.innerHTML =
        '<img src="' + GIFT_IMG + '" alt="">' +
        '<img class="pd-env" src="envolope.png" alt="">';
      els.thumbs.innerHTML = '';
      els.thumbs.style.display = 'none';
      resetGiftForm();
      openModal();
      return;
    }

    /* images: prefer what's on the card, fall back to the map */
    var images = [];
    card.querySelectorAll('.product-img-wrap img').forEach(function (im) {
      images.push(im.getAttribute('src'));
    });
    if (!images.length && info.images) images = info.images.slice();

    current = { name: name, price: parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0, img: images[0] || null, sold: sold };

    els.price.textContent = priceText;

    els.thumbs.innerHTML = images.length > 1
      ? images.map(function (src) {
          return '<button data-src="' + src + '"><img src="' + src + '" alt=""></button>';
        }).join('')
      : '';
    els.thumbs.style.display = images.length > 1 ? 'flex' : 'none';
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
