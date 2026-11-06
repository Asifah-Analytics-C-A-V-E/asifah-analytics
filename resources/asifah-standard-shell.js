(function () {
  'use strict';

  var LOGO_URL = 'https://raw.githubusercontent.com/Asifah-Analytics-C-A-V-E/asifah-analytics/refs/heads/main/Asifah_Analytics_1_25_26_V1_LOGO.png';
  var THEME_KEY = 'asifah-theme';
  /* HEADER CANON v2 (Nov 6 2026, Rachel):
     - every header: logo + Back (left) | page title, white Times New Roman, centred,
       subtitle under it | Dark/Light pill (right). Mirrors itself in right-to-left.
     - one header gradient, the same on the footer; DARK by default for new visitors.
     - English everywhere: language switchers are retired (the browser translates);
       source headlines in Arabic, Hebrew, Persian, Russian, Chinese ... stay in their
       own language and script (dir=auto, translate=no). */
  var SHELL_VERSION = '2.0.1';
  var THEME_MIGRATION_KEY = 'asifah-theme-v2';
  var LEGACY_THEME_KEYS = ['asifah_theme', 'theme', 'wha-theme'];
  var LANG_SELECTOR = '[data-lang], .lang-btn, .language-btn, .lang-switcher, .language-switcher, ' +
    '.lang-toggle, .language-toggle, .lang-buttons, .language-buttons, .lang-switch, .language-selector, ' +
    '.lang-selector, #langSwitcher, #languageSwitcher';

  var REGION_DASHBOARDS = [
    ['africa.html', '&#127757; Africa'],
    ['asia.html', '&#127759; Asia & Pacific'],
    ['europe.html', '&#127757; Europe'],
    ['middle-east.html', '&#128332; Middle East'],
    ['wha.html', '&#127758; Western Hemisphere']
  ];

  var GLOBAL_TRACKERS = [
    ['commodities.html', '&#128738; Commodities'],
    ['gpi.html', '&#127760; Global Pressure Index'],
    ['market-watch.html', '&#128200; Market Watch'],
    ['military.html', '&#127894; Military Tracker']
  ];

  var REGIONAL_RHETORIC = [
    ['rhetoric-africa.html', '&#128225; Africa'],
    ['rhetoric-asia.html', '&#128225; Asia'],
    ['rhetoric-europe.html', '&#128225; Europe'],
    ['rhetoric-index.html', '&#128225; Middle East'],
    ['rhetoric-wha.html', '&#128225; Western Hemisphere']
  ];

  var REGION_BY_COUNTRY = {
    afghanistan: 'asia.html', china: 'asia.html', india: 'asia.html', japan: 'asia.html',
    kazakhstan: 'asia.html', 'north-korea': 'asia.html', pakistan: 'asia.html',
    'south-korea': 'asia.html', taiwan: 'asia.html', turkmenistan: 'asia.html',
    vietnam: 'asia.html', philippines: 'asia.html',

    albania: 'europe.html', armenia: 'europe.html', azerbaijan: 'europe.html',
    belarus: 'europe.html', belgium: 'europe.html', cyprus: 'europe.html',
    greece: 'europe.html', greenland: 'europe.html', hungary: 'europe.html',
    poland: 'europe.html', russia: 'europe.html', turkey: 'europe.html',
    ukraine: 'europe.html',

    algeria: 'middle-east.html', bahrain: 'middle-east.html', egypt: 'middle-east.html',
    iran: 'middle-east.html', iraq: 'middle-east.html', israel: 'middle-east.html',
    jordan: 'middle-east.html', kuwait: 'middle-east.html', lebanon: 'middle-east.html',
    libya: 'middle-east.html', morocco: 'middle-east.html', oman: 'middle-east.html',
    qatar: 'middle-east.html', saudi_arabia: 'middle-east.html',
    saudi: 'middle-east.html', syria: 'middle-east.html', tunisia: 'middle-east.html',
    uae: 'middle-east.html', yemen: 'middle-east.html',

    brazil: 'wha.html', chile: 'wha.html', colombia: 'wha.html', cuba: 'wha.html',
    haiti: 'wha.html', mexico: 'wha.html', panama: 'wha.html', peru: 'wha.html',
    us: 'wha.html', venezuela: 'wha.html',

    burkina_faso: 'africa.html', 'burkina-faso': 'africa.html', drc: 'africa.html',
    ethiopia: 'africa.html', kenya: 'africa.html', mali: 'africa.html',
    niger: 'africa.html', nigeria: 'africa.html', rwanda: 'africa.html',
    somalia: 'africa.html', south_africa: 'africa.html', 'south-africa': 'africa.html',
    south_sudan: 'africa.html', 'south-sudan': 'africa.html', sudan: 'africa.html',
    tanzania: 'africa.html', uganda: 'africa.html'
  };

  function currentFile() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function countrySlug(file) {
    return file
      .replace(/^rhetoric-/, '')
      .replace(/-stability\.html$/, '')
      .replace(/\.html$/, '');
  }

  function labelForFile(file) {
    var base = countrySlug(file).replace(/_/g, '-');
    return base.split('-').filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  }

  function isRhetoricPage(file) {
    return /^rhetoric-/.test(file) && !/^rhetoric-(africa|asia|europe|index|wha)\.html$/.test(file);
  }

  function isStabilityPage(file) {
    return /-stability\.html$/.test(file) || ['russia.html', 'ukraine.html', 'israel.html', 'jordan.html', 'greenland.html', 'poland.html'].indexOf(file) >= 0;
  }

  var REGION_NAMES = { 'middle-east.html': 'Middle East', 'europe.html': 'Europe', 'asia.html': 'Asia-Pacific',
                       'africa.html': 'Africa', 'wha.html': 'Western Hemisphere' };
  // v2: a header whose h1 is only the brand gets the page's own name instead
  var PAGE_TITLES = { 'middle-east.html': 'Middle East & North Africa', 'europe.html': 'Europe',
                      'asia.html': 'Asia-Pacific', 'africa.html': 'Africa', 'wha.html': 'Western Hemisphere',
                      'index.html': 'Asifah Analytics' };

  function backTarget(file) {
    if (isRhetoricPage(file)) {
      var slug = countrySlug(file);
      var special = {
        dprk: 'north-korea-stability.html',
        russia: 'russia.html',
        ukraine: 'ukraine.html',
        israel: 'israel.html',
        greenland: 'greenland.html',
        poland: 'poland.html'
      };
      return [special[slug] || (slug + '-stability.html'), labelForFile(file) + ' Stability'];
    }
    if (isStabilityPage(file)) {
      var target = REGION_BY_COUNTRY[countrySlug(file)] || 'index.html';
      var label = target === 'index.html' ? 'Home' : (REGION_NAMES[target] || 'Regional') + ' Dashboard';
      return [target, label];
    }
    return ['index.html', 'Home'];
  }

  function navLink(item, kind, file) {
    var href = item[0];
    var label = item[1];
    var current = href.toLowerCase() === file;
    var classes = ['nav-btn'];
    if (kind) classes.push(kind);
    if (current) classes.push('current-page');
    else classes.push('active-nav');
    var tag = current ? 'div' : 'a';
    var hrefAttr = current ? '' : ' href="' + href + '"';
    var status = current ? '&#9673; You are here' : '&#9679; Live';
    return '<' + tag + hrefAttr + ' class="' + classes.join(' ') + '">' +
      '<span class="nav-btn-label">' + label + '</span>' +
      '<span class="nav-btn-status">' + status + '</span>' +
      '</' + tag + '>';
  }

  function canonicalNavHtml() {
    var file = currentFile();
    var html = '<div class="nav-sidebar-label">Dashboards</div>';
    REGION_DASHBOARDS.forEach(function (item) { html += navLink(item, '', file); });
    html += '<div class="nav-divider"></div><div class="nav-sidebar-label">Global Trackers</div>';
    GLOBAL_TRACKERS.forEach(function (item) { html += navLink(item, 'tracker-btn', file); });
    html += '<div class="nav-divider"></div><div class="nav-sidebar-label">Regional Rhetoric</div>';
    REGIONAL_RHETORIC.forEach(function (item) { html += navLink(item, 'rhetoric-btn', file); });
    return html + navExtrasHtml(file);
  }

  /** PAGE-SPECIFIC NAV LINKS  (v, Oct 3 2026)
   *
   *  The reason rhetoric-qatar.html had a hand-rolled sidebar at all was that
   *  it carries two links no other page has -- Qatar Rhetoric and Qatar
   *  Stability -- and the canonical nav had nowhere to put them. So the page
   *  kept its own rail, drifted away from the standard, and ended up with a
   *  second sidebar injected beside it.
   *
   *  A page now declares its extra links in its own markup and the shell
   *  folds them into the canonical nav as a labelled section:
   *
   *      <aside class="nav-sidebar" id="navSidebar">
   *        <div data-asifah-nav-extra="Qatar Pages">
   *          <a href="qatar-stability.html">Qatar Stability</a>
   *        </div>
   *      </aside>
   *
   *  Read BEFORE the sidebar's innerHTML is replaced -- the declaration lives
   *  inside the element we are about to overwrite, which is deliberate: the
   *  links degrade to a plain list if the shell never loads, rather than
   *  vanishing. The attribute's value is the section heading.
   */
  function navExtrasHtml(file) {
    var blocks = document.querySelectorAll('[data-asifah-nav-extra]');
    var html = '';
    Array.prototype.forEach.call(blocks, function (block) {
      var items = [];
      Array.prototype.forEach.call(block.querySelectorAll('a[href]'), function (a) {
        items.push([a.getAttribute('href'), a.textContent.trim()]);
      });
      if (!items.length) return;
      var label = block.getAttribute('data-asifah-nav-extra') || 'This section';
      html += '<div class="nav-divider"></div><div class="nav-sidebar-label">' +
              label + '</div>';
      items.forEach(function (item) { html += navLink(item, 'page-btn', file); });
    });
    return html;
  }

  // ══════════════════════════════════════════════════════════════════
  // ESCALATION LADDER — ONE DEFINITION, EVERY PAGE  (v1.0, Oct 3 2026)
  // ══════════════════════════════════════════════════════════════════
  // Every page used to declare its own ESCALATION_LEVELS. They drifted:
  // Asia's page rendered "Coercion" at L4 while Asia's own backend emitted
  // "Incident" for the same number, and across five surfaces L3 was
  // variously "Direct Threat", "Confrontation" or "ELEVATED". Same scan,
  // different word, depending which element you looked at.
  //
  // The ladder now lives here. Pages read window.AsifahLadder instead of
  // declaring a table, so the chip and the guide rail are reading the same
  // object and CANNOT disagree. A page that does not exist yet gets the
  // correct ladder for free, which is the actual test of whether this is
  // architecture or housekeeping.
  //
  // DESIGN RULE: every rung describes what the ACTOR is doing, except L0,
  // which honestly describes what WE are doing -- watching, with nothing
  // above normal. "Baseline" would imply we assessed it as normal;
  // "Monitoring" says the scan is running and found nothing. On a page that
  // sits at L0 for months that distinction is the difference between
  // reading dead and reading alive.
  var ASIFAH_LADDER = [
    { level: 0, label: 'Monitoring',      color: '#6b7280',
      gloss: 'Nothing above normal. The scan is running.' },
    { level: 1, label: 'Rhetoric',        color: '#3b82f6',
      gloss: 'Talk, with no named target.' },
    { level: 2, label: 'Warning',         color: '#f59e0b',
      gloss: 'Talk directed at a named target.' },
    { level: 3, label: 'Confrontation',   color: '#f97316',
      gloss: 'Direct and mutual — both sides engaged.' },
    { level: 4, label: 'Coercion',        color: '#ef4444',
      gloss: 'Pressure applied to extract a concession.' },
    { level: 5, label: 'Active Conflict', color: '#991b1b',   // Nov 6 2026: darker, so L4 and L5 no longer blur
      gloss: 'Open hostilities underway.' },
    // L6 added Oct 6 2026. The axis tables below have always gone to 6 ('red
    // line breached'), and the GPI's level coercion can return 6 -- so a page
    // could render an L6 chip that this guide had no row for. ladderClamp()
    // capped at 5, which meant an L6 chip silently displayed as L5 'Active
    // Conflict': the platform's most serious reading rendering as its
    // second-most. A ladder that cannot show its own top rung is not a ladder.
    { level: 6, label: 'Red Line Breached', color: '#3b0764',   // Nov 6 2026: near-black purple
      gloss: 'A stated red line has been crossed.' }
  ];

  // ── INDEX LADDER (Oct 28 2026) ─────────────────────────────────────
  // The Global Pressure Index asks a DIFFERENT question from a country page.
  // A country page asks "how intense is it here?" -- the theatre ladder above
  // answers that, and L4 Coercion / L6 Red Line Breached stay exactly right
  // there. The GPI asks "is the world getting worse this fortnight?" Since
  // GPI v3.12/3.13 three rungs mean something else on that page:
  //   L4  also reads SUSTAINED CONFLICT -- a war still at L5 on its own page,
  //       with no new front in 14 days (the novelty gate)
  //   L5  means a NEW front reached open hostilities within 14 days
  //   L6  is GLOBAL SHOCK -- a world-altering event, confirmed by visible
  //       UN / NATO / G7 reaction, held 7 days. Tracker red-line breaches
  //       are held at L5 on the index.
  // Redefining L4 platform-wide would have been wrong: on a country page,
  // coercion is still coercion. So the rail is PAGE-AWARE: the GPI gets the
  // index meanings, every other page gets the theatre ladder unchanged.
  var ASIFAH_INDEX_OVERRIDES = {
    4: { label: 'Coercion · or Sustained Conflict',
         gloss: 'Coercion somewhere; or a war still underway with no new front in 14 days.' },
    5: { label: 'Active Conflict — new front',
         gloss: 'A NEW front reached open hostilities within the last 14 days.' },
    6: { label: 'Global Shock',
         gloss: 'A world-altering event, confirmed by visible UN / NATO / G7 reaction. Holds 7 days.' }
  };
  var INDEX_PAGES = ['gpi.html'];

  function isIndexPage(file) {
    return INDEX_PAGES.indexOf(file || currentFile()) >= 0;
  }

  /** The ladder as THIS page should read it. */
  function pageLadder() {
    if (!isIndexPage()) return ASIFAH_LADDER;
    return ASIFAH_LADDER.map(function (r) {
      var o = ASIFAH_INDEX_OVERRIDES[r.level];
      return o ? { level: r.level, label: o.label, color: r.color, gloss: o.gloss } : r;
    });
  }

  // Mirrors theatre_state.py on the backends. The ladder above is a THREAT
  // ladder, and no single word spans war, famine, supply shock and
  // diplomatic collapse -- any word vague enough to cover all four says
  // nothing. So the axis supplies the meaning. A magnitude-9 earthquake is a
  // legitimate L5, and calling it "active conflict" is not imprecise, it is
  // false.
  var ASIFAH_AXIS_STATE = {
    kinetic:      ['quiet', 'rhetorical signalling', 'pressure building',
                   'standoff hardening', 'armed incident', 'active war footing',
                   'red line breached'],
    humanitarian: ['quiet', 'early humanitarian indicators', 'population pressure building',
                   'humanitarian conditions deteriorating', 'acute humanitarian emergency',
                   'mass-casualty humanitarian disaster', 'catastrophic humanitarian collapse'],
    economic:     ['quiet', 'market signalling', 'cost pressure building',
                   'supply pressure hardening', 'acute supply disruption',
                   'economic rupture', 'systemic economic breakdown'],
    diplomatic:   ['quiet', 'diplomatic signalling', 'diplomatic friction',
                   'diplomatic standoff', 'talks collapsed', 'diplomatic rupture',
                   'relations severed'],
    // Oct 28 2026 -- fifth axis (GPI v3.12). Who governs, and on what
    // authority. A caretaker government in coalition talks reads L3.
    governance:   ['quiet', 'political signalling', 'political friction',
                   'governing authority contested', 'governance crisis',
                   'legitimacy rupture', 'constitutional order broken']
  };

  var LADDER_KEY = 'asifah-ladder-open';

  function ladderClamp(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = 0;
    return Math.max(0, Math.min(6, n));
  }

  window.AsifahLadder = {
    levels: ASIFAH_LADDER,
    /** Full rung object. Always returns something -- never undefined. */
    get: function (n) { return ASIFAH_LADDER[ladderClamp(n)]; },
    label: function (n) { return this.get(n).label; },
    color: function (n) { return this.get(n).color; },
    gloss: function (n) { return this.get(n).gloss; },
    /** 'Coercion (L4)' -- for chips that want both. */
    withLevel: function (n) {
      var lv = ladderClamp(n);
      return ASIFAH_LADDER[lv].label + ' (L' + lv + ')';
    },
    /** Axis-aware phrase, mirroring theatre_state.py. */
    axisPhrase: function (n, axis) {
      var table = ASIFAH_AXIS_STATE[axis] || ASIFAH_AXIS_STATE.kinetic;
      var lv = Math.max(0, Math.min(6, parseInt(n, 10) || 0));
      return table[lv] || table[0];
    },
    axes: ASIFAH_AXIS_STATE,
    /** Index (GPI) meanings for L4-L6 -- see ASIFAH_INDEX_OVERRIDES. */
    indexOverrides: ASIFAH_INDEX_OVERRIDES,
    /** The ladder as the current page reads it (index-aware). */
    forPage: function () { return pageLadder(); }
  };

  /** Pages that actually carry levels. Mission/privacy/index get no rail. */
  function pageHasLevels(file) {
    if (/^(index|mission|privacy)\.html$/.test(file)) return false;
    var known = REGION_DASHBOARDS.concat(GLOBAL_TRACKERS, REGIONAL_RHETORIC)
      .some(function (item) { return item[0].toLowerCase() === file; });
    return known || isRhetoricPage(file) || isStabilityPage(file);
  }

  function ladderRailHtml() {
    var rungs = pageLadder().map(function (r) {
      return '<div class="asifah-ladder-rung">' +
        '<span class="asifah-ladder-chip" style="background:' + r.color + ';">L' + r.level + '</span>' +
        '<span class="asifah-ladder-text">' +
          '<span class="asifah-ladder-label">' + r.label + '</span>' +
          '<span class="asifah-ladder-gloss">' + r.gloss + '</span>' +
        '</span></div>';
    }).join('');

    // The axis note. Without it the rail quietly asserts that L4 means
    // coercion on a humanitarian axis, which would frame a famine as a
    // security problem -- a framing the platform should not make by default.
    var axisRows = [
      ['Kinetic',      ASIFAH_AXIS_STATE.kinetic[4]],
      ['Humanitarian', ASIFAH_AXIS_STATE.humanitarian[4]],
      ['Economic',     ASIFAH_AXIS_STATE.economic[4]],
      ['Diplomatic',   ASIFAH_AXIS_STATE.diplomatic[4]],
      ['Governance',   ASIFAH_AXIS_STATE.governance[4]]
    ].map(function (p) {
      return '<div class="asifah-ladder-axis-row"><strong>' + p[0] + '</strong>' + p[1] + '</div>';
    }).join('');

    return '<button type="button" class="asifah-ladder-toggle" aria-label="Collapse the escalation guide">' +
             '<span class="asifah-ladder-toggle-icon">&rsaquo;</span>' +
           '</button>' +
           '<div class="asifah-ladder-body">' +
             '<div class="asifah-ladder-title">' +
               (isIndexPage() ? 'How to read the index' : 'How to read levels') + '</div>' +
             rungs +
             (isIndexPage()
               ? '<div class="asifah-ladder-axis">' +
                   '<div class="asifah-ladder-axis-title">Why the index differs</div>' +
                   '<div class="asifah-ladder-axis-note">Country pages score how intense a theatre is. ' +
                   'This index scores whether the WORLD is getting worse: a long war with nothing new ' +
                   'added reads L4 here while its own page stays L5. Severity there, motion here.</div>' +
                 '</div>'
               : '') +
             '<div class="asifah-ladder-axis">' +
               '<div class="asifah-ladder-axis-title">L4 by pressure axis</div>' + axisRows +
               '<div class="asifah-ladder-axis-note">The ladder scores intensity. What a level ' +
               'MEANS depends on which axis it sits on.</div>' +
             '</div>' +
             '<div class="asifah-ladder-foot">Scores are convergence indicators from publicly ' +
             'observable signals — not event counts and not predictions.</div>' +
           '</div>';
  }

  function ensureLadderRail() {
    var file = currentFile();
    if (!pageHasLevels(file)) return;
    // Nov 1 2026: a page that does not (yet) speak the L0-L6 ladder opts out with
    // <body data-asifah-ladder="off"> -- a rail beside "probability %" cards
    // would contradict them. Remove the attribute once the page speaks levels.
    if (document.body.getAttribute('data-asifah-ladder') === 'off') return;
    if (document.getElementById('asifahLadderRail')) return;

    var rail = document.createElement('aside');
    rail.id = 'asifahLadderRail';
    rail.className = 'asifah-ladder-rail';
    rail.innerHTML = ladderRailHtml();
    document.body.appendChild(rail);
    document.body.classList.add('asifah-ladder-active');

    // Open by default, collapse remembered. A collapsed-by-default rail is
    // invisible to a first-time reader, which defeats it; an always-open one
    // nags the regular. Open-then-remember serves both.
    var open = true;
    try {
      var saved = localStorage.getItem(LADDER_KEY);
      if (saved === 'closed') open = false;
    } catch (e) { /* private mode: fall back to open */ }

    function apply() {
      rail.classList.toggle('collapsed', !open);
      document.body.classList.toggle('asifah-ladder-collapsed', !open);
      var btn = rail.querySelector('.asifah-ladder-toggle');
      if (btn) btn.setAttribute('aria-label',
        (open ? 'Collapse' : 'Expand') + ' the escalation guide');
    }
    apply();

    // ── Vertical alignment (Oct 3 2026) ──────────────────────────────
    // The rail was pinned to the viewport top while the left sidebar sits
    // inside a centred container BELOW the page header, so "HOW TO READ
    // LEVELS" floated above "DASHBOARDS" by the height of the header.
    //
    // WE ALIGN TEXT TO TEXT, NOT BOX TO BOX. The left sidebar is transparent
    // -- no background, no border -- so its box edge is invisible, and lining
    // the two boxes up left the title low by the height of the rail's own
    // padding. The rail is a bordered card, so its card edge has to sit
    // slightly ABOVE the sidebar's notional top for the two labels to read as
    // level. Both offsets are MEASURED at runtime rather than hardcoded, so a
    // page with a different header height or nav padding still lands square.
    //
    //   alignLadderRail()  "HOW TO READ LEVELS"  level with  "DASHBOARDS"
    //   tuneLadderGap()    the first rung        level with  the first nav button
    //
    // SCROLL -- stated accurately, because the first version of this comment
    // got it wrong and a test caught it. The sidebar does NOT stick on these
    // pages. It declares `position: sticky; top: 20px`, but it is the tallest
    // child of its flex row, so its containing block is exactly its own
    // height and sticky has zero travel; at ~990px it is also taller than
    // most viewports. It simply scrolls away. The rail tracks it on the way
    // up and then CLAMPS at 20px, so the guide is still on screen when you
    // are 1,200px down the page looking at an L4 chip -- which is when you
    // actually want it. A deliberate divergence, not an alignment bug.
    function railAnchor() {
      var nav = document.querySelector('.nav-sidebar, aside.sidebar, nav.sidebar');
      if (!nav) return null;
      return {
        nav:   nav,
        label: nav.querySelector('.nav-sidebar-label') || nav,
        btn:   nav.querySelector('.nav-btn, a, button')
      };
    }

    /** Vertical: put the rail's TITLE on the sidebar's LABEL, then keep the
        card inside the viewport. Re-measures on every call, so it stays
        correct after a font swap, a theme change or a collapse. */
    function alignLadderRail() {
      var a = railAnchor();
      if (!a) return;
      var title = rail.querySelector('.asifah-ladder-title');
      var railTop = rail.getBoundingClientRect().top;
      // Card edge -> title: border + padding. Zero while collapsed (the title
      // is hidden), and then box-top alignment is the only thing that means
      // anything anyway.
      var inner = (title && title.getBoundingClientRect().height)
        ? title.getBoundingClientRect().top - railTop
        : 0;
      var want = Math.max(20, Math.round(a.label.getBoundingClientRect().top - inner));
      rail.style.top = want + 'px';
      // The CSS max-height assumes top:20px. Once the rail sits lower than
      // that, the static cap lets a long rail run off the bottom of the
      // screen with no way to scroll to the footnote.
      rail.style.maxHeight = Math.max(160, window.innerHeight - want - 20) + 'px';
    }

    /** Then close the remaining gap so the first rung sits on the first nav
        button. Converges in one pass: the correction IS the measured delta. */
    function tuneLadderGap() {
      var a = railAnchor();
      if (!a || !a.btn) return;
      var title = rail.querySelector('.asifah-ladder-title');
      var rung = rail.querySelector('.asifah-ladder-rung');
      if (!title || !rung || !rung.getBoundingClientRect().height) return;
      var delta = a.btn.getBoundingClientRect().top - rung.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      var cur = parseFloat(window.getComputedStyle(title).marginBottom) || 0;
      title.style.marginBottom = Math.max(0, Math.min(40, Math.round(cur + delta))) + 'px';
    }

    /** Horizontal: MEASURE the content column instead of trusting a constant.
     *
     *  The CSS computes `left` from --asifah-content-max, which carries a comment
     *  stating plainly that it must match the .container max-width on the pages,
     *  and that both are 1280. gpi.html's container is 1500. A page that widens
     *  its container therefore gets a rail positioned for a narrower one, and the
     *  guide lands ON TOP of the content it is supposed to annotate -- about
     *  200px inside the column at 1920 viewport width.
     *
     *  A documented coupling that nothing enforces is a comment, not a contract.
     *  The vertical alignment in this same file has always measured rather than
     *  assumed; the horizontal never did. It does now.
     */
    function placeLadderRailX() {
      var container = document.querySelector('.container, .page-container, main');
      if (!container) return;                 // no column to hug -- CSS stands
      var box = container.getBoundingClientRect();
      if (!box.width) return;
      var gap = 20;
      var railW = rail.getBoundingClientRect().width || 232;
      // Hug the content column's right edge, but never run off screen.
      var want = Math.min(box.right + gap, window.innerWidth - railW - gap);
      // Below the breakpoint the CSS hides the rail entirely; don't fight it.
      if (window.innerWidth <= 1199) { rail.style.left = ''; return; }
      if (rail.classList.contains('collapsed')) { rail.style.left = ''; return; }
      rail.style.left = Math.max(gap, Math.round(want)) + 'px';
    }

    function placeLadderRail() {
      alignLadderRail();
      tuneLadderGap();
      placeLadderRailX();
    }

    placeLadderRail();
    // Webfonts land after first paint and move both columns; re-measure once.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(placeLadderRail).catch(function () {});
    }
    window.addEventListener('scroll', alignLadderRail, { passive: true });
    window.addEventListener('resize', placeLadderRail);

    rail.querySelector('.asifah-ladder-toggle').addEventListener('click', function () {
      open = !open;
      apply();
      // Collapsing hides the title, so the measured offsets change. Re-place
      // rather than leaving the card where the open layout had put it.
      placeLadderRail();
      try { localStorage.setItem(LADDER_KEY, open ? 'open' : 'closed'); } catch (e) {}
    });
  }

  /** Mobile: the rail folds into the existing drawer rather than becoming a
      second rail. A right rail at phone width is a bad time. */
  function ladderDrawerHtml() {
    if (!pageHasLevels(currentFile())) return '';
    return '<div class="nav-divider"></div>' +
           '<div class="nav-sidebar-label">' +
             (isIndexPage() ? 'How to read the index' : 'How to read levels') + '</div>' +
           pageLadder().map(function (r) {
             return '<div class="asifah-ladder-rung drawer">' +
               '<span class="asifah-ladder-chip" style="background:' + r.color + ';">L' + r.level + '</span>' +
               '<span class="asifah-ladder-text">' +
                 '<span class="asifah-ladder-label">' + r.label + '</span>' +
                 '<span class="asifah-ladder-gloss">' + r.gloss + '</span>' +
               '</span></div>';
           }).join('');
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } }

  function ensureTheme() {
    // v2: dark is the default. A visitor's own earlier choice is kept, but a
    // "light" that a PAGE wrote on its own (18 pages opened light) is not a
    // choice -- the one-time migration resets everyone to dark once.
    if (!lsGet(THEME_MIGRATION_KEY)) {
      lsSet(THEME_KEY, 'dark');
      LEGACY_THEME_KEYS.forEach(function (k) { lsSet(k, 'dark'); });
      lsSet(THEME_MIGRATION_KEY, '1');
    }
    var saved = lsGet(THEME_KEY) || 'dark';
    saved = saved === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    lsSet(THEME_KEY, theme);
    LEGACY_THEME_KEYS.forEach(function (k) { lsSet(k, theme); });   // page scripts read these
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.body.classList.toggle('light-mode', theme === 'light');
    var btn = document.querySelector('.asifah-theme-button');
    if (btn) {
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Theme: ' + theme + '. Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function hide(el) { if (el) el.classList.add('asifah-legacy-control-hidden'); }

  function retireLanguages() {
    // v2: English everywhere. Switchers are hidden (not deleted, so no page
    // script breaks looking for them) and a saved non-English choice is reset.
    Array.prototype.slice.call(document.querySelectorAll(LANG_SELECTOR)).forEach(function (el) {
      if (!el.closest('.asifah-footer')) hide(el);
    });
    var langSaved = lsGet('asifah_lang') || lsGet('asifah-lang') || lsGet('lang');
    if (langSaved && langSaved !== 'en') {
      ['asifah_lang', 'asifah-lang', 'lang'].forEach(function (k) { lsSet(k, 'en'); });
      ['setLang', 'setLanguage', 'switchLanguage', 'applyLanguage'].some(function (fn) {
        if (typeof window[fn] === 'function') {
          try { window[fn]('en'); return true; } catch (e) { return false; }
        }
        return false;
      });
    }
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }

  function themePill() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'asifah-theme-button asf-theme-pill';
    b.setAttribute('role', 'switch');
    b.innerHTML = '<span class="asf-theme-opt asf-dark-opt"><span aria-hidden="true">🌙</span> Dark</span>' +
                  '<span class="asf-theme-opt asf-light-opt"><span aria-hidden="true">☀️</span> Light</span>';
    b.addEventListener('click', toggleTheme);
    return b;
  }

  function isEmptyBox(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.classList.contains('asifah-legacy-control-hidden')) return false;
    var live = function (x) { return !x.closest('.asifah-legacy-control-hidden'); };
    var txt = Array.prototype.slice.call(el.querySelectorAll('*')).filter(live).some(function (x) {
      return Array.prototype.some.call(x.childNodes, function (c) { return c.nodeType === 3 && c.nodeValue.trim(); });
    }) || Array.prototype.some.call(el.childNodes, function (c) { return c.nodeType === 3 && c.nodeValue.trim(); });
    if (txt) return false;
    return !Array.prototype.slice.call(el.querySelectorAll('img, svg, canvas, input, select, iframe, video, button')).some(live);
  }

  function ensureHeader() {
    var file = currentFile();
    var header = document.querySelector('header, .header');
    if (!header || header.querySelector('.asf-hdr-grid')) return;
    header.classList.add('asifah-standard-header', 'asf-hdr');

    // Legacy theme controls and mobile menus (as before)
    // Legacy theme controls ANYWHERE on the page (some sat above or beside the header)
    Array.prototype.slice.call(document.querySelectorAll('.theme-row, .theme-toggle, .toggle-switch, .toggle-container, .toggle-label, .theme-btn, #themeToggle, .theme-switch, .theme-control, .theme-label, .theme-toggle-wrap, .theme-switcher')).forEach(function (el) {
      if (!el.classList.contains('asifah-theme-button') && !el.closest('.asifah-theme-button')) hide(el);
    });
    Array.prototype.slice.call(header.querySelectorAll('.mobile-menu-btn, .menu-toggle, .mobile-hamburger')).forEach(function (el) {
      if (!el.classList.contains('asifah-mobile-menu-btn')) hide(el);
    });
    Array.prototype.slice.call(header.querySelectorAll('.asifah-theme-button')).forEach(function (el) {
      el.parentNode.removeChild(el);                         // v1 button: replaced by the pill
    });

    // Logo: the page's own, or ours. Ring and white padding are removed in CSS.
    var logo = header.querySelector('.header-logo img, img.header-logo, .asifah-standard-logo, .logo-container img, .logo img, img');
    if (!logo) {
      logo = document.createElement('img');
      logo.src = LOGO_URL;
    }
    logo.alt = 'Asifah Analytics';
    logo.classList.add('asifah-standard-logo', 'asf-hdr-logo');

    // Back: one rule for every page (rhetoric -> stability -> region -> home).
    // A page can keep its own target with data-asifah-keep-href on the link.
    var back = header.querySelector('.back-link, .home-btn, .asifah-standard-back, .back-btn, .back-button, a.home-link');
    if (!back) {
      back = document.createElement('a');
    }
    if (!back.hasAttribute('data-asifah-keep-href')) {
      var bt = backTarget(file);
      back.setAttribute('href', bt[0]);
      back.textContent = '← ' + bt[1];
    }
    back.classList.add('asifah-standard-back', 'asf-hdr-back');

    var grid = document.createElement('div');
    grid.className = 'asf-hdr-grid';
    var left = document.createElement('div'); left.className = 'asf-hdr-left';
    var center = document.createElement('div'); center.className = 'asf-hdr-center';
    var right = document.createElement('div'); right.className = 'asf-hdr-right';
    left.appendChild(logo);
    left.appendChild(back);
    while (header.firstChild) center.appendChild(header.firstChild);   // nodes MOVE: ids and listeners survive
    Array.prototype.slice.call(center.querySelectorAll('*')).reverse().forEach(function (el) {
      if (isEmptyBox(el) && el.parentNode === center) hide(el);
    });
    Array.prototype.slice.call(center.children).forEach(function (el) { if (isEmptyBox(el)) hide(el); });

    // Title: the page's h1, else its first heading-like element, else its file name.
    var title = center.querySelector('h1') || center.querySelector('.header-title, .page-title, .title, h2');
    if (!title) {
      title = document.createElement('h1');
      title.textContent = labelForFile(file);
      center.insertBefore(title, center.firstChild);
    }
    if (/^\s*asifah analytics\s*$/i.test(title.textContent) && PAGE_TITLES[file] && file !== 'index.html') {
      title.textContent = PAGE_TITLES[file];
    }
    title.classList.add('asf-hdr-title');
    right.appendChild(themePill());
    grid.appendChild(left); grid.appendChild(center); grid.appendChild(right);
    header.appendChild(grid);
  }

  // Source headlines keep their own language and script: right-to-left text
  // reads right-to-left, and the browser's translate leaves it alone.
  var FOREIGN_RX = /[֐-ࣿיִ-﷿ﹰ-﻿Ѐ-ӿ぀-ヿ㐀-鿿가-힯]/;
  function markSourceScripts(root) {
    if (!root || !document.createTreeWalker) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n, el;
    while ((n = w.nextNode())) {
      el = n.parentElement;
      if (!el || el.hasAttribute('data-asf-src') || !FOREIGN_RX.test(n.nodeValue)) continue;
      if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(el.tagName)) continue;
      el.setAttribute('data-asf-src', '1');
      if (!el.hasAttribute('dir')) el.setAttribute('dir', 'auto');
      el.setAttribute('translate', 'no');
      el.classList.add('notranslate');
    }
  }
  function watchSourceScripts() {
    markSourceScripts(document.body);
    if (!window.MutationObserver) return;
    var pending = null;
    new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = null; markSourceScripts(document.body); }, 500);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function ensureSidebar() {
    var html = canonicalNavHtml();
    var sidebars = Array.prototype.slice.call(document.querySelectorAll('.nav-sidebar'));
    if (sidebars.length) {
      sidebars.forEach(function (sidebar) {
        sidebar.innerHTML = html;
        sidebar.id = sidebar.id || 'navSidebar';
      });
      return;
    }

    // ── v (Oct 3 2026) DO NOT DOUBLE UP ──────────────────────────────
    // rhetoric-qatar.html carries <aside class="sidebar" id="navSidebar">
    // with page-specific links (Qatar Rhetoric / Qatar Stability) that the
    // canonical nav has no equivalent for. The old code matched only
    // '.nav-sidebar', found nothing, and injected a SECOND rail -- two
    // sidebars side by side, plus 230px of body padding squeezing a grid
    // that had already allocated 220px to the first one.
    //
    // A page with its own navigation is LEFT ALONE rather than overwritten.
    // Replacing bespoke links with the canonical set would silently delete
    // navigation the reader depends on, which is worse than a visual
    // inconsistency -- and unlike the inconsistency, nobody would notice.
    var bespoke = document.querySelector('#navSidebar, aside.sidebar, nav.sidebar');
    if (bespoke) {
        bespoke.classList.add('asifah-bespoke-sidebar');
        if (window.console && console.info) {
            console.info('[Asifah shell] Page has its own sidebar (' +
                (bespoke.className || bespoke.id) + ') -- canonical nav not ' +
                'injected. Rename its class to "nav-sidebar" to adopt the ' +
                'standard nav, but only if its links are already in it.');
        }
        return;
    }

    var sidebar = document.createElement('nav');
    sidebar.className = 'nav-sidebar asifah-injected-sidebar';
    sidebar.id = 'navSidebar';
    sidebar.innerHTML = html;
    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.classList.add('asifah-injected-sidebar-active');
  }

  function ensureMobileNav() {
    if (!document.getElementById('asifahMobileMenu')) {
      var button = document.createElement('button');
      button.type = 'button';
      button.id = 'asifahMobileMenu';
      button.className = 'asifah-mobile-menu-btn';
      button.setAttribute('aria-label', 'Open navigation');
      button.innerHTML = '&#9776;';
      document.body.appendChild(button);
    }

    if (!document.getElementById('asifahMobileBackdrop')) {
      var backdrop = document.createElement('div');
      backdrop.id = 'asifahMobileBackdrop';
      backdrop.className = 'asifah-mobile-backdrop';
      document.body.appendChild(backdrop);
    }

    if (!document.getElementById('asifahMobileDrawer')) {
      var drawer = document.createElement('div');
      drawer.id = 'asifahMobileDrawer';
      drawer.className = 'asifah-mobile-drawer';
      drawer.innerHTML = '<button type="button" class="asifah-mobile-drawer-close" aria-label="Close navigation">&times;</button>' +
        '<div class="asifah-mobile-drawer-title">Asifah Navigation</div>' +
        canonicalNavHtml() + ladderDrawerHtml();
      document.body.appendChild(drawer);
    }

    var menu = document.getElementById('asifahMobileMenu');
    var backdropEl = document.getElementById('asifahMobileBackdrop');
    var drawerEl = document.getElementById('asifahMobileDrawer');
    var close = drawerEl.querySelector('.asifah-mobile-drawer-close');

    function open() {
      drawerEl.classList.add('open');
      backdropEl.classList.add('open');
    }
    function closeDrawer() {
      drawerEl.classList.remove('open');
      backdropEl.classList.remove('open');
    }

    menu.addEventListener('click', open);
    backdropEl.addEventListener('click', closeDrawer);
    close.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer();
    });
  }

  // SOCIALS (Nov 1 2026) -- one list, every page. Add/remove a row here only.
  var SOCIALS = [
    ['https://www.instagram.com/asifahanalytics/', 'Instagram', '@AsifahAnalytics', 'ig'],
    ['https://x.com/AsifahAnalytics', 'X', '@AsifahAnalytics', 'x']
  ];

  function socialsHtml() {
    return '<div class="asifah-footer-socials" aria-label="Follow Asifah Analytics">' +
      SOCIALS.map(function (s) {
        return '<a href="' + s[0] + '" target="_blank" rel="noopener" class="asifah-footer-social ' + s[3] + '">' +
          '<span class="asifah-footer-social-net">' + s[1] + '</span> ' + s[2] + '</a>';
      }).join('') +
      '</div>';
  }

  function footerHtml() {
    return '<div class="asifah-footer-title">Asifah Analytics</div>' +
      '<div class="asifah-footer-sources">Open-source intelligence dashboard built from public reporting, official releases, market and commodity data, humanitarian feeds, aviation notices, and regional social-source mirrors where available.</div>' +
      '<div class="asifah-footer-pills">' +
      '<a href="https://www.buymeacoffee.com/asifahanalytics" target="_blank" rel="noopener" class="asifah-footer-pill bmc">Buy Me a Coffee</a>' +
      '<a href="mailto:asifahanalytics@gmail.com" class="asifah-footer-pill contact">Contact Asifah</a>' +
      '</div>' +
      socialsHtml() +
      '<div class="asifah-footer-translate">Reading in another language? Your browser can translate this page. Source headlines stay in their original language.</div>' +
      '<div class="asifah-footer-disclaimer">Asifah Analytics is an open-source OSINT platform. Scores are convergence indicators based on publicly observable signals, not operational guidance or predictions of action.</div>' +
      '<div class="asifah-footer-links">' +
      '<a href="mission.html">Mission Statement</a>' +
      '<a href="privacy.html">Privacy Policy</a>' +
      '<a href="index.html">Home</a>' +
      '</div>';
  }

  function ensureFooter() {
    var footer = document.querySelector('footer.asifah-footer');
    if (!footer) {
      footer = document.querySelector('footer, .page-footer');
    }
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    footer.className = 'asifah-footer';
    // Nov 1 2026: a page may contribute its own block (methodology, sources, disclaimer)
    // with <section data-asifah-footer-extra>. It is moved INTO the shared footer, above
    // the standard content, so a page has one footer instead of two stacked boxes.
    var extra = document.querySelector('[data-asifah-footer-extra]');
    footer.innerHTML = footerHtml();
    if (extra) {
      extra.classList.add('asifah-footer-extra');
      footer.insertBefore(extra, footer.firstChild);
    }
  }

  function init() {
    document.body.classList.add('asifah-standardized');
    ensureTheme();
    retireLanguages();
    ensureHeader();
    ensureSidebar();
    ensureMobileNav();
    ensureLadderRail();
    ensureFooter();
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    watchSourceScripts();
    document.documentElement.setAttribute('data-asifah-shell', SHELL_VERSION);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
