/* Asifah Analytics -- Polar Gateway card -- v1.0.0 (Nov 4 2026)
 *
 * One component, every page that sits on a polar gateway. A page declares
 *     <div data-polar-gateway="arctic"></div>      (Canada, US, Greenland)
 *     <div data-polar-gateway="antarctic"></div>   (Argentina, Chile; UK later)
 * and loads this file. The card reads /api/wha/polar-gateways/<gateway> on the
 * WHA backend (polar_gateways.py) and falls back to the standing facts when
 * the backend is unread -- unread is said out loud, never shown as calm.
 *
 * The idea: each gateway is a spoke on the chokepoint wheel.
 *   Arctic    = the Suez backup   (partner chokepoint: Suez / Red Sea)
 *   Antarctic = the Panama backup (partner chokepoint: Panama Canal)
 */
(function () {
  'use strict';
  var API = 'https://asifah-wha-backend.onrender.com/api/wha/polar-gateways/';
  var LVL = [
    ['Quiet', '#6b7280'], ['Routine', '#38bdf8'], ['Watch', '#f59e0b'], ['Active', '#f97316'], ['Incident', '#ef4444']
  ];
  var STATUS = { open: ['Open', '#22c55e'], monitored: ['Monitored', '#eab308'], contested: ['Contested', '#f97316'],
                 disrupted: ['Disrupted', '#ef4444'], unread: ['Not reporting', '#6b7280'] };
  var LANE = { corroborated: 'confirmed by 2+ outlets', single_source: 'one outlet, not yet corroborated',
               rumint: 'rumour only', coupling: 'partner chokepoint disrupted', volume: 'busier than usual',
               routine: 'routine coverage', none: 'unread' };
  var FALLBACK = {
    arctic: {
      name: 'Gateway to the Arctic', icon: '🧊', partner: 'Suez / Red Sea',
      so_what: 'The Arctic is the Suez backup. When the Red Sea closes, Russia\'s Northern Sea Route pitch gets louder -- and the gateway Canada and the US both claim gets more valuable to everyone, including Beijing.',
      facts: ['Canada calls the Northwest Passage internal waters; the US calls it an international strait.',
              'Russia\'s Northern Sea Route is the Arctic lane that carries real cargo.',
              'China calls itself a "near-Arctic state".'],
      watch: ['Red Sea / Suez status', 'Northern Sea Route traffic', 'Foreign warships in the Northwest Passage', 'US moves on Greenland']
    },
    antarctic: {
      name: 'Gateway to the Antarctic', icon: '🐧', partner: 'Panama Canal',
      so_what: 'The south is the Panama backup. When the canal restricts transits, the Strait of Magellan and the Drake Passage carry the overflow -- and whoever builds the ports at Ushuaia and Punta Arenas holds the keys to Antarctica.',
      facts: ['Ushuaia (Argentina) and Punta Arenas (Chile) are the two southern gateways to Antarctica.',
              'The 1959 Antarctic Treaty freezes territorial claims and bans mining and military bases.',
              'In 2023-24 drought cut Panama Canal transits and ships went around South America.'],
      watch: ['Panama Canal draft and transit limits', 'Diversions via Magellan / Cape Horn', 'Who builds Ushuaia and Punta Arenas', 'Antarctic Treaty mining talk']
    }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function em(s) { return String(s || '').replace(/--/g, '—'); }

  function css() {
    if (document.getElementById('asfPolarCss')) return;
    var st = document.createElement('style');
    st.id = 'asfPolarCss';
    st.textContent =
      '.asf-polar{background:var(--bg-card,#0d1b2e);border:1px solid var(--border-color,#1e3a5f);border-left:4px solid #22d3ee;border-radius:10px;padding:16px 18px;margin:0 0 22px;color:var(--text-primary,#e2f0fb);font-family:inherit;position:relative;z-index:1}' +
      '.asf-polar-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}' +
      '.asf-polar-title{font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-size:0.95rem}' +
      '.asf-polar-sub{font-size:0.72rem;color:var(--text-muted,#5d7ea3);letter-spacing:1px;text-transform:uppercase;margin-top:2px}' +
      '.asf-polar-pill{font-size:0.66rem;font-weight:800;letter-spacing:1px;padding:4px 10px;border-radius:4px;color:#04111f;white-space:nowrap}' +
      '.asf-polar-read{font-size:0.95rem;line-height:1.55;font-weight:700;margin:6px 0 10px}' +
      '.asf-polar-row{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px}' +
      '.asf-polar-chip{font-size:0.75rem;border:1px solid var(--border-color,#1e3a5f);border-radius:999px;padding:4px 10px;display:inline-flex;gap:6px;align-items:center}' +
      '.asf-polar-dot{width:8px;height:8px;border-radius:50%;display:inline-block}' +
      '.asf-polar-sowhat{font-size:0.86rem;line-height:1.55;color:var(--text-secondary,#93c5fd);background:rgba(34,211,238,0.06);border-radius:6px;padding:10px 12px;margin-bottom:10px}' +
      '.asf-polar h5{font-size:0.68rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted,#5d7ea3);margin:10px 0 4px}' +
      '.asf-polar ul{margin:0;padding-left:18px;font-size:0.82rem;line-height:1.5;color:var(--text-secondary,#93c5fd)}' +
      '.asf-polar a{color:var(--accent-cyan,#38bdf8)}' +
      '.asf-polar details summary{cursor:pointer;font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted,#5d7ea3);margin-top:8px}' +
      '.asf-polar-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:800px){.asf-polar-cols{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function render(el, gid, d, live) {
    var fb = FALLBACK[gid] || {};
    var lvl = live ? Math.max(0, Math.min(4, parseInt(d.level || 0, 10))) : 0;
    var lv = LVL[lvl];
    var partner = (live && d.partner) ? d.partner : { label: fb.partner, status: 'unread' };
    var ps = STATUS[partner.status] || STATUS.unread;
    var waters = (live && d.gateway_waters) ? d.gateway_waters : { status: 'unread' };
    var ws = STATUS[waters.status] || STATUS.unread;
    var events = (live && d.events) || [];
    var items = (live && d.items) || [];
    var read = live ? d.sentence : 'Gateway sensor unavailable this load -- unread, not calm. Standing facts below.';
    var h = '<div class="asf-polar-head"><div><div class="asf-polar-title">' + esc((d && d.icon) || fb.icon) + ' ' + esc((d && d.name) || fb.name) + '</div>' +
      '<div class="asf-polar-sub">A spoke on the chokepoint wheel · ' + (gid === 'arctic' ? 'the Suez backup' : 'the Panama backup') + '</div></div>' +
      '<span class="asf-polar-pill" style="background:' + (live ? lv[1] : '#6b7280') + ';">' + (live ? ('L' + lvl + ' — ' + lv[0]) : 'UNREAD') + '</span></div>' +
      '<div class="asf-polar-read">' + esc(em(read)) + (live && d.lane && d.lane !== 'none' ? ' <span style="font-weight:400;color:var(--text-muted,#5d7ea3);font-size:0.8rem;">(' + esc(LANE[d.lane] || d.lane) + ')</span>' : '') + '</div>' +
      '<div class="asf-polar-row">' +
        '<span class="asf-polar-chip"><span class="asf-polar-dot" style="background:' + ps[1] + '"></span>Partner chokepoint · ' + esc(partner.label) + ': <b>' + esc(ps[0]) + '</b></span>' +
        '<span class="asf-polar-chip"><span class="asf-polar-dot" style="background:' + ws[1] + '"></span>Gateway waters: <b>' + esc(ws[0]) + '</b></span>' +
        (live && d.coupling_active ? '<span class="asf-polar-chip" style="border-color:#f97316;color:#f97316;">⚡ Coupling live</span>' : '') +
      '</div>' +
      '<div class="asf-polar-sowhat"><b>So What:</b> ' + esc(em((d && d.so_what) || fb.so_what)) + '</div>';
    var left = '', right = '';
    if (events.length) {
      left += '<h5>Events this cycle</h5><ul>' + events.map(function (e) {
        return '<li>' + esc(em(e.what)) + ' — <em>' + esc(LANE[e.lane] || e.lane) + '</em>' +
          ((e.outlets || []).length ? ' (' + esc(e.outlets.slice(0, 3).join(', ')) + ')' : '') + '</li>';
      }).join('') + '</ul>';
    }
    left += '<h5>Watch</h5><ul>' + ((d && d.watch) || fb.watch || []).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
    if (items.length) {
      right += '<h5>Latest items</h5><ul>' + items.slice(0, 5).map(function (i) {
        return '<li>' + (i.url ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener">' : '') + esc(i.title) + (i.url ? '</a>' : '') +
          ' <span style="color:var(--text-muted,#5d7ea3)">— ' + esc(i.source || '') + '</span></li>';
      }).join('') + '</ul>';
    }
    right += '<details><summary>Standing facts</summary><ul>' + ((d && d.facts) || fb.facts || []).map(function (f) { return '<li>' + esc(em(f)) + '</li>'; }).join('') + '</ul>' +
      (live && d.facts_as_of ? '<div style="font-size:0.7rem;color:var(--text-muted,#5d7ea3);margin-top:4px;">Facts as of ' + esc(d.facts_as_of) + ' · re-verified on a 45-day cycle</div>' : '') + '</details>';
    h += '<div class="asf-polar-cols"><div>' + left + '</div><div>' + right + '</div></div>';
    el.innerHTML = h;
  }

  function init() {
    css();
    Array.prototype.forEach.call(document.querySelectorAll('[data-polar-gateway]'), function (el) {
      var gid = (el.getAttribute('data-polar-gateway') || '').toLowerCase();
      if (!FALLBACK[gid]) return;
      el.classList.add('asf-polar');
      render(el, gid, FALLBACK[gid], false);
      el.querySelector('.asf-polar-read').textContent = 'Reading the gateway sensor…';
      fetch(API + gid).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.success !== false && typeof d.level !== 'undefined') render(el, gid, d, true);
        else render(el, gid, FALLBACK[gid], false);
      }).catch(function () { render(el, gid, FALLBACK[gid], false); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
