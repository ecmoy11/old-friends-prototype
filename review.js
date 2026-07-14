/* ══ OLD FRIENDS — REVIEW MODE ══
   Temporary design-review tool. Include on any page:
   <script src="review.js"></script>
   Click = flag element · Shift-click = flag whole section ·
   click again to unflag · Esc to stop · Copy list → paste to Claude.
   REMOVE BEFORE LAUNCH. */
(function () {
  var on = false;
  var flagged = new Map(); // el -> {desc, outline, background}
  var hoverEl = null, hoverPrev = '';

  var bar = document.createElement('div');
  bar.id = 'rv-bar';
  bar.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; display:flex; gap:10px; align-items:center; background:#F3EDE4; border:2px dashed #3E2A1A; padding:10px 14px; font-family:Georgia,serif; font-size:12px; color:#3E2A1A; box-shadow:0 4px 14px rgba(62,42,26,.25);';
  bar.innerHTML =
    '<button id="rv-toggle" style="background:#3E2A1A; color:#F3EDE4; border:none; padding:8px 14px; font-size:11px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer;">&#9986; Start review</button>' +
    '<span id="rv-hint" style="display:none; max-width:220px; line-height:1.4;">Click = flag element &middot; Shift-click = flag whole section &middot; click again to unflag &middot; Esc to stop</span>' +
    '<span id="rv-count" style="display:none; font-weight:bold;">0 flagged</span>' +
    '<button id="rv-copy" style="display:none; background:#B84A38; color:#F3EDE4; border:none; padding:8px 14px; font-size:11px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer;">Copy list</button>';
  document.body.appendChild(bar);

  var btn = document.getElementById('rv-toggle');
  var hint = document.getElementById('rv-hint');
  var count = document.getElementById('rv-count');
  var copyBtn = document.getElementById('rv-copy');

  /* getAttribute works for SVG elements too — el.className does not */
  function cls(el) {
    var c = el.getAttribute && el.getAttribute('class');
    return (c && c.trim()) ? '.' + c.trim().split(/\s+/)[0] : '';
  }
  function nodeName(el) {
    var n = el.tagName.toLowerCase() + cls(el);
    if (el.tagName.toLowerCase() === 'use') {
      var h = el.getAttribute('href') || el.getAttribute('xlink:href');
      if (h) n += '[' + h + ']';
    }
    return n;
  }
  function describe(el) {
    var sec = el.closest('section, footer, nav, header');
    var secName = sec ? (sec.id ? '#' + sec.id : sec.tagName.toLowerCase() + cls(sec)) : '(page)';
    var path = nodeName(el);
    /* anonymous element? borrow the nearest named parent for context */
    if (!cls(el) && !el.id) {
      var p = el.parentElement;
      while (p && p !== sec && p !== document.body) {
        if (p.id) { path = '#' + p.id + ' > ' + path; break; }
        if (cls(p)) { path = nodeName(p) + ' > ' + path; break; }
        p = p.parentElement;
      }
    }
    var txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70);
    return secName + ' > ' + path + (txt ? ' -- "' + txt + '"' : '');
  }
  function setFlag(el) {
    flagged.set(el, { desc: describe(el), outline: el.style.outline, background: el.style.background });
    el.style.outline = '2px dashed #B84A38';
    el.style.background = 'rgba(184,74,56,.14)';
  }
  function unflag(el) {
    var s = flagged.get(el);
    el.style.outline = s.outline;
    el.style.background = s.background;
    flagged.delete(el);
  }
  function updateCount() {
    count.textContent = flagged.size + ' flagged';
    copyBtn.style.display = flagged.size ? 'inline-block' : 'none';
  }
  function clearHover() {
    if (hoverEl && !flagged.has(hoverEl)) hoverEl.style.outline = hoverPrev;
    hoverEl = null;
  }
  function toggleMode(state) {
    on = state;
    btn.innerHTML = on ? '&#9986; Stop review' : '&#9986; Start review';
    hint.style.display = on ? 'inline' : 'none';
    count.style.display = on || flagged.size ? 'inline' : 'none';
    document.body.style.cursor = on ? 'crosshair' : '';
    if (!on) clearHover();
    updateCount();
  }

  btn.addEventListener('click', function () { toggleMode(!on); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && on) toggleMode(false); });

  document.addEventListener('mouseover', function (e) {
    if (!on || bar.contains(e.target)) return;
    clearHover();
    hoverEl = e.target;
    hoverPrev = hoverEl.style.outline;
    if (!flagged.has(hoverEl)) hoverEl.style.outline = '2px solid #B84A38';
  }, true);

  document.addEventListener('click', function (e) {
    if (!on || bar.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    var el = e.shiftKey ? (e.target.closest('section, footer, header') || e.target) : e.target;
    if (el === hoverEl) clearHover();
    flagged.has(el) ? unflag(el) : setFlag(el);
    updateCount();
  }, true);

  copyBtn.addEventListener('click', function () {
    var list = 'CUT LIST (' + document.title + '):\n' +
      Array.from(flagged.values()).map(function (s, i) { return (i + 1) + '. ' + s.desc; }).join('\n');
    function done() {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(function () { copyBtn.textContent = 'Copy list'; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(list).then(done, function () { window.prompt('Copy this:', list); });
    } else {
      window.prompt('Copy this:', list);
    }
  });
})();
