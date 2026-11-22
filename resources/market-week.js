/* Asifah Analytics -- THE WEEK IN MARKETS banner -- v1.1.0 (Nov 22 2026: 'not yet' items explain themselves -- what it means, and the signs that would mean it is changing, with today's reading)
 * v1.0.0 (Nov 21 2026)
 *
 * Rachel (Nov 21): "we need to catch what happened and be able to talk about
 * what it reflects (what kinds of fears it reflects) and what that could mean
 * on a wider global scale."
 *
 * Owns the top banner on market-watch.html (#headlineBanner). Reads the ME
 * backend's market_week.py (/api/market-week): five trading sessions of
 * cross-asset prices, read for which fears they fit, each with its numbers,
 * what it reflects and where it can travel. The monthly fragility headline that
 * used to sit here now lives inside the fragility card (#fragilityLead).
 *
 * Doctrine: exposure, not instruction. Context labelled as context. Unread is
 * said out loud, never shown as calm. Display only; one fetch per page load.
 */
(function () {
  'use strict';
  var API = 'https://asifah-backend.onrender.com/api/market-week';
  var BAND = { calm: 'normal', uneasy: 'elevated', stressed: 'high', acute: 'critical' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pc(x) { return x == null ? 'n/a' : (x > 0 ? '+' : '') + x.toFixed(1) + '%'; }

  function css() {
    if (document.getElementById('mwkCss')) return;
    var st = document.createElement('style');
    st.id = 'mwkCss';
    st.textContent =
      '#headlineBanner{contain:inline-size}' +
      '.mwk-pill{display:inline-block;font-family:"Courier New",monospace;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:999px;margin-right:8px;vertical-align:middle}' +
      '.mwk-pill.calm{background:rgba(34,197,94,.15);color:#16a34a}.mwk-pill.uneasy{background:rgba(234,179,8,.16);color:#ca8a04}' +
      '.mwk-pill.stressed{background:rgba(249,115,22,.16);color:#ea580c}.mwk-pill.acute{background:rgba(239,68,68,.16);color:#dc2626}' +
      '.mwk-lab{font-family:"Courier New",monospace;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin:16px 0 8px}' +
      '.mwk-fears{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}' +
      '.mwk-fear{border:1px solid var(--card-border);border-radius:10px;padding:11px 13px;background:rgba(127,127,127,.05);font-size:12.5px;line-height:1.55;color:var(--text-secondary)}' +
      '.mwk-fear h4{margin:0 0 6px;font-size:13.5px;line-height:1.35;color:var(--text-primary);display:flex;justify-content:space-between;gap:8px}' +
      '.mwk-dots{font-size:11px;letter-spacing:1px;color:#ef4444;white-space:nowrap}' +
      '.mwk-fear .k{display:block;font-size:9.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);margin-top:7px}' +
      '.mwk-fear .ev{font-variant-numeric:tabular-nums;color:var(--text-primary)}' +
      '.mwk-not{display:flex;flex-direction:column;gap:6px}' +
      '.mwk-not div{font-size:12.5px;line-height:1.5;padding:8px 12px;border-radius:8px;border:1px dashed rgba(34,197,94,.55);color:var(--text-secondary)}' +
      '.mwk-not b{color:var(--text-primary)}' +
      '.mwk-why{margin-top:6px}.mwk-why summary{text-transform:none!important;letter-spacing:0!important;font-size:12px!important;color:var(--accent)!important}' +
      '.mwk-why p{margin:6px 0;line-height:1.55}.mwk-why .mwk-wl{font-weight:700;color:var(--text-primary)}' +
      '.mwk-why ul{list-style:none;padding:0;margin:4px 0 0}.mwk-why li{display:flex;gap:8px;margin:5px 0;line-height:1.5}.mwk-why .ic{flex:0 0 18px}' +
      '.mwk-ctx div{font-size:12.5px;line-height:1.55;padding:8px 12px;border-left:3px solid #a855f7;background:rgba(168,85,247,.06);border-radius:6px;margin-bottom:6px;color:var(--text-secondary)}' +
      '.mwk-afraid{font-size:14.5px;line-height:1.5;margin:2px 0 8px;color:var(--text-secondary)}.mwk-afraid b{color:var(--text-primary)}' +
      '.mwk-sowhat{font-size:14px;line-height:1.6;padding:10px 14px;border-radius:8px;background:rgba(56,189,248,.07);border-left:3px solid var(--accent);color:var(--text-primary)}' +
      '.mwk-world{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:5px 18px;font-size:12px}' +
      '.mwk-w{display:grid;grid-template-columns:92px 1fr 48px;align-items:center;gap:8px}' +
      '.mwk-w .bar{height:7px;border-radius:4px;background:rgba(127,127,127,.15);position:relative;overflow:hidden}' +
      '.mwk-w .bar i{position:absolute;top:0;bottom:0;right:50%;background:#ef4444;border-radius:4px}' +
      '.mwk-w .bar i.up{right:auto;left:50%;background:#22c55e}' +
      '.mwk-w .n{text-align:right;font-variant-numeric:tabular-nums}' +
      '.mwk-foot{font-size:11px;color:var(--text-muted);margin-top:14px;line-height:1.5}' +
      '#headlineBanner details summary{cursor:pointer;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-top:10px}' +
      '@media(max-width:640px){.mwk-fears{grid-template-columns:1fr}.headline-title{font-size:18px!important}}';
    document.head.appendChild(st);
  }

  function ago(iso) {
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(m)) return '';
    return m < 90 ? m + ' min ago' : Math.round(m / 60) + 'h ago';
  }

  function fearCard(f) {
    var dots = '';
    for (var i = 1; i <= 3; i++) dots += i <= (f.strength || 1) ? '●' : '○';
    return '<div class="mwk-fear"><h4><span>' + esc(f.name) + '</span><span class="mwk-dots" title="How strongly this week\'s prices fit this fear (1-3)">' + dots + '</span></h4>' +
      '<span class="k">What it reflects</span>' + esc(f.reflects) +
      '<span class="k">The evidence</span><span class="ev">' + esc(f.evidence) + '</span>' +
      '<span class="k">🌍 Wider world</span>' + esc(f.global) + '</div>';
  }

  function world(list) {
    if (!list || !list.length) return '';
    var max = Math.max.apply(null, list.map(function (w) { return Math.abs(w.r5); }).concat([5]));
    return '<div class="mwk-lab">World markets, same five sessions</div><div class="mwk-world">' +
      list.map(function (w) {
        var wd = Math.min(50, Math.abs(w.r5) / max * 50);
        return '<div class="mwk-w"><span>' + esc(w.name) + '</span><span class="bar"><i class="' + (w.r5 >= 0 ? 'up' : '') + '" style="width:' + wd.toFixed(1) + '%"></i></span><span class="n">' + pc(w.r5) + '</span></div>';
      }).join('') + '</div>';
  }

  function render(d) {
    var b = document.getElementById('headlineBanner');
    if (!b) return;
    var t = document.getElementById('headlineTitle'), p = document.getElementById('headlineProse');
    if (!d || !d.available || d.band === 'unread') {
      b.className = 'headline-banner';
      if (t) t.textContent = 'The week in markets: unread';
      if (p) p.innerHTML = 'This week\'s cross-market read could not be loaded. <strong>Unread, not calm.</strong> The monthly fragility read is in its card below.';
      return;
    }
    b.className = 'headline-banner band-' + (BAND[d.band] || 'normal');
    if (t) t.innerHTML = '<span class="mwk-pill ' + esc(d.band) + '">' + esc(d.band_words) + '</span>' + esc(d.title || d.headline);
    var fears = d.fears || [];
    var html = '';
    if (fears.length) {
      html += '<div class="mwk-afraid">What the tape is afraid of: <b>' + fears.slice(0, 3).map(function (f) { return esc(f.name); }).join('</b> · <b>') + '</b></div>';
    }
    html += d.summary ? '<div class="mwk-sowhat">' + esc(d.summary) + '</div>' : '';
    if (fears.length) {
      html += '<div class="mwk-lab">What the prices fit, strongest first</div><div class="mwk-fears">' +
        fears.slice(0, 3).map(fearCard).join('') + '</div>';
      if (fears.length > 3) {
        html += '<details><summary>' + (fears.length - 3) + ' more fear' + (fears.length > 4 ? 's' : '') +
          ' the week fits</summary><div class="mwk-fears" style="margin-top:8px">' + fears.slice(3).map(fearCard).join('') + '</div></details>';
      }
    }
    if ((d.not_yet || []).length) {
      html += '<div class="mwk-lab">What is NOT happening (yet)</div><div class="mwk-not">' +
        d.not_yet.map(function (n) {
          var x = '<div><b>' + esc(n.name) + '.</b> ' + esc(n.text);
          if (n.explain || (n.watch || []).length) {
            x += '<details class="mwk-why"><summary>What does that mean, and what would change it?</summary>';
            if (n.explain) x += '<p>' + esc(n.explain) + '</p>';
            if ((n.watch || []).length) {
              x += '<p class="mwk-wl">Signs it would be changing, with this week\'s reading:</p><ul>' + n.watch.map(function (w) {
                var ic = w.tripped === true ? '⚠️' : w.tripped === false ? '✓' : '👁';
                var st = w.tripped === true ? 'TRIPPED' : w.tripped === false ? 'not yet' : 'watch the news';
                return '<li><span class="ic">' + ic + '</span><span><b>' + esc(w.sign) + '.</b> Now: ' + esc(w.now) + ' <em>(' + st + ')</em></span></li>';
              }).join('') + '</ul>';
            }
            x += '</details>';
          }
          return x + '</div>';
        }).join('') + '</div>';
    }
    if ((d.context || []).length) {
      html += '<div class="mwk-lab">Asifah context · not scored</div><div class="mwk-ctx">' +
        d.context.map(function (c) { return '<div>' + esc(c.text) + '</div>'; }).join('') + '</div>';
    }
    html += world(d.world);
    html += '<div class="mwk-foot">' + esc(d.disclaimer || '') + ' Daily closes, last five sessions' +
      (d.generated_at ? ' · read ' + ago(d.generated_at) : '') + '. The monthly fragility read (how dry the forest is) sits in its own card below.</div>';
    if (p) p.innerHTML = html;
  }

  function init() {
    css();
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; render(null); } }, 20000);
    fetch(API).then(function (r) { return r.json(); }).then(function (d) {
      if (done) return; done = true; clearTimeout(timer); render(d);
    }).catch(function () { if (done) return; done = true; clearTimeout(timer); render(null); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
