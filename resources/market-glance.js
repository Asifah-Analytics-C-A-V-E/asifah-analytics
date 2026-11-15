/* Asifah Analytics -- MARKET GLANCE  v1.0.0  (Nov 15 2026)
 *
 * market-watch.html, the same top-to-bottom pass as Commodities and Military.
 *
 *   1. READ -- the plain-language read, and beside it "Ten conditions": the
 *      fragility detector's ten conditions as lights (lit / quiet / unread),
 *      the band, and this week's pattern match against last week. Right
 *      column: the At-a-glance boxes + "Chains to watch".
 *   2. CHAINS -- supply chains read ACROSS pages. First: the chip supply
 *      chain (silicon, chips, rare earths, the Taiwan Strait, and this page's
 *      semiconductor reading). It is built once, by the commodities desk, and
 *      shown here too: one convergence, two doors.
 *   3. CONFLICT REPRICING moves up (geopolitics is Asifah's job), then the
 *      fragility detector in full, traders' odds, the markets board and the
 *      pattern library.
 *   + sticky section chips.
 *
 * Display only. One extra read: /api/tracker-voice?desk=commodities, which
 * never calls Claude (it serves the stored read + always-on explainers).
 */
(function () {
  'use strict';

  var ME = 'https://asifah-backend.onrender.com';
  var FEATURE_ORDER = ['valuation_stretch', 'parabolic_momentum', 'concentration', 'breadth_divergence',
                       'vol_complacency', 'curve_inversion', 'leader_rollover', 'credit_stress',
                       'thematic_fever', 'global_sync'];
  var NICE = { valuation_stretch: 'Valuations stretched', parabolic_momentum: 'Prices going vertical',
               concentration: 'A few giants carry the index', breadth_divergence: 'Fewer stocks rising',
               vol_complacency: 'Too calm (low volatility)', curve_inversion: 'Yield curve inverted',
               leader_rollover: 'Market leaders rolling over', credit_stress: 'Credit stress',
               thematic_fever: 'Chip & AI fever', global_sync: 'Markets moving together' };
  var BAND_COL = { normal: '#10b981', elevated: '#f59e0b', high: '#f97316', critical: '#ef4444' };
  var last = { d: null, chain: null };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nice(k) { k = String(k || ''); return NICE[k] || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' '); }
  function nameOf(f) { return typeof f === 'string' ? f : ((f && (f.name || f.id)) || ''); }

  function css() {
    if (document.getElementById('mkgCss')) return;
    var st = document.createElement('style');
    st.id = 'mkgCss';
    st.textContent =
      '.mkg-row{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;align-items:start}' +
      '@media (max-width:900px){.mkg-row{grid-template-columns:1fr}}' +
      '.mkg-side{display:flex;flex-direction:column;gap:8px;min-width:0}' +
      '.mkg-side .tv-grid.mkg-side-grid{grid-template-columns:1fr}' +
      '.mkg-box{border:1px solid var(--card-border,#1e3a5f);border-radius:10px;padding:12px 14px;background:rgba(56,189,248,0.04);min-width:0}' +
      '.mkg-h{font-weight:800;font-size:0.95rem;margin-bottom:2px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}' +
      '.mkg-sub{font-size:0.76rem;opacity:0.75;margin-bottom:10px}' +
      '.mkg-pill{font-size:0.66rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:999px;color:#fff}' +
      '.mkg-lights{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}' +
      '@media (max-width:640px){.mkg-lights{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '.mkg-l{border:1px solid var(--card-border,#1e3a5f);border-radius:8px;padding:8px 8px 7px;text-align:center;font-size:0.74rem;line-height:1.3;cursor:help;min-height:62px}' +
      '.mkg-l .dot{display:block;width:16px;height:16px;border-radius:50%;margin:0 auto 5px;border:2px solid #475569}' +
      '.mkg-l.lit{border-color:#f97316;background:rgba(249,115,22,0.08)}.mkg-l.lit .dot{background:#f97316;border-color:#f97316;box-shadow:0 0 10px rgba(249,115,22,0.7)}' +
      '.mkg-l.unread{opacity:0.5;border-style:dashed}.mkg-l.unread .dot{border-style:dashed}' +
      '.mkg-trend{font-size:0.82rem;line-height:1.5;margin-top:10px;padding-top:8px;border-top:1px solid var(--card-border,#1e3a5f)}' +
      '.mkg-leg{font-size:0.7rem;opacity:0.7;margin-top:6px}' +
      /* chain card */
      '.mkg-chain{border:1px solid var(--card-border,#1e3a5f);border-left:4px solid #64748b;border-radius:10px;padding:10px 12px}' +
      '.mkg-chain.firing{border-left-color:#f97316}' +
      '.mkg-chain-h{font-weight:800;font-size:0.88rem;display:flex;justify-content:space-between;gap:8px;align-items:baseline}' +
      '.mkg-chain-r{display:flex;justify-content:space-between;gap:8px;font-size:0.78rem;padding:4px 0;border-top:1px solid rgba(127,127,127,0.15)}' +
      '.mkg-chain-r .v{font-weight:800;white-space:nowrap}' +
      '.mkg-chain-r.hot .v{color:#f97316}' +
      '.mkg-chain-p{font-size:0.78rem;line-height:1.45;margin:6px 0}' +
      '.mkg-chain-l{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
      '.mkg-chain-l a{font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(56,189,248,0.4);color:#38bdf8;text-decoration:none}' +
      '#mkgChains{margin:18px 0}' +
      '#mkgChains .mkg-chain-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px}' +
      /* chips */
      '.mkg-chips{position:sticky;top:0;z-index:40;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:0 0 14px;' +
      'background:var(--bg-color,#060d1a);border-bottom:1px solid var(--card-border,#1e3a5f);scrollbar-width:thin}' +
      'body[data-theme="light"] .mkg-chips,[data-theme="light"] .mkg-chips{background:var(--bg-color,#e8f0f8)}' +
      '.mkg-chip{flex:0 0 auto;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;padding:5px 11px;border-radius:999px;cursor:pointer;' +
      'border:1px solid var(--card-border,#1e3a5f);color:var(--text-secondary,#93c5fd);background:transparent;white-space:nowrap}' +
      '.mkg-chip:hover{border-color:#38bdf8;color:#38bdf8;background:rgba(56,189,248,0.08)}';
    document.head.appendChild(st);
  }

  // ── Ten conditions ────────────────────────────────────────────────────
  function lightsBox(d) {
    var lit = {}, quiet = {}, unread = {};
    (d.active_features || []).forEach(function (f) { lit[nameOf(f)] = f; });
    (d.quiet_features || []).forEach(function (f) { quiet[nameOf(f)] = 1; });
    (d.features_unavailable || []).forEach(function (f) { unread[nameOf(f)] = 1; });
    var keys = FEATURE_ORDER.slice();
    Object.keys(lit).concat(Object.keys(quiet), Object.keys(unread)).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    var band = d.band || 'normal';
    var nLit = Object.keys(lit).length;
    var el = document.createElement('div');
    el.className = 'mkg-box';
    el.id = 'mkgLights';
    el.innerHTML = '<div class="mkg-h"><span>Ten conditions</span><span class="mkg-pill" style="background:' + (BAND_COL[band] || '#64748b') + '">' +
      esc(band) + (d.composite != null ? ' · ' + esc(d.composite) : '') + '</span></div>' +
      '<div class="mkg-sub">What came before past crashes, measured on today’s markets. ' + nLit + ' of ' + keys.length +
      ' lit. Lit = present now; dim = quiet; dashed = no data. Hover for what each one means.</div>' +
      '<div class="mkg-lights">' + keys.map(function (k) {
        var f = lit[k], cls = f ? 'lit' : (unread[k] ? 'unread' : '');
        var tip = f ? ((f.plain || '') + (f.why ? ' Why it matters: ' + f.why : '')) : (unread[k] ? 'No data this cycle: unread, not calm.' : 'Quiet this cycle.');
        return '<div class="mkg-l ' + cls + '" title="' + esc(tip) + '"><span class="dot"></span>' + esc(nice(k)) + '</div>';
      }).join('') + '</div>' +
      (d.match_trend && d.match_trend.sentence ? '<div class="mkg-trend"><b>This week:</b> ' + esc(d.match_trend.sentence) + '</div>' : '') +
      '<div class="mkg-leg">Fragility, not prophecy: these say how dry the forest is, not whether lightning strikes. Full detail in the Fragility section.</div>';
    return el;
  }

  // ── Chains ────────────────────────────────────────────────────────────
  function chainCard(it, compact) {
    if (!it) return null;
    var f = it.facts || {}, links = f.links || [], hot = f.stressed_links || [];
    var firing = it.state === 'firing';
    var el = document.createElement('div');
    el.className = 'mkg-chain' + (firing ? ' firing' : '');
    el.innerHTML = '<div class="mkg-chain-h"><span>🔗 ' + esc(it.name || 'Chip supply chain watch') + '</span>' +
      '<span style="font-size:0.7rem;font-weight:800;color:' + (firing ? '#f97316' : '#94a3b8') + '">' +
      (firing ? hot.length + ' LINKS MOVING' : 'STANDING WATCH') + '</span></div>' +
      (compact ? '' : '<div class="mkg-chain-p">' + esc(it.text || it.plain || '') + '</div>') +
      links.map(function (l) {
        var v = ('change_30d_pct' in l) ? ((l.change_30d_pct > 0 ? '+' : '') + l.change_30d_pct + '% (30d)') : esc(l.state || 'unread');
        return '<div class="mkg-chain-r' + (l.stressed ? ' hot' : '') + '"><span>' + esc(l.link) + '</span><span class="v">' + v + '</span></div>';
      }).join('') +
      '<div class="mkg-chain-l"><a href="commodities.html">Commodities →</a><a href="military.html">Military →</a><a href="#mkgChains">Why these links →</a></div>';
    return el;
  }

  function loadChain() {
    if (last.chainP) return last.chainP;
    last.chainP = fetch(ME + '/api/tracker-voice?desk=commodities').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var ex = (j && j.explainers) || [];
        var it = null;
        ex.forEach(function (e) { if (e && e.id === 'chain_watch:chips') it = e; });
        if (it && j.view && j.view.items && j.view.items[it.id]) it.text = j.view.items[it.id].what_it_means || '';
        last.chain = it;
        return it;
      }).catch(function () { return null; });
    return last.chainP;
  }

  function chainsSection(it) {
    var old = document.getElementById('mkgChains');
    if (old) old.parentNode.removeChild(old);
    var wrap = document.createElement('div');
    wrap.id = 'mkgChains';
    wrap.innerHTML = '<div class="fragility-title" style="margin-bottom:6px;">🔗 Chains to watch</div>' +
      '<div style="font-size:12.5px;opacity:0.8;margin-bottom:10px;line-height:1.5;">A supply chain read across Asifah’s pages at once. ' +
      'One link moving can be noise; two or more moving together is the pattern. The same chain shows on Commodities and Military.</div>' +
      '<div class="mkg-chain-grid"></div>';
    var c = chainCard(it, false);
    wrap.querySelector('.mkg-chain-grid').appendChild(c || (function () {
      var x = document.createElement('div'); x.className = 'mkg-chain';
      x.textContent = 'The chip supply chain read is not available yet: it appears once the commodities read has run with the new version. Unread, not calm.';
      return x;
    })());
    return wrap;
  }

  // ── placement ─────────────────────────────────────────────────────────
  var moved = false;
  function restructure() {
    if (moved) return;
    var frag = document.getElementById('fragilityCard'), rep = document.getElementById('repricingCard');
    if (!frag || !rep) return;
    moved = true;
    frag.parentNode.insertBefore(rep, frag);           // conflict repricing above the fragility detail
  }

  function placeRead(d) {
    ['mkgLights', 'mkgChainMini'].forEach(function (id) { var o = document.getElementById(id); if (o) o.parentNode.removeChild(o); });
    var grid = document.querySelector('#tvCard .tv-grid');
    var lights = lightsBox(d);
    if (!grid) {
      var hb = document.getElementById('headlineBanner');
      if (hb) hb.parentNode.insertBefore(lights, hb.nextSibling);
      lights.style.margin = '0 0 14px';
      return false;
    }
    var row = document.getElementById('mkgRow'), side;
    if (!row) {
      row = document.createElement('div'); row.className = 'mkg-row'; row.id = 'mkgRow';
      side = document.createElement('div'); side.className = 'mkg-side';
      grid.parentNode.insertBefore(row, grid);
      row.appendChild(side); side.appendChild(grid);
      grid.classList.add('mkg-side-grid');
    } else side = row.querySelector('.mkg-side');
    row.insertBefore(lights, side);
    if (last.chain) {
      var mini = chainCard(last.chain, true);
      mini.id = 'mkgChainMini';
      side.appendChild(mini);
    }
    return true;
  }

  function placeChains() {
    var rep = document.getElementById('repricingCard');
    if (!rep) return;
    rep.parentNode.insertBefore(chainsSection(last.chain), rep);
  }

  function chips() {
    if (document.getElementById('mkgChips')) return;
    var first = document.getElementById('tvCard') || document.getElementById('headlineBanner');
    if (!first) return;
    var T = [['Read', first], ['Chains', document.getElementById('mkgChains')],
             ['Conflict repricing', document.getElementById('repricingCard')],
             ['Fragility', document.getElementById('fragilityCard')],
             ["Traders' odds", document.querySelector('[data-asifah-markets="market-watch"]')],
             ['Markets board', document.getElementById('globalStripBlock') || document.getElementById('regionTabs')],
             ['Pattern library', document.querySelector('.library-card')]].filter(function (t) { return t[1]; });
    var bar = document.createElement('nav');
    bar.className = 'mkg-chips'; bar.id = 'mkgChips';
    bar.setAttribute('aria-label', 'Jump to section');
    T.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mkg-chip'; b.textContent = t[0];
      b.addEventListener('click', function () {
        var target = t[1];
        if (target.style && target.style.display === 'none' && t[0] === 'Markets board') target = document.getElementById('regionTabs') || target;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8, behavior: 'smooth' });
      });
      bar.appendChild(b);
    });
    first.parentNode.insertBefore(bar, first);
  }

  var waiting = false;
  function waitForGrid() {
    if (waiting || !window.MutationObserver) return;
    waiting = true;
    var mo = new MutationObserver(function () {
      if (document.querySelector('#tvCard .tv-grid') && last.d) { mo.disconnect(); waiting = false; placeRead(last.d); chips(); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); waiting = false; }, 60000);
  }

  function render(d) {
    try {
      if (!d) return;
      last.d = d;
      css();
      restructure();
      if (!placeRead(d)) waitForGrid();
      loadChain().then(function () {
        placeChains();
        placeRead(d);
        var bar = document.getElementById('mkgChips');
        if (bar) bar.parentNode.removeChild(bar);
        chips();
        setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
      });
      chips();
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
    } catch (e) { console.warn('[Market glance]', e); }
  }

  window.AsifahMarketGlance = { render: render };
})();
