/*
 * Asifah Analytics -- REGION GLANCE  v1.0.0  (Nov 6 2026)
 *
 * Three things every regional page gets from ONE read of its regional BLUF:
 *
 *   1. MAP   <div data-asifah-region-map="me"></div>
 *            Each country shaded by its pressure level; hover for the read,
 *            click to jump to (and open) its card. Countries with no pressure
 *            tracker are HATCHED, never coloured calm -- unread, not calm.
 *
 *   2. CARD FACES  (automatic)
 *            Every closed country card gains a level chip ("L4 · Coercion")
 *            and a one-line read from that country's top signal.
 *
 *   3. TABS  <section data-asifah-region-tabs></section>
 *            Actor Matrix | Traders' odds | Airspace & flights, moved into one
 *            tabbed panel after the cards (nodes are MOVED, so every script
 *            that fills them keeps working).
 *
 * Reads the regional BLUF the page already depends on (cached on the backend,
 * served from cache in about a second). No keys. Map shapes: world-atlas
 * (Natural Earth 1:50m), drawn with d3-geo -- no map tiles, no CARTO key.
 */
(function () {
  'use strict';

  var LIBS = [
    'https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js'
  ];
  var WORLD = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';

  // Region config: BLUF endpoint + countries (ISO 3166 numeric -> theatre key, card id, name).
  // theatre = the key the regional BLUF uses in theatre_summary / top_signals.
  var REGIONS = {
    me: {
      bluf: 'https://asifah-backend.onrender.com/api/rhetoric/me/bluf',
      label: 'Middle East & North Africa',
      // small, crowded countries: label pushed aside with a leader line [dx, dy]
      nudge: { lebanon: [-60, -14], israel: [-62, 14], jordan: [44, 18], kuwait: [26, -10] },
      countries: [
        [12, 'algeria', 'algeria-card', 'Algeria'], [48, 'bahrain', 'bahrain-card', 'Bahrain'],
        [818, 'egypt', 'egypt-card', 'Egypt'], [364, 'iran', 'iran-card', 'Iran'],
        [368, 'iraq', 'iraq-card', 'Iraq'], [376, 'israel', 'israel-card', 'Israel'],
        [400, 'jordan', 'jordan-card', 'Jordan'], [414, 'kuwait', 'kuwait-card', 'Kuwait'],
        [422, 'lebanon', 'hezbollah-card', 'Lebanon'], [434, 'libya', 'libya-card', 'Libya'],
        [504, 'morocco', 'morocco-card', 'Morocco'], [512, 'oman', 'oman-card', 'Oman'],
        [634, 'qatar', 'qatar-card', 'Qatar'], [682, 'saudi_arabia', 'saudi_arabia-card', 'Saudi Arabia'],
        [760, 'syria', 'syria-card', 'Syria'], [788, 'tunisia', 'tunisia-card', 'Tunisia'],
        [784, 'uae', 'uae-card', 'UAE'], [887, 'yemen', 'houthis-card', 'Yemen']
      ],
      airspace: ['.bottom-content-wrapper'],
      order: true
    },
    // Nov 6 2026: the other four regions. box = [[west, south], [east, north]]
    // in degrees: the map frame (Russia, Greenland and the US would otherwise
    // shrink everything else). labelAt = where a label sits, in degrees, when
    // the country's centre is outside the frame.
    europe: {
      bluf: 'https://asifa-europe-backend.onrender.com/api/rhetoric/europe/bluf',
      label: 'Europe & Eurasia',
      box: [[-30, 33], [72, 73]],
      labelAt: { russia: [48, 61], greenland: [-27, 70.5], kazakhstan: [66, 48] },
      nudge: { belgium: [-46, 14], albania: [-40, 14], moldova: [-34, 30], cyprus: [0, 16],
               armenia: [10, 30], azerbaijan: [-4, -24] },
      countries: [
        [8, 'albania', 'albania-card', 'Albania'], [51, 'armenia', 'armenia-card', 'Armenia'],
        [31, 'azerbaijan', 'azerbaijan-card', 'Azerbaijan'], [112, 'belarus', 'belarus-card', 'Belarus'],
        [56, 'belgium', 'belgium-card', 'Belgium'], [196, 'cyprus', 'cyprus-card', 'Cyprus'],
        [300, 'greece', 'greece-card', 'Greece'], [304, 'greenland', 'greenland-card', 'Greenland'],
        [348, 'hungary', 'hungary-card', 'Hungary'], [398, 'kazakhstan', 'kazakhstan-card', 'Kazakhstan'],
        [498, 'moldova', 'moldova-card', 'Moldova'], [616, 'poland', 'poland-card', 'Poland'],
        [643, 'russia', 'russia-card', 'Russia'], [792, 'turkey', 'turkey-card', 'Türkiye'],
        [795, 'turkmenistan', 'turkmenistan-card', 'Turkmenistan'], [804, 'ukraine', 'ukraine-card', 'Ukraine'],
        [826, 'uk', 'uk-card', 'UK']
      ],
      airspace: ['#notamWidget', '#flightWidget']
    },
    asia: {
      bluf: 'https://asifah-asia-backend.onrender.com/api/rhetoric/asia/bluf',
      label: 'Asia & Pacific',
      box: [[58, 2], [148, 52]],
      nudge: { taiwan: [40, 6], south_korea: [34, 12], north_korea: [-30, -16] },
      countries: [
        [4, 'afghanistan', 'afghanistan-card', 'Afghanistan'], [156, 'china', 'china-card', 'China'],
        [356, 'india', 'india-card', 'India'], [392, 'japan', 'japan-card', 'Japan'],
        [408, 'dprk', 'north_korea-card', 'North Korea'], [586, 'pakistan', 'pakistan-card', 'Pakistan'],
        [608, 'philippines', 'philippines-card', 'Philippines'], [410, 'south_korea', 'south_korea-card', 'South Korea'],
        [158, 'taiwan', 'taiwan-card', 'Taiwan'], [704, 'vietnam', 'vietnam-card', 'Vietnam']
      ],
      airspace: ['#notamWidget', '#flightWidget']
    },
    africa: {
      bluf: 'https://asifah-africa-backend.onrender.com/api/rhetoric/africa/bluf',
      label: 'Africa',
      box: [[-19, -36], [53, 37]],
      labelAt: { drc: [21, -5] },
      nudge: { rwanda: [-60, -26] },
      countries: [
        [854, 'burkina_faso', 'burkina_faso-card', 'Burkina Faso'], [140, 'car', 'car-card', 'CAR'],
        [148, 'chad', 'chad-card', 'Chad'], [180, 'drc', 'drc-card', 'DR Congo'],
        [226, 'equatorial_guinea', 'equatorial_guinea-card', 'Eq. Guinea'], [231, 'ethiopia', 'ethiopia-card', 'Ethiopia'],
        [324, 'guinea', 'guinea-card', 'Guinea'], [404, 'kenya', 'kenya-card', 'Kenya'],
        [450, 'madagascar', 'madagascar-card', 'Madagascar'], [466, 'mali', 'mali-card', 'Mali'],
        [508, 'mozambique', 'mozambique-card', 'Mozambique'], [562, 'niger', 'niger-card', 'Niger'],
        [566, 'nigeria', 'nigeria-card', 'Nigeria'], [646, 'rwanda', 'rwanda-card', 'Rwanda'],
        [706, 'somalia', 'somalia-card', 'Somalia'], [710, 'south_africa', 'south_africa-card', 'South Africa'],
        [728, 'south_sudan', 'south_sudan-card', 'South Sudan'], [729, 'sudan', 'sudan-card', 'Sudan'],
        [834, 'tanzania', 'tanzania-card', 'Tanzania'], [800, 'uganda', 'uganda-card', 'Uganda']
      ],
      airspace: ['#notamWidget', '.flight-section']
    },
    wha: {
      bluf: 'https://asifah-wha-backend.onrender.com/api/rhetoric/wha/bluf',
      label: 'Western Hemisphere',
      projection: 'naturalEarth', h: 760,
      box: [[-168, -56], [-34, 72]],
      labelAt: { us: [-99, 39], canada: [-102, 58] },
      nudge: { cuba: [10, -14], haiti: [34, 6], panama: [-36, 10] },
      countries: [
        [32, 'argentina', 'argentina-card', 'Argentina'], [76, 'brazil', 'brazil-card', 'Brazil'],
        [124, 'canada', 'canada-card', 'Canada'], [152, 'chile', 'chile-card', 'Chile'],
        [170, 'colombia', 'colombia-card', 'Colombia'], [192, 'cuba', 'cuba-card', 'Cuba'],
        [332, 'haiti', 'haiti-card', 'Haiti'], [484, 'mexico', 'mexico-card', 'Mexico'],
        [591, 'panama', 'panama-card', 'Panama'], [600, 'paraguay', 'paraguay-card', 'Paraguay'],
        [604, 'peru', 'peru-card', 'Peru'], [840, 'us', 'us-card', 'USA'],
        [862, 'venezuela', 'venezuela-card', 'Venezuela']
      ],
      airspace: ['.notam-section', '.flight-section']
    }
  };

  var LEVEL = {
    0: ['Monitoring', '#6b7280'], 1: ['Rhetoric', '#3b82f6'], 2: ['Warning', '#f59e0b'],
    3: ['Confrontation', '#f97316'], 4: ['Coercion', '#ef4444'], 5: ['Active Conflict', '#991b1b'],
    6: ['Red Line Breached', '#3b0764']   // Nov 6 2026: L5 crimson, L6 near-black purple (L4/L5 no longer blur)
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }

  function css() {
    if (document.getElementById('asfGlanceCss')) return;
    var st = document.createElement('style');
    st.id = 'asfGlanceCss';
    st.textContent =
      '.asf-map{grid-column:1/-1;box-sizing:border-box;margin:0 0 22px;padding:14px 16px;border-radius:12px;' +
      'background:var(--asifah-shell-card,rgba(127,127,127,0.06));border:1px solid var(--asifah-shell-border,rgba(127,127,127,0.3));position:relative}' +
      '.asf-map-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}' +
      '.asf-map-title{font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-size:0.85rem}' +
      '.asf-map-sub{font-size:0.72rem;opacity:0.7}' +
      '.asf-map svg{width:100%;height:auto;display:block;margin-top:8px}' +
      '.asf-map .ctx{fill:rgba(127,127,127,0.12);stroke:rgba(127,127,127,0.35);stroke-width:0.4}' +
      '.asf-map .ctry{stroke:rgba(255,255,255,0.75);stroke-width:0.7;cursor:pointer;transition:opacity .15s}' +
      '[data-theme="light"] .asf-map .ctry{stroke:#0b1d33}' +
      '.asf-map .ctry:hover{opacity:0.8;stroke-width:1.6}' +
      '.asf-map .dot{stroke:#fff;stroke-width:1.2;cursor:pointer}' +
      '.asf-map .lbl{font-size:10px;font-family:inherit;fill:var(--asifah-shell-text,#e2f0fb);pointer-events:none;paint-order:stroke;stroke:rgba(0,0,0,0.55);stroke-width:2.5px}' +
      '[data-theme="light"] .asf-map .lbl{stroke:rgba(255,255,255,0.85)}' +
      '.asf-map-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:0.7rem;margin-top:6px;opacity:0.9}' +
      '.asf-map-legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:4px;vertical-align:-1px}' +
      '.asf-map-tip{position:absolute;pointer-events:none;background:rgba(6,13,26,0.95);color:#e2f0fb;border:1px solid #38bdf8;' +
      'border-radius:8px;padding:8px 10px;font-size:0.78rem;line-height:1.4;max-width:280px;display:none;z-index:5}' +
      '.asf-map-tip b{display:block;font-size:0.82rem;margin-bottom:2px}' +
      '.asf-face{margin:8px 0 2px;display:flex;flex-direction:column;gap:5px}' +
      '.asf-face-chip{align-self:flex-start;font-size:0.68rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#fff;padding:3px 8px;border-radius:4px}' +
      '.asf-face-chip.none{background:transparent;color:inherit;opacity:0.65;border:1px dashed currentColor}' +
      '.asf-face-line{font-size:0.8rem;line-height:1.45;opacity:0.92;font-style:italic;white-space:normal;overflow-wrap:anywhere}' +
      '.asf-face-more{font-size:0.74rem;font-weight:800;letter-spacing:0.3px;opacity:0.95;cursor:pointer}' +
      '@media(max-width:600px){.asf-map .lbl,.asf-map line{display:none}.asf-map-legend{font-size:0.66rem;gap:8px}}' +
      '.asf-sowhat{margin:4px 0 14px;padding:12px 14px;border-radius:8px;border-left:4px solid #38bdf8;background:rgba(56,189,248,0.08)}' +
      '.asf-sowhat-k{font-size:0.66rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;opacity:0.75;margin-bottom:4px}' +
      '.asf-sowhat-t{font-size:0.9rem;line-height:1.55}' +
      '.asf-flash{box-shadow:0 0 0 3px #38bdf8 !important;transition:box-shadow .3s}' +
      '.asf-tabs{grid-column:1/-1;margin:24px 0}' +
      '.asf-tabbar{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--asifah-shell-border,rgba(127,127,127,0.3));margin-bottom:14px}' +
      '.asf-tab{font-family:inherit;font-size:0.8rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:9px 16px;' +
      'border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;background:none;color:inherit;opacity:0.65;cursor:pointer}' +
      '.asf-tab[aria-selected="true"]{opacity:1;border-color:var(--asifah-shell-border,rgba(127,127,127,0.3));background:var(--asifah-shell-card,rgba(127,127,127,0.06));color:var(--asifah-shell-accent,#38bdf8)}' +
      '.asf-tabpane[hidden]{display:none !important}';
    document.head.appendChild(st);
  }

  function lvlOf(rec) {
    if (!rec) return null;
    var l = rec.level != null ? rec.level : rec.threat_level;
    return typeof l === 'number' ? l : (parseInt(l, 10) || 0);
  }

  function oneLiner(theatre, bluf, rec) {
    var sigs = (bluf && (bluf.top_signals || bluf.signals)) || [];
    for (var i = 0; i < sigs.length; i++) {
      if ((sigs[i].theatre || '') === theatre && sigs[i].short_text) {
        return sigs[i].short_text
          .replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '')          // leading flag
          .replace(/^[A-Z][A-Z \-']+:\s*/, '');                  // "IRAN: "
      }
    }
    return (rec && rec.tracker_label && rec.tracker_label !== rec.label) ? rec.tracker_label : '';
  }

  // Card-face line: the backend's short_text is cut mid-word, so use the first
  // sentence of the long read, trimmed at a word boundary (~150 chars).
  function faceLine(theatre, bluf, rec) {
    var t = longRead(theatre, bluf) || oneLiner(theatre, bluf, rec) || '';
    t = t.replace(/^[A-Z][A-Z \-']+:\s*/, '').replace(/\s+/g, ' ').trim();
    var m = t.match(/^.{20,}?[.!?](\s|$)/);
    if (m) t = m[0].trim();
    if (t.length > 150) t = t.slice(0, 150).replace(/\s+\S*$/, '') + '\u2026';
    return t;
  }

  // ── Card faces ────────────────────────────────────────────────────────────
  function cardFaces(cfg, bluf) {
    var ts = (bluf && bluf.theatre_summary) || {};
    cfg.countries.forEach(function (c) {
      var card = document.getElementById(c[2]);
      if (!card) return;
      var view = card.querySelector('.card-collapsed-view') || card;
      var old = view.querySelector('.asf-face');
      if (old) old.parentNode.removeChild(old);
      var rec = ts[c[1]], l = lvlOf(rec), face = document.createElement('div');
      face.className = 'asf-face';
      if (l == null) {
        face.innerHTML = '<span class="asf-face-chip none">No pressure tracker yet</span>';
      } else {
        var meta = LEVEL[l] || LEVEL[0], line = faceLine(c[1], bluf, rec);
        face.innerHTML = '<span class="asf-face-chip" style="background:' + meta[1] + '">L' + l + ' · ' +
          esc(rec.label || meta[0]) + '</span>' + (line ? '<span class="asf-face-line">' + esc(line) + '</span>' : '') +
          '<span class="asf-face-more">Expand card for more \u25BE</span>';
      }
      var more = face.querySelector('.asf-face-more');
      if (more) more.addEventListener('click', (function (id) {
        return function (e) { e.stopPropagation(); openCard(id); };
      })(c[2]));
      var anchor = view.querySelector('.collapsed-header') || view.firstElementChild;
      if (anchor && anchor.nextSibling) view.insertBefore(face, anchor.nextSibling); else view.appendChild(face);
    });
  }

  // ── Inside an opened card: So What first, then the threat picture, then
  //    advisory and headlines, then sources, weather and the scan button. ──
  // Nov 6 2026: ONE card order on all five regional pages (the ME order Rachel
  // approved). Each region built its cards differently, so each slot is a test
  // on the element rather than one class name.
  function hasC(el, c) { return el.classList && el.classList.contains(c); }
  function idEnds(el, sfx) { return !!(el.id && el.id.slice(-sfx.length) === sfx); }
  var CARD_ORDER = [
    function (el) { return hasC(el, 'probability-display'); },                                    // gauge
    function (el) { return hasC(el, 'travel-advisory-container') || idEnds(el, '-travel-advisory'); },
    function (el) { return hasC(el, 'context-box'); },                                             // background (Africa, WHA)
    function (el) { return hasC(el, 'timeline-display'); },
    function (el) { return hasC(el, 'threat-matrix-section'); },
    function (el) { return hasC(el, 'mil-posture-awaiting') || hasC(el, 'mil-posture') || idEnds(el, '-mil-posture'); },
    function (el) { return hasC(el, 'headlines-section') || idEnds(el, '-headlines'); },
    function (el) { return hasC(el, 'intel-sources'); },
    function (el) { return hasC(el, 'weather-section') || idEnds(el, '-weather'); },
    function (el) { return hasC(el, 'card-scan-controls'); },
    function (el) {                                                                                // Stability / Rhetoric / Military links
      return hasC(el, 'card-link-row') || hasC(el, 'stability-live') || hasC(el, 'rhetoric-live') ||
        (el.tagName === 'DIV' && !el.className && !!el.querySelector('a[href*="-stability"], .country-stability-btn'));
    }
  ];

  function longRead(theatre, bluf) {
    var sigs = (bluf && (bluf.top_signals || bluf.signals)) || [];
    for (var i = 0; i < sigs.length; i++) {
      if ((sigs[i].theatre || '') === theatre && (sigs[i].long_text || sigs[i].short_text)) {
        return (sigs[i].long_text || sigs[i].short_text).replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '');
      }
    }
    return '';
  }

  function cardInside(cfg, bluf) {
    var ts = (bluf && bluf.theatre_summary) || {};
    cfg.countries.forEach(function (c) {
      var card = document.getElementById(c[2]);
      var view = card && card.querySelector('.card-expanded-view');
      if (!view) return;
      var old = view.querySelector('.asf-sowhat');
      if (old) old.parentNode.removeChild(old);
      var rec = ts[c[1]], l = lvlOf(rec), box = document.createElement('div');
      box.className = 'asf-sowhat';
      var read = longRead(c[1], bluf);
      box.innerHTML = '<div class="asf-sowhat-k">So what</div>' + (l == null
        ? '<div class="asf-sowhat-t">No pressure tracker covers ' + esc(c[3]) + ' yet, so there is no level to explain: unread, not calm. ' +
          'The Pressure Index below still comes from the news scan.</div>'
        : '<div class="asf-sowhat-t"><b style="background:' + (LEVEL[l] || LEVEL[0])[1] + ';color:#fff;padding:1px 7px;border-radius:4px;white-space:nowrap">L' + l + ' · ' + esc((LEVEL[l] || LEVEL[0])[0]) + '</b> ' +
          esc(read || oneLiner(c[1], bluf, rec) || 'No single signal stands out this cycle.') + '</div>');
      // after the expanded view's own header row (the Collapse button), else first
      // after the Collapse button when it sits at the top (ME, Europe, Asia),
      // otherwise after the card's own title (Africa, WHA keep Collapse at the bottom)
      var kids = Array.prototype.slice.call(view.children, 0, 3);
      var head = kids.filter(function (k) { return k.classList && k.classList.contains('collapse-toggle-btn'); })[0] ||
                 kids.filter(function (k) { return /^H[1-4]$/.test(k.tagName); })[0];
      if (head) view.insertBefore(box, head.nextSibling);
      else view.insertBefore(box, view.firstChild);
      reorderCard(view, box);
    });
  }

  // Collapse at the top, then the CARD_ORDER slots. Runs even when the regional
  // read fails to load (then without a So What box).
  function reorderCard(view, box) {
      var col = Array.prototype.slice.call(view.children).filter(function (k) { return hasC(k, 'collapse-toggle-btn'); })[0];
      if (!box) {
        var h = Array.prototype.slice.call(view.children, 0, 3).filter(function (k) { return /^H[1-4]$/.test(k.tagName); })[0];
        if (col && h) view.insertBefore(col, h.nextSibling);
        box = col || h;
        if (!box) return;
      } else if (col && col.nextSibling !== box) { view.insertBefore(col, box); }
      var after = box;
      CARD_ORDER.forEach(function (test) {
        Array.prototype.slice.call(view.children).forEach(function (el) {
          if (el !== box && test(el)) {
            view.insertBefore(el, after.nextSibling);
            after = el;
          }
        });
      });
  }

  function openCard(cardId) {
    var card = document.getElementById(cardId);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.add('asf-flash');
    setTimeout(function () { card.classList.remove('asf-flash'); }, 1800);
    if (card.classList.contains('collapsed')) {
      if (typeof window.toggleCard === 'function') window.toggleCard(cardId);
      else if (typeof window.expandCard === 'function') window.expandCard(cardId.replace(/-card$/, ''), null);
      else card.classList.remove('collapsed');
    }
  }

  // ── Map ───────────────────────────────────────────────────────────────────
  function drawMap(el, cfg, bluf, world) {
    var d3 = window.d3, topojson = window.topojson;
    var ts = (bluf && bluf.theatre_summary) || {};
    var all = topojson.feature(world, world.objects.countries).features;
    var byId = {};
    cfg.countries.forEach(function (c) { byId[c[0]] = c; });
    var mine = all.filter(function (f) { return byId[+f.id]; });
    var W = 960, H = cfg.h || 470;
    var frame = cfg.box
      ? { type: 'MultiPoint', coordinates: [cfg.box[0], cfg.box[1], [cfg.box[0][0], cfg.box[1][1]], [cfg.box[1][0], cfg.box[0][1]],
          [(cfg.box[0][0] + cfg.box[1][0]) / 2, cfg.box[0][1]], [(cfg.box[0][0] + cfg.box[1][0]) / 2, cfg.box[1][1]]] }
      : { type: 'FeatureCollection', features: mine };
    var proj = (cfg.projection === 'naturalEarth' ? d3.geoNaturalEarth1() : d3.geoMercator())
      .fitExtent([[10, 10], [W - 10, H - 10]], frame);
    var path = d3.geoPath(proj);
    var defs = '<defs><pattern id="asfHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="6" height="6" fill="rgba(127,127,127,0.18)"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(148,163,184,0.75)" stroke-width="2"/></pattern></defs>';
    var ctx = all.filter(function (f) { return !byId[+f.id]; }).map(function (f) {
      var d = path(f); return d ? '<path class="ctx" d="' + d + '"/>' : '';
    }).join('');
    var shapes = '', labels = '', dots = '';
    mine.forEach(function (f) {
      var c = byId[+f.id], rec = ts[c[1]], l = lvlOf(rec);
      var fill = l == null ? 'url(#asfHatch)' : (LEVEL[l] || LEVEL[0])[1];
      var d = path(f), ctr = path.centroid(f), area = path.area(f);
      var at = (cfg.labelAt || {})[c[1]];
      if (at) ctr = proj(at);
      shapes += '<path class="ctry" data-k="' + c[1] + '" d="' + d + '" fill="' + fill + '"/>';
      if (area < 140) {               // too small to click (Bahrain, Qatar, Lebanon): add a dot
        dots += '<circle class="dot ctry" data-k="' + c[1] + '" cx="' + ctr[0] + '" cy="' + ctr[1] + '" r="7" fill="' + fill + '"/>';
      }
      var nd = (cfg.nudge || {})[c[1]];
      var lx = ctr[0] + (nd ? nd[0] : 0), ly = ctr[1] + (nd ? nd[1] : (area < 140 ? -11 : 4));
      if (nd) labels += '<line x1="' + ctr[0] + '" y1="' + ctr[1] + '" x2="' + lx + '" y2="' + (ly - 3) +
        '" stroke="#94a3b8" stroke-opacity="0.9" stroke-width="1"/>';
      labels += '<text class="lbl" x="' + lx + '" y="' + ly + '" text-anchor="middle">' +
        esc(c[3]) + '</text>';
    });
    var legend = [0, 1, 2, 3, 4, 5].map(function (k) {
      return '<span><i style="background:' + LEVEL[k][1] + '"></i>L' + k + ' ' + LEVEL[k][0] + '</span>';
    }).join('') + '<span><i style="background:repeating-linear-gradient(45deg,#94a3b8 0 2px,transparent 2px 5px)"></i>No pressure tracker yet (unread, not calm)</span>';
    var when = bluf && bluf.generated_at ? new Date(bluf.generated_at).toLocaleString() : '';
    el.innerHTML = '<div class="asf-map-head"><div class="asf-map-title">🗺️ Where the pressure is</div>' +
      '<div class="asf-map-sub">Each country\'s pressure level · click a country to open its card' + (when ? ' · as of ' + esc(when) : '') + '</div></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Map of pressure levels, ' + esc(cfg.label) + '">' + defs + ctx + shapes + dots + labels + '</svg>' +
      '<div class="asf-map-legend">' + legend + '</div><div class="asf-map-tip"></div>';
    var tip = el.querySelector('.asf-map-tip');
    var keyed = {};
    cfg.countries.forEach(function (c) { keyed[c[1]] = c; });
    Array.prototype.forEach.call(el.querySelectorAll('.ctry'), function (p) {
      var k = p.getAttribute('data-k'), c = keyed[k], rec = ts[k], l = lvlOf(rec);
      p.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var line = l == null ? 'No pressure tracker yet: unread, not calm. The card still carries its strike-window score.'
          : ('L' + l + ' · ' + (rec.label || '') + (oneLiner(k, bluf, rec) ? '<br>' + esc(oneLiner(k, bluf, rec)) : ''));
        tip.innerHTML = '<b>' + esc(c[3]) + '</b>' + line;
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 290) + 'px';
        tip.style.top = (ev.clientY - r.top + 14) + 'px';
      });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { openCard(c[2]); });
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  function buildTabs(host, cfg) {
    var air = null;
    var airEls = ((cfg && cfg.airspace) || ['.bottom-content-wrapper']).map(function (q) {
      return document.querySelector(q);
    }).filter(Boolean);
    if (airEls.length === 1) air = airEls[0];
    else if (airEls.length > 1) {
      air = document.createElement('div');
      air.className = 'asf-airspace-pane';
      airEls.forEach(function (e) { air.appendChild(e); });   // MOVE: their scripts keep filling them
    }
    var panes = [
      ['Actor Matrix', document.getElementById('actorMatrixPanel')],
      ['Traders\' odds', document.querySelector('[data-asifah-markets^="region:"]')],
      ['Airspace & flights', air]
    ].filter(function (p) { return p[1]; });
    if (!panes.length) return;
    host.classList.add('asf-tabs');
    var bar = document.createElement('div');
    bar.className = 'asf-tabbar'; bar.setAttribute('role', 'tablist');
    host.appendChild(bar);
    panes.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'asf-tab'; b.textContent = p[0];
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      var pane = document.createElement('div');
      pane.className = 'asf-tabpane'; pane.setAttribute('role', 'tabpanel');
      if (i) pane.hidden = true;
      p[1].style.gridColumn = 'auto';
      pane.appendChild(p[1]);                       // MOVE, so the scripts filling it keep working
      host.appendChild(pane);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(bar.children, function (x) { x.setAttribute('aria-selected', 'false'); });
        Array.prototype.forEach.call(host.querySelectorAll('.asf-tabpane'), function (x) { x.hidden = true; });
        b.setAttribute('aria-selected', 'true'); pane.hidden = false;
        window.dispatchEvent(new Event('resize'));  // maps / charts inside re-measure when shown
      });
      bar.appendChild(b);
    });
  }

  function init() {
    css();
    var mapEl = document.querySelector('[data-asifah-region-map]');
    var key = mapEl ? mapEl.getAttribute('data-asifah-region-map') : document.body.getAttribute('data-asifah-region');
    var cfg = REGIONS[key];
    var tabHost = document.querySelector('[data-asifah-region-tabs]');
    if (tabHost) buildTabs(tabHost, cfg);
    if (!cfg) return;
    if (mapEl) {
      mapEl.classList.add('asf-map');
      mapEl.innerHTML = '<div class="asf-map-title">🗺️ Where the pressure is</div><div class="asf-map-sub">Loading map…</div>';
    }
    var blufP = fetch(cfg.bluf).then(function (r) { return r.json(); }).catch(function () { return null; });
    blufP.then(function (b) {
      if (b) { cardFaces(cfg, b); cardInside(cfg, b); return; }
      cfg.countries.forEach(function (c) {
        var v = document.getElementById(c[2]); v = v && v.querySelector('.card-expanded-view');
        if (v) reorderCard(v, null);
      });
    });
    if (!mapEl) return;
    Promise.all([blufP, LIBS.reduce(function (p, s) { return p.then(function () { return window.d3 && s.indexOf('/d3@') > 0 ? null : loadScript(s); }); }, Promise.resolve())
      .then(function () { return fetch(WORLD).then(function (r) { return r.json(); }); })])
      .then(function (res) {
        if (!res[0]) {
          mapEl.innerHTML = '<div class="asf-map-title">🗺️ Where the pressure is</div><div class="asf-map-sub">Regional read unavailable this load: unread, not calm.</div>';
          return;
        }
        drawMap(mapEl, cfg, res[0], res[1]);
      })
      .catch(function () {
        mapEl.innerHTML = '<div class="asf-map-title">🗺️ Where the pressure is</div><div class="asf-map-sub">Map could not load this time; the country cards below carry the same levels.</div>';
      });
  }

  window.AsifahRegionGlance = { REGIONS: REGIONS, openCard: openCard };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
