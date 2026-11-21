/* Asifah Analytics -- CARD LINKS ON TOP  v1.0.0  (Nov 21 2026)
 *
 * Rachel: "it took me awhile to find the links for the stability page -- the
 * pills are way down at the bottom ... put the pills right under the country
 * names ... and you shouldn't need to expand the page to get to the links!"
 *
 * One shared script for the five regional pages (africa, asia, europe,
 * middle-east, wha). Each page still builds its own Stability · Rhetoric ·
 * Military pill row exactly as before; this script only MOVES it:
 *
 *   * EXPANDED card: the pill row (and its one-line subtitle) sits directly
 *     under the country name, above everything else.
 *   * COLLAPSED card: a copy of the same pills sits directly under the name,
 *     so the pages are one tap away without expanding the card.
 *
 * WHA cards have no pill row (they show big Stability / Rhetoric buttons right
 * under the name, which is already the top), so on WHA only the collapsed copy
 * is added, built from those buttons.
 *
 * Other scripts insert things under the card title after load (So What boxes,
 * actor-matrix panels, the Rhetoric pill when its page exists), so this runs a
 * few passes in the first seconds and is idempotent: it moves nothing that is
 * already in place. Display only; no fetches.
 */
(function () {
  'use strict';

  var css =
    '.card-link-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 6px}' +
    '.card-link-row a{font-size:12px;font-weight:700;text-decoration:none;padding:6px 12px;border-radius:16px;border:1.5px solid;white-space:nowrap}' +
    '.card-link-row a.stab{color:#0369a1;border-color:rgba(3,105,161,.45)}' +
    '.card-link-row a.rhet{color:#15803d;border-color:rgba(21,128,61,.45)}' +
    '.card-link-row a.mil{color:#b45309;border-color:rgba(180,83,9,.45)}' +
    '[data-theme="dark"] .card-link-row a.stab{color:#38bdf8}[data-theme="dark"] .card-link-row a.rhet{color:#4ade80}[data-theme="dark"] .card-link-row a.mil{color:#fbbf24}' +
    '.card-link-row a:hover{background:rgba(56,189,248,.10)}' +
    '.card-link-row.clt-top{margin:8px 0 6px}' +
    '.card-link-row.clt-clone{margin:8px 0 10px}.card-link-row.clt-clone a{font-size:11.5px;padding:5px 11px}';

  function addCss() {
    if (document.getElementById('cltCss')) return;
    var st = document.createElement('style');
    st.id = 'cltCss';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function stop(e) { e.stopPropagation(); }

  // The page's own pill row, or (WHA) one built from its big buttons.
  function sourceRow(card) {
    var row = card.querySelector('.card-link-row:not(.clt-clone)');
    if (row) return { row: row, built: false };
    var s = card.querySelector('a.stability-live, a.country-stability-btn, a.protest-analytics-btn');
    var r = card.querySelector('a.rhetoric-live');
    if (!s && !r) return null;
    var html = '';
    if (s) html += '<a class="stab" href="' + s.getAttribute('href') + '">📊 Stability</a>';
    if (r) html += '<a class="rhet" href="' + r.getAttribute('href') + '">📡 Rhetoric</a>';
    html += '<a class="mil" href="military.html">🎖️ Military</a>';
    var tmp = document.createElement('div');
    tmp.className = 'card-link-row';
    tmp.innerHTML = html;
    return { row: tmp, built: true };
  }

  function pass() {
    Array.prototype.forEach.call(document.querySelectorAll('.target-card[id$="-card"]'), function (card) {
      var src = sourceRow(card);
      if (!src) return;

      // 1. Expanded view: pills directly under the country name.
      if (!src.built) {
        var exp = card.querySelector('.card-expanded-view') || card;
        var title = exp.querySelector('h3, h2');
        if (title) {
          var row = src.row, par = row.parentElement;
          // Africa/Asia/Europe wrap the row with its subtitle in one div: move both.
          var block = (par && par !== exp && par.children.length <= 2 &&
                       (par.children.length === 1 || par.querySelector(':scope > .card-link-sub'))) ? par : row;
          if (title.nextElementSibling !== block) title.insertAdjacentElement('afterend', block);
          row.classList.add('clt-top');
          if (!block._clt) { block.addEventListener('click', stop); block._clt = true; }
        }
      }

      // 2. Collapsed view: the same pills under the name, no expanding needed.
      var head = card.querySelector('.card-collapsed-view .collapsed-header');
      if (!head) return;
      var clone = card.querySelector('.clt-clone');
      if (!clone) {
        clone = document.createElement('div');
        clone.className = 'card-link-row clt-clone';
        clone.addEventListener('click', stop);
        head.insertAdjacentElement('afterend', clone);
      }
      if (clone.innerHTML !== src.row.innerHTML) clone.innerHTML = src.row.innerHTML;
    });
  }

  function start() {
    addCss();
    pass();
    // The pages build their rows on DOMContentLoaded and add the Rhetoric pill
    // after a HEAD check; other panels insert under titles as data arrives.
    [600, 1800, 4000, 8000, 15000].forEach(function (ms) { setTimeout(pass, ms); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
