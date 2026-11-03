/*
 * asifah-tracker-voice.js -- Asifah Analytics -- Military / Commodities / Market Watch
 * ============================================================================
 * THE PLAIN-LANGUAGE READ, AND "WHAT THIS MEANS", ON THE THREE TRACKER PAGES
 * (Nov 3 2026).
 *
 * Fetches /api/tracker-voice?desk=... from the ME backend and inserts one card
 * above the page's own executive summary:
 *     1. headline + two-sentence So What           (AI-drafted, when written)
 *     2. "The fuller read" + what to watch          (AI-drafted, when written)
 *     3. "What the lit readings mean" -- one row per lit item: what it means
 *        today, then LOCAL / REGIONAL / GLOBAL / ECONOMY, key facts, what it
 *        does NOT mean, and the evidence headlines.
 *
 * Layer 3 is ALWAYS available: when the writer has not run, each row shows
 * Asifah's reference note for that item instead (labelled as such). Nothing
 * on this card is invented in the browser.
 *
 * Usage (one line in the page <head>):
 *   <script src="resources/asifah-tracker-voice.js" data-desk="military" data-anchor="taExecBlock" defer></script>
 * desks: military, commodities, market.  data-anchor = the element id the card goes ABOVE.
 *
 * ABSENCE-HONEST: endpoint down, script blocked, nothing lit -> the page renders
 * exactly as before. Reading this endpoint never calls Claude.
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

    var CSS = [
        '.tv-card{margin:0 0 16px 0;padding:16px 18px;border:1px solid var(--card-border,var(--border-color,#2a3a4e));',
        'border-left:4px solid #38bdf8;border-radius:10px;background:var(--card-bg,rgba(56,189,248,0.04));min-width:0}',
        '.tv-kicker{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#38bdf8;margin-bottom:8px}',
        '.tv-headline{font-family:"Times New Roman",Times,serif;font-size:1.2rem;line-height:1.35;font-weight:700;',
        'color:var(--text-primary);margin-bottom:8px;overflow-wrap:anywhere}',
        '.tv-sowhat{font-family:"Times New Roman",Times,serif;font-size:1rem;line-height:1.65;color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-card details{margin-top:10px}',
        '.tv-card details>summary{cursor:pointer;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;',
        'color:#38bdf8;padding:6px 0;list-style:none;user-select:none}',
        '.tv-card details>summary::-webkit-details-marker{display:none}',
        '.tv-card details>summary::before{content:"\\25B8  "}',
        '.tv-card details[open]>summary::before{content:"\\25BE  "}',
        '.tv-read{font-family:"Times New Roman",Times,serif;font-size:0.95rem;line-height:1.7;color:var(--text-primary);margin:6px 0 8px 0;overflow-wrap:anywhere}',
        '.tv-sub{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-top:8px}',
        '.tv-list{margin:4px 0 0 18px;padding:0}',
        '.tv-list li{font-size:0.9rem;line-height:1.55;color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-items{margin-top:6px}',
        '.tv-item{border-top:1px solid var(--card-border,var(--border-color,#2a3a4e));padding:2px 0}',
        '.tv-item>summary{text-transform:none!important;letter-spacing:0!important;font-size:14px!important;color:var(--text-primary)!important;',
        'display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
        '.tv-pill{display:inline-block;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:0.5px;',
        'text-transform:uppercase;background:rgba(148,163,184,0.18);color:var(--text-secondary)}',
        '.tv-pill.hot{background:rgba(239,68,68,0.16);color:#ef4444}.tv-pill.warm{background:rgba(249,115,22,0.16);color:#f97316}',
        '.tv-pill.mild{background:rgba(245,158,11,0.16);color:#d97706}.tv-pill.new{background:rgba(56,189,248,0.18);color:#0284c7}',
        '.tv-means{font-family:"Times New Roman",Times,serif;font-size:0.97rem;line-height:1.6;color:var(--text-primary);margin:6px 0}',
        '.tv-alt{display:grid;grid-template-columns:92px 1fr;gap:4px 10px;margin:6px 0;font-size:0.88rem;line-height:1.5}',
        '.tv-alt b{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);padding-top:2px}',
        '.tv-alt span{color:var(--text-primary);overflow-wrap:anywhere}',
        '.tv-note{font-size:11.5px;line-height:1.5;color:var(--text-muted);margin-top:4px;overflow-wrap:anywhere}',
        '.tv-label{margin-top:10px;font-size:11px;color:var(--text-muted);font-style:italic}',
        '@media (max-width:600px){.tv-card{padding:12px 12px}.tv-alt{grid-template-columns:1fr}.tv-headline{font-size:1.08rem}}'
    ].join('');

    var HOT = {disrupted: 'hot', surge: 'hot', critical: 'hot', firing: 'warm', contested: 'warm', high: 'warm',
               offramp_contradicted: 'warm', escalation_repricing: 'warm', market_alert: 'warm', strong: 'warm', pattern_match: 'warm',
               monitored: 'mild', elevated: 'mild', moderate: 'mild', partial_flinch: 'mild', active: 'warm'};
    var KIND = {chokepoint: 'Chokepoint', pair: 'Coupled chokepoints', theatre: 'Theatre', neo: 'Evacuations',
                convergence: 'Convergence', commodity: 'Commodity', fragility: 'Fragility', analog: 'Historical analog',
                repricing: 'Conflict repricing', market_read: 'Market pattern'};

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
    function words(s) { return String(s || '').replace(/_/g, ' '); }

    function factLines(f) {
        var out = [];
        Object.keys(f || {}).forEach(function (k) {
            var v = f[k];
            if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
            if (Array.isArray(v)) {
                v = v.map(function (x) {
                    return (x && typeof x === 'object') ? (x.condition || x.name || JSON.stringify(x)) : x;
                }).join('; ');
            } else if (typeof v === 'object') {
                v = Object.keys(v).map(function (kk) { return words(kk) + ': ' + (typeof v[kk] === 'object' ? JSON.stringify(v[kk]) : v[kk]); }).join('; ');
            }
            out.push('<li><b>' + esc(words(k)) + ':</b> ' + esc(v) + '</li>');
        });
        return out.slice(0, 8);
    }

    function itemHTML(ex, ai) {
        var state = String(ex.state || '');
        var cls = HOT[state] || '';
        var a = ai || {};
        var useAI = !!(a.what_it_means);
        var alt = [['Local', a.local || ex.local], ['Regional', a.regional || ex.regional],
                   ['Global', a.global || ex.global], ['Economy', a.economy || ex.economy]]
            .filter(function (p) { return p[1]; });
        var facts = factLines(ex.facts);
        var h = '<details class="tv-item"><summary>' +
            '<span>' + esc(ex.name) + '</span>' +
            '<span class="tv-pill">' + esc(KIND[ex.kind] || ex.kind) + '</span>' +
            '<span class="tv-pill ' + cls + '">' + esc(words(state)) + '</span>' +
            (ex.is_new ? '<span class="tv-pill new">new</span>' : '') +
            '</summary>';
        if (useAI) h += '<div class="tv-means">' + esc(a.what_it_means) + '</div>';
        if (ex.plain) h += '<div class="tv-note">' + (useAI ? '<b>What it is:</b> ' : '') + esc(ex.plain) + '</div>';
        if (ex.level_words) h += '<div class="tv-note"><b>This level means:</b> ' + esc(ex.level_words) + '</div>';
        if (alt.length) {
            h += '<div class="tv-alt">' + alt.map(function (p) {
                return '<b>' + p[0] + '</b><span>' + esc(p[1]) + '</span>';
            }).join('') + '</div>';
        }
        if (facts.length) h += '<div class="tv-sub">Key facts</div><ul class="tv-list">' + facts.join('') + '</ul>';
        if (ex.not_implied) h += '<div class="tv-note"><b>Not implied:</b> ' + esc(ex.not_implied) + '</div>';
        if ((ex.evidence || []).length) {
            h += '<div class="tv-sub">Reporting behind it</div><ul class="tv-list">' +
                ex.evidence.slice(0, 3).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
        }
        var src = useAI ? 'Today’s meaning AI-drafted from Asifah signals; reference note: ' + (ex.basis || 'Asifah')
                        : 'Asifah reference note (' + (ex.basis || 'Asifah') + ')';
        if (ex.verified === false) src += ' — approximate figures awaiting review';
        h += '<div class="tv-note"><i>' + esc(src) + '</i></div></details>';
        return h;
    }

    function render(rec) {
        var anchor = ANCHOR && document.getElementById(ANCHOR);
        if (!anchor || document.getElementById('tvCard')) return;
        var v = rec.available ? (rec.view || {}) : {};
        var exps = rec.explainers || [];
        if (!v.headline && !exps.length) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var aiItems = v.items || {};
        var h = '<div class="tv-kicker">Plain-language read</div>';
        if (v.headline) {
            var watch = (v.watch || []).filter(Boolean);
            h += '<div class="tv-headline">' + esc(v.headline) + '</div>' +
                 '<div class="tv-sowhat">' + esc(v.so_what) + '</div>' +
                 '<details><summary>The fuller read</summary><div class="tv-read">' + esc(v.read) + '</div>' +
                 (watch.length ? '<div class="tv-sub">What to watch</div><ul class="tv-list">' +
                     watch.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
                 '</details>';
        } else {
            h += '<div class="tv-sowhat">What each lit reading on this page means — for the place itself, ' +
                 'its region, the world, and the economy.</div>';
        }
        if (exps.length) {
            h += '<details' + (v.headline ? '' : ' open') + '><summary>What the lit readings mean (' + exps.length + ')</summary>' +
                 '<div class="tv-items">' + exps.map(function (ex) { return itemHTML(ex, aiItems[ex.id]); }).join('') +
                 '</div></details>';
        }
        h += '<div class="tv-label">' + (v.headline
                ? esc(rec.label || 'Plain-language read, AI-drafted from Asifah signals') + when(rec.generated_at)
                : 'Asifah reference notes — the AI-drafted read appears here once written') + '</div>';

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
