/* FiveOceans UI helpers: range sliders and scroll-edge affordances. No dependencies. */
(function () {
  'use strict';
  function slider(wrap, input, r) {
    var s = document.createElement('input');
    s.type = 'range'; s.className = 'rng'; s.min = r[0]; s.max = r[1]; s.step = r[2];
    var lab = wrap.querySelector('label');
    s.setAttribute('aria-label', ((lab && lab.textContent) || input.getAttribute('aria-label') || 'Value') + ' slider');
    function paint() { var v = Math.min(Math.max(parseFloat(s.value) || 0, r[0]), r[1]); s.style.setProperty('--fill', ((v - r[0]) / (r[1] - r[0])) * 100 + '%'); }
    function fromText() { var v = parseFloat(String(input.value).replace(/[^0-9.\-]/g, '')); if (isFinite(v)) s.value = Math.min(Math.max(v, r[0]), r[1]); paint(); }
    s.addEventListener('input', function () { input.value = s.value; paint(); input.dispatchEvent(new Event('input', { bubbles: true })); });
    input.addEventListener('input', fromText);
    fromText();
    var anchor = wrap.querySelector('.inp') || input; anchor.after(s);
    return s;
  }
  function edges(el) {
    function upd() { var l = el.scrollLeft > 4, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4; el.toggleAttribute('data-l', l); el.toggleAttribute('data-r', r); }
    el.classList.add('scrolls'); el.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
    upd(); var cur = el.querySelector('[aria-current],[aria-selected="true"],.on');
    if (cur && el.scrollWidth > el.clientWidth + 4) { var x = cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2; el.scrollLeft = Math.max(0, x); upd(); }
  }
  window.FOUI = { slider: slider, edges: edges };
})();
/* auto-attach sliders declared in markup: <div class="fld" data-range="min,max,step"> */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.fld[data-range]').forEach(function (w) { var r = w.dataset.range.split(',').map(Number), i = w.querySelector('input:not([type=range])'); if (i && window.FOUI) FOUI.slider(w, i, r); });
});
