/* Asifah Analytics -- MILITARY GLANCE  v1.1.0  (Nov 15 2026)
 *
 * v1.1.0: chokepoint tiles carry SHIP COUNTS (ships a day against the pre-war
 *   normal, a share-of-normal bar, standing-since or NEW step change), from
 *   military tracker v3.19.0. The map pin tooltip leads with the ship count.
 *
 * v1.0.1 (Rachel): Theatres prose folds closed like the chokepoint detail, so the
 *   chokepoint tiles and the naval tracker follow the read directly; Traders' odds
 *   move up to sit right under the naval map, then Active Military Actors.
 *
 * The military.html top-to-bottom pass (Rachel, Nov 15: "readable,
 * interactable, not click-baity, but something that draws people to look
 * deeper"). The page was first built to answer WHERE IS IT HOT; it grew a
 * list of sections on top of that. This module puts the answer back first:
 *
 *   1. READ  -- the plain-language read, and beside it a "Where it's hot"
 *      world map: countries tinted by their military-reporting level, the
 *      watched chokepoints as pins in their band colour. Tap a country ->
 *      its theatre; tap a pin -> its chokepoint tile. Right column: the
 *      At-a-glance boxes + "Hottest right now" (top actors).
 *   2. CHOKEPOINTS -- every watched strait as a tile, most serious first,
 *      with "what it touches" links (Hormuz -> oil, food, Oman).
 *   3. NAVAL ASSET TRACKER -- moved up from 8th place; Named-Asset Movement
 *      folds in under it. Positions come from NEWS REPORTING, and the
 *      section says so, with each report's age.
 *   4. THEATRES & ACTORS, then TARGET POSTURE.
 *   5. Traders' odds, the status counts and asset mix, then the signal feed.
 *   + sticky section chips.
 *
 * Display only: reads the payload the page already fetched (no new calls,
 * except the world outline asifah-geo loads once from the CDN).
 * The page calls AsifahMilitaryGlance.render(data) at the end of renderAll().
 */
(function () {
  'use strict';

  var BAND_LVL = { open: 0, monitored: 2, contested: 3, disrupted: 4 };
  var BAND_WORD = { open: 'Open', monitored: 'Watched', contested: 'Contested', disrupted: 'Disrupted' };
  var ALERT_LVL = { normal: 0, elevated: 2, high: 3, surge: 4 };
  var ALERT_WORD = { normal: 'Routine', elevated: 'Above normal', high: 'Heavy', surge: 'Heaviest' };
  var COL = ['#6b7280', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#991b1b', '#3b0764'];
  // actors that are not one country's territory: never tint a whole map shape for them
  var NOT_A_COUNTRY = { us: 1, nato: 1, wagner_africa: 1 };
  var ACTOR_NAME_FIX = { north_korea: 'north korea', drc: 'democratic republic of the congo',
                         central_african_republic: 'central african republic', uk: 'united kingdom' };

  // chokepoint id (military tracker) -> where to draw it + what it touches
  var CP = {
    hormuz:          { label: 'Strait of Hormuz', at: [56.4, 26.6],
                       why: 'About a fifth of the world’s oil and LNG, plus Gulf fertiliser and sulfur.',
                       links: [['Oil, gas & food', 'commodities.html'], ['Oman', 'rhetoric-oman.html'], ['Iran', 'rhetoric-iran.html']] },
    bab_el_mandeb:   { label: 'Bab el-Mandeb', at: [43.4, 12.6],
                       why: 'The Red Sea gate: Suez traffic, Black Sea grain to Asia and East Africa, Asian rice and palm oil to Europe.',
                       links: [['Food & oil', 'commodities.html'], ['Yemen', 'rhetoric-yemen.html'], ['Egypt', 'rhetoric-egypt.html']] },
    suez:            { label: 'Suez Canal', at: [32.55, 30.5], why: 'Europe–Asia shipping and Egypt’s hard currency.',
                       links: [['Egypt', 'rhetoric-egypt.html'], ['Commodities', 'commodities.html']] },
    black_sea:       { label: 'Black Sea', at: [34.0, 43.2], why: 'Ukrainian and Russian grain, sunflower oil and fertiliser.',
                       links: [['Ukraine', 'rhetoric-ukraine.html'], ['Food', 'commodities.html']] },
    bosporus:        { label: 'Turkish Straits', at: [29.0, 41.1], why: 'The only sea exit for Black Sea grain and Russian oil.',
                       links: [['Turkey', 'rhetoric-turkey.html']] },
    baltic:          { label: 'Baltic Sea', at: [19.5, 57.5], why: 'NATO’s northern flank, undersea cables and the shadow fleet.',
                       links: [['Russia', 'rhetoric-russia.html'], ['Poland', 'rhetoric-poland.html']] },
    taiwan_strait:   { label: 'Taiwan Strait', at: [119.6, 24.2], why: 'The busiest container lane on earth and most of the world’s advanced chips.',
                       links: [['Taiwan', 'rhetoric-taiwan.html'], ['China', 'rhetoric-china.html']] },
    luzon_strait:    { label: 'Luzon Strait', at: [121.2, 20.6], why: 'The Pacific gate between Taiwan and the Philippines.',
                       links: [['Philippines', 'rhetoric-philippines.html']] },
    south_china_sea: { label: 'South China Sea', at: [114.0, 13.0], why: 'A third of seaborne trade and the Philippine and Vietnamese claims.',
                       links: [['Philippines', 'rhetoric-philippines.html'], ['Vietnam', 'rhetoric-vietnam.html']] },
    malacca:         { label: 'Strait of Malacca', at: [100.4, 3.2], why: 'Gulf oil to East Asia and Southeast Asian palm oil.',
                       links: [['Commodities', 'commodities.html']] },
    panama_canal:    { label: 'Panama Canal', at: [-79.7, 9.1], why: 'US grain and LNG to Asia.', links: [['Panama', 'panama-stability.html']] },
    caribbean:       { label: 'Caribbean', at: [-74.0, 15.5], why: 'US operations around Venezuela and Cuba.',
                       links: [['Venezuela', 'rhetoric-venezuela.html'], ['Cuba', 'rhetoric-cuba.html']] },
    arctic:          { label: 'Arctic', at: [-10, 78], why: 'Greenland, the High North and the polar sea routes.', links: [['Greenland', 'rhetoric-greenland.html']] },
    magellan:        { label: 'Strait of Magellan', at: [-70.9, -53.4], why: 'The southern bypass when Panama is closed.', links: [['Chile', 'rhetoric-chile.html']] },
    gibraltar:       { label: 'Gibraltar', at: [-5.6, 36.0], why: 'The Atlantic–Mediterranean gate.', links: [] },
    sicily_strait:   { label: 'Strait of Sicily', at: [12.0, 37.0], why: 'Central Mediterranean shipping and migration.', links: [] },
    sunda_strait:    { label: 'Sunda / Lombok', at: [105.8, -6.0], why: 'The bypass when Malacca is closed.', links: [] },
    mediterranean:   { label: 'Eastern Mediterranean', at: [33.0, 34.5], why: 'Israel, Lebanon, Cyprus and the gas fields.', links: [] },
    bering_strait:   { label: 'Bering Strait', at: [-169, 65.8], why: 'The US–Russia Arctic gap.', links: [] }
  };

  var last = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  function css() {
    if (document.getElementById('mgCss')) return;
    var st = document.createElement('style');
    st.id = 'mgCss';
    st.textContent =
      '.mg-row{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;align-items:start}' +
      '@media (max-width:900px){.mg-row{grid-template-columns:1fr}}' +
      '.mg-side{display:flex;flex-direction:column;gap:8px;min-width:0}' +
      '.mg-side .tv-grid.mg-side-grid{grid-template-columns:1fr}' +
      '.mg-box{border:1px solid var(--border-color,#1e3a5f);border-radius:10px;padding:10px 12px;background:rgba(56,189,248,0.04);min-width:0;position:relative}' +
      '.mg-h{font-weight:800;font-size:0.92rem;margin-bottom:2px}' +
      '.mg-sub{font-size:0.74rem;opacity:0.75;margin-bottom:6px}' +
      '.mg-box svg{width:100%;height:auto;display:block}' +
      '.mg-c{cursor:pointer;transition:opacity .15s}.mg-c:hover{opacity:.75}' +
      '.mg-leg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:0.7rem;opacity:0.8;margin-top:6px}' +
      '.mg-leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}' +
      '.mg-tip{position:absolute;z-index:30;pointer-events:none;background:#0d1b2e;color:#e2f0fb;border:1px solid #1e3a5f;border-radius:6px;padding:6px 9px;font-size:0.76rem;line-height:1.4;max-width:280px;display:none}' +
      '.mg-tip b{display:block}' +
      '.mg-hot{border:1px solid var(--border-color,#1e3a5f);border-radius:10px;padding:10px 12px}' +
      '.mg-hot-h{font-weight:800;font-size:0.88rem;margin-bottom:6px}' +
      '.mg-hot-r{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 78px;gap:8px;align-items:center;width:100%;background:none;border:0;' +
      'border-top:1px solid rgba(127,127,127,0.15);padding:5px 0;color:inherit;font:inherit;font-size:0.8rem;cursor:pointer;text-align:left}' +
      '.mg-hot-r:hover .mg-hot-n{color:#38bdf8}' +
      '.mg-hot-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.mg-bar{height:7px;border-radius:4px;background:rgba(127,127,127,0.15);overflow:hidden}.mg-bar i{display:block;height:100%;border-radius:4px}' +
      '.mg-hot-b{font-size:0.64rem;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;text-align:right}' +
      '.mg-foot{font-size:0.7rem;opacity:0.65;margin-top:4px}' +
      /* chokepoint strip */
      '.mg-cp-wrap{margin:18px 0 6px}' +
      '.mg-cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}' +
      '.mg-cp{border:1px solid var(--border-color,#1e3a5f);border-left-width:4px;border-radius:9px;padding:9px 12px;background:var(--card-bg,transparent)}' +
      '.mg-cp.open{opacity:0.72}' +
      '.mg-cp-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-weight:800;font-size:0.9rem}' +
      '.mg-cp-chip{font-size:0.62rem;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;padding:2px 8px;border-radius:999px;color:#fff;white-space:nowrap}' +
      '.mg-cp-t{font-size:0.8rem;line-height:1.45;margin-top:4px}' +
      '.mg-cp-w{font-size:0.74rem;opacity:0.7;margin-top:3px;font-style:italic}' +
      '.mg-cp-l{margin-top:5px;display:flex;flex-wrap:wrap;gap:5px}' +
      '.mg-cp-l a{font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(56,189,248,0.4);color:#38bdf8;text-decoration:none}' +
      '.mg-cp-l a:hover{background:rgba(56,189,248,0.1)}' +
      '.mg-cp.mg-flash{outline:3px solid #38bdf8;outline-offset:2px}' +
      '.mg-sm{margin:6px 0 4px;padding:7px 9px;border-radius:7px;background:rgba(127,127,127,0.07);font-size:0.76rem;line-height:1.4;cursor:help}' +
      '.mg-sm-h{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}' +
      '.mg-sm-tag{font-size:0.62rem;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;padding:1px 7px;border-radius:999px;border:1px solid rgba(148,163,184,0.5);opacity:0.9}' +
      '.mg-sm-tag.new{border-color:#ef4444;color:#ef4444}.mg-sm-tag.up{border-color:#10b981;color:#10b981}' +
      '.mg-sm-bar{height:7px;border-radius:4px;background:rgba(127,127,127,0.2);margin:5px 0 4px;overflow:hidden}' +
      '.mg-sm-bar span{display:block;height:100%;border-radius:4px}' +
      '.mg-sm-f{font-size:0.68rem;opacity:0.7}.mg-sm-b{font-size:0.68rem;opacity:0.85;margin-top:3px;font-style:italic}' +
      '.mg-cp-more{font-size:0.75rem;opacity:0.7;margin-top:6px;cursor:pointer;text-decoration:underline}' +
      '.mg-naval-note{font-size:0.78rem;line-height:1.45;opacity:0.85;margin:0 0 10px;padding:8px 12px;border-left:3px solid #38bdf8;background:rgba(56,189,248,0.05);border-radius:6px}' +
      '.theatre-section.mg-flash{outline:3px solid #38bdf8;outline-offset:3px;border-radius:10px}' +
      /* chips */
      '.mg-chips{position:sticky;top:0;z-index:40;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;margin:0 0 14px;' +
      'background:var(--bg-color,#060d1a);border-bottom:1px solid var(--border-color,#1e3a5f);scrollbar-width:thin}' +
      '[data-theme="light"] .mg-chips{background:var(--bg-color,#e8f0f8)}' +
      '.mg-chip{flex:0 0 auto;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;padding:5px 11px;border-radius:999px;cursor:pointer;' +
      'border:1px solid var(--border-color,#1e3a5f);color:var(--text-secondary,#93c5fd);background:transparent;white-space:nowrap}' +
      '.mg-chip:hover{border-color:#38bdf8;color:#38bdf8;background:rgba(56,189,248,0.08)}';
    document.head.appendChild(st);
  }

  // ── data ──────────────────────────────────────────────────────────────
  function chokepoints(data) {
    var post = data.chokepoint_postures || {};
    var prose = ((data.interpretation || {}).chokepoint_prose) || {};
    return Object.keys(post).map(function (id) {
      var p = post[id] || {}, band = String(p.alert_level || 'open').toLowerCase();
      var pr = prose[id] || {};
      var line = pr.prose || pr.text || pr.summary || '';
      // v1.1.0: when ship counts set the level, the prose repeats the meter;
      // show the newest headline instead (the meter carries the ships).
      if (p.transits && p.level_basis === 'ship_counts') {
        var t0 = (p.top_signals || [])[0];
        line = t0 ? ('Newest reporting: ' + (t0.article_title || t0.title || '')) : '';
      }
      if (!line) {
        var ts = (p.top_signals || [])[0];
        line = ts ? (ts.article_title || ts.title || '') : '';
      }
      if (!line) line = band === 'open' ? 'No reporting matched this scan: unread, not calm.'
                                        : (p.signal_count || 0) + ' signal' + (p.signal_count === 1 ? '' : 's') + ' mention this lane this scan; none is an attack or seizure.';
      return { id: id, band: band, lvl: BAND_LVL[band] || 0, n: p.signal_count || 0, line: line, tr: p.transits || null,
               basis: p.level_basis || 'reporting', reportingLevel: p.reporting_level || band,
               meta: CP[id] || { label: cap(id.replace(/_/g, ' ')), why: '', links: [] } };
    }).sort(function (a, b) { return (b.lvl - a.lvl) || (b.n - a.n); });
  }

  function actors(data) {
    var a = data.actor_summaries || {};
    return Object.keys(a).map(function (id) {
      var s = a[id] || {}, band = String(s.alert_level || 'normal').toLowerCase();
      return { id: id, name: s.name || id, flag: s.flag || '', theatre: s.theatre || '', band: band,
               lvl: ALERT_LVL[band] || 0, score: +s.total_score || 0, n: s.signal_count || 0,
               top: ((s.top_signals || [])[0] || {}).article_title || '' };
    });
  }

  // ── the map ───────────────────────────────────────────────────────────
  function mapBox(data) {
    var el = document.createElement('div');
    el.className = 'mg-box';
    el.id = 'mgMap';
    el.innerHTML = '<div class="mg-h">Where it’s hot</div>' +
      '<div class="mg-sub">Countries tinted by how heavy their military reporting is this scan; diamonds are the watched sea lanes. Tap a country for its theatre, a diamond for its lane.</div>' +
      '<div class="mg-svg">Loading the map…</div><div class="mg-tip"></div>';
    var G = window.AsifahGeo;
    if (!G || !window.Promise) { el.querySelector('.mg-svg').textContent = 'Map unavailable on this browser.'; return el; }
    G.loadWorld().then(function (w) {
      draw(el, w, data);
    }).catch(function () { el.querySelector('.mg-svg').textContent = 'The world outline could not load: the lists below carry the same read.'; });
    return el;
  }

  function draw(el, w, data) {
    var d3 = window.d3, topo = window.topojson, G = window.AsifahGeo;
    var W = 960, H = 470;
    var feats = topo.feature(w, w.objects.countries).features.filter(function (f) { return String(f.id) !== '010'; });
    var proj = d3.geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'FeatureCollection', features: feats });
    var path = d3.geoPath(proj);
    var byId = {};
    actors(data).forEach(function (a) {
      if (NOT_A_COUNTRY[a.id] || a.lvl < 2) return;
      (G.idsFor(ACTOR_NAME_FIX[a.id] || a.id) || []).forEach(function (cid) {
        if (!byId[cid] || byId[cid].lvl < a.lvl) byId[cid] = a;
      });
    });
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    var base = light ? '#cbd5e1' : '#1e293b', edge = light ? '#ffffff' : '#0b1626';
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="World map of military reporting levels">';
    feats.forEach(function (f) {
      var a = byId[+f.id];
      var fill = a ? COL[a.lvl] : base;
      s += '<path d="' + path(f) + '" fill="' + fill + '" fill-opacity="' + (a ? 0.85 : 1) + '" stroke="' + edge + '" stroke-width="0.4"' +
        (a ? ' class="mg-c" data-actor="' + esc(a.id) + '"' : '') + '/>';
    });
    // chokepoint pins via the shared pin painter
    var lv = {};
    chokepoints(data).forEach(function (c) {
      if (c.band === 'open' || !c.meta.at) return;
      var tx = [];
      if (c.tr && c.tr.ratio_pct != null) tx.push('Ships: ~' + Math.round(c.tr.avg_7d) + '/day, ' + c.tr.ratio_pct + '% of pre-war normal' +
        (c.tr.step_change ? ' (NEW this week)' : (c.tr.band !== 'normal' ? ' (standing)' : '')));
      if (c.line) tx.push(c.line.slice(0, 140));
      lv[c.id] = { level: c.lvl, texts: tx, n: c.n,
                   place: { key: c.id, label: c.meta.label, at: c.meta.at } };
    });
    G.pinCss();
    s += G.pinsSvg(proj, W, H, lv, 'gpi', 0, 0) + '</svg>';
    el.querySelector('.mg-svg').innerHTML = s;
    var tip = el.querySelector('.mg-tip');
    G.bindPins(el, tip, lv);
    Array.prototype.forEach.call(el.querySelectorAll('.asf-pin'), function (g) {
      g.addEventListener('click', function () { openCp(g.getAttribute('data-place')); });
    });
    var amap = {};
    actors(data).forEach(function (a) { amap[a.id] = a; });
    Array.prototype.forEach.call(el.querySelectorAll('path.mg-c'), function (p) {
      var a = amap[p.getAttribute('data-actor')];
      p.addEventListener('mousemove', function (ev) {
        var b = el.getBoundingClientRect();
        tip.innerHTML = '<b>' + esc(a.flag + ' ' + a.name) + '</b>' + ALERT_WORD[a.band] + ' military reporting · ' + a.n +
          ' signal' + (a.n === 1 ? '' : 's') + (a.top ? '<br>' + esc(a.top.slice(0, 120)) : '');
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX - b.left + 14, b.width - 290) + 'px';
        tip.style.top = (ev.clientY - b.top + 14) + 'px';
      });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { openTheatre(a.theatre); });
    });
    var leg = document.createElement('div');
    leg.className = 'mg-leg';
    leg.innerHTML = '<span><i style="background:' + COL[2] + '"></i>Above normal</span><span><i style="background:' + COL[3] + '"></i>Heavy</span>' +
      '<span><i style="background:' + COL[4] + '"></i>Heaviest</span>' + G.PIN_LEGEND.replace('named in a live signal', 'watched by this tracker') +
      '<span style="opacity:0.8">US, NATO and Wagner forces operate across many places, so they are listed, not painted.</span>';
    el.appendChild(leg);
  }

  function hottest(data) {
    var top = actors(data).filter(function (a) { return a.lvl >= 2; })
      .sort(function (a, b) { return (b.lvl - a.lvl) || (b.score - a.score); }).slice(0, 7);
    if (!top.length) return null;
    var max = Math.max.apply(null, top.map(function (a) { return a.score; })) || 1;
    var el = document.createElement('div');
    el.className = 'mg-hot';
    el.id = 'mgHot';
    el.innerHTML = '<div class="mg-hot-h">Hottest right now</div>' + top.map(function (a) {
      return '<button type="button" class="mg-hot-r" data-theatre="' + esc(a.theatre) + '"><span class="mg-hot-n">' + esc(a.flag + ' ' + a.name) + '</span>' +
        '<span class="mg-bar"><i style="width:' + Math.max(5, Math.round(a.score / max * 100)) + '%;background:' + COL[a.lvl] + '"></i></span>' +
        '<span class="mg-hot-b" style="color:' + COL[a.lvl] + '">' + ALERT_WORD[a.band] + '</span></button>';
    }).join('') + '<div class="mg-foot">Bar = weight of military reporting this scan. It measures reporting, not forces on the ground. Tap for the theatre.</div>';
    Array.prototype.forEach.call(el.querySelectorAll('.mg-hot-r'), function (b) {
      b.addEventListener('click', function () { openTheatre(b.getAttribute('data-theatre')); });
    });
    return el;
  }

  function openTheatre(tid) {
    var sec = document.getElementById('theatre-' + tid);
    if (!sec) return;
    if (sec.classList.contains('collapsed') && typeof window.toggleTheatre === 'function') window.toggleTheatre(tid);
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sec.classList.add('mg-flash');
    setTimeout(function () { sec.classList.remove('mg-flash'); }, 1600);
  }
  function openCp(id) {
    var t = document.getElementById('mgcp-' + id);
    if (!t) return;
    t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    t.classList.add('mg-flash');
    setTimeout(function () { t.classList.remove('mg-flash'); }, 1600);
  }

  // ── chokepoint strip ──────────────────────────────────────────────────
  // v1.1.0 (Nov 15 2026): SHIP COUNTS. Measured traffic against the pre-war
  // normal (IMF PortWatch via chokepoint_transits on the ME backend). The bar
  // is the share of normal; the tag says standing (long-running) or NEW.
  function shipMeter(c) {
    var t = c.tr;
    if (!t || t.ratio_pct == null) return '';
    var pct = Math.max(0, Math.min(100, t.ratio_pct));
    // colour by the WORSE comparison: Bab el-Mandeb at 85% of 2025 is still a
    // third of its pre-2023 traffic, and green would hide that.
    var worst = Math.min(pct, t.long_baseline_pct != null ? t.long_baseline_pct : 100);
    var col = worst >= 75 ? '#10b981' : worst >= 50 ? '#f59e0b' : worst >= 25 ? '#f97316' : '#ef4444';
    var wk = t.latest_date ? new Date(t.latest_date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
    var d = t.standing_since ? new Date(t.standing_since + 'T00:00:00Z') : null;
    var sinceTxt = d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
    var tag = t.step_change === 'drop' ? '<span class="mg-sm-tag new">NEW: sharp drop this week</span>'
            : t.step_change === 'rise' ? '<span class="mg-sm-tag up">NEW: traffic recovering</span>'
            : (t.band !== 'normal' ? '<span class="mg-sm-tag">Standing' + (sinceTxt ? ' since ' + esc(sinceTxt) : '') + '</span>' : '');
    var fmt = function (x) { return x >= 10 ? Math.round(x) : (Math.round(x * 10) / 10); };
    var basis = c.basis === 'ship_counts' && c.reportingLevel !== c.band
      ? '<div class="mg-sm-b">Level set by ship counts. Reporting alone read ' + esc(BAND_WORD[c.reportingLevel] || c.reportingLevel) + '.</div>' : '';
    return '<div class="mg-sm" title="' + esc(t.plain || '') + '">' +
      '<div class="mg-sm-h"><b>Ships: ~' + fmt(t.avg_7d) + '/day</b> vs ~' + fmt(t.baseline_avg) + ' before the war ' + tag + '</div>' +
      '<div class="mg-sm-bar"><span style="width:' + Math.max(pct, 1.5) + '%;background:' + col + '"></span></div>' +
      '<div class="mg-sm-f">' + t.ratio_pct + '% of normal · week to ' + esc(wk) +
      (t.long_baseline_pct != null ? ' · ' + t.long_baseline_pct + '% of pre-2023 Red Sea traffic' : '') +
      ' · IMF PortWatch, ~' + (t.lag_days || 7) + ' days behind, misses ships running dark</div>' + basis + '</div>';
  }

  function cpStrip(data) {
    var cps = chokepoints(data);
    if (!cps.length) return null;
    var wrap = document.createElement('div');
    wrap.className = 'mg-cp-wrap';
    wrap.id = 'mgChokepoints';
    var live = cps.filter(function (c) { return c.band !== 'open'; }), quiet = cps.filter(function (c) { return c.band === 'open'; });
    function tile(c) {
      var col = COL[c.lvl];
      return '<div class="mg-cp ' + c.band + '" id="mgcp-' + esc(c.id) + '" style="border-left-color:' + col + '">' +
        '<div class="mg-cp-h"><span>' + esc(c.meta.label) + '</span><span class="mg-cp-chip" style="background:' + col + '">' + BAND_WORD[c.band] + '</span></div>' +
        shipMeter(c) +
        (c.line ? '<div class="mg-cp-t">' + esc(c.line.length > 220 ? c.line.slice(0, 217) + '…' : c.line) + '</div>' : '') +
        (c.meta.why ? '<div class="mg-cp-w">Why it matters: ' + esc(c.meta.why) + '</div>' : '') +
        ((c.meta.links || []).length && c.band !== 'open' ? '<div class="mg-cp-l">' + c.meta.links.map(function (l) {
          return '<a href="' + l[1] + '">' + esc(l[0]) + ' →</a>'; }).join('') + '</div>' : '') +
        '</div>';
    }
    wrap.innerHTML = '<div class="section-header"><span class="icon">⚓</span> <span>Chokepoints</span></div>' +
      '<div class="mg-cp-grid">' + live.map(tile).join('') + '</div>' +
      (quiet.length ? '<div class="mg-cp-more" id="mgCpMore">' + quiet.length + ' more watched lane' + (quiet.length === 1 ? '' : 's') +
        ' read Open: ' + esc(quiet.map(function (c) { return c.meta.label; }).join(', ')) + ' (show)</div>' +
        '<div class="mg-cp-grid" id="mgCpQuiet" style="display:none;margin-top:8px">' + quiet.map(tile).join('') + '</div>' : '');
    var more = wrap.querySelector('#mgCpMore');
    if (more) more.addEventListener('click', function () {
      var q = wrap.querySelector('#mgCpQuiet');
      q.style.display = q.style.display === 'none' ? '' : 'none';
    });
    return wrap;
  }

  // ── restructure (once) ────────────────────────────────────────────────
  function sectionOf(id) {            // a .section-header + its block
    var blk = document.getElementById(id);
    if (!blk) return null;
    var h = blk.previousElementSibling;
    return (h && h.classList.contains('section-header')) ? [h, blk] : [blk];
  }
  var moved = false;
  function restructure() {
    if (moved) return;
    var ta = document.getElementById('taCard');
    var main = ta && ta.parentNode;
    if (!main) return;
    moved = true;
    var after = ta;
    function put(nodes) {
      (nodes || []).forEach(function (n) { if (n) { after.parentNode.insertBefore(n, after.nextSibling); after = n; } });
    }
    // 3. naval tracker (+ named-asset movement) right after the read & chokepoints
    var navWrap = document.querySelector('.naval-map-section');
    var navHead = navWrap && navWrap.previousElementSibling;
    if (navWrap) {
      var note = document.createElement('div');
      note.className = 'mg-naval-note';
      note.innerHTML = 'Positions here come from <b>news reporting</b> (USNI News, The War Zone, Naval News and defence feeds), not live tracking. ' +
        'Each marker’s popup says how old its newest report is. A ship last reported a week ago may have moved.';
      navWrap.insertBefore(note, navWrap.firstChild);
      var mv = document.getElementById('taMovementSection');
      if (mv) navWrap.appendChild(mv);
      put([navHead && navHead.classList.contains('section-header') ? navHead : null, navWrap]);
    }
    // 4. traders' odds right under the naval map (Rachel, v1.0.1)
    put([document.querySelector('[data-asifah-markets="military"]')]);
    // 5. active military actors, target posture
    put(sectionOf('theatreContainer'));
    put(sectionOf('targetGrid'));
    // 6. the counts and the asset mix
    put([document.querySelector('.status-strip')]);
    put(sectionOf('assetBar'));
    if (window._navalMap && window._navalMap.invalidateSize) setTimeout(function () { window._navalMap.invalidateSize(); }, 80);
  }

  function chips() {
    if (document.getElementById('mgChips')) return;
    var ta = document.getElementById('taCard');
    if (!ta) return;
    var T = [['Read', ta], ['Chokepoints', document.getElementById('mgChokepoints')],
             ['Naval tracker', document.querySelector('.naval-map-section')],
             ["Traders' odds", document.querySelector('[data-asifah-markets="military"]')],
             ['Military actors', document.getElementById('theatreContainer')],
             ['Target posture', document.getElementById('targetGrid')],
             ['Signal feed', document.getElementById('signalFeed')]].filter(function (t) { return t[1]; });
    var bar = document.createElement('nav');
    bar.className = 'mg-chips';
    bar.id = 'mgChips';
    bar.setAttribute('aria-label', 'Jump to section');
    T.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mg-chip'; b.textContent = t[0];
      b.addEventListener('click', function () {
        var target = t[1], prev = target.previousElementSibling;
        if (prev && prev.classList.contains('section-header')) target = prev;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8, behavior: 'smooth' });
      });
      bar.appendChild(b);
    });
    ta.parentNode.insertBefore(bar, ta);
  }

  function placeMap(data) {
    ['mgMap', 'mgHot'].forEach(function (id) { var o = document.getElementById(id); if (o) o.parentNode.removeChild(o); });
    var grid = document.querySelector('#tvCard .tv-grid');
    var mapEl = mapBox(data), hot = hottest(data);
    if (grid) {
      var row = document.getElementById('mgRow'), side;
      if (!row) {
        row = document.createElement('div'); row.className = 'mg-row'; row.id = 'mgRow';
        side = document.createElement('div'); side.className = 'mg-side';
        grid.parentNode.insertBefore(row, grid);
        row.appendChild(side); side.appendChild(grid);
        grid.classList.add('mg-side-grid');
      } else side = row.querySelector('.mg-side');
      row.insertBefore(mapEl, side);
      if (hot) side.appendChild(hot);
      return true;
    }
    var exec = document.getElementById('taExecBlock');       // voice not in yet: sit above the summary
    if (exec) { exec.parentNode.insertBefore(mapEl, exec); mapEl.style.marginBottom = '12px'; if (hot) exec.parentNode.insertBefore(hot, exec); }
    return false;
  }

  var waiting = false;
  function waitForGrid() {
    if (waiting || !window.MutationObserver) return;
    waiting = true;
    var mo = new MutationObserver(function () {
      if (document.querySelector('#tvCard .tv-grid') && last) { mo.disconnect(); waiting = false; placeMap(last); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); waiting = false; }, 60000);
  }

  function render(data) {
    try {
      if (!data) return;
      last = data;
      css();
      restructure();
      var old = document.getElementById('mgChokepoints');
      if (old) old.parentNode.removeChild(old);
      var strip = cpStrip(data), ta = document.getElementById('taCard');
      if (strip && ta) ta.parentNode.insertBefore(strip, ta.nextSibling);
      if (!placeMap(data)) waitForGrid();
      // The strip now carries the chokepoint read; the old in-card section keeps
      // the full prose and the polar gateways, folded, under a clearer name.
      var cps = document.getElementById('taChokepointSection');
      if (cps && !cps.classList.contains('user-toggled')) cps.classList.remove('expanded');
      var cpt = cps && cps.querySelector('[data-i18n="taChokepoints"]');
      if (cpt) cpt.textContent = 'Chokepoint detail & polar gateways';
      // v1.0.1: the theatre prose folds too -- the map, the tiles and the actor
      // list below carry it; open it when you want the long form.
      var ths = document.getElementById('taTheatreSection');
      if (ths && !ths.classList.contains('user-toggled')) ths.classList.remove('expanded');
      chips();
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);   // let the levels rail re-measure
    } catch (e) { console.warn('[Military glance]', e); }
  }

  window.AsifahMilitaryGlance = { render: render };
})();
