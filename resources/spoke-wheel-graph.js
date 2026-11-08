/* Asifah Analytics -- Spoke & Wheel network graph  v1.0.0  (Nov 8 2026)
 *
 * The GPI's "N hubs converged" line, drawn as the network it describes.
 * Hubs (China, USA, Russia, Iran, Turkiye, UAE, Israel...) are the big nodes;
 * every country a hub's wheel touches is a spoke. A country touched by more
 * than one hub is ONE node with several lines -- so Yemen sits between Iran,
 * Israel and the UAE, and that position is the read.
 *
 *   line colour  = the level that spoke is firing (site ladder L0-L6)
 *   solid line   = lit this cycle      dashed = tracked, quiet
 *   dotted, faint= not reporting (unread, not calm) -- shown with "full rim"
 *   gold ring    = hub converged (its wheel is lit across regions)
 *   white halo   = contested spoke (2+ hubs lit on it)
 *   cyan ring    = newly lit since this browser's last visit
 *
 * Built ONLY from the GPI payload's convergence_panel.resident_wheels, so a
 * new wheel or spoke appears the cycle its tracker starts reporting. Nothing
 * here is a list someone has to keep up to date.
 *
 * Interaction (ported from Rachel's network-graph reading aid): drag nodes,
 * drag the background to pan, +/- or Ctrl/Cmd + wheel to zoom, hover to
 * light a node's network, click/tap for the record panel.
 *
 * Use: AsifahWheelGraph.render(gpiPayload) into <div id="gpiWheelGraph">.
 */
(function () {
  'use strict';

  var LEVEL = {
    0: ['Monitoring', '#6b7280'], 1: ['Rhetoric', '#3b82f6'], 2: ['Warning', '#f59e0b'],
    3: ['Confrontation', '#f97316'], 4: ['Coercion', '#ef4444'], 5: ['Active Conflict', '#991b1b'],
    6: ['Red Line Breached', '#3b0764']
  };
  var HUB_NAME = { us: 'USA', uk: 'UK', uae: 'UAE', dprk: 'DPRK', turkey: 'Türkiye', car: 'CAR', drc: 'DR Congo' };
  // pages that exist today; anything else gets no link rather than a dead one
  var RHETORIC = ' afghanistan argentina armenia azerbaijan belarus burkina_faso canada chile china cuba cyprus dprk egypt greece greenland hungary india iran iraq israel japan kazakhstan lebanon libya mali mexico moldova oman pakistan paraguay peru philippines poland qatar russia saudi_arabia somalia sudan syria taiwan turkey uae uk ukraine us venezuela vietnam yemen ';
  var STABILITY = ' albania algeria bahrain belgium brazil car chad colombia drc equatorial_guinea ethiopia guinea haiti jordan kenya kuwait madagascar morocco mozambique niger nigeria panama rwanda south_africa south_sudan tanzania tunisia turkmenistan uganda ';
  var STAB_ALIAS = { south_korea: 'south-korea' };

  var S = {
    host: null, data: null, built: false, canvas: null, ctx: null, stage: null, tip: null, panel: null,
    nodes: [], edges: [], nodeMap: {}, hubs: [], showQuiet: false, focusHub: null,
    selected: null, hovered: null, alpha: 1, frame: 0, view: { x: 0, y: 0, k: 1 },
    ptr: { down: false, moved: false, node: null, sx: 0, sy: 0, vx: 0, vy: 0 }, newly: {}, gate: null
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>'"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]; }); }
  function nice(key) {
    if (HUB_NAME[key]) return HUB_NAME[key];
    return String(key || '').replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function cls(c) {
    if (!c || c === 'unclassified') return 'link';
    return String(c).replace(/_/g, ' ').replace(/\bbri\b/i, 'BRI');
  }
  function pageFor(key) {
    if (RHETORIC.indexOf(' ' + key + ' ') >= 0) return 'rhetoric-' + key + '.html';
    if (STABILITY.indexOf(' ' + key + ' ') >= 0) return key + '-stability.html';
    if (STAB_ALIAS[key]) return STAB_ALIAS[key] + '-stability.html';
    return '';
  }
  function isPhone() { return window.matchMedia && window.matchMedia('(max-width: 700px)').matches; }

  // L5 only for a NEW front (Rachel, Nov 6): while the GPI's novelty gate
  // holds a sustained war at L4, an L5 spoke with no new front shows as L4.
  function shownLevel(lvl, country) {
    var g = S.gate || {};
    if (lvl === 5 && g.applied && !(S.data && S.data.l6 && S.data.l6.active)) {
      var fresh = (g.fresh || []).some(function (e) { return e.theatre === country; });
      if (!fresh) return 4;
    }
    return lvl;
  }

  // ── data -> graph ────────────────────────────────────────────────────────
  function build(payload) {
    var cp = payload && payload.convergence_panel;
    var wheels = (cp && cp.resident_wheels) || [];
    S.gate = payload.level_gate || null;
    var nodes = [], edges = [], map = {};
    function node(id, kind) {
      if (map[id]) { if (kind === 'hub') map[id].kind = 'hub'; return map[id]; }
      var n = { id: id, kind: kind, name: nice(id), edges: [], x: 0, y: 0, vx: 0, vy: 0 };
      map[id] = n; nodes.push(n); return n;
    }
    wheels.forEach(function (w) {
      var h = node(w.hub, 'hub');
      h.kind = 'hub'; h.wheel = w; h.converged = !!w.converged; h.icon = w.icon || '';
    });
    wheels.forEach(function (w) {
      (w.spokes || []).forEach(function (sp) {
        if (!sp.country || sp.country === w.hub) return;
        var n = node(sp.country, map[sp.country] && map[sp.country].kind === 'hub' ? 'hub' : 'spoke');
        if (sp.display && n.kind !== 'hub') n.name = sp.display;
        var raw = +sp.level || 0;
        var e = {
          id: w.hub + '>' + sp.country, source: w.hub, target: sp.country, state: sp.state,
          raw: raw, level: sp.state === 'lit' ? shownLevel(raw, sp.country) : 0,
          cls: sp.node_class, signal: sp.top_signal || '', age: sp.age_hours, region: sp.region,
          reason: sp.reason || '', peer: n.kind === 'hub'
        };
        edges.push(e);
      });
    });
    // node colour = highest lit level touching it; contested = 2+ hubs lit on it
    nodes.forEach(function (n) { n.level = -1; n.litHubs = 0; n.r = n.kind === 'hub' ? 24 : 13; });
    edges.forEach(function (e) {
      map[e.source].edges.push(e); map[e.target].edges.push(e);
      if (e.state === 'lit') {
        var t = map[e.target];
        t.level = Math.max(t.level, e.level); t.litHubs += 1;
      }
    });
    nodes.forEach(function (n) {
      if (n.kind === 'hub') n.r = 22 + Math.min(10, (n.wheel ? n.wheel.lit_count || 0 : 0));
      else n.r = 11 + Math.max(0, n.level) * 1.3;
      n.contested = n.kind !== 'hub' && n.litHubs >= 2;
    });
    S.nodes = nodes; S.edges = edges; S.nodeMap = map;
    S.hubs = nodes.filter(function (n) { return n.kind === 'hub'; });
    markNew();
    seed();
  }

  // "newly lit since your last visit" -- this browser only, honest about it
  function markNew() {
    var KEY = 'asf-swg-seen-v1', prev = null, now = Date.now();
    try { prev = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { prev = null; }
    var lit = S.edges.filter(function (e) { return e.state === 'lit'; }).map(function (e) { return e.id; });
    S.newly = {};
    if (prev && prev.lit && now - (prev.t || 0) > 30 * 60 * 1000) {
      var had = {}; prev.lit.forEach(function (id) { had[id] = 1; });
      lit.forEach(function (id) { if (!had[id]) S.newly[id] = 1; });
      S.newlySince = prev.t;
    }
    if (!prev || now - (prev.t || 0) > 30 * 60 * 1000) {
      try { localStorage.setItem(KEY, JSON.stringify({ t: now, lit: lit })); } catch (e) { /* private mode */ }
    }
  }

  function seed() {
    var hubs = S.hubs, R = 230;
    hubs.forEach(function (h, i) {
      var a = (i / Math.max(1, hubs.length)) * Math.PI * 2 - Math.PI / 2;
      h.x = Math.cos(a) * R; h.y = Math.sin(a) * R;
    });
    S.nodes.forEach(function (n, i) {
      if (n.kind === 'hub') return;
      var hs = n.edges.map(function (e) { return S.nodeMap[e.source]; });
      var cx = 0, cy = 0;
      hs.forEach(function (h) { cx += h.x; cy += h.y; });
      cx /= Math.max(1, hs.length); cy /= Math.max(1, hs.length);
      var a = i * 2.39996;                       // golden-angle scatter around its hubs
      n.x = cx * (hs.length > 1 ? 0.7 : 1.25) + Math.cos(a) * 60;
      n.y = cy * (hs.length > 1 ? 0.7 : 1.25) + Math.sin(a) * 60;
    });
    S.alpha = 1;
  }

  function visibleEdges() {
    return S.edges.filter(function (e) {
      return e.state === 'lit' || S.showQuiet;
    });
  }
  function visibleNodeIds() {
    var ids = {};
    S.hubs.forEach(function (h) { ids[h.id] = 1; });
    visibleEdges().forEach(function (e) { ids[e.source] = 1; ids[e.target] = 1; });
    return ids;
  }
  function context() {
    var item = S.hovered || (S.selected) || (S.focusHub ? S.nodeMap[S.focusHub] : null);
    if (!item) return null;
    var ids = { __focus: item.id }; ids[item.id] = 1;
    visibleEdges().forEach(function (e) {
      if (e.source === item.id) ids[e.target] = 1;
      if (e.target === item.id) ids[e.source] = 1;
    });
    return ids;
  }

  // ── physics (same shape as the reading-aid graph, tuned for ~80 nodes) ────
  function simulate() {
    var vis = visibleNodeIds(), ns = S.nodes.filter(function (n) { return vis[n.id]; });
    var es = visibleEdges(), a = S.alpha;
    for (var i = 0; i < ns.length; i++) {
      for (var j = i + 1; j < ns.length; j++) {
        var p = ns[i], q = ns[j];
        var dx = q.x - p.x, dy = q.y - p.y, d2 = Math.max(120, dx * dx + dy * dy), d = Math.sqrt(d2);
        var rep = (p.kind === 'hub' && q.kind === 'hub') ? 26000 : 4200;
        var f = rep * a / d2; dx /= d; dy /= d;
        if (p.fx == null) { p.vx -= dx * f; p.vy -= dy * f; }
        if (q.fx == null) { q.vx += dx * f; q.vy += dy * f; }
      }
    }
    es.forEach(function (e) {
      var p = S.nodeMap[e.source], q = S.nodeMap[e.target];
      var dx = q.x - p.x, dy = q.y - p.y, d = Math.max(1, Math.hypot(dx, dy));
      var want = e.peer ? 260 : (e.state === 'lit' ? 110 : 150);
      var f = (d - want) * (e.state === 'lit' ? 0.004 : 0.0022) * a;
      var fx = dx / d * f, fy = dy / d * f;
      var wp = p.kind === 'hub' ? 0.25 : 1, wq = q.kind === 'hub' ? 0.25 : 1;
      if (p.fx == null) { p.vx += fx * wp; p.vy += fy * wp; }
      if (q.fx == null) { q.vx -= fx * wq; q.vy -= fy * wq; }
    });
    ns.forEach(function (n) {
      if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; return; }
      n.vx += -n.x * 0.0009 * a; n.vy += -n.y * 0.0009 * a;
      n.vx *= 0.86; n.vy *= 0.86; n.x += n.vx; n.y += n.vy;
    });
    S.alpha *= 0.985;
    draw();
    if (S.alpha > 0.01 || S.ptr.down) S.frame = requestAnimationFrame(simulate);
  }
  function reheat(v) { S.alpha = Math.max(S.alpha, v || 0.4); cancelAnimationFrame(S.frame); S.frame = requestAnimationFrame(simulate); }

  // ── drawing ──────────────────────────────────────────────────────────────
  function ratio() { return Math.min(window.devicePixelRatio || 1, 2); }
  function resize() {
    if (!S.stage) return;
    var r = S.stage.getBoundingClientRect(), k = ratio();
    S.canvas.width = Math.max(1, Math.round(r.width * k)); S.canvas.height = Math.max(1, Math.round(r.height * k));
    S.canvas.style.width = r.width + 'px'; S.canvas.style.height = r.height + 'px';
    draw();
  }
  function toWorld(cx, cy) {
    var r = S.canvas.getBoundingClientRect();
    return { x: (cx - r.left - r.width / 2 - S.view.x) / S.view.k, y: (cy - r.top - r.height / 2 - S.view.y) / S.view.k };
  }
  function light() {
    var t = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    return t === 'light' || document.body.classList.contains('light-mode');
  }

  function draw() {
    var c = S.canvas, x = S.ctx; if (!c || !c.width) return;
    var k = ratio(), W = c.width / k, H = c.height / k, L = light();
    x.save(); x.scale(k, k);
    x.fillStyle = L ? '#f1f5f9' : '#07101a'; x.fillRect(0, 0, W, H);
    var sp = 36 * S.view.k;
    if (sp > 14) {
      var ox = ((W / 2 + S.view.x) % sp + sp) % sp, oy = ((H / 2 + S.view.y) % sp + sp) % sp;
      x.fillStyle = L ? 'rgba(15,23,42,0.08)' : 'rgba(148,163,184,0.08)';
      for (var gx = ox; gx < W; gx += sp) for (var gy = oy; gy < H; gy += sp) x.fillRect(gx, gy, 1, 1);
    }
    x.translate(W / 2 + S.view.x, H / 2 + S.view.y); x.scale(S.view.k, S.view.k);
    var ctxIds = context(), vis = visibleNodeIds(), z = S.view.k, focusId = ctxIds && ctxIds.__focus;

    visibleEdges().forEach(function (e) {
      var p = S.nodeMap[e.source], q = S.nodeMap[e.target];
      var rel = !ctxIds || p.id === focusId || q.id === focusId;
      var col = e.state === 'lit' ? LEVEL[Math.min(6, e.level)][1] : (L ? '#94a3b8' : '#475569');
      x.save();
      x.globalAlpha = rel ? (ctxIds ? 0.95 : (e.state === 'lit' ? 0.75 : 0.35)) : 0.05;
      x.strokeStyle = col;
      x.lineWidth = (e.state === 'lit' ? 1.2 + e.level * 0.35 : 0.8) / z;
      if (e.state === 'dark') x.setLineDash([6 / z, 5 / z]);
      if (e.state === 'not_reporting') { x.setLineDash([2 / z, 5 / z]); x.globalAlpha *= 0.6; }
      x.shadowBlur = (ctxIds && rel && e.state === 'lit' ? 8 : 0) / z; x.shadowColor = col;
      x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
      x.restore();
      if (rel && ctxIds && e.state === 'lit') {
        var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, ang = Math.atan2(q.y - p.y, q.x - p.x);
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        var lab = cls(e.cls).toUpperCase();
        x.save(); x.translate(mx, my); x.rotate(ang);
        x.font = '600 ' + (8.5 / z) + 'px "Times New Roman"'; x.textAlign = 'center'; x.textBaseline = 'bottom';
        var tw = x.measureText(lab).width;
        x.fillStyle = L ? 'rgba(241,245,249,.9)' : 'rgba(7,16,26,.88)';
        x.fillRect(-tw / 2 - 3 / z, -11 / z, tw + 6 / z, 12 / z);
        x.fillStyle = col === '#3b0764' || col === '#991b1b' ? (L ? col : '#fca5a5') : col;
        x.fillText(lab, 0, -2 / z); x.restore();
      }
    });

    S.nodes.forEach(function (n) {
      if (!vis[n.id]) return;
      var rel = !ctxIds || ctxIds[n.id], sel = S.selected && S.selected.id === n.id, hov = S.hovered && S.hovered.id === n.id;
      var r = n.r + (sel || hov ? 2 : 0);
      x.save(); x.globalAlpha = rel ? 1 : 0.12;
      var fill = n.kind === 'hub' ? (L ? '#e2e8f0' : '#101c2c') : (n.level >= 0 ? LEVEL[Math.min(6, n.level)][1] : (L ? '#cbd5e1' : '#1e293b'));
      // halos
      if (n.contested) { x.strokeStyle = L ? '#0f172a' : '#e2e8f0'; x.setLineDash([3 / z, 3 / z]); x.lineWidth = 1 / z; x.beginPath(); x.arc(n.x, n.y, r + 6, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
      var isNew = n.edges.some(function (e) { return S.newly[e.id] && (e.target === n.id); });
      if (isNew) { x.strokeStyle = '#22d3ee'; x.lineWidth = 2 / z; x.beginPath(); x.arc(n.x, n.y, r + (n.contested ? 10 : 6), 0, Math.PI * 2); x.stroke(); }
      if (n.kind === 'hub' && n.converged) { x.strokeStyle = '#e8c675'; x.lineWidth = 2.2 / z; x.shadowBlur = 16 / z; x.shadowColor = 'rgba(232,198,117,.45)'; x.beginPath(); x.arc(n.x, n.y, r + 5, 0, Math.PI * 2); x.stroke(); x.shadowBlur = 0; }
      x.fillStyle = fill;
      x.strokeStyle = n.kind === 'hub' ? (n.converged ? '#e8c675' : '#64748b') : (L ? '#475569' : 'rgba(255,255,255,.75)');
      x.lineWidth = (n.kind === 'hub' ? 1.6 : 0.9) / z;
      x.shadowBlur = (sel || hov ? 18 : 4) / z; x.shadowColor = n.kind === 'hub' ? 'rgba(232,198,117,.3)' : 'rgba(56,189,248,.25)';
      x.beginPath(); x.arc(n.x, n.y, r, 0, Math.PI * 2); x.fill(); x.stroke(); x.shadowBlur = 0;
      if (n.kind === 'hub') {
        x.font = Math.round(r * 0.9) + 'px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(n.icon || '◎', n.x, n.y + 1);
      }
      // labels stay a readable size on screen whatever the zoom
      if (rel && (n.kind === 'hub' || ctxIds || n.level >= 3 || n.contested || S.view.k > 0.8)) {
        var lab = n.name, fs = (n.kind === 'hub' ? 12.5 : 10.5) / z;
        x.font = '600 ' + fs + 'px "Times New Roman"'; x.textAlign = 'center'; x.textBaseline = 'top';
        var w = x.measureText(lab).width, ty = n.y + r + 3 / z;
        x.fillStyle = L ? 'rgba(241,245,249,.92)' : 'rgba(7,16,26,.85)';
        x.fillRect(n.x - w / 2 - 3 / z, ty, w + 6 / z, fs + 3 / z);
        x.fillStyle = n.kind === 'hub' ? (L ? '#92400e' : '#f0db9f') : (L ? '#0f172a' : '#cbd5e1');
        x.fillText(lab, n.x, ty + 1.5 / z);
      }
      x.restore();
    });
    x.restore();
  }

  // ── pointer ──────────────────────────────────────────────────────────────
  function nodeAt(w) {
    var vis = visibleNodeIds(), pad = (isPhone() ? 14 : 6) / S.view.k;
    for (var i = S.nodes.length - 1; i >= 0; i--) {
      var n = S.nodes[i];
      if (vis[n.id] && Math.hypot(n.x - w.x, n.y - w.y) <= n.r + pad) return n;
    }
    return null;
  }
  function bindPointer() {
    var c = S.canvas;
    var touches = {}, pinch = null;
    function pinchDist() { var t = Object.keys(touches).map(function (k) { return touches[k]; }); return t.length < 2 ? null : { d: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y), mx: (t[0].x + t[1].x) / 2, my: (t[0].y + t[1].y) / 2 }; }
    c.addEventListener('pointerdown', function (ev) {
      c.setPointerCapture(ev.pointerId);
      touches[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (Object.keys(touches).length === 2) {           // two fingers: pinch to zoom
        if (S.ptr.node) { S.ptr.node.fx = S.ptr.node.fy = null; }
        S.ptr = { down: false, moved: true }; pinch = pinchDist(); return;
      }
      var n = nodeAt(toWorld(ev.clientX, ev.clientY));
      S.ptr = { down: true, moved: false, node: n, sx: ev.clientX, sy: ev.clientY, vx: S.view.x, vy: S.view.y };
      if (n) { n.fx = n.x; n.fy = n.y; reheat(0.3); }
    });
    c.addEventListener('pointermove', function (ev) {
      if (touches[ev.pointerId]) touches[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (pinch) { var p2 = pinchDist(); if (p2 && pinch.d > 0) { zoomAt(p2.d / pinch.d, p2.mx, p2.my); pinch = p2; } return; }
      if (!S.ptr.down) return hover(ev);
      var dx = ev.clientX - S.ptr.sx, dy = ev.clientY - S.ptr.sy;
      if (Math.hypot(dx, dy) > 3) S.ptr.moved = true;
      if (S.ptr.node) { var w = toWorld(ev.clientX, ev.clientY); S.ptr.node.fx = S.ptr.node.x = w.x; S.ptr.node.fy = S.ptr.node.y = w.y; reheat(0.2); }
      else { S.view.x = S.ptr.vx + dx; S.view.y = S.ptr.vy + dy; draw(); }
    });
    function up(ev) {
      delete touches[ev.pointerId];
      if (pinch) { if (Object.keys(touches).length < 2) pinch = null; return; }
      if (!S.ptr.down) return;
      var n = S.ptr.node;
      if (n) { n.fx = n.fy = null; if (!S.ptr.moved) select(n); reheat(0.15); }
      else if (!S.ptr.moved) { S.selected = null; S.focusHub = null; renderChips(); renderPanel(); draw(); }
      S.ptr.down = false;
    }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', function () { if (!S.ptr.down) { S.hovered = null; S.tip.hidden = true; draw(); } });
    c.addEventListener('wheel', function (ev) {
      if (!ev.ctrlKey && !ev.metaKey) return;            // plain scroll keeps scrolling the page
      ev.preventDefault();
      zoomAt(Math.exp(-ev.deltaY * 0.0015), ev.clientX, ev.clientY);
    }, { passive: false });
  }
  function hover(ev) {
    var n = nodeAt(toWorld(ev.clientX, ev.clientY));
    if ((n && n.id) !== (S.hovered && S.hovered.id)) { S.hovered = n; S.canvas.style.cursor = n ? 'pointer' : 'grab'; draw(); }
    if (!n) { S.tip.hidden = true; return; }
    var r = S.stage.getBoundingClientRect();
    S.tip.hidden = false;
    S.tip.style.left = Math.min(r.width - 240, ev.clientX - r.left + 14) + 'px';
    S.tip.style.top = Math.min(r.height - 60, ev.clientY - r.top + 14) + 'px';
    S.tip.innerHTML = '<b>' + esc(n.name) + '</b>' + (n.kind === 'hub'
      ? ((n.wheel ? n.wheel.lit_count : 0) + ' spokes lit' + (n.converged ? ' · converged' : ''))
      : (n.level >= 0 ? 'L' + n.level + ' · ' + LEVEL[Math.min(6, n.level)][0] + ' · ' + n.litHubs + ' hub' + (n.litHubs === 1 ? '' : 's') : 'quiet / unread')) +
      '<small>click for the record</small>';
  }
  function zoomAt(f, cx, cy) {
    var r = S.canvas.getBoundingClientRect();
    var mx = (cx == null ? r.left + r.width / 2 : cx) - r.left - r.width / 2;
    var my = (cy == null ? r.top + r.height / 2 : cy) - r.top - r.height / 2;
    var bx = (mx - S.view.x) / S.view.k, by = (my - S.view.y) / S.view.k;
    S.view.k = Math.max(0.3, Math.min(2.8, S.view.k * f));
    S.view.x = mx - bx * S.view.k; S.view.y = my - by * S.view.k; draw();
  }
  function fit() {
    var vis = visibleNodeIds(), ns = S.nodes.filter(function (n) { return vis[n.id]; });
    if (!ns.length) return;
    var xs = ns.map(function (n) { return n.x; }), ys = ns.map(function (n) { return n.y; });
    var x0 = Math.min.apply(null, xs) - 50, x1 = Math.max.apply(null, xs) + 50, y0 = Math.min.apply(null, ys) - 50, y1 = Math.max.apply(null, ys) + 60;
    var r = S.canvas.getBoundingClientRect();
    S.view.k = Math.max(0.3, Math.min(1.3, Math.min(r.width / (x1 - x0), r.height / (y1 - y0)) * 0.94));
    S.view.x = -((x0 + x1) / 2) * S.view.k; S.view.y = -((y0 + y1) / 2) * S.view.k; draw();
  }

  // ── record panel ─────────────────────────────────────────────────────────
  function select(n) {
    S.selected = n;
    S.focusHub = n.kind === 'hub' ? n.id : null;
    renderChips(); renderPanel(); draw();
  }
  function link(key, label) {
    var p = pageFor(key);
    return p ? '<a href="' + p + '">' + esc(label || nice(key)) + ' ↗</a>' : esc(label || nice(key));
  }
  function renderPanel() {
    var P = S.panel, n = S.selected;
    if (!n) {
      var cp = S.data.convergence_panel || {};
      P.innerHTML = '<div class="swg-p-kicker">How to read this</div>' +
        '<p>' + esc(cp.global_headline || '') + '</p>' +
        '<p class="swg-p-note">Click a hub to see its wheel, or a country to see every hub pressing on it. ' +
        'Countries pulled between several hubs sit between them on purpose.</p>' +
        '<p class="swg-p-note">' + esc(cp.disclaimer || '') + '</p>';
      return;
    }
    var lit = n.edges.filter(function (e) { return e.state === 'lit'; });
    var html = '';
    if (n.kind === 'hub') {
      var w = n.wheel || {}, b = w.breadth || {};
      var rows = n.edges.filter(function (e) { return e.source === n.id && e.state === 'lit'; })
        .sort(function (a, c) { return c.level - a.level; });
      html = '<div class="swg-p-kicker">Hub · ' + (n.converged ? 'converged' : 'not converged') + '</div>' +
        '<h3>' + esc(n.icon || '') + ' ' + link(n.id, n.name + ' wheel') + '</h3>' +
        '<p>' + esc(w.headline || '') + '</p>' +
        '<div class="swg-p-flags"><span>' + (w.lit_count || 0) + ' lit</span><span>' + (w.dark_count || 0) + ' quiet</span>' +
        '<span>' + (w.unreported_count || 0) + ' not reporting</span>' + (b.span ? '<span>' + b.span + ' regions</span>' : '') + '</div>' +
        rows.map(row).join('') +
        (b.coverage_note ? '<p class="swg-p-note">' + esc(b.coverage_note) + '</p>' : '') +
        (b.peer_note ? '<p class="swg-p-note">' + esc(b.peer_note) + '</p>' : '');
    } else {
      var cs = ((S.data.convergence_panel || {}).contested_spokes || []).filter(function (c) { return c.country === n.id; })[0];
      html = '<div class="swg-p-kicker">' + (n.contested ? 'Contested spoke · ' + n.litHubs + ' hubs lit' : 'Spoke') + '</div>' +
        '<h3>' + link(n.id, n.name) + '</h3>' +
        (lit.length ? lit.sort(function (a, c) { return c.level - a.level; }).map(row).join('') : '<p class="swg-p-note">No hub is lit on this country this cycle (quiet or not reporting -- unread is not calm).</p>');
      if (cs && cs.mutual_classification) {
        var mc = Object.keys(cs.mutual_classification).map(function (k) {
          var m = k.split('_reads_');
          return esc(nice(m[0])) + ' reads ' + esc(nice(m[1])) + ' as <b>' + esc(cls(cs.mutual_classification[k])) + '</b>';
        });
        html += '<div class="swg-p-kicker" style="margin-top:12px">Between the hubs themselves</div><p class="swg-p-note">' + mc.join(' · ') + '</p>';
      }
    }
    P.innerHTML = html;
  }
  function row(e) {
    var other = S.selected && S.selected.id === e.source ? e.target : e.source;
    var col = LEVEL[Math.min(6, e.level)][1];
    var sus = e.raw === 5 && e.level === 4 ? ' (L5 reading, sustained)' : '';
    return '<div class="swg-row" style="border-left-color:' + col + '">' +
      '<div><b>' + esc(nice(other)) + '</b> <span class="swg-chip" style="background:' + col + '">L' + e.level + '</span>' +
      ' <i>' + esc(cls(e.cls)) + '</i>' + (S.newly[e.id] ? ' <span class="swg-new">NEW</span>' : '') + '</div>' +
      (e.signal ? '<div class="swg-sig">' + esc(e.signal) + '</div>' : '') +
      '<div class="swg-meta">' + esc(LEVEL[Math.min(6, e.level)][0]) + sus + (e.age != null ? ' · read ' + Math.round(e.age) + 'h ago' : '') + '</div></div>';
  }

  function renderChips() {
    var bar = S.host.querySelector('.swg-chips'); if (!bar) return;
    bar.innerHTML = '<button type="button" data-hub="" class="' + (!S.focusHub ? 'on' : '') + '">All hubs</button>' +
      S.hubs.slice().sort(function (a, b) { return (b.wheel ? b.wheel.lit_count : 0) - (a.wheel ? a.wheel.lit_count : 0); })
        .map(function (h) {
          return '<button type="button" data-hub="' + esc(h.id) + '" class="' + (S.focusHub === h.id ? 'on' : '') + (h.converged ? ' cv' : '') + '">' +
            esc(h.icon || '') + ' ' + esc(h.name) + ' <small>' + (h.wheel ? h.wheel.lit_count : 0) + '</small></button>';
        }).join('');
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-hub');
        S.focusHub = id || null; S.selected = id ? S.nodeMap[id] : null;
        renderChips(); renderPanel(); draw();
      };
    });
  }

  function css() {
    if (document.getElementById('swgCss')) return;
    var st = document.createElement('style'); st.id = 'swgCss';
    st.textContent =
      '.swg{border:1px solid var(--card-border,rgba(148,163,184,.25));border-radius:12px;padding:14px;background:var(--card-bg,rgba(15,23,42,.6))}' +
      '.swg-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 18px;align-items:baseline;margin-bottom:10px}' +
      '.swg-title{font:800 .95rem "Times New Roman",serif;letter-spacing:2px;text-transform:uppercase}' +
      '.swg-sub{font-size:.78rem;opacity:.75}' +
      '.swg-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
      '.swg-chips button,.swg-tools button{font:600 .74rem "Times New Roman",serif;padding:5px 10px;border-radius:999px;cursor:pointer;' +
        'background:transparent;color:inherit;border:1px solid rgba(148,163,184,.4)}' +
      '.swg-chips button.cv{border-color:#e8c675}.swg-chips button.on{background:rgba(56,189,248,.18);border-color:#38bdf8}' +
      '.swg-chips small{opacity:.7;margin-left:2px}' +
      '.swg-body{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:12px}' +
      '.swg-stage{position:relative;height:560px;border-radius:10px;overflow:hidden;border:1px solid rgba(148,163,184,.2)}' +
      '.swg-stage canvas{display:block;touch-action:none;cursor:grab}' +
      '.swg-tools{position:absolute;right:8px;top:8px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}' +
      '.swg-tools button{background:rgba(7,16,26,.75);color:#e2e8f0}' +
      '.swg-hint{position:absolute;left:10px;bottom:8px;font-size:.68rem;opacity:.6;pointer-events:none}' +
      '.swg-tip{position:absolute;pointer-events:none;background:rgba(7,16,26,.95);color:#e2e8f0;border:1px solid rgba(148,163,184,.4);' +
        'border-radius:6px;padding:6px 9px;font-size:.78rem;max-width:230px;z-index:2}.swg-tip b{display:block}.swg-tip small{display:block;opacity:.6}' +
      '.swg-panel{max-height:560px;overflow:auto;font-size:.84rem;line-height:1.5;padding-right:4px}' +
      '.swg-panel h3{margin:4px 0 8px;font-size:1.05rem}.swg-panel a{color:var(--accent-cyan,#38bdf8)}' +
      '.swg-p-kicker{font-size:.66rem;letter-spacing:1.5px;text-transform:uppercase;opacity:.7;font-weight:800}' +
      '.swg-p-note{opacity:.75;font-size:.78rem}.swg-p-flags{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}' +
      '.swg-p-flags span{font-size:.7rem;border:1px solid rgba(148,163,184,.4);border-radius:999px;padding:1px 8px}' +
      '.swg-row{border-left:3px solid;padding:6px 8px;margin:6px 0;background:rgba(148,163,184,.07);border-radius:4px}' +
      '.swg-chip{color:#fff;font-size:.66rem;font-weight:800;padding:0 6px;border-radius:4px}.swg-row i{opacity:.8;font-size:.76rem}' +
      '.swg-sig{font-size:.78rem;opacity:.85;margin-top:2px}.swg-meta{font-size:.7rem;opacity:.6}' +
      '.swg-new{background:#22d3ee;color:#04202a;font-size:.6rem;font-weight:800;padding:0 5px;border-radius:3px}' +
      '.swg-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.72rem;opacity:.85;margin-top:10px}' +
      '.swg-legend i{display:inline-block;width:14px;height:0;border-top:3px solid;vertical-align:middle;margin-right:5px}' +
      '.swg-legend .dot{width:11px;height:11px;border-radius:50%;border:none;margin-right:5px}' +
      '@media (max-width:900px){.swg-body{grid-template-columns:1fr}.swg-stage{height:440px}.swg-panel{max-height:none}}';
    document.head.appendChild(st);
  }

  function scaffold() {
    css();
    var cp = S.data.convergence_panel || {};
    S.host.innerHTML =
      '<div class="swg">' +
      '<div class="swg-head"><div class="swg-title">☸️ Spoke &amp; Wheel · who is pressing where</div>' +
      '<div class="swg-sub">' + esc(cp.subtitle || '') + (cp.converged_count ? ' · ' + cp.converged_count + ' hubs converged' : '') +
      (cp.contested_count ? ' · ' + cp.contested_count + ' contested spokes' : '') + '</div></div>' +
      '<div class="swg-chips"></div>' +
      '<div class="swg-body"><div class="swg-stage"><canvas></canvas>' +
      '<div class="swg-tools"><button type="button" data-a="quiet">Full rim: off</button><button type="button" data-a="fit">Fit</button>' +
      '<button type="button" data-a="in">+</button><button type="button" data-a="out">−</button></div>' +
      '<div class="swg-hint">' + (isPhone() ? 'tap a circle · drag to pan · pinch to zoom · scroll the page beside the graph'
        : 'drag nodes · drag background to pan · Ctrl/⌘ + scroll or +/− to zoom') + '</div>' +
      '<div class="swg-tip" hidden></div></div>' +
      '<aside class="swg-panel" aria-live="polite"></aside></div>' +
      '<div class="swg-legend">' +
      [1, 2, 3, 4, 5].map(function (l) { return '<span><i style="border-color:' + LEVEL[l][1] + '"></i>L' + l + ' ' + LEVEL[l][0] + '</span>'; }).join('') +
      '<span><i style="border-top-style:dashed;border-color:#64748b"></i>Quiet (full rim)</span>' +
      '<span><i style="border-top-style:dotted;border-color:#64748b"></i>Not reporting — unread, not calm</span>' +
      '<span><i class="dot" style="border:2px solid #e8c675"></i>Hub converged</span>' +
      '<span><i class="dot" style="border:1px dashed #e2e8f0"></i>Contested (2+ hubs)</span>' +
      '<span><i class="dot" style="border:2px solid #22d3ee"></i>Newly lit since your last visit</span>' +
      '</div></div>';
    S.stage = S.host.querySelector('.swg-stage'); S.canvas = S.stage.querySelector('canvas');
    S.ctx = S.canvas.getContext('2d'); S.tip = S.stage.querySelector('.swg-tip'); S.panel = S.host.querySelector('.swg-panel');
    Array.prototype.forEach.call(S.host.querySelectorAll('.swg-tools button'), function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a');
        if (a === 'fit') fit();
        if (a === 'in') zoomAt(1.2);
        if (a === 'out') zoomAt(0.83);
        if (a === 'quiet') { S.showQuiet = !S.showQuiet; b.textContent = 'Full rim: ' + (S.showQuiet ? 'on' : 'off'); reheat(0.6); setTimeout(fit, 900); }
      };
    });
    bindPointer();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(S.stage);
    window.addEventListener('asifah:theme', draw);
    new MutationObserver(draw).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  }

  window.AsifahWheelGraph = {
    render: function (payload) {
      S.host = S.host || document.getElementById('gpiWheelGraph');
      if (!S.host || !payload || !payload.convergence_panel) return;
      S.data = payload;
      if (!S.built) { scaffold(); S.built = true; }
      build(payload);
      renderChips(); renderPanel(); resize();
      reheat(1);
      setTimeout(fit, 900);
    },
    // called when its tab becomes visible (a hidden canvas has no size)
    show: function () { if (S.built) { resize(); fit(); } },
    // open a country's or hub's record from elsewhere on the page
    focus: function (id) { if (S.nodeMap[id]) select(S.nodeMap[id]); }
  };
})();
