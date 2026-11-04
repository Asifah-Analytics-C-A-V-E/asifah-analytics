/*
 * asifah-tracker-voice.js -- Asifah Analytics -- Military / Commodities / Market Watch
 * ============================================================================
 * THE PLAIN-LANGUAGE READ ON THE THREE TRACKER PAGES.
 *
 * v1.1.0 (Nov 3 2026, evening) -- Rachel: "full sentences, in a natural voice,
 * telling the reader what they are seeing. Similar to the GPI." v1.0.0 led
 * with a list of coloured labels (CONVERGENCE / FIRING / OFFRAMP MARKET MIXED)
 * that made the page harder to read, not easier. Now, GPI-style:
 *     1. a headline and a two-sentence So What
 *     2. "The fuller read" + what to watch          (when the AI has written)
 *     3. "What you are seeing" -- one short paragraph per reading, in sentences
 *        ("The Strait of Hormuz is contested: ..."), with the local / regional /
 *        global / economy notes one click further down.
 * No internal state words reach the reader.
 *
 * Before the AI writes (or if it cannot), the backend's fallback read -- built
 * from Asifah's own reference notes -- fills the same layout, labelled.
 *
 * Usage (one line in the page <head>):
 *   <script src="resources/asifah-tracker-voice.js" data-desk="military" data-anchor="taExecBlock" defer></script>
 *
 * ABSENCE-HONEST: endpoint down or nothing lit -> the page renders as before.
 * Reading this endpoint never calls Claude.
 *
 * COPYRIGHT (c) 2025-2026 Asifah Analytics. All rights reserved.
 */
(function () {
    'use strict';
    var ME_BACKEND = 'https://asifah-backend.onrender.com';
    var me = document.currentScript;
    var DESK = (me && me.getAttribute('data-desk')) || '';
    var ANCHOR = (me && me.getAttribute('data-anchor')) || '';
    if (!DESK) return;

    var SERIF = 'font-family:"Times New Roman",Times,serif;';
    var CSS = [
        '.tv-card{margin:0 0 16px 0;padding:18px 20px;border:1px solid var(--card-border,var(--border-color,#2a3a4e));',
        'border-left:4px solid #38bdf8;border-radius:10px;background:var(--card-bg,rgba(56,189,248,0.04));min-width:0}',
        '.tv-kicker{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#38bdf8;margin-bottom:8px}',
        '.tv-headline{' + SERIF + 'font-size:1.25rem;line-height:1.35;font-weight:700;color:var(--text-primary);margin-bottom:8px;overflow-wrap:anywhere}',
        '.tv-sowhat{' + SERIF + 'font-size:1.02rem;line-height:1.65;color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-card details{margin-top:12px}',
        '.tv-card details>summary{cursor:pointer;font-size:13px;font-weight:700;letter-spacing:0.5px;',
        'color:#38bdf8;padding:4px 0;list-style:none;user-select:none}',
        '.tv-card details>summary::-webkit-details-marker{display:none}',
        '.tv-card details>summary::before{content:"\\25B8  "}',
        '.tv-card details[open]>summary::before{content:"\\25BE  "}',
        '.tv-read{' + SERIF + 'font-size:0.97rem;line-height:1.7;color:var(--text-primary);margin:6px 0 8px 0;overflow-wrap:anywhere}',
        '.tv-sub{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-top:8px}',
        '.tv-list{margin:4px 0 0 18px;padding:0}',
        '.tv-list li{' + SERIF + 'font-size:0.93rem;line-height:1.55;color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-para{' + SERIF + 'font-size:0.98rem;line-height:1.65;color:var(--text-primary);margin:12px 0 0 0;overflow-wrap:anywhere}',
        '.tv-para b{font-weight:700}',
        '.tv-new{font-size:11px;font-style:italic;color:#0ea5e9;margin-left:4px}',
        '.tv-why{margin:4px 0 0 0}',
        '.tv-why>summary{font-size:12px!important;font-weight:600!important;color:var(--text-muted)!important}',
        '.tv-alt{display:grid;grid-template-columns:86px 1fr;gap:3px 10px;margin:6px 0 2px 0;font-size:0.9rem;line-height:1.5}',
        '.tv-alt b{font-size:11px;letter-spacing:0.5px;color:var(--text-muted);padding-top:2px}',
        '.tv-alt span{' + SERIF + 'color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-note{font-size:11.5px;line-height:1.5;color:var(--text-muted);margin-top:4px;overflow-wrap:anywhere}',
        '.tv-label{margin-top:14px;font-size:11px;color:var(--text-muted);font-style:italic}',
        '@media (max-width:600px){.tv-card{padding:14px 13px}.tv-alt{grid-template-columns:1fr}.tv-headline{font-size:1.1rem}}'
    ].join('');

    function esc(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function when(iso) {
        var dt = new Date(iso);
        if (!iso || isNaN(dt)) return '';
        return ' · written ' + dt.toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric',
            minute: '2-digit', hour12: true});
    }

    function para(ex, ai) {
        var a = ai || {};
        var text = a.what_it_means || ex.sentence || ex.plain || '';
        if (!text) return '';
        // The sentence already names the thing ("The Strait of Hormuz is ...");
        // only add a bold lead when the AI text does not start with the name.
        var name = String(ex.name || '').split(' /')[0];
        var key = name.toLowerCase().replace(/^the /, '').slice(0, 24);
        var at = text.toLowerCase().indexOf(key);
        var lead = (at > -1 && at < 140) ? '' : '<b>' + esc(name) + '.</b> ';
        var h = '<div class="tv-para">' + lead + esc(text) + (ex.is_new ? '<span class="tv-new">new</span>' : '');
        var alt = [['Locally', a.local || ex.local], ['In the region', a.regional || ex.regional],
                   ['Globally', a.global || ex.global], ['For the economy', a.economy || ex.economy]]
            .filter(function (p) { return p[1]; });
        if (alt.length || ex.not_implied) {
            h += '<details class="tv-why"><summary>Why it matters at each level</summary>';
            if (alt.length) {
                h += '<div class="tv-alt">' + alt.map(function (p) {
                    return '<b>' + p[0] + '</b><span>' + esc(p[1]) + '</span>';
                }).join('') + '</div>';
            }
            if (ex.not_implied) h += '<div class="tv-note">What this does not mean: ' + esc(ex.not_implied) + '</div>';
            if (ex.verified === false) h += '<div class="tv-note"><i>Reference figures are approximate and awaiting review.</i></div>';
            h += '</details>';
        }
        return h + '</div>';
    }

    function render(rec) {
        var anchor = ANCHOR && document.getElementById(ANCHOR);
        if (!anchor || document.getElementById('tvCard')) return;
        var ai = !!(rec.available && rec.view && rec.view.headline);
        var v = ai ? rec.view : (rec.fallback_view || {});
        var exps = rec.explainers || [];
        if (!v.headline && !exps.length) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var aiItems = (ai && v.items) || {};
        var h = '<div class="tv-kicker">Plain-language read</div>';
        if (v.headline) h += '<div class="tv-headline">' + esc(v.headline) + '</div>';
        if (v.so_what) h += '<div class="tv-sowhat">' + esc(v.so_what) + '</div>';
        var watch = (v.watch || []).filter(Boolean);
        if (v.read || watch.length) {
            h += '<details><summary>The fuller read</summary>' +
                 (v.read ? '<div class="tv-read">' + esc(v.read) + '</div>' : '') +
                 (watch.length ? '<div class="tv-sub">What to watch</div><ul class="tv-list">' +
                     watch.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
                 '</details>';
        }
        if (exps.length) {
            h += '<details open><summary>What you are seeing on this page</summary>' +
                 exps.map(function (ex) { return para(ex, aiItems[ex.id]); }).join('') + '</details>';
        }
        h += '<div class="tv-label">' + (ai
                ? esc(rec.label || 'Plain-language read, AI-drafted from Asifah signals') + when(rec.generated_at)
                : 'Written from Asifah’s reference notes — the AI-drafted read replaces it once written') + '</div>';

        var card = document.createElement('div');
        card.className = 'tv-card';
        card.id = 'tvCard';
        card.innerHTML = h;
        anchor.parentNode.insertBefore(card, anchor);
    }

    function load() {
        fetch(ME_BACKEND + '/api/tracker-voice?desk=' + encodeURIComponent(DESK), {cache: 'no-store'})
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (rec) { if (rec) render(rec); })
            .catch(function (e) { console.warn('[Tracker voice] unavailable:', e); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
    else load();
})();
