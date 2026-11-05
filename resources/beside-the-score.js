/* Asifah Analytics -- "Beside the score" country panel -- v1.0.0 (Nov 5 2026)
 *
 * One panel per country page, in place of separate strips:
 *     <div data-asifah-beside="iran"></div>
 * (any page slug: iran, israel, lebanon, uk, us, north_korea ...)
 *
 * Reads ONE endpoint on the ME backend: /api/attention/<country>
 * (attention_layer.py), which puts side by side:
 *   - traders' odds (Polymarket / Kalshi)
 *   - commentary this week, by lean (newsletters, outlets, institutes, YouTube)
 *   - Asifah's own level
 * and flags where they disagree. Doctrine: what people are SAYING and
 * BETTING is context, never part of the score. Unread is said, never shown
 * as calm. Replaces the standalone traders' odds strip on country pages.
 */
(function () {
  'use strict';
  var API = 'https://asifah-backend.onrender.com/api/attention/';
  var LEAN = { left: ['Left', '#3b82f6'], center: ['Centre', '#94a3b8'], right: ['Right', '#ef4444'],
               nonpartisan: ['Nonpartisan', '#a3a3a3'] };
  var LEAN_OF = { 'left': 'left', 'center-left': 'left', 'center': 'center', 'center-right': 'right',
                  'right': 'right', 'nonpartisan': 'nonpartisan' };
  var FLAG = {
    ahead_of_score: ['Conversation ahead of the score', '#f59e0b'],
    score_ahead: ['Score ahead of the conversation', '#38bdf8'],
    lopsided: ['One side doing the talking', '#a855f7']
  };
  var MFLAG = { settled: 'settled', jump: 'sharp move', consensus: 'expected', divergence: 'disagrees with Asifah' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function css() {
    if (document.getElementById('asfBesideCss')) return;
    var st = document.createElement('style');
    st.id = 'asfBesideCss';
    st.textContent =
      '.asf-bts{grid-column:1/-1;box-sizing:border-box;background:var(--card-bg,var(--bg-card,rgba(127,127,127,0.06)));border:1px solid var(--card-border,var(--border-color,rgba(127,127,127,0.3)));border-left:4px solid #a855f7;border-radius:10px;padding:14px 16px;margin:0 0 22px;color:inherit;font-family:inherit}' +
      '.asf-bts-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}' +
      '.asf-bts-title{font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-size:0.9rem}' +
      '.asf-bts-sub{font-size:0.72rem;opacity:0.7;margin-top:3px;line-height:1.4}' +
      '.asf-bts-lvl{font-size:0.7rem;opacity:0.75;white-space:nowrap}' +
      '.asf-bts-flag{margin:10px 0 0;padding:9px 12px;border-radius:6px;background:rgba(168,85,247,0.08);font-size:0.86rem;line-height:1.5}' +
      '.asf-bts-flag b{display:block;font-size:0.64rem;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}' +
      '.asf-bts-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}' +
      '.asf-bts-col h5{margin:0 0 6px;font-size:0.66rem;letter-spacing:1.5px;text-transform:uppercase;opacity:0.7}' +
      '.asf-bts-mk{display:flex;justify-content:space-between;gap:8px;font-size:0.8rem;line-height:1.4;padding:5px 0;border-top:1px solid rgba(127,127,127,0.18)}' +
      '.asf-bts-mk:first-of-type{border-top:0}' +
      '.asf-bts-odds{font-weight:800;white-space:nowrap;padding:0 7px;border-radius:4px;background:rgba(127,127,127,0.14);height:fit-content}' +
      '.asf-bts-tag{font-size:0.62rem;opacity:0.8;font-style:italic}' +
      '.asf-bts-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;background:rgba(127,127,127,0.15);margin:2px 0 4px}' +
      '.asf-bts-bar span{display:block;height:100%}' +
      '.asf-bts-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:0.68rem;opacity:0.85}' +
      '.asf-bts-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle}' +
      '.asf-bts-att{font-size:0.74rem;opacity:0.8;margin:6px 0}' +
      '.asf-bts-piece{font-size:0.78rem;line-height:1.4;padding:4px 0;border-top:1px solid rgba(127,127,127,0.18)}' +
      '.asf-bts-piece .s{font-size:0.66rem;opacity:0.7}' +
      '.asf-bts a{color:var(--accent,var(--accent-cyan,#38bdf8));text-decoration:none}.asf-bts a:hover{text-decoration:underline}' +
      '.asf-bts-empty{font-size:0.78rem;opacity:0.7;font-style:italic}' +
      '.asf-bts details{margin-top:10px}.asf-bts details summary{cursor:pointer;font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;opacity:0.75}' +
      '.asf-bts-how{font-size:0.76rem;line-height:1.55;opacity:0.85;margin:6px 0 0;padding-left:18px}' +
      '@media(max-width:760px){.asf-bts-cols{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function odds(it) {
    var h = it.headline || {};
    if (it.status === 'settled' && it.settled_recent && it.settled_recent.length) return 'settled ' + it.settled_recent[0].settled_label;
    if (it.unit && it.median && it.median.strike != null) return (it.median.kind === 'below' ? '≤' : '>') + it.median.strike;
    return h.odds || '—';
  }

  function marketsCol(d) {
    var m = d.markets || {}, items = m.items || [];
    var h = '<h5>🎲 Traders\' odds</h5>';
    if (!d.available.markets) return h + '<div class="asf-bts-empty">Traders\' odds unread this load — unread, not calm.</div>';
    if (!items.length) return h + '<div class="asf-bts-empty">No prediction market on the watchlist covers ' + esc(d.country_name) + ' yet.</div>';
    return h + items.slice(0, 3).map(function (it) {
      var tags = (it.flags || []).map(function (f) { return MFLAG[f.kind] || f.kind; });
      if (it.status === 'thin') tags.push('thin market');
      return '<div class="asf-bts-mk"><div>' + (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.label) + '</a>' : esc(it.label)) +
        (tags.length ? ' <span class="asf-bts-tag">· ' + esc(tags.join(' · ')) + '</span>' : '') + '</div>' +
        '<span class="asf-bts-odds">' + esc(odds(it)) + '</span></div>';
    }).join('') + (m.count > 3 ? '<div class="asf-bts-tag" style="margin-top:4px">+' + (m.count - 3) + ' more on the regional page</div>' : '');
  }

  function commentaryCol(d) {
    var c = d.commentary || {}, b = c.balance, a = c.attention, pieces = c.pieces || [];
    var h = '<h5>🗣️ Commentary this week</h5>';
    if (!d.available.commentary) return h + '<div class="asf-bts-empty">Commentary unread this load — unread, not quiet.</div>';
    if (b && b.counts) {
      var k = b.counts, tot = (k.left || 0) + (k.center || 0) + (k.right || 0) + (k.nonpartisan || 0);
      if (tot) {
        h += '<div class="asf-bts-bar" title="Pieces published this week by sources on each side">' +
          ['left', 'center', 'right', 'nonpartisan'].map(function (x) {
            return k[x] ? '<span style="width:' + (100 * k[x] / tot) + '%;background:' + LEAN[x][1] + '"></span>' : '';
          }).join('') + '</div><div class="asf-bts-legend">' +
          ['left', 'center', 'right', 'nonpartisan'].map(function (x) {
            return k[x] ? '<span><i class="asf-bts-dot" style="background:' + LEAN[x][1] + '"></i>' + LEAN[x][0] + ' ' + k[x] + '</span>' : '';
          }).join('') + '</div>';
      }
    }
    if (a) {
      var line = a.this_week + ' piece' + (a.this_week === 1 ? '' : 's') + ' this week';
      if (a.state === 'baseline_building') line += ' · usual volume still being learned (' + (a.baseline_days || 0) + ' of 14 days)';
      else if (a.usual_week != null) line += ' · usual week ~' + a.usual_week + (a.spike ? ' · <b>about ' + a.ratio + '× usual</b>' : (a.state === 'quiet' ? ' · quieter than usual' : ''));
      h += '<div class="asf-bts-att">' + line + '</div>';
    }
    if (!pieces.length) return h + '<div class="asf-bts-empty">None of the tracked commentators wrote about ' + esc(d.country_name) + ' recently.</div>';
    return h + pieces.slice(0, 3).map(function (p) {
      var l = LEAN[LEAN_OF[p.lean] || 'center'];
      return '<div class="asf-bts-piece"><i class="asf-bts-dot" style="background:' + l[1] + '" title="' + esc(p.lean || '') + '"></i>' +
        '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' +
        '<div class="s">' + esc(p.source) + (p.kind === 'video' ? ' · video' : '') + '</div></div>';
    }).join('');
  }

  function render(el, d) {
    var name = (d && d.country_name) || el.getAttribute('data-asifah-beside');
    var head = '<div class="asf-bts-head"><div><div class="asf-bts-title">⚖️ Beside the score</div>' +
      '<div class="asf-bts-sub">What people are saying and betting about ' + esc(name) + ' — context, never part of the score.</div></div>' +
      (d && d.asifah_level != null ? '<div class="asf-bts-lvl">Asifah level: L' + d.asifah_level + '</div>' : '') + '</div>';
    if (!d) { el.innerHTML = head + '<div class="asf-bts-flag">Attention layer unread this load — unread, not calm.</div>'; return; }
    var flags = (d.flags || []).map(function (f) {
      var meta = FLAG[f.kind] || [f.kind, '#64748b'];
      return '<div class="asf-bts-flag" style="border-left:3px solid ' + meta[1] + '"><b style="color:' + meta[1] + '">' + esc(meta[0]) + '</b>' + esc(f.text) + '</div>';
    }).join('');
    if (!flags) flags = '<div class="asf-bts-flag">Traders and commentators are not pulling away from Asifah\'s reading this week.</div>';
    el.innerHTML = head + flags +
      '<div class="asf-bts-cols"><div class="asf-bts-col">' + marketsCol(d) + '</div><div class="asf-bts-col">' + commentaryCol(d) + '</div></div>' +
      '<details><summary>How to read this panel</summary><ul class="asf-bts-how">' +
      '<li>Traders\' odds are bets on public prediction markets. Commentary is what newsletters, opinion outlets, institutes and YouTube channels across the political spectrum published this week. Neither is evidence, and neither changes an Asifah level.</li>' +
      '<li><b>Conversation ahead of the score</b>: commentary is spiking and/or traders moved toward pressure while Asifah\'s sensors read quiet. Worth watching, not yet evidence.</li>' +
      '<li><b>Score ahead of the conversation</b>: Asifah reads serious pressure while commentators are quieter than usual and traders have not moved.</li>' +
      '<li><b>One side doing the talking</b>: one side of the spectrum published at least three times as much on this country. A signal about who is talking, not about what is true.</li>' +
      '<li>Lean labels are approximate, from public media-bias ratings; they exist so the balance is visible.</li></ul></details>';
  }

  function load(el) {
    var key = el.getAttribute('data-asifah-beside');
    if (!key) return;
    el.classList.add('asf-bts');
    el.innerHTML = '<div class="asf-bts-title">⚖️ Beside the score</div><div class="asf-bts-sub">Loading…</div>';
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; render(el, null); } }, 15000);
    fetch(API + encodeURIComponent(key)).then(function (r) { return r.json(); }).then(function (d) {
      if (done) return; done = true; clearTimeout(timer); render(el, d);
    }).catch(function () { if (done) return; done = true; clearTimeout(timer); render(el, null); });
  }

  function init() { css(); Array.prototype.forEach.call(document.querySelectorAll('[data-asifah-beside]'), load); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
