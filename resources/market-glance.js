/* Asifah Analytics -- MARKET GLANCE  v1.1.0  (Nov 15 2026)
 *
 * v1.1.0 (Rachel: "another situation of white space ... full top to bottom
 * scan ... the order of information, what defaults as open vs. closed"):
 *   * The Read row was lopsided: a short left column ("Ten conditions") next
 *     to a tall column of boxes. The left column now carries the page's
 *     graphic, "Markets around the world": every market Asifah reads on its
 *     own index, placed by how far it sits below its two-year high and how
 *     much of a past crisis pattern it shares. The corner that matters
 *     (near highs AND looking like a past setup) is labelled. Currencies we
 *     read without an index sit under the chart as a strip.
 *   * The chip supply chain card moves into the left column, in full. The
 *     separate "Chains to watch" section is gone: it said the same thing twice.
 *   * Order below the Read: Conflict repricing, Traders' odds (both are the
 *     money's view of geopolitics), then the fragility detail, the markets
 *     board and the pattern library.
 *   * Open vs closed: the meaning (So What, historical analogs) stays open.
 *     Detail that the top of the page already shows folds closed with a
 *     one-line summary: what each lit condition means, the market-by-market
 *     detail, and the episode table. The "quiet" chips are hidden: the lights
 *     show them.
 *
 * v1.0.0: Ten conditions lights, the chain card, repricing above fragility, chips.
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
  var FLAG_AT = 50;          // the backend flags a market at 50% of a pattern (and 2+ shared conditions)
  var FALLEN_AT = -10;       // "fallen" = 10% or more below the two-year high
  var last = { d: null, chain: null };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nice(k) { k = String(k || ''); return NICE[k] || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' '); }
  function nameOf(f) { return typeof f === 'string' ? f : ((f && (f.name || f.id)) || ''); }
  function short(n) { return String(n || '').replace(/\s*\(.*\)\s*$/, ''); }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  function css() {
    if (document.getElementById('mkgCss')) return;
    var st = document.createElement('style');
    st.id = 'mkgCss';
    st.textContent =
      '.mkg-row{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;align-items:start}' +
      '@media (max-width:900px){.mkg-row{grid-template-columns:1fr}}' +
      '.mkg-main,.mkg-side{display:flex;flex-direction:column;gap:10px;min-width:0}' +
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
      /* world chart */
      '.mkg-world svg{width:100%;height:auto;display:block}' +
      '.mkg-world .q{font:700 9px "Courier New",monospace;letter-spacing:1.2px;fill:currentColor;opacity:0.5}' +
      '.mkg-world .q.hot{fill:#f97316;opacity:0.85}' +
      '.mkg-world .ax{font-size:10.5px;fill:currentColor;opacity:0.7}' +
      '.mkg-world .lbl{font-size:11.5px;fill:currentColor;font-weight:600;pointer-events:none}' +
      '.mkg-world .pt{cursor:pointer}.mkg-world .pt:hover circle{stroke:#38bdf8;stroke-width:3}' +
      '.mkg-sum{font-size:0.82rem;line-height:1.55;margin-top:8px}' +
      '.mkg-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center;font-size:0.72rem}' +
      '.mkg-fx span.c{padding:2px 9px;border-radius:999px;border:1px solid var(--card-border,#1e3a5f);cursor:pointer}' +
      '.mkg-fx span.c.flag{border-color:#ef4444;color:#ef4444}' +
      '.mkg-tip{position:fixed;z-index:60;max-width:300px;padding:8px 10px;border-radius:8px;font-size:0.76rem;line-height:1.45;pointer-events:none;' +
      'background:#0b1628;color:#e2e8f0;border:1px solid #38bdf8;box-shadow:0 6px 20px rgba(0,0,0,0.4);display:none}' +
      /* chain card */
      '.mkg-chain{border:1px solid var(--card-border,#1e3a5f);border-left:4px solid #64748b;border-radius:10px;padding:10px 12px}' +
      '.mkg-chain.firing{border-left-color:#f97316}' +
      '.mkg-chain-h{font-weight:800;font-size:0.92rem;display:flex;justify-content:space-between;gap:8px;align-items:baseline}' +
      '.mkg-chain-r{display:flex;justify-content:space-between;gap:8px;font-size:0.78rem;padding:4px 0;border-top:1px solid rgba(127,127,127,0.15)}' +
      '.mkg-chain-r .v{font-weight:800;white-space:nowrap}' +
      '.mkg-chain-r.hot .v{color:#f97316}' +
      '.mkg-chain-p{font-size:0.8rem;line-height:1.5;margin:6px 0}' +
      '.mkg-chain-l{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
      '.mkg-chain-l a{font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(56,189,248,0.4);color:#38bdf8;text-decoration:none}' +
      '.mkg-chain-why{font-size:0.74rem;line-height:1.5;margin-top:6px}.mkg-chain-why summary{cursor:pointer;color:#38bdf8}' +
      /* folds */
      'details.mkg-fold{margin:12px 0;border:1px solid var(--card-border,#1e3a5f);border-radius:8px;padding:2px 12px}' +
      'details.mkg-fold>summary{cursor:pointer;padding:8px 0;font-size:0.82rem;line-height:1.45}' +
      'details.mkg-fold>summary b{color:var(--accent,#38bdf8);font-family:"Courier New",monospace;font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;margin-right:6px}' +
      'details.mkg-fold[open]>summary{border-bottom:1px solid var(--card-border,#1e3a5f);margin-bottom:8px}' +
      '.mkg-flash{outline:3px solid #38bdf8;outline-offset:2px;border-radius:6px}' +
      /* chips */
      '.mkg-chips{position:sticky;top:0;z-index:40;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:0 0 14px;' +
      'background:var(--bg-color,#060d1a);border-bottom:1px solid var(--card-border,#1e3a5f);scrollbar-width:thin}' +
      'body[data-theme="light"] .mkg-chips,[data-theme="light"] .mkg-chips{background:var(--bg-color,#e8f0f8)}' +
      '[data-theme="light"] .mkg-tip{background:#fff;color:#0f172a}' +
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
    el.innerHTML = '<div class="mkg-h"><span>Ten conditions (US market)</span><span class="mkg-pill" style="background:' + (BAND_COL[band] || '#64748b') + '">' +
      esc(band) + (d.composite != null ? ' · ' + esc(d.composite) : '') + '</span></div>' +
      '<div class="mkg-sub">What came before past crashes, measured on today’s markets. ' + nLit + ' of ' + keys.length +
      ' lit. Lit = present now; dim = quiet; dashed = no data. Hover for what each one means.</div>' +
      '<div class="mkg-lights">' + keys.map(function (k) {
        var f = lit[k], cls = f ? 'lit' : (unread[k] ? 'unread' : '');
        var tip = f ? ((f.plain || '') + (f.why ? ' Why it matters: ' + f.why : '')) : (unread[k] ? 'No data this cycle: unread, not calm.' : 'Quiet this cycle.');
        return '<div class="mkg-l ' + cls + '" title="' + esc(tip) + '"><span class="dot"></span>' + esc(nice(k)) + '</div>';
      }).join('') + '</div>' +
      (d.match_trend && d.match_trend.sentence ? '<div class="mkg-trend"><b>This week:</b> ' + esc(d.match_trend.sentence) + '</div>' : '') +
      '<div class="mkg-leg">Fragility, not prophecy: these say how dry the forest is, not whether lightning strikes.</div>';
    return el;
  }

  // ── Markets around the world (v1.1.0) ─────────────────────────────────
  function marketsOf(d) {
    var mk = ((d.regional_reads || {}).markets) || {};
    var pts = [], fx = [];
    Object.keys(mk).forEach(function (k) {
      var m = mk[k] || {}, top = (m.closest || [])[0] || null, det = m.detail || {};
      var rec = { key: k, name: m.name, short: short(m.name), flagged: !!m.flagged, sim: top ? +top.similarity_pct || 0 : 0,
                  pattern: top ? top.label : '', dd: det.pct_from_24m_high, fx6: det.fx_6m_pct, cur: m.currency,
                  conds: (m.conditions_now || []).map(function (c) { return c.words; }), region: m.region_name || '' };
      if (m.currency_only || rec.dd == null) fx.push(rec); else pts.push(rec);
    });
    return { pts: pts, fx: fx };
  }

  function tipText(p) {
    var t = '<b>' + esc(p.name) + '</b>' + (p.region ? ' · ' + esc(p.region) : '') + '<br>';
    if (p.dd != null) t += esc(p.dd) + '% from its two-year high';
    if (p.fx6 != null) t += (p.dd != null ? ' · ' : '') + esc(p.cur || 'currency') + ' ' + (p.fx6 > 0 ? '+' : '') + esc(p.fx6) + '% over 6 months';
    t += '<br>' + (p.pattern ? 'Closest past pattern: <b>' + esc(p.pattern) + '</b>, ' + p.sim + '% of its conditions' : 'No past pattern shares two or more of its conditions');
    if (p.conds.length) t += '<br>Present now: ' + esc(p.conds.slice(0, 4).join('; '));
    return t + '<br><i>Tap for the detail.</i>';
  }

  function worldBox(d) {
    var M = marketsOf(d);
    if (!M.pts.length && !M.fx.length) return null;
    var W = 640, H = 360, L = 54, R = 16, T = 26, B = 50;
    // Square-root scale: most markets sit within 10% of their highs, and a
    // straight scale stacks them in one strip. sqrt spreads the near-highs
    // zone and still keeps a -40% market on the chart.
    var minDD = Math.min(-25, Math.min.apply(null, M.pts.map(function (p) { return p.dd; }).concat([0])) * 1.15);
    var f = function (v) { return Math.sqrt(Math.max(0, -v)); };
    var x = function (v) { return L + (Math.max(0, Math.min(100, v)) / 100) * (W - L - R); };
    var y = function (v) { return T + 8 + (f(v) / f(minDD)) * (H - T - B - 8); };
    var xs = x(FLAG_AT), ys = y(FALLEN_AT), yb = H - B;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Markets placed by distance from their two-year high and by how much of a past crisis pattern they share">';
    // quadrant tints: the top-right corner is the one to watch
    s += '<rect x="' + xs + '" y="' + T + '" width="' + (W - R - xs) + '" height="' + (ys - T) + '" fill="rgba(249,115,22,0.11)"/>';
    s += '<rect x="' + xs + '" y="' + ys + '" width="' + (W - R - xs) + '" height="' + (yb - ys) + '" fill="rgba(239,68,68,0.06)"/>';
    s += '<rect x="' + L + '" y="' + T + '" width="' + (xs - L) + '" height="' + (yb - T) + '" fill="rgba(127,127,127,0.04)"/>';
    s += '<line x1="' + xs + '" x2="' + xs + '" y1="' + T + '" y2="' + yb + '" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="4 4"/>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ys + '" y2="' + ys + '" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="4 4"/>';
    // quadrant names sit in the margins, never on top of a dot
    s += '<text class="q" x="' + (L + 2) + '" y="' + (T - 8) + '">NEAR HIGHS · NO CLEAR PATTERN</text>';
    s += '<text class="q hot" x="' + (W - R) + '" y="' + (T - 8) + '" text-anchor="end">NEAR HIGHS · LOOKS LIKE A PAST SETUP</text>';
    s += '<text class="q" x="' + (L + 2) + '" y="' + (yb + 30) + '">FALLEN · NOT A KNOWN PATTERN</text>';
    s += '<text class="q" x="' + (W - R) + '" y="' + (yb + 30) + '" text-anchor="end">ALREADY FALLING · ALONG A PAST PATTERN</text>';
    // axes
    [0, 25, 50, 75, 100].forEach(function (v) { s += '<text class="ax" x="' + x(v) + '" y="' + (yb + 14) + '" text-anchor="middle">' + v + '%</text>'; });
    s += '<text class="ax" x="' + ((L + W - R) / 2) + '" y="' + (H - 2) + '" text-anchor="middle">share of a past crisis pattern’s conditions present now →</text>';
    [0, -5, -10, -20, -30, -40, -60].forEach(function (v) {
      if (v < minDD) return;
      s += '<text class="ax" x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '%</text>';
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="currentColor" stroke-opacity="0.07"/>';
    });
    s += '<text class="ax" transform="translate(13,' + ((T + yb) / 2) + ') rotate(-90)" text-anchor="middle">below its two-year high</text>';
    // points first, then labels placed to avoid dots and each other
    var boxes = [];
    var dots = M.pts.map(function (p) { return { p: p, x: x(p.sim), y: y(p.dd), r: p.flagged ? 8 : 6.5 }; });
    dots.forEach(function (d0) {
      var p = d0.p, col = p.flagged ? '#ef4444' : p.sim >= 40 ? '#f59e0b' : '#64748b';
      s += '<g class="pt" data-k="' + esc(p.key) + '"><circle cx="' + d0.x + '" cy="' + d0.y + '" r="' + d0.r + '" fill="' + col + '" fill-opacity="0.92" stroke="#0b1628" stroke-width="1.5"/></g>';
      boxes.push({ x1: d0.x - d0.r, x2: d0.x + d0.r, y1: d0.y - d0.r, y2: d0.y + d0.r });
    });
    function hits(b) {
      if (b.x1 < L || b.x2 > W - R || b.y1 < T || b.y2 > yb) return true;
      return boxes.some(function (o) { return b.x1 < o.x2 && b.x2 > o.x1 && b.y1 < o.y2 && b.y2 > o.y1; });
    }
    dots.slice().sort(function (a, b) { return (b.p.flagged - a.p.flagged) || (b.p.sim - a.p.sim); }).forEach(function (d0) {
      var w = d0.p.short.length * 6.6 + 4, h = 13, gap = d0.r + 3;
      var tries = [[gap, 4, 'start'], [-gap, 4, 'end'], [-w / 2, -gap - 2, 'mid'], [-w / 2, gap + 11, 'mid'],
                   [gap, -9, 'start'], [gap, 16, 'start'], [-gap, -9, 'end'], [-gap, 16, 'end']];
      var pick = null;
      for (var i = 0; i < tries.length && !pick; i++) {
        var t = tries[i], bx = t[2] === 'end' ? d0.x + t[0] - w : (t[2] === 'mid' ? d0.x + t[0] : d0.x + t[0]);
        var b = { x1: bx, x2: bx + w, y1: d0.y + t[1] - 10, y2: d0.y + t[1] - 10 + h };
        if (!hits(b)) pick = { b: b, tx: t[2] === 'end' ? bx + w : (t[2] === 'mid' ? bx + w / 2 : bx), anchor: t[2] === 'end' ? 'end' : (t[2] === 'mid' ? 'middle' : 'start'), ty: d0.y + t[1] };
      }
      if (!pick) {                                          // crowded: leader line to free space on the right
        var ty = d0.y, tx = d0.x + 26, bb;
        for (var k = 0; k < 12; k++) { bb = { x1: tx, x2: tx + w, y1: ty - 10, y2: ty + 3 }; if (!hits(bb)) break; ty += 13; }
        s += '<line x1="' + d0.x + '" y1="' + d0.y + '" x2="' + (tx - 2) + '" y2="' + (ty - 4) + '" stroke="currentColor" stroke-opacity="0.4"/>';
        pick = { b: bb, tx: tx, anchor: 'start', ty: ty };
      }
      boxes.push(pick.b);
      s += '<text class="lbl" x="' + pick.tx + '" y="' + pick.ty + '" text-anchor="' + pick.anchor + '">' + esc(d0.p.short) + '</text>';
    });
    s += '</svg>';

    // the so-what in one or two sentences, computed from the same points
    var hot = M.pts.filter(function (p) { return p.sim >= FLAG_AT && p.dd > FALLEN_AT; });
    var falling = M.pts.filter(function (p) { return p.sim >= FLAG_AT && p.dd <= FALLEN_AT; });
    var sum = [];
    if (hot.length) sum.push('<b>Near their highs and looking like a past setup:</b> ' + esc(list(hot.map(function (p) { return p.short + ' (' + p.pattern + ', ' + p.sim + '%)'; }))) + '. That is the corner where a shock would travel furthest.');
    if (falling.length) sum.push('<b>Already falling along a past pattern:</b> ' + esc(list(falling.map(function (p) { return p.short + ' (' + p.dd + '%, ' + p.pattern + ')'; }))) + '. The repricing there has started; the question is whether it spreads.');
    if (!hot.length && !falling.length) sum.push('<b>No market outside the US</b> shares half of a past crisis pattern on its own index and currency this cycle.');
    var fxH = M.fx.length ? '<div class="mkg-fx"><span style="opacity:0.7">Currencies read without a stock index:</span>' + M.fx.map(function (p) {
      return '<span class="c' + (p.flagged ? ' flag' : '') + '" data-k="' + esc(p.key) + '">' + esc(p.short) + (p.fx6 != null ? ' ' + (p.fx6 > 0 ? '+' : '') + esc(p.fx6) + '% (6m)' : '') + '</span>';
    }).join('') + '</div>' : '';

    var el = document.createElement('div');
    el.className = 'mkg-box mkg-world';
    el.id = 'mkgWorld';
    el.innerHTML = '<div class="mkg-h"><span>Markets around the world</span><span style="font-size:0.7rem;opacity:0.7;font-weight:600">' +
      M.pts.length + ' indexes · ' + M.fx.length + ' currencies · monthly closes</span></div>' +
      '<div class="mkg-sub">Each dot is a market read on its own index and currency. Up/down = how far below its two-year high; ' +
      'right = how much of a past crisis pattern it shares (red = flagged). Tap a dot for its detail.</div>' + s +
      '<div class="mkg-sum">' + sum.join(' ') + '</div>' + fxH +
      '<div class="mkg-leg">A shared pattern is a set of conditions in common, not a forecast; reserves, leverage and bond stress cannot be seen in these prices.</div>' +
      '<div class="mkg-tip"></div>';
    var all = {};
    M.pts.concat(M.fx).forEach(function (p) { all[p.key] = p; });
    var tip = el.querySelector('.mkg-tip');
    Array.prototype.forEach.call(el.querySelectorAll('[data-k]'), function (g) {
      var p = all[g.getAttribute('data-k')];
      g.addEventListener('mousemove', function (ev) {
        tip.innerHTML = tipText(p); tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX + 14, window.innerWidth - 320) + 'px'; tip.style.top = (ev.clientY + 14) + 'px';
      });
      g.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      g.addEventListener('click', function () { tip.style.display = 'none'; openMarket(p); });
    });
    return el;
  }

  function openMarket(p) {
    var fold = document.getElementById('mkgFoldMarkets');
    if (fold) fold.open = true;
    var box = document.getElementById('regionalReads');
    if (!box) return;
    var hit = null;
    Array.prototype.forEach.call(box.querySelectorAll('details'), function (dt) {
      var b = dt.querySelector('summary b');
      if (!hit && b && b.textContent === p.name) hit = dt;
    });
    var target = hit || box;
    if (hit) hit.open = true;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    target.classList.add('mkg-flash');
    setTimeout(function () { target.classList.remove('mkg-flash'); }, 1600);
  }

  // ── Chain ─────────────────────────────────────────────────────────────
  function chainCard(it) {
    var el = document.createElement('div');
    el.id = 'mkgChain';
    if (!it) {
      el.className = 'mkg-chain';
      el.innerHTML = '<div class="mkg-chain-h"><span>🔗 Chip supply chain watch</span></div>' +
        '<div class="mkg-chain-p">Not available yet: it appears once the commodities read has run. Unread, not calm.</div>';
      return el;
    }
    var f = it.facts || {}, links = f.links || [], hot = f.stressed_links || [];
    var firing = it.state === 'firing';
    el.className = 'mkg-chain' + (firing ? ' firing' : '');
    el.innerHTML = '<div class="mkg-chain-h"><span>🔗 ' + esc(it.name || 'Chip supply chain watch') + '</span>' +
      '<span style="font-size:0.7rem;font-weight:800;color:' + (firing ? '#f97316' : '#94a3b8') + '">' +
      (firing ? hot.length + ' LINKS MOVING' : 'STANDING WATCH') + '</span></div>' +
      ((it.text || it.plain) ? '<div class="mkg-chain-p">' + esc(it.text || it.plain) + '</div>' : '') +
      links.map(function (l) {
        var v = ('change_30d_pct' in l) ? ((l.change_30d_pct > 0 ? '+' : '') + l.change_30d_pct + '% (30d)') : esc(l.state || 'unread');
        return '<div class="mkg-chain-r' + (l.stressed ? ' hot' : '') + '"><span>' + esc(l.link) + '</span><span class="v">' + v + '</span></div>';
      }).join('') +
      '<details class="mkg-chain-why"><summary>Why these links</summary>Silicon becomes wafers; rare earths go into the magnets and tools; ' +
      'most advanced chips are made beside the Taiwan Strait; and this page’s semiconductor reading says whether investors are over-excited about chips. ' +
      'One link moving can be noise. Two or more moving together is the pattern. The same card shows on Commodities and Military.</details>' +
      '<div class="mkg-chain-l"><a href="commodities.html">Commodities →</a><a href="military.html">Military →</a></div>';
    return el;
  }

  function loadChain() {
    if (last.chainP) return last.chainP;
    last.chainP = fetch(ME + '/api/tracker-voice?desk=commodities').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var it = null;
        ((j && j.explainers) || []).forEach(function (e) { if (e && e.id === 'chain_watch:chips') it = e; });
        if (it && j.view && j.view.items && j.view.items[it.id]) it.text = j.view.items[it.id].what_it_means || '';
        last.chain = it;
        return it;
      }).catch(function () { return null; });
    return last.chainP;
  }

  // ── folds: detail the top of the page already shows ───────────────────
  function labelBefore(id) {
    var n = document.getElementById(id);
    var p = n && n.previousElementSibling;
    return (p && p.classList.contains('feature-section-label')) ? p : null;
  }
  function fold(id, foldId, summaryHTML, nodes) {
    var f = document.getElementById(foldId);
    if (!f) {
      var first = nodes.filter(Boolean)[0];
      if (!first) return null;
      f = document.createElement('details');
      f.className = 'mkg-fold'; f.id = foldId;
      f.innerHTML = '<summary></summary>';
      first.parentNode.insertBefore(f, first);
      nodes.filter(Boolean).forEach(function (n) { f.appendChild(n); });
    }
    f.querySelector('summary').innerHTML = summaryHTML;
    return f;
  }

  function folds(d) {
    var nLit = (d.active_features || []).length;
    // 1. what each lit condition means (the lights show which are lit)
    var la = labelBefore('activeFeatures');
    if (la) la.style.display = 'none';
    fold('activeFeatures', 'mkgFoldActive', '<b>Lit conditions</b>' + nLit + ' lit: ' +
      esc((d.active_features || []).map(function (f) { return nice(nameOf(f)); }).join(', ') || 'none') +
      '. Open for what each means and its precedent.', [document.getElementById('activeFeatures')]);
    // 2. quiet chips: the lights already show quiet and no-data conditions
    var lq = labelBefore('quietFeatures'), q = document.getElementById('quietFeatures');
    if (lq) lq.style.display = 'none';
    if (q) q.style.display = 'none';
    // 3. market-by-market detail: the world chart shows them all
    var rr = d.regional_reads || {}, flags = rr.flags || [];
    var lm = labelBefore('regionalReads');
    if (lm) lm.style.display = 'none';
    fold('regionalReads', 'mkgFoldMarkets', '<b>Market by market</b>' + Object.keys(rr.markets || {}).length + ' markets read; ' +
      (flags.length ? flags.length + ' flagged: ' + esc(flags.map(function (f) { return short(f.name); }).join(', ')) : 'none flagged') +
      '. The world chart at the top places them all; open for each one’s conditions.', [document.getElementById('regionalReads')]);
    // 4. the episode table (the year strip stays visible)
    var lib = document.querySelector('.library-card');
    if (lib && !document.getElementById('mkgFoldLib')) {
      var tabs = document.getElementById('libraryTabs');
      var tbl = lib.querySelector('.episode-table');
      var wrap = tbl ? tbl.parentNode : null;
      var foot = document.getElementById('libraryFootnote');
      var after = foot ? foot.nextElementSibling : null;
      fold(null, 'mkgFoldLib', '<b>Episode table</b>Every past episode, its lead time and drawdown, by region. Open to read it.', [tabs, wrap, foot, after]);
    }
  }

  // ── placement ─────────────────────────────────────────────────────────
  var moved = false;
  function restructure() {
    if (moved) return;
    var frag = document.getElementById('fragilityCard'), rep = document.getElementById('repricingCard');
    var odds = document.querySelector('[data-asifah-markets="market-watch"]');
    if (!frag || !rep) return;
    moved = true;
    frag.parentNode.insertBefore(rep, frag);            // conflict repricing first
    if (odds) frag.parentNode.insertBefore(odds, frag); // then traders' odds, then the fragility detail
  }

  function placeRead(d) {
    ['mkgLights', 'mkgWorld', 'mkgChain'].forEach(function (id) { var o = document.getElementById(id); if (o) o.parentNode.removeChild(o); });
    var lights = lightsBox(d), world = worldBox(d), chain = chainCard(last.chain);
    var grid = document.querySelector('#tvCard .tv-grid');
    if (!grid) {
      var hb = document.getElementById('headlineBanner');
      if (hb) [chain, world, lights].forEach(function (n) { if (n) { n.style.margin = '0 0 12px'; hb.parentNode.insertBefore(n, hb.nextSibling); } });
      return false;
    }
    var row = document.getElementById('mkgRow'), main, side;
    if (!row) {
      row = document.createElement('div'); row.className = 'mkg-row'; row.id = 'mkgRow';
      main = document.createElement('div'); main.className = 'mkg-main';
      side = document.createElement('div'); side.className = 'mkg-side';
      grid.parentNode.insertBefore(row, grid);
      row.appendChild(main); row.appendChild(side); side.appendChild(grid);
      grid.classList.add('mkg-side-grid');
    } else { main = row.querySelector('.mkg-main'); }
    main.appendChild(lights);
    if (world) main.appendChild(world);
    main.appendChild(chain);
    return true;
  }

  function chips() {
    var old = document.getElementById('mkgChips');
    if (old) old.parentNode.removeChild(old);
    var first = document.getElementById('tvCard') || document.getElementById('headlineBanner');
    if (!first) return;
    var T = [['Read', first], ['World markets', document.getElementById('mkgWorld')],
             ['Chip chain', document.getElementById('mkgChain')],
             ['Conflict repricing', document.getElementById('repricingCard')],
             ["Traders' odds", document.querySelector('[data-asifah-markets="market-watch"]')],
             ['Fragility detail', document.getElementById('fragilityCard')],
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
        if (target.style && target.style.display === 'none') target = document.getElementById('regionTabs') || target;
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
      if (document.querySelector('#tvCard .tv-grid') && last.d) { mo.disconnect(); waiting = false; placeRead(last.d); chips(); kick(); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); waiting = false; }, 60000);
  }

  function kick() { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60); }

  function render(d) {
    try {
      if (!d) return;
      last.d = d;
      css();
      restructure();
      folds(d);
      if (!placeRead(d)) waitForGrid();
      chips();
      kick();
      loadChain().then(function () {
        placeRead(last.d);
        chips();
        kick();
      });
    } catch (e) { console.warn('[Market glance]', e); }
  }

  window.AsifahMarketGlance = { render: render };
})();
