(function () {
  'use strict';

  var LOGO_URL = 'https://raw.githubusercontent.com/Asifah-Analytics-C-A-V-E/asifah-analytics/refs/heads/main/Asifah_Analytics_1_25_26_V1_LOGO.png';
  var THEME_KEY = 'asifah-theme';

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
      return [special[slug] || (slug + '-stability.html'), 'Back to ' + labelForFile(file)];
    }
    if (isStabilityPage(file)) {
      var target = REGION_BY_COUNTRY[countrySlug(file)] || 'index.html';
      var label = target === 'index.html' ? 'Back to Home' : 'Back to Regional Dashboard';
      return [target, label];
    }
    return ['index.html', 'Back to Home'];
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
    return html;
  }

  function ensureTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (!saved) {
      saved = document.documentElement.getAttribute('data-theme') || 'dark';
    }
    saved = saved === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    var btn = document.querySelector('.asifah-theme-button');
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function ensureHeader() {
    var file = currentFile();
    var header = document.querySelector('header, .header');
    if (!header) return;
    header.classList.add('asifah-standard-header');
    Array.prototype.slice.call(header.querySelectorAll('.theme-row, .theme-toggle, .toggle-switch')).forEach(function (el) {
      if (!el.classList.contains('asifah-theme-button') && !el.closest('.asifah-theme-button')) {
        el.classList.add('asifah-legacy-control-hidden');
      }
    });
    Array.prototype.slice.call(header.querySelectorAll('.mobile-menu-btn, .menu-toggle, .mobile-hamburger')).forEach(function (el) {
      if (!el.classList.contains('asifah-mobile-menu-btn')) {
        el.classList.add('asifah-legacy-control-hidden');
      }
    });

    if (!header.querySelector('.header-logo, .asifah-standard-logo')) {
      var img = document.createElement('img');
      img.src = LOGO_URL;
      img.alt = 'Asifah Analytics';
      img.className = 'asifah-standard-logo';
      header.insertBefore(img, header.firstChild);
    }

    if (!header.querySelector('.back-link, .home-btn, .asifah-standard-back')) {
      var back = backTarget(file);
      var link = document.createElement('a');
      link.href = back[0];
      link.className = 'asifah-standard-back';
      link.textContent = back[1];
      header.insertBefore(link, header.firstChild);
    }

    if (!header.querySelector('.asifah-theme-button')) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'asifah-theme-button';
      button.innerHTML = '<span>Theme</span><span class="asifah-theme-switch-track"><span class="asifah-theme-switch-knob"></span></span>';
      button.addEventListener('click', toggleTheme);
      header.appendChild(button);
    }
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
        '<div class="asifah-mobile-drawer-title">Asifah Navigation</div>' + canonicalNavHtml();
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
    footer.innerHTML = footerHtml();
  }

  function init() {
    document.body.classList.add('asifah-standardized');
    ensureTheme();
    ensureHeader();
    ensureSidebar();
    ensureMobileNav();
    ensureFooter();
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
