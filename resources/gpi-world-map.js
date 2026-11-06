/* Asifah Analytics -- GPI world map  v1.1.0  (Nov 6 2026)
 *
 * One map under the GPI's Bottom Line, shaded by the highest level each
 * country carries in the global read. It follows the lens buttons: click
 * Kinetic and it shows only kinetic pressure, click Governance and the
 * governance map appears -- the pressure sits in different places depending
 * on the kind you look at, and that is the point of showing it.
 *
 *   coloured  = a signal reached the global read (L0-L6)
 *   slate     = we track it, nothing reached the global read this cycle
 *   dark      = not tracked (unread, not calm)
 *
 *   striped  = NAMED in a signal's text (exposed / linked), not the signal's own subject
 *   (v1.1.0: Global Commodities rows name exposed importers -- they light up striped)
 *
 * Data: gpi.html calls AsifahGpiMap.render(apiData) after /api/gpi loads and
 * AsifahGpiMap.setAxis(axis) on every lens click. Levels come from
 * _all_signals_raw (pressure_type + countries/theatre) plus country_rollup
 * (signals filed under one theatre that touch another country).
 * Needs resources/region-glance.js loaded first (palette, tracked countries,
 * map styles).
 */
(function () {
  'use strict';

  var LIBS = [
    'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js'
  ];
  var WORLD = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
  var LEVEL = {
    0: ['Monitoring', '#6b7280'], 1: ['Rhetoric', '#3b82f6'], 2: ['Warning', '#f59e0b'],
    3: ['Confrontation', '#f97316'], 4: ['Coercion', '#ef4444'], 5: ['Active Conflict', '#991b1b'],
    6: ['Red Line Breached', '#3b0764']
  };
  var AXIS_LABEL = { all: 'All vectors', kinetic: 'Kinetic', economic: 'Economic', diplomatic: 'Diplomatic',
                     humanitarian: 'Humanitarian', governance: 'Governance' };
  // Theatre / tracker keys that are not a world-atlas country name.
  var ALIAS = {
    us: 840, usa: 840, united_states: 840, uk: 826, britain: 826, drc: 180, dr_congo: 180, car: 140,
    dprk: 408, north_korea: 408, south_korea: 410, rok: 410, uae: 784, gaza: 275, west_bank: 275,
    palestine: 275, palestinian_territories: 275, south_sudan: 728, equatorial_guinea: 226,
    turkiye: 792, hezbollah: 422, houthis: 887, ivory_coast: 384, cote_d_ivoire: 384, bosnia: 70,
    czech_republic: 203, dominican_republic: 214, central_african_republic: 140, russia: 643,
    iran: 364, syria: 760, vietnam: 704, laos: 418, moldova: 498, taiwan: 158, venezuela: 862,
    bolivia: 68, tanzania: 834, macedonia: 807, north_macedonia: 807, eswatini: 748
  };
  var MULTI = { baltics: [233, 428, 440], gulf: [], sahel: [466, 854, 562] };

  var state = { data: null, axis: 'all', world: null, el: null, nameToId: null, libs: null };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, ''); }

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }
  function libs() {
    if (state.libs) return state.libs;
    state.libs = LIBS.reduce(function (p, src) {
      return p.then(function () {
        if (src.indexOf('/d3@') > 0 && window.d3) return null;
        if (src.indexOf('topojson') > 0 && window.topojson) return null;
        return loadScript(src);
      });
    }, Promise.resolve()).then(function () {
      return fetch(WORLD).then(function (r) { return r.json(); });
    }).then(function (w) {
      state.world = w;
      state.nameToId = {};
      w.objects.countries.geometries.forEach(function (g) {
        if (g.id) state.nameToId[norm(g.properties && g.properties.name)] = +g.id;
      });
      return w;
    });
    return state.libs;
  }

  function idsFor(key) {
    var k = norm(key);
    if (!k) return [];
    if (MULTI[k]) return MULTI[k];
    if (ALIAS[k]) return [ALIAS[k]];
    if (state.nameToId[k]) return [state.nameToId[k]];
    return [];
  }

  function trackedIds() {
    var out = {};
    var R = (window.AsifahRegionGlance && window.AsifahRegionGlance.REGIONS) || {};
    Object.keys(R).forEach(function (r) {
      (R[r].countries || []).forEach(function (c) { out[c[0]] = c[3]; });
    });
    return out;
  }

  // country id -> {level, axes:{}, n, names:[]}
  function levelsFor(data, axis) {
    var out = {};
    function rec(id) { return out[id] || (out[id] = { level: -1, named: -1, axes: {}, n: 0, nn: 0, from: [] }); }
    function bump(id, lvl, ax) {
      if (lvl == null || isNaN(lvl)) return;
      var r = rec(id);
      if (lvl > r.level) r.level = lvl;
      if (ax) r.axes[ax] = Math.max(r.axes[ax] || 0, lvl);
      r.n += 1;
    }
    function name(id, lvl, from) {
      if (lvl == null || isNaN(lvl)) return;
      var r = rec(id);
      if (lvl > r.named) r.named = lvl;
      r.nn += 1;
      if (from && r.from.indexOf(from) < 0 && r.from.length < 3) r.from.push(from);
    }
    // every signal we can see: the raw pool plus each axis' top signals (these carry the long text)
    var raw = (data._all_signals_raw || []).slice();
    if (data.pressure_axes && data.pressure_axes.axes) {
      Object.keys(data.pressure_axes.axes).forEach(function (a) {
        (data.pressure_axes.axes[a].top_signals || []).forEach(function (s) {
          var c = {}; for (var k in s) c[k] = s[k];
          c.pressure_type = s.pressure_type || a;
          raw.push(c);
        });
      });
    }
    var allC = window._gpiAllCountries || function (s) { return s.countries || []; };
    raw.forEach(function (s) {
      var ax = s.pressure_type || s.axis || '';
      if (axis !== 'all' && ax !== axis) return;
      var lvl = +s.level;
      var about = {};
      var own = idsFor(s.theatre);
      own.forEach(function (id) { about[id] = 1; bump(id, lvl, ax); });
      var from = String(s.theatre || '').replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }) + ' L' + lvl;
      var tagged = s.countries || [];
      allC(s).forEach(function (k) {
        idsFor(k).forEach(function (id) {
          if (about[id]) return;
          if (!own.length && tagged.length === 1 && tagged[0] === k) bump(id, lvl, ax);   // its only tagged country IS its subject
          else name(id, lvl, from);
        });
      });
    });
    if (axis === 'all') {
      (data.country_rollup || []).forEach(function (c) {
        idsFor(c.country).forEach(function (id) {
          var r = rec(id);
          if (c.max_level > r.level) r.level = c.max_level;
          (c.axes || []).forEach(function (a) { if (!(a in r.axes)) r.axes[a] = null; });
          r.n = Math.max(r.n, c.signal_count || 0);
        });
      });
    }
    return out;
  }

  function draw() {
    var el = state.el, data = state.data;
    if (!el || !data || !state.world || !window.d3 || !window.topojson) return;
    var d3 = window.d3, topojson = window.topojson;
    var lv = levelsFor(data, state.axis), tracked = trackedIds();
    var feats = topojson.feature(state.world, state.world.objects.countries).features
      .filter(function (f) { return f.id !== '010'; });               // no Antarctica
    var W = 960, H = 470;
    var proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'FeatureCollection', features: feats });
    var path = d3.geoPath(proj);
    var shapes = '', dots = '', lit = 0, named = 0;
    var defs = '<defs>' + [0, 1, 2, 3, 4, 5, 6].map(function (k) {
      return '<pattern id="gwStripe' + k + '" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="5" height="5" fill="#3b4a60"/><rect width="2.4" height="5" fill="' + LEVEL[k][1] + '"/></pattern>';
    }).join('') + '</defs>';
    feats.forEach(function (f) {
      var id = +f.id, r = lv[id], d = path(f);
      if (!d) return;
      var cls, fill = '';
      if (r && r.level >= 0) { cls = 'ctry gw-lit'; fill = (LEVEL[Math.min(6, r.level)] || LEVEL[0])[1]; lit++; }
      else if (r && r.named >= 0) { cls = 'ctry gw-named'; fill = 'url(#gwStripe' + Math.min(6, r.named) + ')'; named++; }
      else if (tracked[id]) { cls = 'ctry gw-quiet'; }
      else { cls = 'ctx'; }
      shapes += '<path class="' + cls + '" data-id="' + id + '" d="' + d + '"' + (fill ? ' fill="' + fill + '"' : '') + '/>';
      if (fill && cls.indexOf('gw-lit') >= 0 && path.area(f) < 60) {      // Israel, Lebanon, Qatar... too small to see: add a dot
        var c = path.centroid(f);
        dots += '<circle class="ctry gw-lit gw-dot" data-id="' + id + '" cx="' + c[0] + '" cy="' + c[1] + '" r="5.5" fill="' + fill + '"/>';
      }
    });
    var legend = [0, 1, 2, 3, 4, 5, 6].map(function (k) {
      return '<span><i style="background:' + LEVEL[k][1] + '"></i>L' + k + ' ' + LEVEL[k][0] + '</span>';
    }).join('') +
      '<span><i style="background:repeating-linear-gradient(45deg,#f97316 0 2px,#3b4a60 2px 5px)"></i>Named in a signal (exposed or linked)</span>' +
      '<span><i style="background:#3b4a60;border:1px solid #7b8ba3"></i>Tracked, nothing reached the global read</span>' +
      '<span><i style="background:rgba(127,127,127,0.18)"></i>Not tracked (unread, not calm)</span>';
    var lens = AXIS_LABEL[state.axis] || state.axis;
    var sub = lit
      ? lit + ' ' + (lit === 1 ? 'country carries' : 'countries carry') + ' ' + (state.axis === 'all' ? 'pressure' : lens.toLowerCase() + ' pressure') + ' in this read'
      : 'No country carries ' + lens.toLowerCase() + ' pressure in this read';
    if (named) sub += ' \u00B7 ' + named + ' more named';
    el.innerHTML =
      '<div class="asf-map-head"><div class="asf-map-title">🌍 Where the pressure is · <span class="gw-lens">' + esc(lens) + '</span></div>' +
      '<div class="asf-map-sub">' + esc(sub) + ' · follows the lens buttons · click a country for its full picture</div></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="World map of pressure levels, ' + esc(lens) + '">' + defs + shapes + dots + '</svg>' +
      '<div class="asf-map-legend">' + legend + '</div><div class="asf-map-tip"></div>';
    var tip = el.querySelector('.asf-map-tip');
    var names = {};
    feats.forEach(function (f) { names[+f.id] = (f.properties && f.properties.name) || ''; });
    Array.prototype.forEach.call(el.querySelectorAll('.ctry'), function (p) {
      var id = +p.getAttribute('data-id'), r = lv[id];
      p.addEventListener('mousemove', function (e) {
        var b = el.getBoundingClientRect();
        var nm = tracked[id] || names[id];
        var body;
        if (r && r.level >= 0) {
          var m = LEVEL[Math.min(6, r.level)];
          var axes = Object.keys(r.axes).filter(Boolean);
          body = 'L' + r.level + ' · ' + m[0] +
            (axes.length ? '<br>Axes: ' + axes.map(function (a) {
              return esc(AXIS_LABEL[a] || a) + (r.axes[a] != null ? ' L' + r.axes[a] : '');
            }).join(', ') : '') +
            (r.n ? '<br>' + r.n + ' signal' + (r.n === 1 ? '' : 's') : '');
        } else if (r && r.named >= 0) {
          body = 'Named in ' + r.nn + ' signal' + (r.nn === 1 ? '' : 's') + ' (exposed or linked), not their subject' +
            (r.from.length ? '<br>From: ' + r.from.map(esc).join(', ') : '');
        } else {
          body = 'Tracked \u2014 no ' + (state.axis === 'all' ? '' : esc(lens.toLowerCase()) + ' ') + 'signal reached the global read this cycle';
        }
        tip.innerHTML = '<b>' + esc(nm) + '</b>' + body;
        tip.style.left = Math.min(e.clientX - b.left + 14, b.width - 230) + 'px';
        tip.style.top = (e.clientY - b.top + 14) + 'px';
        tip.style.display = 'block';
      });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { focusRead(id, tracked[id] || names[id]); });
    });
  }

  // v1.1.0: a click on the map opens the read's signal drawer and highlights the
  // signals that touch that country. Nothing in this lens? The By-country tab.
  function focusRead(id, label) {
    var hero = document.querySelector('.axis-hero');
    var drawer = hero && hero.querySelector('.axis-signals-drawer');
    var rows = drawer ? drawer.querySelectorAll('.sig-row[data-ctry]') : [];
    var hits = [];
    Array.prototype.forEach.call(rows, function (row) {
      var keys = (row.getAttribute('data-ctry') || '').split(/\s+/);
      var hit = keys.some(function (k) { return idsFor(k).indexOf(id) >= 0; });
      row.classList.toggle('gw-hit', hit);
      if (hit) hits.push(row);
    });
    if (!hits.length) {
      if (drawer) drawer.classList.remove('gw-filtering');
      if (window.AsifahGpiTabs) window.AsifahGpiTabs.open('country');
      return;
    }
    drawer.open = true;
    drawer.classList.add('gw-filtering');
    var note = drawer.querySelector('.gw-filter-note');
    if (!note) {
      note = document.createElement('div'); note.className = 'gw-filter-note';
      var sum = drawer.querySelector('summary');
      drawer.insertBefore(note, sum.nextSibling);
    }
    note.innerHTML = 'Highlighting ' + hits.length + ' signal' + (hits.length === 1 ? '' : 's') + ' that touch <b>' + esc(label) +
      '</b><button type="button">Show all</button>';
    note.querySelector('button').onclick = function (e) {
      e.stopPropagation();
      drawer.classList.remove('gw-filtering');
      Array.prototype.forEach.call(rows, function (r) { r.classList.remove('gw-hit'); });
      note.parentNode.removeChild(note);
    };
    hits[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function css() {
    if (document.getElementById('gwCss')) return;
    var st = document.createElement('style');
    st.id = 'gwCss';
    st.textContent =
      '#gpiWorldMap{position:relative;margin:22px 0 4px}' +
      '#gpiWorldMap .gw-quiet{fill:#3b4a60;stroke:#7b8ba3;stroke-width:0.6}' +
      '#gpiWorldMap .gw-dot{stroke:#fff;stroke-width:1.2}' +
      '#gpiWorldMap .gw-named{stroke:#94a3b8;stroke-width:0.6}' +
      '#gpiWorldMap .gw-lit{stroke:rgba(255,255,255,0.8);stroke-width:0.6}' +
      '#gpiWorldMap .gw-lens{color:var(--asifah-shell-accent,#38bdf8)}' +
      '[data-theme="light"] #gpiWorldMap .gw-quiet{fill:#cbd5e1;stroke:#94a3b8}';
    document.head.appendChild(st);
  }

  window.AsifahGpiMap = {
    render: function (data) {
      state.data = data;
      state.el = state.el || document.getElementById('gpiWorldMap');
      if (!state.el) return;
      css();
      state.el.classList.add('asf-map');
      if (!state.world) state.el.innerHTML = '<div class="asf-map-title">🌍 Where the pressure is</div><div class="asf-map-sub">Loading map…</div>';
      libs().then(draw).catch(function () {
        state.el.innerHTML = '<div class="asf-map-title">🌍 Where the pressure is</div>' +
          '<div class="asf-map-sub">Map could not load this time; the read above and the tabs below carry the same levels.</div>';
      });
    },
    setAxis: function (axis) {
      state.axis = AXIS_LABEL[axis] ? axis : 'all';
      draw();
    }
  };

  // gpi.html may have loaded its data before this file arrived
  function boot() {
    try {
      /* global _gpiState */
      if (typeof _gpiState !== 'undefined' && _gpiState && _gpiState.apiData && _gpiState.apiData.success) {
        state.axis = _gpiState.activeAxis || 'all';
        window.AsifahGpiMap.render(_gpiState.apiData);
      }
    } catch (e) { /* no-op */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
