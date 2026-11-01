/*
 * asifah-mecca-pact-card.js  v1.0.0  (Nov 1 2026)
 * Mecca Pact Watch card -- one script, every member page.
 *
 * USAGE (one line before </body>):
 *   <script src="resources/asifah-mecca-pact-card.js" data-member="turkey" defer></script>
 * data-member: saudi_arabia | turkey | pakistan | egypt | syria   (highlights that row)
 *
 * PLACEMENT: inside <div id="meccaPactCard"></div> if the page has one;
 * otherwise directly after the page's main <header>.
 *
 * Reads GET https://asifah-backend.onrender.com/api/mecca-pact (ME backend,
 * mecca_pact_watch.py). No Claude calls. If the endpoint is down or warming,
 * the card says so and never invents a reading.
 */
(function () {
  'use strict';
  var API = 'https://asifah-backend.onrender.com/api/mecca-pact';
  var me = document.currentScript;
  var focus = (me && me.getAttribute('data-member')) || '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CSS = '' +
    '.amp-card{background:var(--card-bg,var(--container-bg,#0d1b2e));border:2px solid rgba(167,139,250,.45);' +
    'border-left:5px solid #a78bfa;border-radius:12px;padding:18px 20px;margin:0 0 22px;color:var(--text-primary,#e2f0fb);' +
    'font-family:"Times New Roman",Times,serif;position:relative;z-index:1}' +
    '[dir="rtl"] .amp-card{border-left:2px solid rgba(167,139,250,.45);border-right:5px solid #a78bfa}' +
    '.amp-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}' +
    '.amp-title{flex:1;min-width:220px;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#a78bfa}' +
    '.amp-q{font-size:12.5px;font-style:italic;color:var(--text-muted,#93a4b8);margin-top:2px;text-transform:none;letter-spacing:0;font-weight:400}' +
    '.amp-pill{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.8px;padding:3px 10px;border-radius:5px;color:#fff;text-transform:uppercase}' +
    '.amp-rows{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:14px}' +
    '.amp-row{background:var(--article-bg,rgba(255,255,255,.03));border:1px solid var(--card-border,#1e3a5f);border-radius:9px;padding:10px 12px;min-width:0}' +
    '.amp-row.focus{border:2px solid #a78bfa;box-shadow:0 0 14px rgba(167,139,250,.25)}' +
    '.amp-name{font-size:13px;font-weight:700}' +
    '.amp-status{font-size:10.5px;color:var(--text-muted,#93a4b8);margin:2px 0 6px;line-height:1.35}' +
    '.amp-lanes{font-family:"Courier New",monospace;font-size:10.5px;color:var(--text-secondary,#93c5fd);margin-top:5px}' +
    '.amp-lines{margin:14px 0 0 18px}.amp-lines li{font-size:13px;line-height:1.55;color:var(--text-secondary,#b6c6da);margin-bottom:5px}' +
    '[dir="rtl"] .amp-lines{margin:14px 18px 0 0}' +
    '.amp-meta{font-size:10.5px;color:var(--text-muted,#7c8ea3);margin-top:10px;font-style:italic}' +
    '.amp-meta a{color:#a78bfa}' +
    '@media(max-width:768px){.amp-card{padding:14px}.amp-rows{grid-template-columns:1fr}}';

  function injectCss() {
    if (document.getElementById('amp-css')) return;
    var st = document.createElement('style');
    st.id = 'amp-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function mount() {
    var host = document.getElementById('meccaPactCard');
    if (!host) {
      host = document.createElement('div');
      host.id = 'meccaPactCard';
      var hdr = document.querySelector('.main-content > header, main > header, .main-content header, header');
      if (hdr && hdr.parentNode) hdr.parentNode.insertBefore(host, hdr.nextSibling);
      else (document.querySelector('.container') || document.body).insertBefore(host, (document.querySelector('.container') || document.body).firstChild);
    }
    return host;
  }

  var VERDICT_COLORS = { shield: '#ef4444', channel: '#38bdf8', both: '#a78bfa', paper: '#dc2626',
                         present: '#6b7280', quiet: '#4b5563' };
  var ORDER = ['saudi_arabia', 'turkey', 'pakistan', 'egypt', 'syria'];

  function render(host, d) {
    var r = d.reading || {}, m = d.members || {};
    var rows = ORDER.filter(function (k) { return m[k]; }).map(function (k) {
      var x = m[k], ln = x.lanes || {};
      var lanes = (k === 'saudi_arabia')
        ? 'Riyadh sees guarantors: def ' + (ln.defence || 0) + ' · dip ' + (ln.diplomacy || 0) + ' · enl ' + (ln.enlargement || 0)
        : 'def ' + (ln.defence || 0) + ' · dip ' + (ln.diplomacy || 0) + ' · enl ' + (ln.enlargement || 0) + (ln.talk ? ' · talk ' + ln.talk : '');
      var link = x.page ? ' <a href="' + esc(x.page) + '" style="color:inherit;text-decoration:none;opacity:.7;">↗</a>' : '';
      return '<div class="amp-row' + (k === focus ? ' focus' : '') + '">' +
        '<div class="amp-name">' + (x.flag || '') + ' ' + esc(x.name) + link + '</div>' +
        '<div class="amp-status">' + esc(x.status_text) + '</div>' +
        '<span class="amp-pill" style="background:' + esc(x.posture_color || '#6b7280') + ';">' + esc(x.posture_word || x.posture) + '</span>' +
        '<div class="amp-lanes">' + esc(lanes) + ' · ' + esc(x.stories || 0) + ' stories</div>' +
        '</div>';
    }).join('');
    var lines = (r.lines || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
    var when = d.scanned_at ? new Date(d.scanned_at).toLocaleString() : '';
    host.innerHTML = '<div class="amp-card">' +
      '<div class="amp-top"><div class="amp-title">🤝 Mecca Pact Watch' +
      '<div class="amp-q">' + esc(r.hub_question || 'Shield or channel -- and which members are moving?') + '</div></div>' +
      '<span class="amp-pill" style="background:' + (VERDICT_COLORS[r.verdict] || '#6b7280') + ';">' + esc(r.verdict_word || r.verdict || '') + '</span></div>' +
      '<div class="amp-rows">' + rows + '</div>' +
      (lines ? '<ul class="amp-lines">' + lines + '</ul>' : '') +
      '<div class="amp-meta">Membership as of ' + esc(d.membership_as_of || '') + ' · scanned ' + esc(when) +
      ' · members read from their own capitals\' press (EN/TR/UR/AR); Saudi Arabia and Egypt read from their trackers. ' +
      esc((d.baseline || {}).note || '') + ' Convergence indicator, not a prediction.</div>' +
      '</div>';
  }

  function load() {
    injectCss();
    var host = mount();
    host.innerHTML = '<div class="amp-card"><div class="amp-title">🤝 Mecca Pact Watch</div><div class="amp-meta">Loading…</div></div>';
    fetch(API + (focus ? '?member=' + encodeURIComponent(focus) : ''))
      .then(function (res) { return res.json(); })
      .then(function (d) {
        if (!d || d.warming || !d.members) {
          host.innerHTML = '<div class="amp-card"><div class="amp-title">🤝 Mecca Pact Watch</div>' +
            '<div class="amp-meta">First scan running -- reload in a minute.</div></div>';
          return;
        }
        render(host, d);
      })
      .catch(function () {
        host.innerHTML = '<div class="amp-card"><div class="amp-title">🤝 Mecca Pact Watch</div>' +
          '<div class="amp-meta">Could not reach the pact reading just now -- unread, not quiet.</div></div>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
