/* Asifah Analytics -- GEO  v1.0.0  (Nov 8 2026)
 *
 * ONE answer, sitewide, to "where is this?". Before this file the GPI map,
 * the regional maps and the GPI's country pills each kept their own list of
 * country names, and a new country had to be remembered in three places.
 * Now they all ask here.
 *
 *   AsifahGeo.loadWorld()        -> the world map shapes (loaded once per page)
 *   AsifahGeo.idsFor(key)        -> map ids for "uk", "Türkiye", "hezbollah", "baltics"...
 *   AsifahGeo.allCountries(sig)  -> every country a signal is about OR names in its text
 *   AsifahGeo.countryLevels(gpi, axis) -> highest level per country in the global read
 *   AsifahGeo.placeLevels(signals, gate) -> places that are not countries (Hormuz,
 *                                   the Arctic, Antarctica...) with the level of
 *                                   what is happening there
 *   AsifahGeo.pinsSvg(...) / bindPins(...) -> draw those places as pins
 *
 * The whole world is covered: any country on the world map is found by its
 * own name, so a new card or tracker needs no new line here. Add to ALIAS only
 * for a key that is not a country name (a group, an abbreviation).
 *
 * Must load BEFORE gpi.html's inline script (plain <script>, not defer).
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

  // Keys that are NOT a world-map country name -> ISO 3166 numeric.
  // Groups are filed under the country they operate from.
  var ALIAS = {
    us: 840, usa: 840, united_states: 840, uk: 826, britain: 826, united_kingdom: 826,
    drc: 180, dr_congo: 180, car: 140, central_african_republic: 140,
    dprk: 408, north_korea: 408, south_korea: 410, rok: 410, uae: 784,
    gaza: 275, west_bank: 275, palestine: 275, palestinian_territories: 275,
    south_sudan: 728, equatorial_guinea: 226, eq_guinea: 226, turkiye: 792, t_rkiye: 792, turkey: 792,
    hezbollah: 422, hizballah: 422, houthis: 887, houthi: 887, ivory_coast: 384, cote_d_ivoire: 384,
    bosnia: 70, bosnia_and_herzegovina: 70, czech_republic: 203, czechia: 203, dominican_republic: 214,
    russia: 643, iran: 364, syria: 760, vietnam: 704, laos: 418, moldova: 498, taiwan: 158,
    venezuela: 862, bolivia: 68, tanzania: 834, macedonia: 807, north_macedonia: 807, eswatini: 748,
    somaliland: 706, solomon_islands: 90, saudi_arabia: 682, south_africa: 710, burkina_faso: 854,
    usa_us: 840, antarctica: 10
  };
  var MULTI = { baltics: [233, 428, 440], sahel: [466, 854, 562] };

  // Words in a signal's text that mean a country (demonyms included) -- the
  // same list the GPI backend uses. Moved here from gpi.html (Nov 8 2026).
  var CTRY_TERMS = {"venezuelan": "venezuela","iranian": "iran","israeli": "israel","russian": "russia","chinese": "china","ukrainian": "ukraine","syrian": "syria","iraqi": "iraq","lebanese": "lebanon","saudi": "saudi_arabia","turkish": "turkey","indian": "india","pakistani": "pakistan","japanese": "japan","taiwanese": "taiwan","emirati": "uae","qatari": "qatar","egyptian": "egypt","sudanese": "sudan","cuban": "cuba","mexican": "mexico","brazilian": "brazil","argentine": "argentina","argentinian": "argentina","peruvian": "peru","chilean": "chile","colombian": "colombia","haitian": "haiti","somali": "somalia","nigerian": "nigeria","ethiopian": "ethiopia","kenyan": "kenya","yemeni": "yemen","libyan": "libya","jordanian": "jordan","kuwaiti": "kuwait","omani": "oman","bahraini": "bahrain","afghan": "afghanistan","filipino": "philippines","vietnamese": "vietnam","polish": "poland","hungarian": "hungary","greek": "greece","belarusian": "belarus","moldovan": "moldova","armenian": "armenia","azerbaijani": "azerbaijan","kazakh": "kazakhstan","canadian": "canada","paraguayan": "paraguay","south korean": "south_korea","north korean": "dprk","malian": "mali","nigerien": "niger","rwandan": "rwanda","ugandan": "uganda","tanzanian": "tanzania","mozambican": "mozambique","chadian": "chad","burkinabe": "burkina_faso","congolese": "drc","algerian": "algeria","moroccan": "morocco","tunisian": "tunisia","british": "united_kingdom","palestinian": "gaza","cypriot": "cyprus","greenlandic": "greenland","danish": "denmark","afghanistan": "afghanistan", "albania": "albania", "algeria": "algeria", "angola": "angola", "argentina": "argentina", "armenia": "armenia", "australia": "australia", "azerbaijan": "azerbaijan", "bahrain": "bahrain", "bangladesh": "bangladesh", "belarus": "belarus", "belgium": "belgium", "bolivia": "bolivia", "botswana": "botswana", "brazil": "brazil", "britain": "united_kingdom", "bulgaria": "bulgaria", "burkina faso": "burkina_faso", "cambodia": "cambodia", "cameroon": "cameroon", "canada": "canada", "central african republic": "central_african_republic", "chad": "chad", "chile": "chile", "china": "china", "colombia": "colombia", "congo": "congo", "costa rica": "costa_rica", "cuba": "cuba", "cyprus": "cyprus", "denmark": "denmark", "djibouti": "djibouti", "dominican republic": "dominican_republic", "dprk": "dprk", "drc": "drc", "ecuador": "ecuador", "egypt": "egypt", "el salvador": "el_salvador", "equatorial guinea": "equatorial_guinea", "eritrea": "eritrea", "estonia": "estonia", "ethiopia": "ethiopia", "finland": "finland", "france": "france", "gabon": "gabon", "gaza": "gaza", "georgia": "georgia", "germany": "germany", "ghana": "ghana", "greece": "greece", "greenland": "greenland", "guatemala": "guatemala", "guinea": "guinea", "haiti": "haiti", "honduras": "honduras", "hungary": "hungary", "india": "india", "indonesia": "indonesia", "iran": "iran", "iraq": "iraq", "israel": "israel", "italy": "italy", "ivory coast": "ivory_coast", "jamaica": "jamaica", "japan": "japan", "jordan": "jordan", "kazakhstan": "kazakhstan", "kenya": "kenya", "kosovo": "kosovo", "kuwait": "kuwait", "kyrgyzstan": "kyrgyzstan", "laos": "laos", "latvia": "latvia", "lebanon": "lebanon", "liberia": "liberia", "libya": "libya", "lithuania": "lithuania", "madagascar": "madagascar", "malaysia": "malaysia", "mali": "mali", "mauritania": "mauritania", "mexico": "mexico", "moldova": "moldova", "mongolia": "mongolia", "morocco": "morocco", "mozambique": "mozambique", "myanmar": "myanmar", "namibia": "namibia", "nepal": "nepal", "netherlands": "netherlands", "new zealand": "new_zealand", "nicaragua": "nicaragua", "niger": "niger", "nigeria": "nigeria", "north korea": "dprk", "norway": "norway", "oman": "oman", "pakistan": "pakistan", "panama": "panama", "paraguay": "paraguay", "peru": "peru", "philippines": "philippines", "poland": "poland", "qatar": "qatar", "romania": "romania", "russia": "russia", "rwanda": "rwanda", "saudi arabia": "saudi_arabia", "senegal": "senegal", "serbia": "serbia", "sierra leone": "sierra_leone", "singapore": "singapore", "somalia": "somalia", "south africa": "south_africa", "south korea": "south_korea", "south sudan": "south_sudan", "spain": "spain", "sri lanka": "sri_lanka", "sudan": "sudan", "sweden": "sweden", "syria": "syria", "taiwan": "taiwan", "tajikistan": "tajikistan", "tanzania": "tanzania", "thailand": "thailand", "tunisia": "tunisia", "turkey": "turkey", "turkiye": "turkey", "turkmenistan": "turkmenistan", "türkiye": "turkey", "uae": "uae", "uganda": "uganda", "uk": "united_kingdom", "ukraine": "ukraine", "united kingdom": "united_kingdom", "united states": "us", "uruguay": "uruguay", "usa": "us", "uzbekistan": "uzbekistan", "venezuela": "venezuela", "vietnam": "vietnam", "western sahara": "western_sahara", "yemen": "yemen", "zambia": "zambia", "zimbabwe": "zimbabwe"};
  // Places that drag countries in with them ("Hormuz" touches Iran, Oman, UAE).
  var GEO_TERMS = {"hormuz": ["iran", "oman", "uae"], "strait of hormuz": ["iran", "oman", "uae"], "bab el-mandeb": ["yemen", "djibouti"], "bab al-mandab": ["yemen", "djibouti"], "red sea": ["yemen", "egypt", "saudi_arabia"], "suez": ["egypt"], "taiwan strait": ["taiwan", "china"], "kerch": ["russia", "ukraine"], "black sea": ["russia", "ukraine", "turkey"], "bosphorus": ["turkey"], "dardanelles": ["turkey"], "malacca": ["malaysia", "indonesia", "singapore"], "panama canal": ["panama"], "senkaku": ["japan", "china"], "donbas": ["ukraine"], "crimea": ["ukraine", "russia"], "sahel": ["mali", "niger", "burkina_faso"], "liptako-gourma": ["mali", "niger", "burkina_faso"], "gaza strip": ["gaza", "israel"], "west bank": ["israel"], "golan": ["syria", "israel"], "kashmir": ["india", "pakistan"], "korean peninsula": ["dprk", "south_korea"], "falklands": ["argentina", "united_kingdom"], "malvinas": ["argentina", "united_kingdom"], "northwest passage": ["canada"], "northern sea route": ["russia"], "strait of magellan": ["chile"], "drake passage": ["chile", "argentina"], "tri-border area": ["paraguay", "argentina", "brazil"], "ciudad del este": ["paraguay"]};

  // Places that are not countries, drawn as PINS when a live signal names them.
  // at = [longitude, latitude]. edge = maps where the pin may sit on the map's
  // edge when the place is outside the frame (Antarctica under Africa).
  // atBy = a better spot on a particular map.
  var PLACES = [
    { key: 'hormuz', label: 'Strait of Hormuz', at: [56.4, 26.6], terms: ['strait of hormuz', 'hormuz'] },
    { key: 'bab_el_mandeb', label: 'Bab el-Mandeb', at: [43.4, 12.6], terms: ['bab el-mandeb', 'bab al-mandab', 'mandeb'] },
    { key: 'gulf_of_aden', label: 'Gulf of Aden', at: [48.5, 12.4], terms: ['gulf of aden'] },
    { key: 'red_sea', label: 'Red Sea', at: [38.3, 20.5], terms: ['red sea'] },
    { key: 'suez', label: 'Suez Canal', at: [32.55, 30.5], terms: ['suez'] },
    { key: 'persian_gulf', label: 'The Gulf', at: [51.0, 27.6], terms: ['persian gulf', 'arabian gulf'] },
    { key: 'black_sea', label: 'Black Sea', at: [34.0, 43.2], terms: ['black sea', 'kerch'] },
    { key: 'turkish_straits', label: 'Turkish Straits', at: [29.0, 41.1], terms: ['bosphorus', 'dardanelles', 'turkish straits'] },
    { key: 'baltic_sea', label: 'Baltic Sea', at: [19.5, 57.5], terms: ['baltic sea'] },
    { key: 'malacca', label: 'Strait of Malacca', at: [100.4, 3.2], terms: ['malacca'] },
    { key: 'taiwan_strait', label: 'Taiwan Strait', at: [119.6, 24.2], terms: ['taiwan strait'] },
    { key: 'south_china_sea', label: 'South China Sea', at: [114.0, 13.0], terms: ['south china sea', 'scarborough', 'spratly', 'second thomas'] },
    { key: 'east_china_sea', label: 'East China Sea', at: [125.5, 27.5], terms: ['east china sea', 'senkaku'] },
    { key: 'gulf_of_guinea', label: 'Gulf of Guinea', at: [3.0, 2.5], terms: ['gulf of guinea'] },
    { key: 'panama_canal', label: 'Panama Canal', at: [-79.7, 9.1], terms: ['panama canal'] },
    { key: 'northwest_passage', label: 'Northwest Passage', at: [-98, 74], terms: ['northwest passage'], edge: ['wha'] },
    { key: 'northern_sea_route', label: 'Northern Sea Route', at: [100, 77], terms: ['northern sea route'], edge: ['europe', 'asia'] },
    { key: 'arctic', label: 'Arctic', at: [-10, 80], terms: ['arctic', 'high north', 'svalbard'], edge: ['europe', 'wha'],
      atBy: { wha: [-70, 80], europe: [20, 80] } },
    { key: 'drake_passage', label: 'Drake Passage', at: [-64, -58], terms: ['drake passage'], edge: ['wha'] },
    { key: 'magellan', label: 'Strait of Magellan', at: [-70.9, -53.4], terms: ['strait of magellan', 'magellan'] },
    { key: 'falklands', label: 'Falklands / Malvinas', at: [-59.5, -51.7], terms: ['falklands', 'malvinas'] },
    { key: 'antarctica', label: 'Antarctica', at: [-58, -64], terms: ['antarctica', 'antarctic'], edge: ['africa', 'wha', 'gpi'],
      atBy: { africa: [25, -70], wha: [-42, -64], gpi: [0, -66] } }
  ];

  var world = { promise: null, data: null, nameToId: {}, idToName: {} };

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }
  function loadWorld() {
    if (world.promise) return world.promise;
    world.promise = LIBS.reduce(function (p, src) {
      return p.then(function () {
        if (src.indexOf('/d3@') > 0 && window.d3) return null;
        if (src.indexOf('topojson') > 0 && window.topojson) return null;
        return loadScript(src);
      });
    }, Promise.resolve()).then(function () {
      return fetch(WORLD).then(function (r) { return r.json(); });
    }).then(function (w) {
      world.data = w;
      w.objects.countries.geometries.forEach(function (g) {
        var nm = g.properties && g.properties.name;
        if (g.id == null || !nm) return;
        world.nameToId[norm(nm)] = +g.id;
        world.idToName[+g.id] = nm;
      });
      // world-atlas short forms people do not type ("Dem. Rep. Congo")
      [['democratic_republic_of_the_congo', 180], ['republic_of_the_congo', 178], ['congo_brazzaville', 178],
       ['central_african_republic', 140], ['dominican_republic', 214], ['bosnia_and_herzegovina', 70],
       ['equatorial_guinea', 226], ['south_sudan', 728], ['western_sahara', 732]].forEach(function (p) {
        if (!world.nameToId[p[0]]) world.nameToId[p[0]] = p[1];
      });
      return w;
    });
    return world.promise;
  }

  function idsFor(key) {
    var k = norm(key);
    if (!k) return [];
    if (MULTI[k]) return MULTI[k];
    if (ALIAS[k]) return [ALIAS[k]];
    if (world.nameToId[k]) return [world.nameToId[k]];
    if (CTRY_TERMS[k.replace(/_/g, ' ')]) {                  // "iranian" -> iran
      var t = norm(CTRY_TERMS[k.replace(/_/g, ' ')]);
      if (ALIAS[t]) return [ALIAS[t]];
      if (world.nameToId[t]) return [world.nameToId[t]];
    }
    return [];
  }
  function nameOf(id) { return world.idToName[+id] || ''; }

  // ── countries named in a signal's text ───────────────────────────────────
  var TERM_RE = new RegExp('\\b(' + Object.keys(CTRY_TERMS).concat(Object.keys(GEO_TERMS))
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'gi');
  function sigText(s) {
    return [s && s.short_text, s && s.long_text, s && s.headline, s && s.detail, s && s.text]
      .filter(Boolean).join(' ');
  }
  function textCountries(s) {
    var text = sigText(s).replace(/\b(indian ocean|turkish straits|persian gulf|arabian sea|guinea-bissau|papua new guinea)\b/gi, ' ');
    var out = {}, m;
    TERM_RE.lastIndex = 0;
    while ((m = TERM_RE.exec(text))) {
      var t = m[1].toLowerCase();
      if (CTRY_TERMS[t]) out[CTRY_TERMS[t]] = 1;
      (GEO_TERMS[t] || []).forEach(function (c) { out[c] = 1; });
    }
    return Object.keys(out);
  }
  function allCountries(s) {
    var seen = {};
    ((s && s.countries) || []).concat(textCountries(s)).forEach(function (c) {
      if (c) seen[String(c).toLowerCase().replace(/\s+/g, '_')] = 1;
    });
    return Object.keys(seen);
  }

  // ── the novelty gate: L5 only for a NEW front (Rachel, Nov 6) ────────────
  function gateFn(data) {
    var gate = (data && data.level_gate) || {}, l6 = !!(data && data.l6 && data.l6.active), fresh = {}, sustained = {};
    (gate.fresh || []).forEach(function (e) { fresh[norm(e.theatre)] = 1; });
    (gate.sustained || []).forEach(function (e) { sustained[norm(e.theatre)] = 1; });
    return function capL(lvl, key, ax) {
      if (lvl !== 5 || !gate.applied || l6 || fresh[norm(key)]) return lvl;
      if (ax === 'kinetic' || (ax == null && sustained[norm(key)])) return 4;
      return lvl;
    };
  }

  // every signal in a GPI payload, one lens or all
  function gpiSignals(data, axis) {
    var raw = ((data && data._all_signals_raw) || []).slice();
    if (data && data.pressure_axes && data.pressure_axes.axes) {
      Object.keys(data.pressure_axes.axes).forEach(function (a) {
        (data.pressure_axes.axes[a].top_signals || []).forEach(function (s) {
          var c = {}; for (var k in s) c[k] = s[k];
          c.pressure_type = s.pressure_type || a;
          raw.push(c);
        });
      });
    }
    if (!axis || axis === 'all') return raw;
    return raw.filter(function (s) { return (s.pressure_type || s.axis || '') === axis; });
  }

  // country id -> {level, named, axes:{}, n, nn, from:[], texts:[], sust}
  function countryLevels(data, axis) {
    axis = axis || 'all';
    var out = {}, capL = gateFn(data);
    function rec(id) { return out[id] || (out[id] = { level: -1, named: -1, axes: {}, n: 0, nn: 0, from: [], texts: [] }); }
    function keep(r, s) {
      var t = (s.short_text || s.text || s.headline || '').replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '');
      if (t && r.texts.length < 3 && r.texts.indexOf(t) < 0) r.texts.push(t);
    }
    function bump(id, lvl, ax, s) {
      if (lvl == null || isNaN(lvl)) return;
      var r = rec(id);
      if (lvl > r.level) r.level = lvl;
      if (ax) r.axes[ax] = Math.max(r.axes[ax] || 0, lvl);
      r.n += 1; keep(r, s);
    }
    function name(id, lvl, from, s) {
      if (lvl == null || isNaN(lvl)) return;
      var r = rec(id);
      if (lvl > r.named) r.named = lvl;
      r.nn += 1; keep(r, s);
      if (from && r.from.indexOf(from) < 0 && r.from.length < 3) r.from.push(from);
    }
    gpiSignals(data, axis).forEach(function (s) {
      var ax = s.pressure_type || s.axis || '';
      var lvl0 = +s.level, lvl = capL(lvl0, s.theatre, ax);
      var about = {}, own = idsFor(s.theatre);
      own.forEach(function (id) { about[id] = 1; bump(id, lvl, ax, s); if (lvl0 !== lvl) rec(id).sust = true; });
      var from = String(s.theatre || '').replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }) + ' L' + lvl;
      var tagged = s.countries || [];
      allCountries(s).forEach(function (k) {
        idsFor(k).forEach(function (id) {
          if (about[id]) return;
          if (!own.length && tagged.length === 1 && tagged[0] === k) bump(id, lvl, ax, s);   // its only tagged country IS its subject
          else name(id, lvl, from, s);
        });
      });
    });
    if (axis === 'all') {
      ((data && data.country_rollup) || []).forEach(function (c) {
        idsFor(c.country).forEach(function (id) {
          var r = rec(id), ml = capL(+c.max_level, c.country, null);
          if (ml !== +c.max_level) r.sust = true;
          if (ml > r.level) r.level = ml;
          (c.axes || []).forEach(function (a) { if (!(a in r.axes)) r.axes[a] = null; });
          r.n = Math.max(r.n, c.signal_count || 0);
        });
      });
    }
    return out;
  }

  // ── places that are not countries ────────────────────────────────────────
  var PLACE_RE = PLACES.map(function (p) {
    return new RegExp('\\b(' + p.terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'i');
  });
  // signals: any list of signal objects (GPI and/or a regional BLUF). data: a GPI
  // payload for the novelty gate (optional).
  function placeLevels(signals, data) {
    var out = {}, capL = gateFn(data || {});
    (signals || []).forEach(function (s) {
      var text = sigText(s);
      if (!text) return;
      var ax = s.pressure_type || s.axis || '';
      PLACES.forEach(function (p, i) {
        if (!PLACE_RE[i].test(text)) return;
        var lvl = capL(+s.level, s.theatre, ax);
        if (isNaN(lvl)) return;
        var r = out[p.key] || (out[p.key] = { level: -1, texts: [], n: 0, place: p });
        r.level = Math.max(r.level, lvl); r.n += 1;
        var t = (s.short_text || s.headline || s.text || '').replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '');
        if (t && r.texts.length < 3 && r.texts.indexOf(t) < 0) r.texts.push(t);
      });
    });
    return out;
  }

  // Pins: a diamond in the level colour, a soft pulse at L4 and above. A place
  // outside the frame is drawn on the edge (arrow pointing out) only on the
  // maps listed in its `edge`.
  function pinsSvg(proj, W, H, lv, mapKey) {
    var s = '';
    Object.keys(lv).forEach(function (k) {
      var r = lv[k], p = r.place;
      if (r.level < 0) return;
      var at = (p.atBy && p.atBy[mapKey]) || p.at, xy = proj(at);
      if (!xy || isNaN(xy[0])) return;
      var pad = 16, out = xy[0] < pad || xy[0] > W - pad || xy[1] < pad || xy[1] > H - pad, arrow = '';
      if (out) {
        if (!(p.edge && p.edge.indexOf(mapKey) >= 0)) return;
        var cx = Math.max(pad, Math.min(W - pad, xy[0])), cy = Math.max(pad, Math.min(H - pad - 14, xy[1]));
        arrow = xy[1] > H - pad ? ' ↓' : xy[1] < pad ? ' ↑' : xy[0] < pad ? ' ←' : ' →';
        xy = [cx, cy];
      }
      var col = (LEVEL[Math.min(6, r.level)] || LEVEL[0])[1], x = xy[0], y = xy[1];
      s += '<g class="asf-pin" data-place="' + k + '" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')">' +
        (r.level >= 4 ? '<circle class="asf-pin-pulse" r="9" fill="none" stroke="' + col + '"/>' : '') +
        '<rect x="-5.5" y="-5.5" width="11" height="11" transform="rotate(45)" fill="' + col + '" stroke="#fff" stroke-width="1.4"/>' +
        '<text class="asf-pin-lbl" x="9" y="4">' + esc(p.label + arrow) + '</text></g>';
    });
    return s;
  }
  function bindPins(el, tip, lv) {
    Array.prototype.forEach.call(el.querySelectorAll('.asf-pin'), function (g) {
      var r = lv[g.getAttribute('data-place')];
      if (!r) return;
      function show(ev) {
        var b = el.getBoundingClientRect(), m = LEVEL[Math.min(6, r.level)] || LEVEL[0];
        tip.innerHTML = '<b>' + esc(r.place.label) + '</b>L' + r.level + ' · ' + esc(m[0]) +
          ' · named in ' + r.n + ' signal' + (r.n === 1 ? '' : 's') +
          (r.texts.length ? '<br>' + r.texts.map(esc).join('<br>') : '');
        tip.style.display = 'block';
        tip.style.left = Math.min(ev.clientX - b.left + 14, b.width - 290) + 'px';
        tip.style.top = (ev.clientY - b.top + 14) + 'px';
      }
      g.addEventListener('mousemove', show);
      g.addEventListener('click', show);                 // phones: tap shows the read
      g.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    });
  }
  function pinCss() {
    if (document.getElementById('asfPinCss')) return;
    var st = document.createElement('style'); st.id = 'asfPinCss';
    st.textContent =
      '.asf-pin{cursor:pointer}' +
      '.asf-pin-lbl{font-size:10px;font-style:italic;fill:var(--asifah-shell-text,#e2f0fb);paint-order:stroke;stroke:rgba(0,0,0,0.6);stroke-width:2.5px;pointer-events:none}' +
      '[data-theme="light"] .asf-pin-lbl{stroke:rgba(255,255,255,0.9);fill:#0b1d33}' +
      '.asf-pin-pulse{stroke-width:2;opacity:.8;transform-box:fill-box;transform-origin:center;animation:asfPinPulse 2.2s ease-out infinite}' +
      '@keyframes asfPinPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.9);opacity:0}}' +
      '@media (prefers-reduced-motion:reduce){.asf-pin-pulse{animation:none}}' +
      '@media(max-width:600px){.asf-pin-lbl{display:none}}';
    document.head.appendChild(st);
  }
  var PIN_LEGEND = '<span><i style="background:#f97316;transform:rotate(45deg) scale(.8);border:1px solid #fff"></i>' +
    'Sea lane / region named in a live signal (colour = its level)</span>';

  window.AsifahGeo = {
    VERSION: '1.0.0', LEVEL: LEVEL, ALIAS: ALIAS, MULTI: MULTI, CTRY_TERMS: CTRY_TERMS, GEO_TERMS: GEO_TERMS,
    PLACES: PLACES, PIN_LEGEND: PIN_LEGEND,
    norm: norm, loadWorld: loadWorld, idsFor: idsFor, nameOf: nameOf, world: function () { return world.data; },
    textCountries: textCountries, allCountries: allCountries, gpiSignals: gpiSignals,
    countryLevels: countryLevels, placeLevels: placeLevels, pinsSvg: pinsSvg, bindPins: bindPins, pinCss: pinCss
  };
})();
