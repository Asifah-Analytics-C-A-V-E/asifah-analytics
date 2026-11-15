/* Asifah Analytics -- COMMODITY GLANCE  v1.0.0  (Nov 15 2026)
 *
 * Two things for commodities.html:
 *
 * 1. "TALKED ABOUT vs ACTUALLY MOVING" -- a four-box chart in the At a glance
 *    grid. Each commodity is a dot:
 *      across = how loudly it is being reported (the news-pressure band)
 *      up/down = its real 30-day price move
 *    The four corners each say something different:
 *      loud + moving   -> the news and the market agree
 *      loud + flat     -> written about, not (yet) priced
 *      quiet + moving  -> MOVING QUIETLY: a price move no story explains
 *      quiet + flat    -> calm
 *    It answers the page's standing caveat ("reporting volume is not price")
 *    with a picture instead of a sentence. Commodities with no public spot
 *    price (potash, chips...) cannot be placed honestly, so they are NAMED
 *    under the chart, not dropped. Click a dot -> its card.
 *
 * 2. SECTION CHIPS -- a sticky row under the header that jumps to each
 *    section. Built from the page's own section headers, so a new section
 *    gets a chip without touching this file.
 *
 * Display only. Reads the data the page already fetched (no new calls).
 * The page calls AsifahCommodityGlance.render(pricesData, pressureData)
 * from renderEverything().
 */
(function () {
  'use strict';

  var MOVING_PCT = 5;                       // |30-day move| at or above this = "moving"
  var BAND = { normal: 0, elevated: 1, high: 2, surge: 3 };
  var BAND_WORD = ['Normal', 'Elevated', 'High', 'Surge'];
  var BAND_COL = ['#64748b', '#f59e0b', '#f97316', '#ef4444'];
  var LOUD_AT = 2;                          // high or surge = "loud"
  var last = null;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function css() {
    if (document.getElementById('cgCss')) return;
    var st = document.createElement('style');
    st.id = 'cgCss';
    st.textContent =
      '.cg-box{grid-column:span 2;border:1px solid var(--card-border,#1e3a5f);border-radius:10px;padding:10px 12px;background:rgba(56,189,248,0.04)}' +
      '@media (max-width:640px){.cg-box{grid-column:auto}}' +
      '.cg-h{font-weight:800;font-size:0.92rem;margin-bottom:2px}' +
      '.cg-sub{font-size:0.74rem;opacity:0.75;margin-bottom:6px}' +
      '.cg-box svg{width:100%;height:auto;display:block;overflow:visible}' +
      '.cg-dot{cursor:pointer;transition:r .15s}' +
      '.cg-dot:hover{stroke-width:2.5}' +
      '.cg-q{font-family:"Courier New",monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;fill:currentColor;opacity:0.55}' +
      '.cg-ax{font-size:9.5px;fill:currentColor;opacity:0.7}' +
      '.cg-lbl{font-size:9.5px;fill:currentColor;pointer-events:none}' +
      '.cg-read{font-size:0.8rem;line-height:1.45;margin-top:6px}' +
      '.cg-read b{font-weight:800}' +
      '.cg-noprice{font-size:0.72rem;opacity:0.75;margin-top:4px;font-style:italic}' +
      '.cg-tip{position:fixed;z-index:50;pointer-events:none;background:#0d1b2e;color:#e2f0fb;border:1px solid #1e3a5f;border-radius:6px;padding:6px 9px;font-size:0.76rem;line-height:1.4;max-width:260px;display:none}' +
      '.commodity-card.cg-flash{outline:3px solid #38bdf8;outline-offset:3px;transition:outline-color 1.2s}' +
      /* section chips */
      '.cg-chips{position:sticky;top:0;z-index:40;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:0 0 14px;' +
      'background:var(--bg-color,#060d1a);border-bottom:1px solid var(--card-border,#1e3a5f);scrollbar-width:thin}' +
      'body[data-theme="light"] .cg-chips{background:#e8f0f8}' +
      '.cg-chip{flex:0 0 auto;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;padding:5px 11px;border-radius:999px;cursor:pointer;' +
      'border:1px solid var(--card-border,#1e3a5f);color:var(--text-secondary,#93c5fd);background:transparent;white-space:nowrap}' +
      '.cg-chip:hover,.cg-chip.on{border-color:#38bdf8;color:#38bdf8;background:rgba(56,189,248,0.08)}';
    document.head.appendChild(st);
  }

  // ── data → points ─────────────────────────────────────────────────────
  function points(prices, pressure) {
    var meta = (prices && prices.commodity_meta) || {};
    var sparks = (prices && prices.sparklines) || {};
    var sums = (pressure && pressure.commodity_summaries) || {};
    var ids = {};
    Object.keys(meta).forEach(function (k) { ids[k] = 1; });
    Object.keys(sums).forEach(function (k) { ids[k] = 1; });
    var pts = [], noPrice = [];
    Object.keys(ids).forEach(function (cid) {
      var m = meta[cid] || sums[cid] || {}, s = sums[cid] || {}, sp = sparks[cid];
      var band = BAND[String(s.alert_level || 'normal').toLowerCase()];
      if (band == null) band = 0;
      var name = String(m.name || cid.replace(/_/g, ' ')).split(' (')[0];
      var hasPrice = m.has_spot_price !== false && sp && typeof sp.change_pct_30d === 'number';
      var rec = { cid: cid, name: name, icon: m.icon || '', band: band, score: +s.total_score || 0,
                  chg: hasPrice ? sp.change_pct_30d : null };
      if (hasPrice) pts.push(rec); else if (band >= 1) noPrice.push(rec);
    });
    return { pts: pts, noPrice: noPrice };
  }

  function corner(p) {
    var loud = p.band >= LOUD_AT, moving = Math.abs(p.chg) >= MOVING_PCT;
    return loud ? (moving ? 'agree' : 'flat') : (moving ? 'quiet' : 'calm');
  }

  function list(arr) {
    var n = arr.map(function (p) { return p.name + ' (' + (p.chg >= 0 ? '+' : '') + p.chg.toFixed(1) + '%)'; });
    if (n.length > 4) n = n.slice(0, 4).concat(['+' + (arr.length - 4) + ' more']);
    return n.join(', ');
  }

  // ── the chart ─────────────────────────────────────────────────────────
  function chart(d) {
    var narrow = window.innerWidth < 640;             // phones: a narrower canvas so the words stay readable
    var W = narrow ? 340 : 520, H = narrow ? 260 : 250, L = 40, R = 8, T = 18, B = 34;
    var pw = W - L - R, ph = H - T - B;
    var maxAbs = 10;
    d.pts.forEach(function (p) { maxAbs = Math.max(maxAbs, Math.abs(p.chg)); });
    maxAbs = Math.min(40, Math.ceil(maxAbs / 5) * 5);          // cap so one outlier cannot flatten the rest
    function x(p) {
      // band column, spread inside it by score rank so dots do not stack
      var col = pw / 4, peers = d.pts.filter(function (q) { return q.band === p.band; })
        .sort(function (a, b) { return a.score - b.score; });
      var i = peers.indexOf(p), f = peers.length > 1 ? i / (peers.length - 1) : 0.5;
      return L + col * p.band + col * (0.18 + 0.64 * f);
    }
    function y(v) { v = Math.max(-maxAbs, Math.min(maxAbs, v)); return T + ph / 2 - (v / maxAbs) * (ph / 2); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Commodities: news pressure against 30-day price move">';
    // quadrant shading: right half = loud, outer bands = moving
    var xLoud = L + pw / 2, yUp = y(MOVING_PCT), yDn = y(-MOVING_PCT);
    s += '<rect x="' + xLoud + '" y="' + T + '" width="' + (pw / 2) + '" height="' + (yUp - T) + '" fill="#ef4444" opacity="0.07"/>';
    s += '<rect x="' + xLoud + '" y="' + yDn + '" width="' + (pw / 2) + '" height="' + (T + ph - yDn) + '" fill="#ef4444" opacity="0.07"/>';
    s += '<rect x="' + L + '" y="' + T + '" width="' + (pw / 2) + '" height="' + (yUp - T) + '" fill="#a855f7" opacity="0.09"/>';
    s += '<rect x="' + L + '" y="' + yDn + '" width="' + (pw / 2) + '" height="' + (T + ph - yDn) + '" fill="#a855f7" opacity="0.09"/>';
    // axes and guides
    s += '<line x1="' + L + '" y1="' + y(0) + '" x2="' + (W - R) + '" y2="' + y(0) + '" stroke="currentColor" opacity="0.35"/>';
    s += '<line x1="' + xLoud + '" y1="' + T + '" x2="' + xLoud + '" y2="' + (T + ph) + '" stroke="currentColor" opacity="0.25" stroke-dasharray="3 3"/>';
    [MOVING_PCT, -MOVING_PCT].forEach(function (v) {
      s += '<line x1="' + L + '" y1="' + y(v) + '" x2="' + (W - R) + '" y2="' + y(v) + '" stroke="currentColor" opacity="0.18" stroke-dasharray="2 4"/>';
    });
    [maxAbs, MOVING_PCT, 0, -MOVING_PCT, -maxAbs].forEach(function (v) {
      s += '<text class="cg-ax" x="' + (L - 5) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '%</text>';
    });
    BAND_WORD.forEach(function (w, i) {
      s += '<text class="cg-ax" x="' + (L + pw / 4 * (i + 0.5)) + '" y="' + (H - 18) + '" text-anchor="middle" fill="' + BAND_COL[i] + '">' + w + '</text>';
    });
    s += '<text class="cg-ax" x="' + (L + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">how loudly it is being reported →</text>';
    s += '<text class="cg-ax" transform="translate(10 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle">30-day price move</text>';
    // corner names
    s += '<text class="cg-q" x="' + (L + 4) + '" y="' + (T + 10) + '">Moving quietly</text>';
    s += '<text class="cg-q" x="' + (W - R - 4) + '" y="' + (T + 10) + '" text-anchor="end">News and price agree</text>';
    s += '<text class="cg-q" x="' + (W - R - 4) + '" y="' + (yDn - 4) + '" text-anchor="end">Talked about, not priced</text>';
    s += '<text class="cg-q" x="' + (L + 4) + '" y="' + (yDn - 4) + '">Calm</text>';
    // dots, loud last so they sit on top; label the ones worth naming
    d.pts.slice().sort(function (a, b) { return a.band - b.band; }).forEach(function (p) {
      var cx = x(p), cy = y(p.chg), c = corner(p);
      var col = BAND_COL[p.band], r = 4 + p.band;
      s += '<circle class="cg-dot" data-cid="' + esc(p.cid) + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r +
           '" fill="' + col + '" fill-opacity="0.85" stroke="' + (c === 'quiet' ? '#a855f7' : '#0d1b2e') + '" stroke-width="' + (c === 'quiet' ? 2 : 1) + '"/>';
      if (c !== 'calm') {
        s += '<text class="cg-lbl" x="' + (cx + r + 3).toFixed(1) + '" y="' + (cy + 3).toFixed(1) + '">' + esc(p.name) + '</text>';
      }
    });
    return s + '</svg>';
  }

  function read(d) {
    var g = { agree: [], flat: [], quiet: [], calm: [] };
    d.pts.forEach(function (p) { g[corner(p)].push(p); });
    var bits = [];
    if (g.quiet.length) bits.push('<b>Moving quietly:</b> ' + esc(list(g.quiet)) + ' \u2014 the price moved further than the reporting explains.');
    if (g.agree.length) bits.push('<b>News and price agree:</b> ' + esc(list(g.agree)) + '.');
    if (g.flat.length) bits.push('<b>Talked about, not priced:</b> ' + esc(list(g.flat)) + ' \u2014 heavy reporting, price within ' + MOVING_PCT + '%.');
    if (!bits.length) bits.push('Nothing is both loud and moving this scan: reporting and prices are both within normal range.');
    return bits.join('<br>');
  }

  function box(d) {
    var el = document.createElement('div');
    el.className = 'cg-box';
    el.id = 'cgBox';
    var np = d.noPrice.sort(function (a, b) { return b.band - a.band; });
    el.innerHTML = '<div class="cg-h">Talked about vs. actually moving</div>' +
      '<div class="cg-sub">Each dot is a commodity. Right = louder reporting; up or down = its real 30-day price move. Tap a dot for its card.</div>' +
      chart(d) + '<div class="cg-read">' + read(d) + '</div>' +
      (np.length ? '<div class="cg-noprice">Reported at elevated or above, but no public spot price to check against: ' +
        esc(np.map(function (p) { return p.name + ' (' + BAND_WORD[p.band].toLowerCase() + ')'; }).join(', ')) + '.</div>' : '');
    var tip = document.createElement('div');
    tip.className = 'cg-tip';
    el.appendChild(tip);
    var byCid = {};
    d.pts.forEach(function (p) { byCid[p.cid] = p; });
    Array.prototype.forEach.call(el.querySelectorAll('.cg-dot'), function (dot) {
      var p = byCid[dot.getAttribute('data-cid')];
      dot.addEventListener('mousemove', function (ev) {
        tip.innerHTML = '<b>' + esc(p.icon + ' ' + p.name) + '</b><br>Reporting: ' + BAND_WORD[p.band] +
          '<br>30-day price: ' + (p.chg >= 0 ? '+' : '') + p.chg.toFixed(1) + '%';
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX + 12, window.innerWidth - 270) + 'px';
        tip.style.top = (ev.clientY + 12) + 'px';
      });
      dot.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      dot.addEventListener('click', function () { tip.style.display = 'none'; openCard(p.cid); });
    });
    return el;
  }

  function openCard(cid) {
    var card = document.querySelector('.commodity-card[data-commodity="' + cid + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('cg-flash');
    setTimeout(function () { card.classList.remove('cg-flash'); }, 1600);
  }

  // The At a glance grid is drawn by the tracker voice, which loads on its own
  // clock. Put the chart there when it exists; otherwise at the top of the
  // Commodity Analysis card, so the chart never waits on the voice.
  function place(el) {
    var old = document.getElementById('cgBox');
    if (old) old.parentNode.removeChild(old);
    var ca = document.getElementById('caCard');
    var caShown = ca && getComputedStyle(ca).display !== 'none';
    var grid = caShown && document.querySelector('#tvCard .tv-grid');
    if (grid) { grid.insertBefore(el, grid.firstChild); return true; }
    var exec = document.getElementById('caExecBlock');
    if (caShown && exec) exec.parentNode.insertBefore(el, exec);
    else if (ca) ca.parentNode.insertBefore(el, ca);      // analysis card hidden: never hide the chart with it
    el.style.marginBottom = '14px';
    return false;
  }

  function render(prices, pressure) {
    try {
      css();
      var d = points(prices, pressure);
      if (!d.pts.length) return;
      last = d;
      var inGrid = place(box(d));
      if (!inGrid) waitForGrid();
      chips();
    } catch (e) { console.warn('[Commodity glance]', e); }
  }

  var waiting = false;
  function waitForGrid() {
    if (waiting || !window.MutationObserver) return;
    waiting = true;
    var mo = new MutationObserver(function () {
      if (document.querySelector('#tvCard .tv-grid') && last) {
        mo.disconnect(); waiting = false;
        place(box(last));
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); waiting = false; }, 60000);
  }

  // ── section chips ─────────────────────────────────────────────────────
  var SHORT = {
    'commodity analysis': 'Analysis', "traders' odds": "Traders' odds", 'london desk': 'London Desk',
    'fao food price index': 'Food prices', 'country exposure matrix': 'Who is exposed',
    'commodity webs': 'Webs', 'exposure × structural stress': 'Structural stress',
    'leader commodity signals': 'Leaders', 'commodity pressure cards': 'Commodities',
    'combined signal feed': 'Signal feed'
  };
  function chips() {
    if (document.getElementById('cgChips')) return;
    var main = document.querySelector('main.content');
    if (!main) return;
    var targets = [];
    var ca = document.getElementById('caCard');
    if (ca) targets.push(['Read', document.getElementById('tvCard') || ca]);
    Array.prototype.forEach.call(main.querySelectorAll('.section-header'), function (h) {
      var t = h.querySelector('.section-title');
      var name = t ? t.textContent.trim() : '';
      var key = name.toLowerCase().split(' — ')[0].split(' - ')[0].trim();
      targets.push([SHORT[key] || name.split(' — ')[0], h]);
    });
    var mk = document.querySelector('[data-asifah-markets]');
    if (mk && ca) targets.splice(1, 0, ["Traders' odds", mk]);
    if (targets.length < 3) return;
    var bar = document.createElement('nav');
    bar.className = 'cg-chips';
    bar.id = 'cgChips';
    bar.setAttribute('aria-label', 'Jump to section');
    targets.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cg-chip';
      b.textContent = t[0];
      b.addEventListener('click', function () {
        var top = t[1].getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
      bar.appendChild(b);
    });
    main.insertBefore(bar, main.firstChild);
  }

  window.AsifahCommodityGlance = { render: render, openCard: openCard };
})();
