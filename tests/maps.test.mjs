import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const cities = JSON.parse(fs.readFileSync(new URL('../data/maps/cities.json', import.meta.url), 'utf8'));

test('cities data carries source, license and attribution', () => {
  assert.match(cities.meta.license, /ODbL/);
  assert.match(cities.meta.source, /dr5hn/);
  assert.equal(cities.meta.count, cities.cities.length);
});

test('every city has valid coordinates and required fields', () => {
  const ids = new Set();
  for (const c of cities.cities) {
    assert.ok(c.name && c.country && c.water && c.kind && c.note, c.id);
    assert.ok(c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180, c.id);
    assert.ok(['Seawater', 'Freshwater'].includes(c.family), c.id);
    assert.ok(!ids.has(c.id), 'duplicate id ' + c.id); ids.add(c.id);
  }
});

test('freshwater cities are tagged Freshwater and ocean cities Seawater', () => {
  for (const c of cities.cities) assert.equal(c.family === 'Freshwater', c.ocean === 'Freshwater', c.id);
});

test('known anchor points are near the right place', () => {
  const g = id => cities.cities.find(c => c.id === id);
  const miami = g('miami-fl'); assert.ok(Math.abs(miami.lat - 25.77) < 0.2 && Math.abs(miami.lon + 80.19) < 0.2);
  const lb = g('long-beach-ny'); assert.ok(Math.abs(lb.lat - 40.59) < 0.2 && Math.abs(lb.lon + 73.66) < 0.2);
});

test('built site ships the map page, vendored Leaflet and data', { skip: !fs.existsSync(new URL('../site/maps/cities/index.html', import.meta.url)) }, () => {
  const html = fs.readFileSync(new URL('../site/maps/cities/index.html', import.meta.url), 'utf8');
  assert.match(html, /OpenStreetMap/);
  assert.ok(fs.existsSync(new URL('../site/assets/vendor/leaflet/leaflet.js', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../site/data/maps/cities.json', import.meta.url)));
});
