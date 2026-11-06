/* FiveOceans map component. One list + map + detail panel, configured per map.
   Config (window.FOMAP): { base, kind, items:[{id,name,lat,lon,sub,group,tags,facts:[[label,value]],note,links:[[text,href]]}],
   groups:[{key,label,color}], groupLabel, searchLabel, noun }
   Works without tiles: the list and detail panel carry every fact; the map is an extra view. */
(function () {
  'use strict';
  var C = window.FOMAP; if (!C) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var fold = function (s) { return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var items = C.items, byId = {}; items.forEach(function (i) { byId[i.id] = i; });
  var colors = {}; (C.groups || []).forEach(function (g) { colors[g.key] = g.color; });
  var state = { q: '', group: 'all', sel: null };
  var map = null, markers = {}, tilesOk = true;

  var list = $('#fm-list'), count = $('#fm-count'), detail = $('#fm-detail'), q = $('#fm-q'), grp = $('#fm-group');

  function visible() {
    var t = fold(state.q).trim().split(/\s+/).filter(Boolean);
    return items.filter(function (i) {
      if (state.group !== 'all' && i.group !== state.group) return false;
      var hay = fold([i.name, i.sub, i.group, (i.tags || []).join(' '), i.note || ''].join(' '));
      return t.every(function (w) { return hay.indexOf(w) > -1; });
    });
  }

  function renderList() {
    var v = visible();
    count.textContent = v.length + ' of ' + items.length + ' ' + (C.noun || 'places');
    list.innerHTML = v.map(function (i) {
      return '<li><button type="button" class="fm-item" data-id="' + esc(i.id) + '" aria-pressed="' + (state.sel === i.id) + '">' +
        '<span class="fm-dot" style="--dot:' + esc(colors[i.group] || 'var(--action)') + '" aria-hidden="true"></span>' +
        '<span><b>' + esc(i.name) + '</b><small>' + esc(i.sub) + '</small></span></button></li>';
    }).join('') || '<li class="fm-none">Nothing matches. Clear a filter or search for a different word.</li>';
    if (map) syncMarkers(v);
  }

  function renderDetail() {
    var i = byId[state.sel];
    if (!i) { detail.innerHTML = '<p class="fm-hint">Pick a ' + esc(C.one || 'place') + ' from the list or the map to see its details.</p>'; return; }
    var facts = (i.facts || []).map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
    var links = (i.links || []).map(function (l) { return '<a class="glass' + (l[2] ? ' primary' : '') + '" href="' + esc(l[1]) + '"' + (/^https?:/.test(l[1]) ? ' rel="noopener" target="_blank"' : '') + '>' + esc(l[0]) + '</a>'; }).join('');
    detail.innerHTML = '<h3 id="fm-dh" tabindex="-1">' + esc(i.name) + '</h3><p class="fm-sub">' + esc(i.sub) + '</p>' +
      (i.note ? '<p>' + esc(i.note) + '</p>' : '') + (facts ? '<dl class="fm-facts">' + facts + '</dl>' : '') +
      (links ? '<div class="fm-links">' + links + '</div>' : '') + (i.extra || '');
  }

  function select(id, from) {
    state.sel = id; renderList(); renderDetail();
    var i = byId[id];
    if (map && i) { map.setView([i.lat, i.lon], Math.max(map.getZoom(), C.zoom || 6), { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches }); markStyles(); }
    if (from === 'map') { var h = $('#fm-dh'); if (h) h.focus({ preventScroll: false }); }
    if (from === 'list' && matchMedia('(max-width:900px)').matches) { var d = $('#fm-detail'); if (d) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  function markStyles() {
    Object.keys(markers).forEach(function (k) {
      var on = k === state.sel, g = byId[k].group;
      markers[k].setStyle({ radius: on ? 10 : 7, weight: on ? 3 : 1.5, color: '#fff', fillColor: colors[g] || '#1f6fb2', fillOpacity: .95 });
      if (on) markers[k].bringToFront();
    });
  }

  function syncMarkers(v) {
    var ids = {}; v.forEach(function (i) { ids[i.id] = 1; });
    Object.keys(markers).forEach(function (k) { if (ids[k]) { if (!map.hasLayer(markers[k])) markers[k].addTo(map); } else if (map.hasLayer(markers[k])) map.removeLayer(markers[k]); });
    markStyles();
  }

  function initMap() {
    var box = $('#fm-map');
    if (!window.L) { box.innerHTML = '<p class="fm-hint">The map could not load. The list shows every place with its details.</p>'; return; }
    map = L.map(box, { worldCopyJump: true, minZoom: 2, zoomControl: true, keyboard: true }).setView(C.center || [30, -20], C.zoom0 || 2);
    var tl = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    tl.on('tileerror', function () { if (tilesOk) { tilesOk = false; $('#fm-note').hidden = false; } });
    items.forEach(function (i) {
      var m = L.circleMarker([i.lat, i.lon], { radius: 7 }).addTo(map);
      m.on('click', function () { select(i.id, 'map'); });
      m.bindTooltip(i.name, { direction: 'top' });
      markers[i.id] = m;
    });
    markStyles();
    var b = L.latLngBounds(items.map(function (i) { return [i.lat, i.lon]; }));
    if (items.length && !C.center) map.fitBounds(b, { padding: [20, 20], maxZoom: 3 });
    setTimeout(function () { map.invalidateSize(); }, 200);
  }

  if (grp) {
    grp.innerHTML = '<option value="all">All ' + esc(C.groupLabel || 'groups') + '</option>' + (C.groups || []).map(function (g) { return '<option value="' + esc(g.key) + '">' + esc(g.label) + '</option>'; }).join('');
    grp.addEventListener('change', function () { state.group = grp.value; renderList(); });
  }
  q.addEventListener('input', function () { state.q = q.value; renderList(); });
  $('#fm-reset').addEventListener('click', function () { state.q = ''; state.group = 'all'; q.value = ''; if (grp) grp.value = 'all'; renderList(); });
  list.addEventListener('click', function (e) { var b = e.target.closest('.fm-item'); if (b) select(b.getAttribute('data-id'), 'list'); });
  var legend = $('#fm-legend');
  if (legend) legend.innerHTML = (C.groups || []).map(function (g) { return '<li><span class="fm-dot" style="--dot:' + esc(g.color) + '" aria-hidden="true"></span>' + esc(g.label) + '</li>'; }).join('');

  renderList(); renderDetail(); initMap();
  var hash = decodeURIComponent((location.hash || '').slice(1)); if (hash && byId[hash]) select(hash, 'list');
})();
