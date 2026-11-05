/* FiveOceans Savings Bridge calculator UI. Runs in the browser only. */
(function () {
  'use strict';
  var RE = window.RE, $ = function (id) { return document.getElementById(id); };
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var F = [
    ['start', 'Balance today', 0, '$', 'Money already saved for the bridge'],
    ['deposit', 'Monthly deposit', 600, '$', 'Added at the end of each month'],
    ['years', 'Years of saving', 10, '', 'Until you stop working'],
    ['ret', 'Return while saving', 3, '%', 'Per year, after inflation'],
    ['drawYears', 'Years to bridge', 18, '', 'From leaving work to the first pension'],
    ['drawRet', 'Return while drawing', 2, '%', 'Per year, after inflation'],
    ['gap', 'Monthly gap to fill', 1000, '$', 'Spending minus other income, in today\'s dollars'],
  ];
  var vals = {};
  function parse(t) { var n = parseFloat(String(t).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function f(v) { return (v < 0 ? '−' : '') + usd.format(Math.abs(v)); }
  function render() {
    var b = RE.bridge(vals), ok = b.shortfall <= 0, rows = [
      ['Balance when you stop saving', f(b.end), 'Includes growth of ' + f(b.growth)],
      ['Monthly draw it supports', f(b.draw), 'Draws at the start of each month over ' + vals.drawYears + ' years'],
      ['Balance needed for your gap', f(b.need), f(vals.gap) + ' a month for ' + vals.drawYears + ' years'],
      [ok ? 'Surplus' : 'Shortfall', f(Math.abs(b.shortfall)), ok ? 'You are on track at these assumptions' : 'The gap between what you will have and what you need'],
      ['Monthly deposit that would close it', f(b.depNeeded), 'Same years and return; leaving out any balance today is in the figure'],
    ];
    $('b-results').innerHTML = '<div class="hl"><span class="hl-k">Monthly draw it supports</span><strong class="hl-v">' + f(b.draw) + '</strong><span class="hl-n">' + (ok ? 'Covers your ' + f(vals.gap) + ' gap' : 'Short of your ' + f(vals.gap) + ' gap') + '</span></div><table class="rt"><caption class="sr">Results</caption><tbody>' +
      rows.map(function (r, i) { return '<tr' + (i === 0 || i === 3 ? ' class="strong"' : '') + '><th scope="row">' + r[0] + '<small>' + r[2] + '</small></th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<aside class="callout">Uses effective monthly rates in inflation-adjusted dollars. It stops at the first pension date. Model Social Security and later-life spending separately, and add health and tax assumptions to your gap.</aside>';
  }
  document.addEventListener('DOMContentLoaded', function () {
    var box = $('b-fields');
    F.forEach(function (d) {
      vals[d[0]] = d[2];
      var w = document.createElement('div'); w.className = 'fld';
      w.innerHTML = '<label for="b-' + d[0] + '">' + d[1] + '</label><div class="inp">' + (d[3] === '$' ? '<span class="af pre">$</span>' : '') + '<input id="b-' + d[0] + '" type="text" inputmode="decimal" autocomplete="off" value="' + d[2] + '" aria-describedby="b-' + d[0] + '-h">' + (d[3] === '%' ? '<span class="af suf">%</span>' : '') + '</div><small id="b-' + d[0] + '-h">' + d[4] + '</small>';
      box.appendChild(w);
      var i = w.querySelector('input'); i.addEventListener('input', function () { vals[d[0]] = parse(i.value); render(); });
    });
    $('b-reset').addEventListener('click', function () { F.forEach(function (d) { vals[d[0]] = d[2]; $('b-' + d[0]).value = d[2]; }); render(); });
    render();
  });
})();
