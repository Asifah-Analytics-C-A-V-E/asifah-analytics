/* Asifah Analytics -- Traders' Odds strip -- v1.0.0 (Nov 5 2026)
 *
 * One component for every page. A page declares
 *     <div data-asifah-markets="gpi"></div>
 * (or military / commodities / market-watch / region:me / region:europe /
 *  region:asia / region:africa / region:wha / a country slug such as iran)
 * and loads this file. Add  data-gauges="true"  on a regional page and each
 * country card that has a market also gets a one-line "traders' odds" note
 * directly under its Pressure Index gauge -- beside the score, never in it.
 *
 * Reads the ME backend's prediction_markets.py: /api/markets/page/<key>.
 * Doctrine (Rachel, Nov 5 2026): these are traders' bets, labelled as such,
 * context only. They never change an Asifah level. Unread is said out loud,
 * never shown as calm. Thin markets are shown with a warning, never flagged.
 */
(function () {
  'use strict';
  var API = 'https://asifah-backend.onrender.com/api/markets/page/';
  // country slugs whose gauge id on the regional page differs
  var GAUGE_ALIAS = { lebanon: ['hezbollah'], yemen: ['houthis'], dprk: ['north_korea'] };
  var FLAG = {
    settled:    ['SETTLED', '#a855f7', 'A contract on this question settled early or settled YES -- often the real news.'],
    jump:       ['SHARP MOVE', '#f59e0b', 'Odds moved 10+ points in a day or 15+ in a week, on a market with real money in it.'],
    consensus:  ['EXPECTED', '#ef4444', 'Traders price the pressure outcome at 85%+: it is now the expectation, not a surprise.'],
    divergence: ['DISAGREES WITH ASIFAH', '#38bdf8', 'Traders moved one way while Asifah\'s own reading points the other. Worth a second look -- not a verdict on who is right.']
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function css() {
    if (document.getElementById('asfMktCss')) return;
    var st = document.createElement('style');
    st.id = 'asfMktCss';
    st.textContent =
      '.asf-mkt{grid-column:1/-1;flex:0 0 100%;box-sizing:border-box;background:var(--card-bg,var(--bg-card,rgba(127,127,127,0.06)));border:1px solid var(--card-border,var(--border-color,rgba(127,127,127,0.3)));border-left:4px solid #a855f7;border-radius:10px;padding:14px 16px;margin:0 0 22px;color:inherit;font-family:inherit;position:relative;z-index:1}' +
      '.asf-mkt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}' +
      '.asf-mkt-title{font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-size:0.9rem}' +
      '.asf-mkt-sub{font-size:0.72rem;opacity:0.7;margin-top:3px;line-height:1.4}' +
      '.asf-mkt-age{font-size:0.68rem;opacity:0.65;white-space:nowrap}' +
      '.asf-mkt-sowhat{font-size:0.88rem;line-height:1.5;font-weight:600;margin:10px 0 8px;padding:9px 12px;border-radius:6px;background:rgba(168,85,247,0.08)}' +
      '.asf-mkt-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px;margin-top:8px}' +
      '.asf-mkt-row{border:1px solid var(--card-border,var(--border-color,rgba(127,127,127,0.3)));border-radius:8px;padding:8px 10px;font-size:0.8rem;line-height:1.45;display:flex;flex-direction:column;gap:4px}' +
      '.asf-mkt-row.flagged{border-color:rgba(168,85,247,0.55)}' +
      '.asf-mkt-q{display:flex;justify-content:space-between;gap:8px;align-items:baseline;font-weight:700}' +
      '.asf-mkt-odds{font-weight:800;font-size:0.9rem;white-space:nowrap;padding:1px 8px;border-radius:4px;background:rgba(127,127,127,0.14)}' +
      '.asf-mkt-read{opacity:0.85}' +
      '.asf-mkt-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:0.68rem;opacity:0.85}' +
      '.asf-mkt-chip{font-size:0.62rem;font-weight:800;letter-spacing:0.8px;padding:2px 7px;border-radius:999px;color:#fff;cursor:help}' +
      '.asf-mkt-thin{font-size:0.62rem;font-weight:700;letter-spacing:0.8px;padding:2px 7px;border-radius:999px;border:1px dashed rgba(127,127,127,0.6);cursor:help}' +
      '.asf-mkt a,.asf-mkt-gauge a{color:#38bdf8;font-weight:700;text-decoration:none}.asf-mkt a:hover,.asf-mkt-gauge a:hover{text-decoration:underline}' +
      'html.light-mode .asf-mkt a,html.light-mode .asf-mkt-gauge a,body.light-mode .asf-mkt a,body.light-mode .asf-mkt-gauge a,[data-theme=light] .asf-mkt a,[data-theme=light] .asf-mkt-gauge a{color:#0369a1}' +
      '.asf-mkt-note{font-size:0.7rem;opacity:0.7;font-style:italic}' +
      '.asf-mkt details{margin-top:10px}.asf-mkt details summary{cursor:pointer;font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;opacity:0.75}' +
      '.asf-mkt-how{font-size:0.78rem;line-height:1.55;opacity:0.85;margin-top:6px}.asf-mkt-how li{margin-bottom:3px}' +
      '.asf-mkt-gauge{margin:6px auto 4px;max-width:340px;font-size:0.74rem;line-height:1.4;text-align:center;border:1px dashed rgba(168,85,247,0.55);border-radius:6px;padding:5px 8px;color:inherit}' +
      '.asf-mkt-gauge b{font-weight:800}.asf-mkt-gauge .k{display:block;font-size:0.6rem;letter-spacing:1.2px;text-transform:uppercase;opacity:0.65;margin-bottom:1px}' +
      '@media(max-width:640px){.asf-mkt-list{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function ago(iso) {
    if (!iso) return '';
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(m)) return '';
    if (m < 2) return 'updated just now';
    if (m < 90) return 'updated ' + m + ' min ago';
    return 'updated ' + Math.round(m / 60) + 'h ago';
  }

  function chips(it) {
    var out = (it.flags || []).map(function (f) {
      var d = FLAG[f.kind] || [f.kind.toUpperCase(), '#64748b', ''];
      return '<span class="asf-mkt-chip" style="background:' + d[1] + '" title="' + esc(d[2] + (f.text ? ' -- ' + f.text : '')) + '">' + d[0] + '</span>';
    });
    if (it.status === 'thin') out.push('<span class="asf-mkt-thin" title="Little money behind these odds: shown for context, never flagged.">THIN MARKET</span>');
    return out.join(' ');
  }

  function oddsOf(it) {
    var h = it.headline || {};
    if (it.status === 'settled' && it.settled_recent && it.settled_recent.length) return 'settled ' + it.settled_recent[0].settled_label;
    // a counted quantity shows the traders' middle estimate, not one strike's odds
    if (it.unit && it.median && it.median.strike != null) return (it.median.kind === 'below' ? '≤' : '>') + it.median.strike;
    return h.odds || '—';
  }

  function row(it) {
    var src = it.source === 'kalshi' ? 'Kalshi' : 'Polymarket';
    var link = it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + src + ' ↗</a>' : src;
    var flagged = (it.flags || []).length ? ' flagged' : '';
    var read = it.read || '';
    if (it.status === 'unavailable') read = 'Odds unread this load — unread, not calm.';
    return '<div class="asf-mkt-row' + flagged + '">' +
      '<div class="asf-mkt-q"><span>' + esc(it.label) + '</span><span class="asf-mkt-odds">' + esc(oddsOf(it)) + '</span></div>' +
      '<div class="asf-mkt-read">' + esc(read) + '</div>' +
      (it.note ? '<div class="asf-mkt-note">Contract rule: ' + esc(it.note) + '</div>' : '') +
      '<div class="asf-mkt-meta">' + chips(it) + ' <span>' + link + '</span></div>' +
      '</div>';
  }

  // The unasked question: what should a reader take from this list?
  function soWhat(items) {
    var n = { settled: [], jump: [], consensus: [], divergence: [] };
    items.forEach(function (it) {
      (it.flags || []).forEach(function (f) { if (n[f.kind]) n[f.kind].push(it); });
    });
    var parts = [];
    if (n.settled.length) parts.push(n.settled.map(function (it) {
      var s = (it.settled_recent || [])[0] || {};
      // the contract's rule is the So What: it says what traders' money counted as happening
      var rule = it.note ? ' (' + it.note.replace(/\.$/, '').replace(/^Settles/, 'it settles') + ')' : '';
      return 'a contract on "' + it.label.replace(/\?$/, '') + '" settled ' + (s.settled_label || '') + (s.settled_on ? ' on ' + s.settled_on : '') + rule;
    }).join('; '));
    if (n.divergence.length) parts.push('traders and Asifah disagree on ' + n.divergence.map(function (it) { return '"' + it.label.replace(/\?$/, '') + '"'; }).join(', '));
    if (n.jump.length) parts.push('odds moved sharply on ' + n.jump.map(function (it) {
      var f = (it.flags || []).filter(function (x) { return x.kind === 'jump'; })[0] || {};
      var dir = f.direction ? ', ' + f.direction : '';
      return '"' + it.label.replace(/\?$/, '') + '"' + (f.text ? ' (' + f.text + dir + ')' : '');
    }).join(', '));
    if (n.consensus.length) parts.push('traders now treat ' + n.consensus.map(function (it) { return '"' + it.label.replace(/\?$/, '') + '"'; }).join(', ') + ' as the expected outcome');
    if (!parts.length) return 'No market on this page settled, jumped, or disagrees with Asifah\'s reading. Traders see the same picture, with no sharp re-pricing.';
    return parts.map(function (t) { return t.charAt(0).toUpperCase() + t.slice(1); }).join('. ') + '.';
  }

  function how() {
    return '<details><summary>How to read traders\' odds</summary><ul class="asf-mkt-how">' +
      '<li>These are bets on public prediction markets (Polymarket, Kalshi). They are not evidence and not Asifah\'s assessment, and they never change an Asifah level.</li>' +
      '<li>Each contract settles on its own written rule, which can be narrower or broader than the news. When a rule matters it is shown under the question.</li>' +
      '<li><b>Settled</b>: a contract settled early or settled YES. <b>Sharp move</b>: 10+ points in a day or 15+ in a week. <b>Expected</b>: 85%+ on the pressure outcome. <b>Disagrees with Asifah</b>: traders moved one way while our reading points the other.</li>' +
      '<li><b>Thin market</b>: little money behind the odds, so one trader can move them. Shown, never flagged.</li>' +
      '<li>A ladder ("by Dec 31?") shows the nearest deadline at least two weeks out; close deadlines move with the calendar, not the news.</li>' +
      '</ul></details>';
  }

  function renderStrip(el, key, d) {
    var items = (d && d.items) || [];
    var title = el.getAttribute('data-title') || 'Traders\' odds';
    var head = '<div class="asf-mkt-head"><div><div class="asf-mkt-title">🎲 ' + esc(title) + '</div>' +
      '<div class="asf-mkt-sub">What betting markets price on the same questions — context beside the score, never part of it.</div></div>' +
      '<div class="asf-mkt-age">' + esc(d && d.generated_at ? ago(d.generated_at) : '') + '</div></div>';
    if (!d || !d.available) {
      el.innerHTML = head + '<div class="asf-mkt-sowhat">Traders\' odds unread this load — unread, not calm.</div>';
      return;
    }
    if (!items.length) {
      el.innerHTML = head + '<div class="asf-mkt-sowhat">No prediction market on the watchlist covers this page yet.</div>' + how();
      return;
    }
    items = items.slice().sort(function (a, b) { return (b.flags || []).length - (a.flags || []).length; });
    var max = parseInt(el.getAttribute('data-max') || '6', 10);
    var first = items.slice(0, max), rest = items.slice(max);
    el.innerHTML = head +
      '<div class="asf-mkt-sowhat">' + esc(soWhat(items)) + '</div>' +
      '<div class="asf-mkt-list">' + first.map(row).join('') + '</div>' +
      (rest.length ? '<details><summary>All ' + items.length + ' markets on this page</summary><div class="asf-mkt-list">' + rest.map(row).join('') + '</div></details>' : '') +
      how();
  }

  // One line under each country's Pressure Index gauge (regional pages)
  function renderGauges(items, anchorId) {
    var by = {};
    items.forEach(function (it) {
      (it.pages || []).forEach(function (p) {
        if (p.indexOf(':') > -1 || p === 'gpi' || p === 'military' || p === 'commodities' || p === 'market-watch') return;
        var slugs = [p].concat(GAUGE_ALIAS[p] || []);
        slugs.forEach(function (s) { (by[s] = by[s] || []).push(it); });
      });
    });
    Object.keys(by).forEach(function (slug) {
      // Two places per card: the collapsed view's score line and the expanded
      // view's gauge -- so the note sits beside the score whichever is showing.
      var spots = [];
      var g = document.getElementById(slug + '-gauge');
      if (g) spots.push(g.closest('.probability-display') || g.closest('.gauge-container'));
      var card = document.getElementById(slug + '-card');
      if (card) spots.push(card.querySelector('.card-collapsed-view .collapsed-metric'));
      var list = by[slug].slice().sort(function (a, b) { return (b.flags || []).length - (a.flags || []).length; });
      var it = list[0];
      var flag = (it.flags || [])[0];
      var tag = flag ? ' · ' + (FLAG[flag.kind] || [flag.kind])[0].toLowerCase() : '';
      spots.forEach(function (box) {
        if (!box || (box.nextElementSibling && box.nextElementSibling.classList.contains('asf-mkt-gauge'))) return;
        var div = document.createElement('div');
        div.className = 'asf-mkt-gauge';
        div.innerHTML = '<span class="k">Traders\' odds (context, not score)' + esc(tag) + '</span>' +
          esc(it.label) + ' <b>' + esc(oddsOf(it)) + '</b>' +
          (list.length > 1 ? ' · <a href="#' + anchorId + '" onclick="event.stopPropagation()">+' + (list.length - 1) + ' more</a>' : '') +
          (it.status === 'thin' ? ' <span style="opacity:.7">(thin)</span>' : '');
        box.parentNode.insertBefore(div, box.nextSibling);
      });
    });
  }

  function load(el) {
    var key = el.getAttribute('data-asifah-markets');
    if (!key) return;
    if (!el.id) el.id = 'asfMarkets-' + key.replace(/[^a-z0-9]+/gi, '-');
    el.classList.add('asf-mkt');
    el.innerHTML = '<div class="asf-mkt-title">🎲 Traders\' odds</div><div class="asf-mkt-sub">Loading prediction markets…</div>';
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; renderStrip(el, key, null); } }, 15000);
    fetch(API + encodeURIComponent(key)).then(function (r) { return r.json(); }).then(function (d) {
      if (done) return;
      done = true; clearTimeout(timer);
      renderStrip(el, key, d);
      if (el.getAttribute('data-gauges') === 'true' && d && d.items) renderGauges(d.items, el.id);
    }).catch(function () {
      if (done) return;
      done = true; clearTimeout(timer);
      renderStrip(el, key, null);
    });
  }

  function init() {
    css();
    Array.prototype.forEach.call(document.querySelectorAll('[data-asifah-markets]'), load);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
