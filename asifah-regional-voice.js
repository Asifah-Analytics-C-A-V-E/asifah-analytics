/*
 * asifah-regional-voice.js -- Asifah Analytics -- regional BLUF pages
 * ============================================================================
 * THE PLAIN-LANGUAGE READ ON TOP OF EACH REGIONAL BLUF (Oct 30 2026).
 *
 * Fetches the write-up for this page's region from the ME backend
 * (/api/regional/voice?region=...) and lays the BLUF card out in three layers,
 * the same as the GPI:
 *     1. headline (the posture in plain words) + two-sentence So What
 *     2. "The fuller read" -- the longer read and what to watch
 *     3. "Analyst detail" -- the existing regional prose, unchanged, one click down
 * followed by a label over the live signal list.
 *
 * Usage (one line in the page <head>, next to asifah-standard-shell.js):
 *     <script src="resources/asifah-regional-voice.js" data-region="africa" defer></script>
 * Regions: me, asia, europe, wha, africa.
 *
 * ABSENCE-HONEST: no write-up (not yet written, backend down, script blocked)
 * -> the page renders exactly as it did before. Never blank, never a spinner.
 * Reading this endpoint never calls Claude; it only reads what is stored.
 *
 * COPYRIGHT (c) 2025-2026 Asifah Analytics. All rights reserved.
 */
(function () {
    'use strict';
    var ME_BACKEND = 'https://asifah-backend.onrender.com';
    var me = document.currentScript;
    var REGION = (me && me.getAttribute('data-region')) || '';
    if (!REGION) return;

    var CSS = [
        '.rv-plain{margin:2px 0 12px 0;padding:0 0 4px 0;min-width:0}',
        '.rv-plain-headline{font-family:"Times New Roman",Times,serif;font-size:1.2rem;line-height:1.35;',
        'font-weight:700;color:var(--text-primary);margin-bottom:8px;overflow-wrap:anywhere}',
        '.rv-plain-sowhat{font-family:"Times New Roman",Times,serif;font-size:1rem;line-height:1.65;',
        'color:var(--text-primary);overflow-wrap:anywhere}',
        '.rv-more,.rv-analyst{margin-top:10px}',
        '.rv-more>summary,.rv-analyst>summary{cursor:pointer;font-size:14px;font-weight:700;',
        'letter-spacing:1.5px;text-transform:uppercase;color:var(--cyber-cyan,#38bdf8);padding:6px 0;',
        'list-style:none;user-select:none}',
        '.rv-more>summary::-webkit-details-marker,.rv-analyst>summary::-webkit-details-marker{display:none}',
        '.rv-more>summary::before,.rv-analyst>summary::before{content:"\\25B8  "}',
        '.rv-more[open]>summary::before,.rv-analyst[open]>summary::before{content:"\\25BE  "}',
        '.rv-read{font-family:"Times New Roman",Times,serif;font-size:0.95rem;line-height:1.7;',
        'color:var(--text-primary);margin:6px 0 8px 0;overflow-wrap:anywhere}',
        '.rv-watch-title{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;',
        'color:var(--text-muted);margin-top:6px}',
        '.rv-watch{margin:4px 0 0 18px;padding:0}',
        '.rv-watch li{font-family:"Times New Roman",Times,serif;font-size:0.9rem;line-height:1.55;',
        'color:var(--text-primary)}',
        '.rv-label{margin-top:10px;font-size:11px;letter-spacing:0.5px;color:var(--text-muted);font-style:italic}',
        '.rv-analyst .bluf-prose{margin-top:6px}',
        '.rv-signals-label{margin:12px 0 8px 0;padding-top:10px;border-top:1px solid var(--card-border);',
        'font-size:11px;letter-spacing:0.5px;color:var(--text-muted);font-style:italic}',
        '@media (max-width:768px){.rv-plain-headline{font-size:1.1rem}.rv-plain-sowhat{font-size:0.98rem}}'
    ].join('');

    function esc(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function when(iso) {
        var dt = new Date(iso);
        if (!iso || isNaN(dt)) return '';
        return ' · written ' + dt.toLocaleString('en-US',
            {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});
    }

    function apply(rec) {
        var v = rec && rec.view;
        var prose = document.getElementById('blufProse');
        if (!v || !v.headline || !prose || document.getElementById('rvPlain')) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var watch = (v.watch || []).filter(Boolean);
        var plain = document.createElement('div');
        plain.className = 'rv-plain';
        plain.id = 'rvPlain';
        plain.innerHTML =
            '<div class="rv-plain-headline">' + esc(v.headline) + '</div>' +
            '<div class="rv-plain-sowhat">' + esc(v.so_what) + '</div>' +
            '<details class="rv-more"><summary>The fuller read</summary>' +
            '<div class="rv-read">' + esc(v.read) + '</div>' +
            (watch.length ? '<div class="rv-watch-title">What to watch</div><ul class="rv-watch">' +
                watch.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
            '</details>' +
            '<div class="rv-label">' + esc(rec.label || 'Plain-language read, AI-drafted from Asifah signals') +
            when(rec.generated_at) + '</div>';

        // The analyst prose moves (the SAME element, so the page's own renderer
        // keeps writing into it by id) inside a collapsed <details>.
        var analyst = document.createElement('details');
        analyst.className = 'rv-analyst';
        analyst.innerHTML = '<summary>Analyst detail &mdash; the full regional assessment</summary>';
        prose.parentNode.insertBefore(plain, prose);
        prose.parentNode.insertBefore(analyst, prose);
        analyst.appendChild(prose);

        var sigs = document.getElementById('blufSignals');
        if (sigs && sigs.parentNode) {
            var lab = document.createElement('div');
            lab.className = 'rv-signals-label';
            lab.textContent = 'Live signals behind this read — from Asifah’s trackers, unedited';
            sigs.parentNode.insertBefore(lab, sigs);
        }
    }

    function load() {
        fetch(ME_BACKEND + '/api/regional/voice?region=' + encodeURIComponent(REGION), {cache: 'no-store'})
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (rec) { if (rec && rec.available) apply(rec); })
            .catch(function (e) { console.warn('[Regional voice] unavailable:', e); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
    else load();
})();
