/*
 * Asifah Analytics -- shared page chrome  v2.0.0  (Jul 23 2026)
 * ============================================================================
 * WHAT CHANGED FROM v1 AND WHY
 * ============================================================================
 * v1 was DESTRUCTIVE. Three lines did the damage:
 *     sidebar.innerHTML = html;          // wiped page-specific nav sections
 *     footer.innerHTML  = footerHtml();  // wiped page-specific footers
 *     + ensureHeader() hid the page's own theme toggle, then added its own
 *
 * The practical effect: the HTML file stopped describing the rendered page.
 * Editing a page's sidebar did nothing (the shell overwrote it on load), rich
 * page-specific footers -- data sources, methodology, per-page disclaimers --
 * were replaced by one generic block, and headers that already had a designed
 * layout got extra elements stacked into them.
 *
 * v2 keeps the good idea (one file updates nav everywhere) and makes it
 * ADDITIVE:
 *   1. SIDEBAR  -- canonical nav is injected, but any element marked
 *                  .nav-page-extra is PRESERVED and re-appended. That is how
 *                  a country page keeps its "divider + country pair" tail
 *                  (SIDEBAR CANON v2) while still getting canonical nav.
 *   2. FOOTER   -- only filled when the page has NO real footer of its own.
 *                  A page footer that already carries the canonical CTA is
 *                  left completely alone.
 *   3. HEADER   -- only adds what is genuinely missing. If the page already
 *                  has a working theme toggle, the shell neither hides it nor
 *                  adds a second one.
 *   4. OPT-OUT  -- <body data-asifah-shell="off">    disables everything
 *                  <body data-asifah-shell="nav">    nav only, hands off
 *                                                    header + footer
 *   5. VERSION  -- logged to console so a stale cached copy is obvious at a
 *                  glance. THIS is what bit us: the deployed v1 predated the
 *                  Africa button, and nothing on the page said so.
 * ============================================================================
 */
(function () {
  'use strict';

  var SHELL_VERSION = '2.0.0';
  var LOGO_URL = 'https://raw.githubusercontent.com/Asifah-Analytics-C-A-V-E/asifah-analytics/refs/heads/main/Asifah_Analytics_1_25_26_V1_LOGO.png';
  var THEME_KEY = 'asifah-theme';

  // ── NAV CANON (alphabetical, no abbreviations) ─────────────────────────
  // To add a page platform-wide, add it here and redeploy this one file.
  var REGION_DASHBOARDS = [
    ['africa.html', '&#127757; Africa'],
    ['asia.html', '&#127759; Asia &amp; Pacific'],
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

  // Regional BLUF hubs are NOT country rhetoric pages -- keep this in sync
  // with REGIONAL_RHETORIC or back-button routing misfires.
  var REGIONAL_HUB_RE = /^rhetoric-(africa|asia|europe|index|wha)\.html$/;

  var REGION_BY_COUNTRY = {
    afghanistan: 'asia.html', china: 'asia.html', india: 'asia.html', japan: 'asia.html',
    kazakhstan: 'asia.html', 'north-korea': 'asia.html', pakistan: 'asia.html',
    'south-korea': 'asia.html', taiwan: 'asia.html', turkmenistan: 'asia.html',
    vietnam: 'asia.html',

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

    burkina_faso: 'africa.html', 'burkina-faso': 'africa.html', car: 'africa.html',
    drc: 'africa.html', ethiopia: 'africa.html', kenya: 'africa.html',
    mali: 'africa.html', niger: 'africa.html', nigeria: 'africa.html',
    rwanda: 'africa.html', somalia: 'africa.html',
    south_africa: 'africa.html', 'south-africa': 'africa.html',
    south_sudan: 'africa.html', 'south-sudan': 'africa.html', sudan: 'africa.html',
    tanzania: 'africa.html', uganda: 'africa.html'
  };

  // ── helpers ────────────────────────────────────────────────────────────
  function currentFile() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function shellMode() {
    var m = (document.body.getAttribute('data-asifah-shell') || '').toLowerCase();
    return (m === 'off' || m === 'nav') ? m : 'full';
  }

  function countrySlug(file) {
    return file.replace(/^rhetoric-/, '')
               .replace(/-stability\.html$/, '')
               .replace(/\.html$/, '');
  }

  function labelForFile(file) {
    var base = countrySlug(file).replace(/_/g, '-');
    return base.split('-').filter(Boolean).map(function (p) {
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  }

  function isRhetoricPage(file) {
    return /^rhetoric-/.test(file) && !REGIONAL_HUB_RE.test(file);
  }

  function isStabilityPage(file) {
    return /-stability\.html$/.test(file) ||
      ['russia.html', 'ukraine.html', 'israel.html', 'jordan.html',
       'greenland.html', 'poland.html'].indexOf(file) >= 0;
  }

  function backTarget(file) {
    if (isRhetoricPage(file)) {
      var slug = countrySlug(file);
      var special = {
        dprk: 'north-korea-stability.html', russia: 'russia.html',
        ukraine: 'ukraine.html', israel: 'israel.html',
        greenland: 'greenland.html', poland: 'poland.html'
      };
      return [special[slug] || (slug + '-stability.html'), 'Back to ' + labelForFile(file)];
    }
    if (isStabilityPage(file)) {
      var target = REGION_BY_COUNTRY[countrySlug(file)] || 'index.html';
      return [target, target === 'index.html' ? 'Back to Home' : 'Back to Regional Dashboard'];
    }
    return ['index.html', 'Back to Home'];
  }

  function navLink(item, kind, file) {
    var href = item[0], label = item[1];
    var current = href.toLowerCase() === file;
    var classes = ['nav-btn'];
    if (kind) classes.push(kind);
    classes.push(current ? 'current-page' : 'active-nav');
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
    REGION_DASHBOARDS.forEach(function (i) { html += navLink(i, '', file); });
    html += '<div class="nav-divider"></div><div class="nav-sidebar-label">Global Trackers</div>';
    GLOBAL_TRACKERS.forEach(function (i) { html += navLink(i, 'tracker-btn', file); });
    html += '<div class="nav-divider"></div><div class="nav-sidebar-label">Regional Rhetoric</div>';
    REGIONAL_RHETORIC.forEach(function (i) { html += navLink(i, 'rhetoric-btn', file); });
    return html;
  }

  // ── theme ──────────────────────────────────────────────────────────────
  function ensureTheme() {
    var saved = localStorage.getItem(THEME_KEY) ||
                document.documentElement.getAttribute('data-theme') || 'dark';
    saved = (saved === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    var btn = document.querySelector('.asifah-theme-button');
    if (btn) btn.setAttribute('aria-label',
      'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    // Keep any page-native checkbox toggle visually in sync.
    var native = document.getElementById('themeToggle');
    if (native && native.type === 'checkbox') native.checked = (theme === 'light');
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // ── header (ADDITIVE -- v2) ────────────────────────────────────────────
  function preferredHeader() {
    var headers = Array.prototype.slice.call(document.querySelectorAll('header, .header'));
    if (!headers.length) return null;
    var visible = headers.filter(function (h) { return !h.querySelector('#pageLoadScreen'); });
    var candidates = visible.length ? visible : headers;
    var semantic = candidates.filter(function (h) {
      return h.querySelector('h1, h2, .header-content, .language-switcher, .theme-toggle, .lang-btn');
    });
    return (semantic.length ? semantic : candidates).pop();
  }

  function pageHasOwnThemeControl(header) {
    // A page-native toggle counts if it exists ANYWHERE on the page -- some
    // layouts put it outside <header>.
    return !!(document.getElementById('themeToggle') ||
              document.querySelector('.theme-toggle, .theme-row, .toggle-switch'));
  }

  function ensureHeader() {
    var header = preferredHeader();
    if (!header) return;
    header.classList.add('asifah-standard-header');

    // v2: do NOT hide the page's own theme control. v1 hid it and injected a
    // replacement, which is what made headers look "way off" on pages that
    // already had a designed control.
    var hasOwnTheme = pageHasOwnThemeControl(header);

    if (!header.querySelector('img, .header-logo, .asifah-standard-logo')) {
      var img = document.createElement('img');
      img.src = LOGO_URL;
      img.alt = 'Asifah Analytics';
      img.className = 'asifah-standard-logo';
      header.insertBefore(img, header.firstChild);
    }

    if (!header.querySelector('.back-link, .home-btn, .asifah-standard-back')) {
      var back = backTarget(currentFile());
      var link = document.createElement('a');
      link.href = back[0];
      link.className = 'asifah-standard-back';
      link.textContent = back[1];
      header.insertBefore(link, header.firstChild);
    }

    if (!hasOwnTheme && !header.querySelector('.asifah-theme-button')) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'asifah-theme-button';
      button.innerHTML = '<span>Theme</span><span class="asifah-theme-switch-track">' +
                         '<span class="asifah-theme-switch-knob"></span></span>';
      button.addEventListener('click', toggleTheme);
      header.appendChild(button);
    }
  }

  // ── sidebar (PRESERVES page-specific sections -- v2) ───────────────────
  function ensureSidebar() {
    var html = canonicalNavHtml();
    var sidebars = Array.prototype.slice.call(document.querySelectorAll('.nav-sidebar'));

    if (sidebars.length) {
      sidebars.forEach(function (sidebar) {
        // v2: rescue anything the page marked as its own before overwriting.
        // Country pages use this for the "divider + country pair" tail that
        // SIDEBAR CANON v2 requires (e.g. Somalia's tracker/stability pair).
        var extras = Array.prototype.slice.call(sidebar.querySelectorAll('.nav-page-extra'));
        sidebar.innerHTML = html;
        extras.forEach(function (node) { sidebar.appendChild(node); });
        if (!sidebar.id) sidebar.id = 'navSidebar';
      });
      return;
    }

    var injected = document.createElement('nav');
    injected.className = 'nav-sidebar asifah-injected-sidebar';
    injected.id = 'navSidebar';
    injected.innerHTML = html;
    document.body.insertBefore(injected, document.body.firstChild);
    document.body.classList.add('asifah-injected-sidebar-active');
  }

  function ensureWatermarkMode() {
    var existing = document.querySelector('.watermark, .page-watermark, .asifah-watermark');
    document.body.classList.add(existing ? 'asifah-page-watermark-existing'
                                         : 'asifah-shell-watermark-active');
  }

  // ── mobile nav ─────────────────────────────────────────────────────────
  function ensureMobileNav() {
    // If the page already ships a working drawer, don't add a second one.
    if (document.querySelector('.mobile-drawer, #mobileDrawer')) return;

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
      drawer.innerHTML =
        '<button type="button" class="asifah-mobile-drawer-close" aria-label="Close navigation">&times;</button>' +
        '<div class="asifah-mobile-drawer-title">Asifah Navigation</div>' + canonicalNavHtml();
      document.body.appendChild(drawer);
    }

    var menu = document.getElementById('asifahMobileMenu');
    var backdropEl = document.getElementById('asifahMobileBackdrop');
    var drawerEl = document.getElementById('asifahMobileDrawer');
    var close = drawerEl.querySelector('.asifah-mobile-drawer-close');

    function open() { drawerEl.classList.add('open'); backdropEl.classList.add('open'); }
    function shut() { drawerEl.classList.remove('open'); backdropEl.classList.remove('open'); }

    if (menu) menu.addEventListener('click', open);
    if (backdropEl) backdropEl.addEventListener('click', shut);
    if (close) close.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }

  // ── footer (NON-DESTRUCTIVE -- v2) ─────────────────────────────────────
  function footerHtml() {
    return '<div class="asifah-footer-title">Asifah Analytics</div>' +
      '<div class="asifah-footer-sources">Open-source intelligence dashboard built from public reporting, official releases, market and commodity data, humanitarian feeds, aviation notices, and regional social-source mirrors where available.</div>' +
      '<div class="asifah-footer-pills">' +
      '<a href="https://www.buymeacoffee.com/asifahanalytics" target="_blank" rel="noopener" class="asifah-footer-pill bmc">Buy Me a Coffee</a>' +
      '<a href="mailto:hello@asifahanalytics.com" class="asifah-footer-pill contact">Contact Asifah</a>' +
      '</div>' +
      '<div class="asifah-footer-disclaimer">Asifah Analytics is an open-source OSINT platform. Scores are convergence indicators based on publicly observable signals, not operational guidance or predictions of action.</div>' +
      '<div class="asifah-footer-links">' +
      '<a href="mission.html">Mission Statement</a>' +
      '<a href="privacy.html">Privacy Policy</a>' +
      '<a href="index.html">Home</a>' +
      '</div>';
  }

  function footerIsSubstantive(el) {
    if (!el) return false;
    if (el.getAttribute('data-asifah-footer') === 'keep') return true;
    var html = (el.innerHTML || '').toLowerCase();
    // A page footer that already carries the canonical CTA is the page's own
    // work -- often with data sources and methodology the shell cannot know.
    return html.indexOf('buymeacoffee') !== -1 || html.length > 400;
  }

  function ensureFooter() {
    var footer = document.querySelector('footer.asifah-footer') ||
                 document.querySelector('footer, .page-footer');

    // v2: never clobber a real page footer. v1 replaced every footer with the
    // generic block, silently deleting per-page sources/methodology text.
    if (footerIsSubstantive(footer)) {
      footer.classList.add('asifah-footer-preserved');
      return;
    }
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    footer.className = 'asifah-footer';
    footer.innerHTML = footerHtml();
  }

  // ── init ───────────────────────────────────────────────────────────────
  function init() {
    var mode = shellMode();
    if (mode === 'off') {
      console.log('[Asifah Shell v' + SHELL_VERSION + '] disabled via data-asifah-shell="off"');
      return;
    }
    document.body.classList.add('asifah-standardized');
    ensureWatermarkMode();
    ensureTheme();
    ensureSidebar();
    ensureMobileNav();
    if (mode === 'full') {
      ensureHeader();
      ensureFooter();
    }
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    // Version in the console: a stale cached copy is otherwise invisible, which
    // is exactly how the missing Africa button went unexplained.
    console.log('[Asifah Shell v' + SHELL_VERSION + '] chrome applied (mode=' + mode +
                ', nav items=' + (REGION_DASHBOARDS.length + GLOBAL_TRACKERS.length +
                                  REGIONAL_RHETORIC.length) + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
