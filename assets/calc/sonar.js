/* Dolphin Sonar: turns a listing link plus listing text into calculator inputs and insights.
   It never fetches anything. It reads only what the user pastes or sends from their own open page.
   It deliberately skips personal data (agent names, phone numbers, emails). Original code. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SONAR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const title = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  const toNum = (s) => { const n = parseFloat(String(s).replace(/[$,\s]/g, '')); return Number.isFinite(n) ? n : 0; };
  const amount = (s, suffix) => { let n = toNum(s); const x = (suffix || '').toLowerCase(); if (x === 'm') n *= 1e6; else if (x === 'k') n *= 1e3; return n; };
  const perMonth = (v, unit) => { const u = (unit || '').toLowerCase(); if (/^y|^a/.test(u)) return v / 12; if (/^q/.test(u)) return v / 3; return v; };
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  function parseDate(s) {
    let m = String(s).match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) return new Date(Date.UTC(+m[3], MONTHS[m[1].toLowerCase()], +m[2]));
    m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]));
    return null;
  }
  const iso = (d) => d.toISOString().slice(0, 10);
  const usd0 = (n) => '$' + Math.round(n).toLocaleString('en-US');

  /* ---------- what Sonar can report, grouped ---------- */
  const GROUPS = ['Price and payment', 'Monthly costs', 'Property', 'Building and lot', 'Features', 'Market', 'Price history', 'Rental', 'Location', 'Risk', 'Listing'];
  // key: [label, group, kind]  kinds: money, pct, int, num, text, list, year
  const FIELDS = {
    status: ['Status', 'Price and payment', 'text'], price: ['Price', 'Price and payment', 'money'], estMonthly: ['Listing site payment estimate', 'Price and payment', 'money'],
    estValue: ['Site value estimate', 'Price and payment', 'money'], downPct: ['Down payment', 'Price and payment', 'pct'], downAmt: ['Down payment amount', 'Price and payment', 'money'], rate: ['Interest rate shown', 'Price and payment', 'pct'],
    term: ['Loan term (years)', 'Price and payment', 'int'], loanType: ['Loan type', 'Price and payment', 'text'], pricePerSqft: ['Price per square foot', 'Price and payment', 'money'],
    pi: ['Principal and interest', 'Monthly costs', 'money'], taxMo: ['Property tax per month', 'Monthly costs', 'money'], taxYr: ['Property tax per year', 'Monthly costs', 'money'],
    insMo: ['Home insurance per month', 'Monthly costs', 'money'], miMo: ['Mortgage insurance per month', 'Monthly costs', 'money'], hoaMo: ['HOA per month', 'Monthly costs', 'money'],
    commonMo: ['Common charges per month', 'Monthly costs', 'money'], maintMo: ['Co-op maintenance per month', 'Monthly costs', 'money'],
    flipTaxPct: ['Flip tax', 'Monthly costs', 'pct'], financingPct: ['Financing allowed', 'Monthly costs', 'pct'],
    type: ['Property type', 'Property', 'text'], style: ['Style', 'Property', 'text'], beds: ['Bedrooms', 'Property', 'num'], baths: ['Bathrooms', 'Property', 'num'],
    fullBaths: ['Full bathrooms', 'Property', 'int'], halfBaths: ['Half bathrooms', 'Property', 'int'], sqft: ['Square feet', 'Property', 'int'], year: ['Year built', 'Property', 'year'],
    yearRenovated: ['Year renovated', 'Property', 'year'], stories: ['Stories', 'Property', 'int'], units: ['Units', 'Property', 'int'], newConstruction: ['New construction', 'Property', 'text'],
    lotSqft: ['Lot size (sq ft)', 'Building and lot', 'int'], lotAcres: ['Lot size (acres)', 'Building and lot', 'num'], zoning: ['Zoning', 'Building and lot', 'text'],
    garage: ['Garage spaces', 'Building and lot', 'int'], parking: ['Parking spaces', 'Building and lot', 'int'], basement: ['Basement', 'Building and lot', 'text'],
    county: ['County', 'Building and lot', 'text'], apn: ['Parcel number (APN)', 'Building and lot', 'text'],
    features: ['Features', 'Features', 'list'], flags: ['Worth a closer look', 'Features', 'list'],
    dom: ['Days on market', 'Market', 'int'], domSite: ['Days on this site', 'Market', 'int'], avgDom: ['Average days to pending nearby', 'Market', 'int'], saleToList: ['Sale-to-list ratio', 'Market', 'pct'],
    offerAt: ['Offer the site calls strong', 'Market', 'money'], offerChance: ['Chance to win at that offer', 'Market', 'pct'], views: ['Views', 'Market', 'int'], saves: ['Saves or favorites', 'Market', 'int'],
    peakPrice: ['Highest recent list price', 'Price history', 'money'], peakDate: ['Date of that price', 'Price history', 'text'], reducedPct: ['Reduced from that peak', 'Price history', 'pct'],
    priceCuts: ['Price changes in the last year', 'Price history', 'int'], lastSoldPrice: ['Last sold price', 'Price history', 'money'], lastSoldDate: ['Last sold date', 'Price history', 'text'],
    rent: ['Rent estimate per month', 'Rental', 'money'], rentSource: ['Rent figure comes from', 'Rental', 'text'], pastRent: ['Past rental listing per month', 'Rental', 'money'], pastRentDate: ['Past rental listing date', 'Rental', 'text'],
    walk: ['Walkability', 'Location', 'text'], bike: ['Bikeability', 'Location', 'text'], transit: ['Transit', 'Location', 'text'], quiet: ['Quietness', 'Location', 'text'], calm: ['Calm', 'Location', 'text'],
    schools: ['Schools nearby', 'Location', 'list'],
    flood: ['Flood risk', 'Risk', 'text'], floodZone: ['Flood zone', 'Risk', 'text'], otherRisk: ['Other climate risks', 'Risk', 'text'], sun: ['Sun exposure', 'Risk', 'text'],
    mls: ['Listing source', 'Listing', 'text'], mlsNo: ['MLS number', 'Listing', 'text'], brokerage: ['Brokerage', 'Listing', 'text'], listingUpdated: ['Listing updated', 'Listing', 'text'],
  };
  const ZERO_OK = new Set(['hoaMo', 'miMo', 'commonMo']);
  const TYPE_LABEL = { house: 'Single-family', condo: 'Condo', coop: 'Co-op', multi: 'Multi-family', land: 'Land', townhouse: 'Townhouse' };

  /* ---------- the link ---------- */
  function parseUrl(raw) {
    const out = { site: '', address: '', city: '', state: '', zip: '', unit: '', listingId: '' };
    let u; try { u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return out; }
    const host = u.hostname.replace(/^www\./, '').toLowerCase(), parts = u.pathname.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    const clean = (s) => title(s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim());
    if (host.endsWith('redfin.com')) {
      out.site = 'Redfin';
      const st = parts.findIndex((p) => /^[A-Z]{2}$/.test(p));
      if (st >= 0 && parts[st + 2]) {
        out.state = parts[st]; out.city = clean(parts[st + 1]);
        const m = parts[st + 2].match(/^(.*?)-(\d{5})$/);
        out.address = m ? clean(m[1]) : clean(parts[st + 2]); if (m) out.zip = m[2];
        const un = parts.find((p) => /^unit-/i.test(p)); if (un) out.unit = un.replace(/^unit-/i, '').toUpperCase();
      }
      const id = parts[parts.length - 1]; if (/^\d{5,}$/.test(id)) out.listingId = id;
    } else if (host.endsWith('zillow.com')) {
      out.site = 'Zillow';
      const slug = parts.find((p, i) => parts[i - 1] === 'homedetails' || parts[i - 1] === 'b') || '';
      const m = slug.match(/^(.*)-([A-Z]{2})-(\d{5})$/i);
      if (m) { out.address = clean(m[1]); out.state = m[2].toUpperCase(); out.zip = m[3]; } else out.address = clean(slug);
      const z = parts.find((p) => /_zpid$/i.test(p)); if (z) out.listingId = z.replace(/_zpid$/i, '');
    } else if (host.endsWith('streeteasy.com')) {
      out.site = 'StreetEasy';
      const i = parts.indexOf('building');
      if (i >= 0 && parts[i + 1]) { out.address = clean(parts[i + 1]); if (parts[i + 2]) out.unit = parts[i + 2].toUpperCase(); }
      const j = parts.findIndex((p) => p === 'sale' || p === 'rental'); if (j >= 0 && /^\d+$/.test(parts[j + 1] || '')) out.listingId = parts[j + 1];
      out.state = 'NY';
    } else if (host.endsWith('realtor.com')) out.site = 'Realtor.com'; else if (host.endsWith('trulia.com')) out.site = 'Trulia'; else if (host.endsWith('homes.com')) out.site = 'Homes.com';
    return out;
  }

  /* ---------- structured data (schema.org JSON-LD) ---------- */
  function fromJsonLd(str) {
    const found = {}; if (!str) return found;
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(walk);
      const t = [].concat(o['@type'] || []).join(' ');
      if (o.offers) { const f = [].concat(o.offers)[0]; if (f && f.price && !found.price) found.price = toNum(f.price); }
      if (/Residence|House|Apartment|Accommodation|RealEstate|Product|Place/i.test(t) || o.numberOfBedrooms || o.address) {
        if (o.numberOfBedrooms && !found.beds) found.beds = toNum(o.numberOfBedrooms);
        const ba = o.numberOfBathroomsTotal || o.numberOfFullBathrooms; if (ba && !found.baths) found.baths = toNum(ba);
        if (o.floorSize && !found.sqft) found.sqft = toNum(o.floorSize.value || o.floorSize);
        if (o.yearBuilt && !found.year) found.year = toNum(o.yearBuilt);
        if (o.address && typeof o.address === 'object' && o.address.streetAddress && !found.address) found.address = String(o.address.streetAddress);
      }
      Object.keys(o).forEach((k) => { if (typeof o[k] === 'object') walk(o[k]); });
    };
    String(str).split('\n').forEach((chunk) => { try { walk(JSON.parse(chunk)); } catch (e) { /* not JSON on its own */ } });
    try { walk(JSON.parse(str)); } catch (e) { /* several blocks joined */ }
    return found;
  }

  /* ---------- picking the useful lines (shared idea with the bookmarklet) ---------- */
  const KEEP = /\$|\d|\bbd\b|\bbeds?\b|\bbaths?\b|\bba\b|sq\.?\s?ft|ft²|hoa|tax|maintenance|common charge|built|rent|zestimate|units?\b|\blot\b|co-?op|condo|duplex|triplex|multi|acre|garage|parking|basement|days on|market|sale-to-list|chance|walk|bike|quiet|calm|transit|flood|fire|heat|sun|county|apn|style|stories|source|mls|listing|updated|listed|removed|price|payment|principal|insurance|down|loan|fixed|property type|zoning|pets|doorman|elevator|school|fireplace|cathedral|hardwood|central air|finished|as-is|tlc|mother|in-law|accessory|separate entrance|beach|water|new construction/i;
  function selectLines(text, maxChars) {
    const lines = String(text || '').split('\n').map((x) => x.replace(/\s+/g, ' ').trim()), out = []; let n = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]; if (!l || l.length > 2000 || !KEEP.test(l)) continue;
      out.push(l); n += l.length + 1;
      const nx = lines[i + 1]; // a label line is followed by its value on the next line
      if (nx && nx.length < 70 && !/[0-9$]/.test(l) && /^[$0-9(\u2014\u2013-]/.test(nx)) { out.push(nx); n += nx.length + 1; i++; }
      if (n > (maxChars || 30000)) break;
    }
    return out.join('\n');
  }

  /* ---------- the text ---------- */
  const FEATURES = [['Finished basement', /finished basement/i], ['Central air', /central air|central a\/c|cooling:\s*central/i], ['Fireplace', /fireplace/i], ['Hardwood floors', /hardwood/i],
    ['Cathedral ceilings', /cathedral ceilings?/i], ['Washer/dryer hookup', /washer\/dryer hookup/i], ['Dishwasher', /dishwasher/i], ['Garage', /garage/i], ['Pool', /\bpool\b(?!\s*:?\s*none)/i],
    ['Outdoor kitchen', /outdoor kitchen/i], ['Waterfront', /waterfront|oceanfront|bayfront|on the water/i], ['Water view', /(?:water|ocean|bay) views?/i], ['Doorman', /doorman/i], ['Elevator', /elevator/i],
    ['Pets allowed', /pets?:?\s*(?:allowed|ok)|pet[- ]friendly/i], ['Gas heat', /natural gas heating|heating:\s*gas/i], ['Solar panels', /solar panels?/i], ['New roof', /new roof/i], ['Fenced yard', /fenced yard/i]];
  const FLAGS = [['Possible accessory unit (mother/daughter, in-law, separate entrance): confirm it is legal before counting rent', /mother[\/\- ]daughter|in-?law|accessory (?:apartment|dwelling|unit)|\badu\b|separate entrance|legal (?:two|2)[- ]family|basement apartment/i],
    ['Sold as-is or needs work: price the repairs', /\bas[- ]is\b|needs (?:tlc|work|updating|renovation)|\btlc\b|fixer|handyman|investor special|estate sale|contractor special/i],
    ['Quiet or dead-end street', /dead[- ]end|cul[- ]de[- ]sac/i], ['Near the beach or water', /\bbeach\b|waterfront|bayfront|oceanfront/i], ['New construction', /new construction|newly built/i],
    ['Foreclosure, short sale or auction', /foreclosure|short sale|auction|bank[- ]owned|reo\b/i]];

  function normType(s) {
    const x = String(s || '').toLowerCase();
    if (/co-?op|cooperative/.test(x)) return 'coop'; if (/condo/.test(x)) return 'condo'; if (/town\s?(?:house|home)/.test(x)) return 'townhouse';
    if (/multi|duplex|triplex|fourplex|two[- ]family|2[- ]family|apartment building/.test(x)) return 'multi'; if (/\bland\b|\blot\b|vacant/.test(x)) return 'land'; if (/single|house|home|residen/.test(x)) return 'house';
    return '';
  }

  function parseText(raw) {
    const t = String(raw || '').slice(0, 80000).replace(/ /g, ' ').replace(/[®™]/g, ''), flat = t.replace(/\s+/g, ' '), r = {};
    const m1 = (re, s) => { const m = (s == null ? flat : s).match(re); return m; };
    // status
    let m = m1(/\b(For sale|For rent|Pending|Contingent|Sold|Coming soon|Off market|Active)\b/i); if (m) r.status = title(m[1].toLowerCase());
    const isRental = /^for rent/i.test(r.status || '');
    // price: explicit label, then headline amount (not a monthly figure), then calculator
    const money = [...flat.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*([MmKk])?(?![\w]*\s*\/\s*mo)(?!\s*(?:per month|a month|\/month))/g)].map((x) => ({ v: amount(x[1], x[2]), i: x.index })).filter((x) => x.v >= 10000);
    m = m1(/(?:list(?:ed|ing)?\s*price|asking(?:\s*price)?|sale\s*price)\s*[:\-]?\s*\$\s?(\d[\d,.]*)\s*([MmKk])?\b/i) || m1(/\bprice\s*[:\-]\s*\$\s?(\d[\d,.]*)\s*([MmKk])?\b/i);
    let price = m ? amount(m[1], m[2]) : 0; if (price < 10000) price = 0;
    if (!price) { const head = money.find((x) => x.i < 700); price = head ? head.v : 0; }
    if (!price) { m = m1(/home price\s*\$\s?(\d[\d,.]*)\s*([MmKk])?/i); if (m) price = amount(m[1], m[2]); }
    if (price >= 10000) { if (isRental) r.rent = price; else r.price = price; }
    m = flat.match(/(?<!rent )(?:zestimate|redfin estimate|estimated value|estimated market value)[^$]{0,15}\$\s?([\d,]+)/i); if (m && toNum(m[1]) >= 10000) r.estValue = toNum(m[1]);
    // payment estimate headline and calculator block
    m = m1(/\bEst\.?\s*\$\s?([\d,]+)\s*\/\s*mo/i) || m1(/estimated monthly payment[^$]{0,20}\$\s?([\d,]+)/i) || m1(/\$\s?([\d,]+)\s*per month/i); if (m) r.estMonthly = toNum(m[1]);
    const bi = flat.search(/payment calculator|estimated monthly payment|monthly payment|estimated payment/i);
    if (bi >= 0) {
      const blk = flat.slice(bi, bi + 1600), g = (re) => { const x = blk.match(re); return x ? toNum(x[1]) : undefined; };
      let v;
      if ((v = g(/principal\s*(?:and|&)\s*interest\s*\$?\s*([\d,]+)/i)) !== undefined) r.pi = v;
      if ((v = g(/property\s*tax(?:es)?\s*\$?\s*([\d,]+)/i)) !== undefined && v > 0) r.taxMo = v;
      if ((v = g(/hoa(?:\s*(?:dues|fees?))?\s*\$?\s*([\d,]+)/i)) !== undefined) r.hoaMo = v;
      if ((v = g(/home\s*insurance\s*\$?\s*([\d,]+)/i)) !== undefined && v > 0) r.insMo = v;
      if ((v = g(/mortgage\s*insurance\s*\$?\s*([\d,]+)/i)) !== undefined) r.miMo = v;
      const d = blk.match(/down\s*payment\s*(\d+(?:\.\d+)?)\s*%\s*(?:\(\s*\$?\s*([\d,]+)\s*\))?/i); if (d) { r.downPct = +d[1]; if (d[2]) r.downAmt = toNum(d[2]); }
      const l = blk.match(/(\d+)\s*-?\s*(?:yr|year)s?\s*(fixed|adjustable|arm|fha|va)\b[^\d]{0,8}(\d+(?:\.\d+)?)\s*%/i); if (l) { r.term = +l[1]; r.loanType = title(l[2].toLowerCase()); r.rate = +l[3]; }
    }
    if (!r.rate) { const l = m1(/(\d+)\s*-?\s*(?:yr|year)s?\s*fixed[^\d]{0,8}(\d+\.\d+)\s*%/i); if (l) { r.term = +l[1]; r.rate = +l[2]; r.loanType = 'Fixed'; } }
    // property
    m = m1(/(\d+(?:\.\d)?)\s*(?:bd|beds?|bedrooms?)\b/i); if (m) r.beds = +m[1];
    m = m1(/(\d+(?:\.\d)?)\s*(?:ba|baths?|bathrooms?)\b/i); if (m) r.baths = +m[1];
    m = m1(/(\d+)\s*full\s*bath(?:room)?s?/i); if (m) r.fullBaths = +m[1];
    m = m1(/(\d+)\s*(?:half|1\/2)\s*bath(?:room)?s?/i); if (m) r.halfBaths = +m[1];
    m = m1(/([\d,]{3,6})\s*(?:sq\.?\s?ft\.?|sqft|square\s*feet|ft²)(?!\s*lot)/i); if (m) r.sqft = toNum(m[1]);
    m = m1(/(1[6-9]\d\d|20[0-3]\d)\s*Year Built/i) || m1(/(?:year\s*built|built\s*in)[\s:]*(1[6-9]\d\d|20[0-3]\d)/i) || m1(/\bbuilt[\s:]+(1[6-9]\d\d|20[0-3]\d)\b/i); if (m) r.year = +m[1];
    m = m1(/(?:year\s*renovated|renovated\s*in)[\s:]*(1[6-9]\d\d|20[0-3]\d)/i); if (m) r.yearRenovated = +m[1];
    m = m1(/stories[\s:]*(\d)\b/i) || m1(/\b(\d)\s*stor(?:y|ies)\b/i); if (m) r.stories = +m[1];
    m = m1(/\$\s?([\d,]+)\s*(?:\/\s*sq\.?\s?ft|price\s*\/\s*sq\.?\s?ft)/i) || m1(/price\s*(?:per|\/)\s*(?:sq\.?\s?ft|sqft|ft²)\.?[\s:]*\$\s?([\d,]+)/i); if (m) r.pricePerSqft = toNum(m[1]);
    m = m1(/([\d,]+)\s*sq\.?\s?ft\.?\s*Lot\s*Size/i) || m1(/lot\s*size[\s:]*([\d,]+)\s*sq/i); if (m) r.lotSqft = toNum(m[1]);
    m = m1(/lot[\s:]*([\d.]+)\s*acres?/i) || m1(/([\d.]+)\s*acres?\s*lot/i) || m1(/([\d.]+)\s*acres?\b/i); if (m && +m[1] > 0 && +m[1] < 5000) { r.lotAcres = +m[1]; if (!r.lotSqft) r.lotSqft = Math.round(+m[1] * 43560); }
    if (r.lotSqft && !r.lotAcres) r.lotAcres = Math.round((r.lotSqft / 43560) * 100) / 100;
    m = m1(/(\d+)\s*garage\s*spaces?/i) || m1(/(\d+)[- ]car\s*garage/i); if (m) r.garage = +m[1];
    m = m1(/parking(?:\s*spaces)?[\s:]*(\d+)\b/i); if (m) r.parking = +m[1];
    m = m1(/zoning[\s:]*([A-Z0-9][A-Z0-9\-\/]{0,11})\b/); if (m) r.zoning = m[1];
    if (/finished basement/i.test(flat)) r.basement = 'Finished'; else { m = m1(/basement[\s:]*(finished|unfinished|partially finished|partial|none)/i); if (m) r.basement = title(m[1].toLowerCase()); }
    m = t.match(/\bcounty\s*\n\s*([^\n]{3,40})/i) || flat.match(/\b([A-Z][a-z]+ County)\b/); if (m) r.county = m[1].trim();
    m = t.match(/\bAPN\s*\n?\s*:?\s*([0-9A-Z][0-9A-Z \-]{3,18}?)\s*(?:\n|$)/); if (m) r.apn = m[1].trim();
    m = t.match(/\bstyle\s*\n\s*([^\n]{3,40})/i); if (m) r.style = m[1].trim();
    // type
    m = flat.match(/([A-Za-z][A-Za-z\- ]{2,22}?)\s*Property Type/i) || flat.match(/\btype[\s:]*(SingleFamily|Single Family|Condo|Townhouse|MultiFamily|Multi Family|Apartment|Cooperative|Co-op|Manufactured|Lot|Land)\b/i);
    let type = m ? normType(m[1]) : '';
    m = m1(/(\d)\s*[- ]?\s*(?:units?|family)\b/i); if (m && +m[1] >= 2 && +m[1] <= 8) r.units = +m[1];
    if (/duplex/i.test(t)) r.units = r.units || 2; else if (/triplex/i.test(t)) r.units = r.units || 3; else if (/fourplex|quadplex/i.test(t)) r.units = r.units || 4;
    if (!type) {
      if (/\bco-?op\b|cooperative/i.test(t)) type = 'coop'; else if (/\bcondo(?:minium)?\b/i.test(t)) type = 'condo';
      else if (/vacant\s*land|lot\s*\/\s*land|land\s*for\s*sale|buildable\s*lot|\bacres?\b.*\b(?:lot|land)\b/i.test(t) && !r.beds) type = 'land';
      else if (r.units >= 2 || /multi-?family/i.test(t)) type = 'multi'; else if (/townhouse|townhome/i.test(t)) type = 'townhouse'; else if (r.beds || /single[- ]family|house/i.test(t)) type = 'house';
    }
    if (type) r.type = type; if (/new construction/i.test(t)) r.newConstruction = 'Yes';
    // monthly costs (labels, with the value on the same or next line)
    m = m1(/annual tax amount[\s:]*\$?\s*([\d,]+)/i); if (m) r.taxYr = toNum(m[1]);
    if (!r.taxYr && !r.taxMo) {
      m = m1(/(?:real\s*estate\s*|property\s*)?tax(?:es)?(?:\s*\(monthly\)|\s*monthly|\s*annual|\s*yearly)?[\s:]*\$\s?([\d,]+(?:\.\d+)?)(?:\s*(?:\/|per)?\s*(mo(?:nth)?|yr|year|annual))?/i);
      if (m && toNum(m[1]) > 0) { const v = toNum(m[1]); let unit = m[2]; if (!unit) { const line = m[0].toLowerCase(); unit = /monthly/.test(line) ? 'mo' : /annual|yearly/.test(line) ? 'yr' : (r.price && v / r.price * 100 < 0.5 ? 'mo' : 'yr'); } r.taxYr = Math.round(/^y|^a/i.test(unit) ? v : v * 12); }
    }
    if (r.hoaMo === undefined) { m = m1(/(?:hoa|association)(?:\s*(?:dues|fees?))?(?:\s*monthly)?[\s:]*\$\s?([\d,]+(?:\.\d+)?)(?:\s*(?:\/|per)?\s*(mo(?:nth)?|yr|year|annual(?:ly)?|quarter(?:ly)?))?/i); if (m) r.hoaMo = Math.round(perMonth(toNum(m[1]), m[2] || 'mo')); }
    m = m1(/common\s*charges?[\s:]*\$\s?([\d,]+)/i); if (m) r.commonMo = toNum(m[1]);
    m = m1(/(?:monthly\s*)?maintenance(?:\s*fee)?[\s:]*\$\s?([\d,]+)/i); if (m) r.maintMo = toNum(m[1]);
    m = m1(/flip\s*tax[^%\d$]{0,15}(\d+(?:\.\d+)?)\s*%/i); if (m) r.flipTaxPct = +m[1];
    m = m1(/financ(?:ing|e)\s*(?:allowed|permitted)?[\s:]*(\d{2,3})\s*%/i); if (m) r.financingPct = +m[1];
    // market
    m = m1(/days on market[\s:]*(\d+)/i) || m1(/(\d+)\s*days? on market/i) || m1(/days on (?:zillow|redfin|streeteasy|compass|realtor\.com)[\s:]*(\d+)/i); if (m) r.dom = +m[1];
    m = m1(/(\d+)\s*days? on (?:zillow|redfin|streeteasy|compass|realtor\.com)/i); if (m) r.domSite = +m[1];
    if (!r.dom && r.domSite) r.dom = r.domSite;
    m = m1(/average home goes pending in (\d+) days/i); if (m) r.avgDom = +m[1];
    m = m1(/sale-to-list[\s:]*(\d+(?:\.\d+)?)\s*%/i); if (m) r.saleToList = +m[1];
    m = m1(/\$\s?([\d,.]+)\s*([KkMm])?\s*and above\s*(\d+)\s*%\s*chance/i); if (m) { r.offerAt = amount(m[1], m[2]); r.offerChance = +m[3]; }
    m = m1(/(\d[\d,]*)\s*views?\b/i) || m1(/\bviews?[\s:]*(\d[\d,]*)/i); if (m) r.views = toNum(m[1]);
    m = m1(/\bsaves?[\s:]+(\d[\d,]*)/i) || m1(/(\d[\d,]*)\s*(?:favorites|saves)\b/i); if (m) r.saves = toNum(m[1]);
    // price and rental history
    const ev = [...flat.matchAll(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})\s+(Listed for Rent|Rental Removed|Listed for sale|Listing Removed|Price Changed|Price change|Listed|Sold|Delisted|Pending|Contingent|Relisted|Back on market)\s+(\$[\d,]+|—)/gi)]
      .map((x) => ({ date: parseDate(x[1]), event: x[2].toLowerCase(), price: x[3] === '—' ? 0 : toNum(x[3]) })).filter((x) => x.date);
    if (ev.length) {
      ev.sort((a, b) => b.date - a.date);
      const sale = ev.filter((e) => e.price && !/rent|removed|delisted/.test(e.event)), newest = sale[0] && sale[0].date;
      if (newest) {
        const yr = sale.filter((e) => newest - e.date <= 366 * 864e5 && !/sold/.test(e.event)); const pk = yr.reduce((a, b) => (b.price > a.price ? b : a), { price: 0 });
        const cur = r.price || (sale[0] && sale[0].price) || 0;
        if (pk.price && cur && pk.price > cur * 1.005) { r.peakPrice = pk.price; r.peakDate = iso(pk.date); r.reducedPct = Math.round(((pk.price - cur) / pk.price) * 1000) / 10; }
        r.priceCuts = yr.filter((e) => /price chang/.test(e.event)).length || undefined;
        const sold = ev.find((e) => /sold/.test(e.event) && e.price); if (sold) { r.lastSoldPrice = sold.price; r.lastSoldDate = iso(sold.date); }
      }
      const rents = ev.filter((e) => /listed for rent/.test(e.event) && e.price), ref = r.price || r.peakPrice || 0;
      const ok = rents.filter((e) => !ref || (e.price / ref >= 0.0025 && e.price / ref <= 0.016));
      if (ok[0]) { r.pastRent = ok[0].price; r.pastRentDate = iso(ok[0].date); }
    }
    m = flat.match(/(?:rent\s*zestimate|rental\s*estimate|estimated\s*rent|rent\s*estimate|market\s*rent)[^$]{0,25}\$\s?([\d,]+)/i); if (m) { r.rent = toNum(m[1]); r.rentSource = 'Listing site estimate'; }
    else if (r.rent && isRental) r.rentSource = 'Asking rent'; else if (r.pastRent) { r.rent = r.pastRent; r.rentSource = 'Past rental listing'; }
    // location
    const sc = [...t.matchAll(/(\d+(?:\.\d)?)\s*\/\s*10\s*\n?\s*([A-Za-z][A-Za-z '’-]{3,30})/g)];
    sc.forEach((x) => { const lab = x[2].trim(), val = `${x[1]}/10, ${lab.toLowerCase()}`; if (/bike/i.test(lab) && !r.bike) r.bike = val; else if (/quiet|noise/i.test(lab) && !r.quiet) r.quiet = val; else if (/calm/i.test(lab) && !r.calm) r.calm = val; else if (/transit/i.test(lab) && !r.transit) r.transit = val; else if (/walk|car/i.test(lab) && !r.walk) r.walk = val; });
    m = m1(/walk score[\s:]*(\d{1,3})\s*(?:\/\s*100)?/i); if (m) r.walk = `${m[1]}/100`;
    m = m1(/transit score[\s:]*(\d{1,3})\s*(?:\/\s*100)?/i); if (m) r.transit = `${m[1]}/100`;
    m = m1(/bike score[\s:]*(\d{1,3})\s*(?:\/\s*100)?/i); if (m) r.bike = `${m[1]}/100`;
    const sch = [...new Set([...t.matchAll(/([A-Z][A-Za-z.'’&-]+(?: [A-Z][A-Za-z.'’&-]+){0,3} (?:Elementary|Middle|High) School)/g)].map((x) => x[1]))].slice(0, 6); if (sch.length) r.schools = sch;
    // risk
    m = flat.match(/flood\s*(?:factor|risk)[^\d]{0,25}(\d+\s*\/\s*10)?[^.]{0,20}?(minimal|minor|moderate|major|severe|extreme)/i); if (m) r.flood = title(m[2].toLowerCase()) + (m[1] ? ` (${m[1].replace(/\s/g, '')})` : '');
    m = flat.match(/flood\s*zone[\s:]*([A-Z]{1,2}\d{0,2}[A-Z]?)\b/); if (m) r.floodZone = m[1];
    const oth = [...flat.matchAll(/\b(fire|heat|wind|air)\s*(?:factor|risk)[^\d]{0,25}(\d+\s*\/\s*10)?[^.]{0,20}?(minimal|minor|moderate|major|severe|extreme)/gi)].map((x) => `${title(x[1].toLowerCase())} ${x[3].toLowerCase()}`); if (oth.length) r.otherRisk = oth.join(', ');
    m = m1(/sun exposure[\s:]*(\d+)\s*\/\s*100/i); if (m) r.sun = `${m[1]}/100`;
    // listing source (company and MLS only; never agent names or contact details)
    m = flat.match(/Source:?\s*([^#]{3,60}?)\s*#\s*([A-Za-z0-9-]+)/i); if (m) { r.mls = m[1].replace(/\s+/g, ' ').trim(); r.mlsNo = m[2]; }
    m = flat.match(/(?:listing by|listed by|brokered by|courtesy of)[^•]{0,60}?•\s*([A-Z][A-Za-z0-9&.,' -]{2,60}?(?:LLC|Inc\.?|Corp\.?))(?![A-Za-z])/i)
      || flat.match(/(?:listing by|listed by|brokered by|courtesy of)[^•]{0,60}?•\s*([A-Z][A-Za-z0-9&.,' -]{2,60}?(?:Realty|Group|Brokerage|Properties|Real Estate|Associates))(?![A-Za-z])/i)
      || flat.match(/(?:listed by|brokered by|courtesy of)\s+([A-Z][A-Za-z0-9&.,' -]{2,50}?(?:LLC|Inc\.?|Corp\.?|Realty|Group|Brokerage|Properties|Real Estate|Associates)(?:\s(?:Group|Realty|LLC|Inc\.?|Corp\.?))?)(?![A-Za-z])/i);
    if (m) r.brokerage = m[1].replace(/\s+/g, ' ').trim();
    m = flat.match(/listing updated[\s:]*([A-Z][a-z]{2} \d{1,2}, \d{4})/i); if (m) r.listingUpdated = m[1];
    // features and flags
    const feats = FEATURES.filter(([, re]) => re.test(t)).map(([n]) => n); if (feats.length) r.features = feats;
    const flags = FLAGS.filter(([, re]) => re.test(t)).map(([n]) => n); if (flags.length) r.flags = flags;
    return r;
  }

  /* ---------- derived values and plain-English insights ---------- */
  function derive(f) {
    if (f.taxYr && !f.taxMo) f.taxMo = Math.round(f.taxYr / 12); if (f.taxMo && !f.taxYr) f.taxYr = f.taxMo * 12;
    if (!f.pricePerSqft && f.price && f.sqft) f.pricePerSqft = Math.round(f.price / f.sqft);
    return f;
  }
  function insights(f) {
    const out = [], add = (tone, text) => out.push({ tone, text });
    if (f.price && f.taxYr) add('info', `Property tax is about ${(Math.round((f.taxYr / f.price) * 1000) / 10)}% of the price a year (${usd0(f.taxMo)} a month).`);
    if (f.reducedPct) add('good', `The price is ${f.reducedPct}% below its recent high of ${usd0(f.peakPrice)} (${f.peakDate})${f.priceCuts ? `, after ${f.priceCuts} price change${f.priceCuts === 1 ? '' : 's'}` : ''}.`);
    if (f.dom && f.avgDom) add(f.dom > f.avgDom * 1.5 ? 'good' : 'info', `${f.dom} days on market, against about ${f.avgDom} days for nearby homes to go pending${f.dom > f.avgDom * 1.5 ? ': the seller may be flexible' : ''}.`);
    if (f.saleToList) add('info', `Nearby homes sell at about ${f.saleToList}% of the list price${f.saleToList >= 100 ? ': expect to pay close to or above asking' : ''}.`);
    if (f.offerAt) add('info', `The listing site calls ${usd0(f.offerAt)} or more a strong offer${f.offerChance ? ` (about ${f.offerChance}% chance to win)` : ''}. That is a prediction, not a rule.`);
    if (f.rent && f.price) { const gy = Math.round(((f.rent * 12) / f.price) * 1000) / 10; add('info', `${f.rentSource || 'Rent'} of ${usd0(f.rent)} a month is ${(Math.round((f.rent / f.price) * 10000) / 100)}% of the price a month, a gross yield near ${gy}% a year. Test it with the Investment property calculator.`); }
    if (f.estValue && f.price) { const d = Math.round(((f.price - f.estValue) / f.estValue) * 1000) / 10; add('info', `The listing site's value estimate is ${usd0(f.estValue)}, so the price is ${Math.abs(d)}% ${d >= 0 ? 'above' : 'below'} it. Estimates miss condition and upgrades.`); }
    if (f.estMonthly && f.pi !== undefined) add('info', `The listing site's ${usd0(f.estMonthly)} monthly estimate assumes ${f.downPct ? f.downPct + '% down' : 'a down payment'}${f.rate ? ` at ${f.rate}%` : ''}. Your lender's figures will differ.`);
    if (f.pricePerSqft && f.lotSqft) add('info', `${usd0(f.pricePerSqft)} per square foot on a ${Math.round(f.lotSqft).toLocaleString('en-US')} sq ft lot.`);
    if (f.flood && /major|severe|extreme/i.test(f.flood)) add('warn', `Flood risk is ${f.flood.toLowerCase()}. Get a flood-zone check and a flood insurance quote before you bid.`);
    else if (f.floodZone && /^[AV]/.test(f.floodZone)) add('warn', `The listing mentions flood zone ${f.floodZone}. Flood insurance is usually required with a mortgage there: get a quote.`);
    else if ((f.features || []).some((x) => /waterfront|water view/i.test(x)) || (f.flags || []).some((x) => /beach or water/i.test(x))) add('warn', 'This is near the water. Check the flood zone and price flood and wind insurance before you bid.');
    if (f.year && new Date().getFullYear() - f.year >= 50) add('info', `Built in ${f.year}: ask about the roof, heating, wiring and plumbing, and budget for upkeep.`);
    (f.flags || []).forEach((x) => { if (/accessory|as-is|foreclosure/i.test(x)) add('warn', x + '.'); });
    if (f.hoaMo === 0) add('good', 'No HOA dues are listed.');
    if (f.type === 'coop' && f.maintMo) add('info', 'Co-op maintenance usually covers building taxes, heat and the building loan. Ask what share is tax-deductible and how much the board allows to be financed.');
    return out;
  }

  /* ---------- put it together ---------- */
  function parseListing(o) {
    const link = parseUrl(o.url || ''), ld = fromJsonLd(o.jsonld), tx = parseText(o.text);
    const f = Object.assign({}, tx);
    Object.keys(ld).forEach((k) => { if (k !== 'address' && ld[k] && (!tx[k] || k === 'price')) f[k] = ld[k]; });
    if (ld.price && ld.price >= 10000) f.price = ld.price;
    derive(f);
    const address = link.address ? [link.address, link.unit ? 'Unit ' + link.unit : '', link.city, link.state, link.zip].filter(Boolean).join(', ') : (ld.address || '');
    const found = [];
    GROUPS.forEach((g) => Object.keys(FIELDS).forEach((k) => {
      const [label, grp, kind] = FIELDS[k]; if (grp !== g) return; const v = f[k];
      if (v === undefined || v === null || v === '' || (typeof v === 'number' && (!Number.isFinite(v) || (v === 0 && !ZERO_OK.has(k)))) || (Array.isArray(v) && !v.length)) return;
      found.push({ key: k, label, value: k === 'type' ? (TYPE_LABEL[v] || v) : Array.isArray(v) ? v.join(', ') : v, group: g, kind });
    }));
    return { site: link.site, address, listingId: link.listingId, type: f.type || '', facts: f, found, insights: insights(f), link };
  }

  /* ---------- map onto a calculator mode ---------- */
  function suggestMode(p) {
    const t = p.type, fl = (p.facts && p.facts.flags) || [];
    if (t === 'coop') return 'coop'; if (t === 'condo') return 'condo'; if (t === 'land') return 'land'; if (t === 'multi') return 'house-hacker';
    if (t === 'house' && fl.some((x) => /accessory/i.test(x))) return 'home-rental';
    return 'home';
  }
  function toValues(p, mode, fields) {
    const f = p.facts, v = {}, set = (k, x) => { if (x > 0 && fields.includes(k)) v[k] = Math.round(x * 100) / 100; };
    const dues = f.commonMo || f.hoaMo || 0;
    set('price', f.price);
    if (f.price && f.taxYr) set('taxPct', (f.taxYr / f.price) * 100);
    set('taxYr', f.taxYr); set('taxMo', f.taxMo);
    if (f.insMo) { set('insMo', f.insMo); set('insYr', f.insMo * 12); }
    if (f.downPct && f.downPct < 100 && fields.includes('downPct')) v.downPct = f.downPct;
    set('rate', f.rate); set('term', f.term);
    if (mode === 'condo') set('hoaMo', dues);
    else if (mode === 'coop') { set('maintMo', f.maintMo || dues); set('flipTaxPct', f.flipTaxPct); }
    else if (mode === 'investment') { set('rent', f.rent); set('utilMo', f.hoaMo || f.commonMo || 0); }
    else if (mode === 'home-rental') set('rent', f.rent);
    else if (mode === 'house-hacker') { const n = f.units || 2; set('unitsTotal', n); set('unitsRented', n - 1); if (f.rent) set('rent', f.units ? f.rent / n : f.rent); }
    else if (mode === 'land') { set('sqft', f.sqft); }
    else set('hoaMo', dues);
    return v;
  }
  function decodeHash(hash) {
    const m = String(hash || '').match(/^#?sonar=([A-Za-z0-9_\-]{1,300000})$/); if (!m) return null;
    try {
      const b = m[1].replace(/-/g, '+').replace(/_/g, '/'), pad = b + '==='.slice((b.length + 3) % 4);
      const bin = typeof atob === 'function' ? atob(pad) : Buffer.from(pad, 'base64').toString('binary');
      const json = decodeURIComponent(bin.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const d = JSON.parse(json); return { url: String(d.u || '').slice(0, 500), text: String(d.t || '').slice(0, 80000), jsonld: String(d.j || '').slice(0, 20000) };
    } catch (e) { return null; }
  }
  function bookmarkletSource(calcUrl) {
    const K = '/' + KEEP.source + '/i';
    return "javascript:(function(){var K=" + K + ";var A=(document.body.innerText||'').split('\\n').map(function(s){return s.replace(/\\s+/g,' ').trim()}),L=[],n=0;" +
      "for(var i=0;i<A.length;i++){var l=A[i];if(!l||l.length>2000||!K.test(l))continue;L.push(l);n+=l.length+1;var x=A[i+1];if(x&&x.length<70&&!/[0-9$]/.test(l)&&/^[$0-9(\\u2014\\u2013-]/.test(x)){L.push(x);n+=x.length+1;i++}if(n>30000)break}" +
      "var J=[].slice.call(document.querySelectorAll('script[type=\"application/ld+json\"]')).map(function(s){return s.textContent}).join('\\n').slice(0,6000);" +
      "var b=btoa(unescape(encodeURIComponent(JSON.stringify({u:location.href,t:L.join('\\n'),j:J})))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');" +
      "window.open(" + JSON.stringify(calcUrl) + "+'#sonar='+b,'_blank')})();";
  }
  return { parseUrl, fromJsonLd, parseText, parseListing, suggestMode, toValues, decodeHash, bookmarkletSource, selectLines, insights, FIELDS, GROUPS, KEEP, LABEL: Object.fromEntries(Object.entries(FIELDS).map(([k, v]) => [k, v[0]])) };
});
