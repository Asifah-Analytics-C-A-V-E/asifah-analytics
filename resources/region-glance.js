/*
 * Asifah Analytics -- REGION GLANCE  v1.2.1  (Nov 11 2026)
 *
 * v1.2.1 -- the one-line reads say something:
 *   * A line that only repeats the level ("Paraguay reads level 4 this
 *     cycle") is dropped -- the chip already says that.
 *   * Analyst labels ("SUDAN red line breached -- Peace Track Collapse
 *     (Escalation-by-Absence): INVERTED POLARITY...") lose out to a plain
 *     sentence from the same country's other signals when there is one.
 *   * Tall regions (the Americas): the "Where to look first" column takes
 *     the width the map does not need, instead of leaving empty gutters.
 *
 * v1.2.0 -- smaller, and it says where to look first:
 *   * Monitored-and-quiet (L0) countries carry a cyan Asifah outline, so
 *     "watched, nothing above normal" never looks like "not watched".
 *     (Not green: green reads "all clear", and L0 is not a clearance.)
 *   * The map is capped in height; on wide screens a "Where to look first"
 *     list (top 5 by level, one line each) sits beside it.
 *   * Phones: the map starts folded to one line ("3 countries at L4+ · tap").
 *   * Pages with no country cards (the regional rhetoric pages): a click
 *     opens that country's tracker page instead.
 *
 * v1.1.0 -- built for the whole world:
 *   * CARDS FIND THEMSELVES. Every .target-card on the page joins the map,
 *     matched by its key or its title (resources/asifah-geo.js knows every
 *     country on the world map). The REGIONS lists below are now only the
 *     fine-tuning (names, label nudges). A card the map cannot place is
 *     listed under the map -- never a silent gap.
 *   * COUNTRIES WITH NO CARD light up from the GLOBAL read (striped, labelled
 *     "from the global read"). Countries that have a card keep their REGIONAL
 *     level -- the two scores never sit on the same country.
 *   * PLACES THAT ARE NOT COUNTRIES (Hormuz, Red Sea, Arctic, Antarctica...)
 *     appear as pins in their level colour when a live signal names them.
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
      projection: 'naturalEarth', h: 640,
      box: [[-168, -56], [-34, 64]],                // v1.2.0: was to 72N -- a third of the map was empty Arctic
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

  // Cards named after a group, not a country -> the BLUF's theatre key
  var CARD_THEATRE = { hezbollah: 'lebanon', houthis: 'yemen', north_korea: 'dprk' };
  var GPI_URL = 'https://asifah-backend.onrender.com/api/gpi';

  // v1.1.0: add every card on the page that the hand list does not already have.
  // Returns entries in the same shape: [isoOrNull, theatre, cardId, name, discovered].
  function discoverCards(cfg) {
    var have = {};
    cfg.countries.forEach(function (c) { have[c[2]] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('.target-card[id$="-card"]'), function (card) {
      if (have[card.id]) return;
      var key = (card.getAttribute('data-target') || card.id.slice(0, -5)).toLowerCase();
      var titleEl = card.querySelector('.collapsed-title') || card.querySelector('h2, h3');
      var title = titleEl ? titleEl.textContent.replace(/[^\p{L}\s.'-]/gu, ' ').replace(/\s+/g, ' ').trim() : key;
      if (title === title.toUpperCase()) title = title.toLowerCase().replace(/\b\p{L}/gu, function (m) { return m.toUpperCase(); });
      cfg.countries.push([null, CARD_THEATRE[key] || key, card.id, title || key, true]);
      have[card.id] = 1;
    });
  }
  // Once the world map has loaded: give discovered cards their map id.
  function placeCards(cfg) {
    var G = window.AsifahGeo, lost = [];
    cfg.countries.forEach(function (c) {
      if (c[0] != null) return;
      var ids = G ? (G.idsFor(c[1]).length ? G.idsFor(c[1]) : G.idsFor(c[3])) : [];
      if (ids.length) c[0] = ids[0]; else lost.push(c[3]);
    });
    return lost;
  }

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
      '.asf-map svg{width:100%;height:auto;max-height:440px;display:block;margin-top:8px}' +
      // v1.2.0 layout: map + "where to look first" side by side on wide screens
      '.asf-map-toggle{all:unset;box-sizing:border-box;width:100%;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;cursor:default}' +
      '.asf-map-phone{display:none}' +
      '.asf-map-body{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;align-items:start}' +
      '.asf-top{margin-top:8px;display:flex;flex-direction:column;gap:7px}' +
      '.asf-top-k{font-size:0.66rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;opacity:0.75}' +
      '.asf-top-row{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:7px 9px;border-left:3px solid;border-radius:5px;background:rgba(127,127,127,0.08)}' +
      '.asf-top-row:hover{background:rgba(56,189,248,0.12)}' +
      '.asf-top-h{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:0.82rem}' +
      '.asf-top-chip{color:#fff;font-size:0.62rem;font-weight:800;padding:1px 6px;border-radius:4px;white-space:nowrap}' +
      '.asf-top-line{font-size:0.74rem;line-height:1.4;opacity:0.85}' +
      '.asf-top-none,.asf-top-more{font-size:0.72rem;opacity:0.7;font-style:italic}' +
      '.asf-map .asf-mon{stroke:#38bdf8;stroke-width:1.4}' +
      '@media(max-width:900px){.asf-map-body{grid-template-columns:1fr !important}}' +
      // v1.2.0 phones: folded to one line until tapped
      '@media(max-width:700px){.asf-map-toggle{cursor:pointer}.asf-map-desk{display:none}.asf-map-phone{display:inline}' +
      '.asf-map:not(.asf-open) .asf-map-body,.asf-map:not(.asf-open) .asf-map-legend,.asf-map:not(.asf-open) .asf-map-lost{display:none}' +
      '.asf-map.asf-open .asf-caret{display:inline-block;transform:rotate(180deg)}}' +
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
      '.asf-tabpane[hidden]{display:none !important}' +
      '.asf-map .asf-glob{stroke:rgba(148,163,184,0.7);stroke-width:0.5}' +
      '.asf-map-lost{font-size:0.7rem;margin-top:6px;opacity:0.8;font-style:italic}';
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
  // v1.2.1: candidates from EVERY signal on this theatre; the plainest wins.
  var FILLER_RX = /\breads (level|L)\s*\d\b.*\bthis cycle\b/i;
  function firstSentence(t) {
    t = String(t || '').replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').replace(/^[A-Z][A-Z \-']+:\s*/, '')
      .replace(/\s+/g, ' ').trim();
    var m = t.match(/^.{20,}?[.!?](\s|$)/);
    if (m) t = m[0].trim();
    if (t.length > 150) t = t.slice(0, 150).replace(/\s+\S*$/, '') + '\u2026';
    return t;
  }
  function labelScore(t) {               // higher = reads like an analyst label, not a sentence
    var words = t.split(/\s+/), caps = words.filter(function (w) { return w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w); }).length;
    return (/red line breached|\(escalation-by|polarity|\bL\d\b/i.test(t) ? 3 : 0) + (caps / Math.max(1, words.length) > 0.15 ? 2 : 0) +
      (/--|\u2014.*:/.test(t) ? 1 : 0);
  }
  function faceLine(theatre, bluf, rec) {
    var sigs = (bluf && (bluf.top_signals || bluf.signals)) || [], cands = [];
    sigs.forEach(function (sg) {
      if ((sg.theatre || '') === theatre) cands.push(firstSentence(sg.long_text || sg.short_text));
    });
    cands.push(firstSentence(oneLiner(theatre, bluf, rec)));
    cands = cands.filter(function (t) { return t && t.length > 12 && !FILLER_RX.test(t); });
    if (!cands.length) return '';
    cands.sort(function (a, b) { return labelScore(a) - labelScore(b); });   // stable: ties keep the backend's order
    return cands[0];
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

  function openCard(cardId, key) {
    var card = document.getElementById(cardId);
    if (!card) {                                   // rhetoric pages have no cards: go to the tracker
      var pg = key && window.AsifahGeo && window.AsifahGeo.pageFor(key);
      if (pg) window.location.href = pg;
      return;
    }
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
  function drawMap(el, cfg, bluf, world, gpi, lost, mapKey) {
    var d3 = window.d3, topojson = window.topojson, G = window.AsifahGeo;
    var ts = (bluf && bluf.theatre_summary) || {};
    var all = topojson.feature(world, world.objects.countries).features;
    var byId = {};
    cfg.countries.forEach(function (c) { if (c[0] != null) byId[c[0]] = c; });
    // v1.1.0: no card, but the GLOBAL read has something on it
    var glob = (gpi && G) ? G.countryLevels(gpi, 'all') : {};
    var mine = all.filter(function (f) { return byId[+f.id]; });
    var W = 960, H = cfg.h || 470;
    var frame = cfg.box
      ? { type: 'MultiPoint', coordinates: [cfg.box[0], cfg.box[1], [cfg.box[0][0], cfg.box[1][1]], [cfg.box[1][0], cfg.box[0][1]],
          [(cfg.box[0][0] + cfg.box[1][0]) / 2, cfg.box[0][1]], [(cfg.box[0][0] + cfg.box[1][0]) / 2, cfg.box[1][1]]] }
      : { type: 'FeatureCollection', features: mine };
    var proj = (cfg.projection === 'naturalEarth' ? d3.geoNaturalEarth1() : d3.geoMercator())
      .fitExtent([[10, 10], [W - 10, H - 10]], frame);
    var path = d3.geoPath(proj);
    // v1.2.0: crop the canvas to the frame, so a tall region (the Americas) is
    // not padded out to a wide rectangle of ocean and somebody else's continent
    var vb = [0, 0, W, H];
    if (cfg.box) {
      var bb = path.bounds(frame);
      vb = [Math.max(0, bb[0][0] - 8), Math.max(0, bb[0][1] - 8), 0, 0];
      vb[2] = Math.min(W, bb[1][0] + 8) - vb[0]; vb[3] = Math.min(H, bb[1][1] + 8) - vb[1];
      W = vb[0] + vb[2]; H = vb[1] + vb[3];
    }
    var defs = '<defs><pattern id="asfHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="6" height="6" fill="rgba(127,127,127,0.18)"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(148,163,184,0.75)" stroke-width="2"/></pattern>' +
      [0, 1, 2, 3, 4, 5, 6].map(function (k) {
        return '<pattern id="asfGlob' + k + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">' +
          '<rect width="6" height="6" fill="rgba(127,127,127,0.22)"/><rect width="3" height="6" fill="' + LEVEL[k][1] + '"/></pattern>';
      }).join('') + '</defs>';
    var nGlob = 0;
    var ctx = all.filter(function (f) { return !byId[+f.id] && +f.id !== 10; }).map(function (f) {
      var d = path(f); if (!d) return '';
      var g = glob[+f.id], gl = g ? g.level : -1;      // subject of a global signal only; 'named in passing' stays on the GPI map
      if (gl < 0) return '<path class="ctx" d="' + d + '"/>';
      nGlob++;
      return '<path class="ctry asf-glob' + (gl === 0 ? ' asf-mon' : '') + '" data-g="' + (+f.id) + '" d="' + d + '" fill="url(#asfGlob' + Math.min(6, gl) + ')"/>';
    }).join('');
    var sigs = ((bluf && (bluf.top_signals || bluf.signals)) || []).concat(gpi && G ? G.gpiSignals(gpi, 'all') : []);
    var plv = G ? G.placeLevels(sigs, gpi) : {};
    if (G) G.pinCss();
    var shapes = '', labels = '', dots = '';
    mine.forEach(function (f) {
      var c = byId[+f.id], rec = ts[c[1]], l = lvlOf(rec);
      // a card with no tracker of its own borrows the GLOBAL read when it has one
      // (no regional level to clash with); otherwise hatched, unread
      var gc = l == null && glob[+f.id] && glob[+f.id].level >= 0 ? glob[+f.id] : null;
      var fill = l == null ? (gc ? 'url(#asfGlob' + Math.min(6, gc.level) + ')' : 'url(#asfHatch)') : (LEVEL[l] || LEVEL[0])[1];
      var d = path(f), ctr = path.centroid(f), area = path.area(f);
      var at = (cfg.labelAt || {})[c[1]];
      if (at) ctr = proj(at);
      var mon = l === 0 || (gc && gc.level === 0);   // watched, nothing above normal
      shapes += '<path class="ctry' + (mon ? ' asf-mon' : '') + '" data-k="' + c[1] + '" d="' + d + '" fill="' + fill + '"/>';
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
      return k === 0 ? '<span><i style="background:' + LEVEL[0][1] + ';box-shadow:inset 0 0 0 2px #38bdf8"></i>L0 Monitoring (watched, quiet)</span>'
        : '<span><i style="background:' + LEVEL[k][1] + '"></i>L' + k + ' ' + LEVEL[k][0] + '</span>';
    }).join('') + '<span><i style="background:repeating-linear-gradient(45deg,#94a3b8 0 2px,transparent 2px 5px)"></i>No pressure tracker yet (unread, not calm)</span>' +
      (nGlob ? '<span><i style="background:repeating-linear-gradient(-45deg,#f97316 0 3px,rgba(127,127,127,0.3) 3px 6px)"></i>No regional tracker: lit from the global read</span>' : '') +
      (G ? G.PIN_LEGEND : '');
    var when = bluf && bluf.generated_at ? new Date(bluf.generated_at).toLocaleString() : '';
    var keyed0 = {};
    cfg.countries.forEach(function (c) { keyed0[c[1]] = c; });
    // "Where to look first": the highest regional levels, one line each
    var ranked = Object.keys(ts).map(function (k) { return [k, lvlOf(ts[k])]; })
      .filter(function (r) { return r[1] != null && r[1] >= 1; })
      .sort(function (a, b) { return b[1] - a[1]; });
    var hot = ranked.filter(function (r) { return r[1] >= 4; }).length;
    var nm = function (k) { return keyed0[k] ? keyed0[k][3] : k.replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); };
    var top = ranked.slice(0, 5).map(function (r) {
      var m = LEVEL[Math.min(6, r[1])] || LEVEL[0], line = faceLine(r[0], bluf, ts[r[0]]);
      return '<button type="button" class="asf-top-row" data-k="' + esc(r[0]) + '" style="border-left-color:' + m[1] + '">' +
        '<span class="asf-top-h"><b>' + esc(nm(r[0])) + '</b><span class="asf-top-chip" style="background:' + m[1] + '">L' + r[1] + ' ' + esc(m[0]) + '</span></span>' +
        (line ? '<span class="asf-top-line">' + esc(line) + '</span>' : '') + '</button>';
    }).join('');
    var phone = (hot ? hot + ' ' + (hot === 1 ? 'country' : 'countries') + ' at L4 or above'
      : ranked.length ? 'Highest: ' + nm(ranked[0][0]) + ' L' + ranked[0][1] : 'Nothing above L0 this cycle') + ' \u00B7 tap to open the map';
    el.innerHTML = '<button type="button" class="asf-map-head asf-map-toggle" aria-expanded="false"><span class="asf-map-title">🗺️ Where the pressure is</span>' +
      '<span class="asf-map-sub asf-map-desk">Each country\'s pressure level · click a country to open it' + (when ? ' · as of ' + esc(when) : '') + '</span>' +
      '<span class="asf-map-sub asf-map-phone">' + esc(phone) + ' <b class="asf-caret">\u25BE</b></span></button>' +
      '<div class="asf-map-body"' + (vb[3] && 440 * vb[2] / vb[3] < 640
        ? ' style="grid-template-columns:minmax(0,' + Math.round(440 * vb[2] / vb[3]) + 'px) minmax(270px,1fr)"' : '') +
      '><div class="asf-map-fig">' +
      '<svg viewBox="' + vb.map(function (v) { return Math.round(v); }).join(' ') + '" style="max-width:' + Math.round(440 * vb[2] / vb[3]) + 'px;margin-left:auto;margin-right:auto" role="img" aria-label="Map of pressure levels, ' + esc(cfg.label) + '">' + defs + ctx + shapes + dots + labels +
      (G ? G.pinsSvg(proj, W, H, plv, mapKey, vb[0], vb[1]) : '') + '</svg></div>' +
      '<aside class="asf-top"><div class="asf-top-k">Where to look first</div>' +
      (top || '<div class="asf-top-none">Nothing above L0 in the regional read this cycle. Quiet in what we read is not the same as calm.</div>') +
      (nGlob ? '<div class="asf-top-more">+ ' + nGlob + ' more lit from the global read (striped)</div>' : '') + '</aside></div>' +
      '<div class="asf-map-legend">' + legend + '</div>' +
      (lost && lost.length ? '<div class="asf-map-lost">Not on the map yet (card title not matched to a country): ' + lost.map(esc).join(', ') + '</div>' : '') +
      '<div class="asf-map-tip"></div>';
    var tg = el.querySelector('.asf-map-toggle');
    tg.addEventListener('click', function () {
      var open = !el.classList.contains('asf-open');
      el.classList.toggle('asf-open', open); tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.forEach.call(el.querySelectorAll('.asf-top-row'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), c = keyed0[k];
        openCard(c ? c[2] : k + '-card', k);
      });
    });
    var tip = el.querySelector('.asf-map-tip');
    if (G) G.bindPins(el, tip, plv);
    Array.prototype.forEach.call(el.querySelectorAll('.asf-glob'), function (p) {
      var id = +p.getAttribute('data-g'), g = glob[id], subj = g.level >= 0, l = subj ? g.level : g.named;
      function show(ev) {
        var r = el.getBoundingClientRect(), m = LEVEL[Math.min(6, l)] || LEVEL[0];
        tip.innerHTML = '<b>' + esc(G.nameOf(id)) + '</b>No card here yet \u00B7 from the global read: L' + l + ' \u00B7 ' + esc(m[0]) +
          (subj ? '' : ' (named in a signal, not its subject)') +
          (g.texts.length ? '<br>' + g.texts.map(esc).join('<br>') : '') + '<br><i>Full picture: Global Pressure Index</i>';
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 290) + 'px';
        tip.style.top = (ev.clientY - r.top + 14) + 'px';
      }
      p.addEventListener('mousemove', show);
      p.addEventListener('click', show);
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    });
    var keyed = {};
    cfg.countries.forEach(function (c) { keyed[c[1]] = c; });
    Array.prototype.forEach.call(el.querySelectorAll('.ctry[data-k]'), function (p) {
      var k = p.getAttribute('data-k'), c = keyed[k], rec = ts[k], l = lvlOf(rec);
      p.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var gc = l == null && glob[c[0]] && glob[c[0]].level >= 0 ? glob[c[0]] : null;
        var line = gc ? ('No regional tracker yet \u00B7 from the global read: L' + gc.level + ' \u00B7 ' + esc((LEVEL[Math.min(6, gc.level)] || LEVEL[0])[0]) +
            (gc.texts.length ? '<br>' + gc.texts.map(esc).join('<br>') : ''))
          : l == null ? 'No pressure tracker yet: unread, not calm. The card still carries its strike-window score.'
          : ('L' + l + ' · ' + (rec.label || '') + (oneLiner(k, bluf, rec) ? '<br>' + esc(oneLiner(k, bluf, rec)) : ''));
        tip.innerHTML = '<b>' + esc(c[3]) + '</b>' + line;
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 290) + 'px';
        tip.style.top = (ev.clientY - r.top + 14) + 'px';
      });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { openCard(c[2], k); });
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
    discoverCards(cfg);
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
    var worldP = window.AsifahGeo ? window.AsifahGeo.loadWorld()
      : LIBS.reduce(function (p, s) { return p.then(function () { return window.d3 && s.indexOf('/d3@') > 0 ? null : loadScript(s); }); }, Promise.resolve())
          .then(function () { return fetch(WORLD).then(function (r) { return r.json(); }); });
    // the global read: only for countries with no card, and for the pins
    var gpiP = window.AsifahGeo ? fetch(GPI_URL).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
    window.AsifahRegionGlance.gpi = gpiP;          // the Spoke & Wheel tab reuses this read
    window.AsifahRegionGlance.region = key;
    Promise.all([blufP, worldP, gpiP])
      .then(function (res) {
        if (!res[0]) {
          mapEl.innerHTML = '<div class="asf-map-title">🗺️ Where the pressure is</div><div class="asf-map-sub">Regional read unavailable this load: unread, not calm.</div>';
          return;
        }
        var lost = placeCards(cfg);
        drawMap(mapEl, cfg, res[0], res[1], res[2] && res[2].success !== false ? res[2] : null, lost, key);
      })
      .catch(function () {
        mapEl.innerHTML = '<div class="asf-map-title">🗺️ Where the pressure is</div><div class="asf-map-sub">Map could not load this time; the country cards below carry the same levels.</div>';
      });
  }

  window.AsifahRegionGlance = { REGIONS: REGIONS, openCard: openCard };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
