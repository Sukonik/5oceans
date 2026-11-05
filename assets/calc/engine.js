/* FiveOceans Real Estate Calculator engine. Pure functions, no DOM, no network.
   Original code: standard finance formulas only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const num = (x) => (Number.isFinite(x) ? x : 0);
  const pmt = (P, rate, years) => {
    const r = rate / 1200, n = years * 12;
    if (!(P > 0) || !(n > 0)) return 0;
    return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
  };
  const balance = (P, rate, years, months) => {
    const r = rate / 1200, n = years * 12;
    if (!(P > 0) || !(n > 0)) return 0;
    if (months >= n) return 0;
    if (r === 0) return P - (P / n) * months;
    return P * Math.pow(1 + r, months) - pmt(P, rate, years) * ((Math.pow(1 + r, months) - 1) / r);
  };
  const F = {
    money: (id, label, def, hint) => ({ id, label, def, kind: 'money', hint }),
    pct: (id, label, def, hint) => ({ id, label, def, kind: 'pct', hint }),
    num: (id, label, def, hint, unit) => ({ id, label, def, kind: 'num', hint, unit }),
  };
  const R = (k, v, kind, note, strong) => ({ k, v, kind: kind || 'money', note: note || '', strong: !!strong });

  /* ---------- shared building blocks ---------- */
  function financing(v, priceKey) {
    const price = v[priceKey || 'price'];
    const down = price * (v.downPct / 100);
    const loan = Math.max(price - down, 0);
    const pi = v.piOverride > 0 ? v.piOverride : pmt(loan, v.rate, v.term);
    return { price, down, loan, pi };
  }
  function rentalCore(o) {
    // o: price, down, closing, capex, loan, pi, grossMo, otherMo, vacancy, mgmtPct, opexYr (excl mgmt), growth, rentGrowth, years, rate, term
    const gross = (o.grossMo + (o.otherMo || 0)) * 12;
    const vacLoss = gross * (o.vacancy / 100);
    const eff = gross - vacLoss;
    const mgmt = eff * ((o.mgmtPct || 0) / 100);
    const opex = o.opexYr + mgmt;
    const noi = eff - opex;
    const debt = o.pi * 12;
    const cf = noi - debt;
    const cash = o.down + o.closing + (o.capex || 0);
    const beo = gross > 0 ? ((opex + debt) / gross) * 100 : 0; // break-even occupancy %
    // multi-year projection
    let cumCf = 0, rent = gross, ex = o.opexYr, val = o.price;
    const yrs = Math.max(1, Math.round(o.years || 5));
    for (let y = 1; y <= yrs; y++) {
      const e = rent * (1 - o.vacancy / 100);
      const n = e - ex - e * ((o.mgmtPct || 0) / 100);
      cumCf += n - debt;
      rent *= 1 + (o.rentGrowth || 0) / 100;
      ex *= 1.03;
      val *= 1 + (o.growth || 0) / 100;
    }
    const bal = balance(o.loan, o.rate, o.term, yrs * 12);
    const paydown = o.loan - bal;
    const appreciation = val - o.price;
    const totalGain = cumCf + paydown + appreciation;
    return {
      gross, vacLoss, eff, mgmt, opex, noi, debt, cf, cash, beo, cumCf, paydown, appreciation, totalGain, yrs,
      cap: o.price > 0 ? (noi / o.price) * 100 : 0,
      coc: cash > 0 ? (cf / cash) * 100 : 0,
      dscr: debt > 0 ? noi / debt : 0,
      grm: gross > 0 ? o.price / gross : 0,
      onePct: o.price > 0 ? ((o.grossMo + (o.otherMo || 0)) / o.price) * 100 : 0,
      avgReturn: cash > 0 ? (totalGain / cash / yrs) * 100 : 0,
    };
  }
  const rentalRows = (c, price) => [
    R('Gross rent per year', c.gross, 'money'),
    R('Vacancy loss', -c.vacLoss, 'money'),
    R('Operating costs per year', -c.opex, 'money', 'Includes management'),
    R('Net operating income (NOI)', c.noi, 'money', '', true),
    R('Debt service per year', -c.debt, 'money'),
    R('Cash flow per month', c.cf / 12, 'money', 'After debt, before income tax', true),
    R('Cap rate', c.cap, 'pct', 'NOI divided by price'),
    R('Cash-on-cash return', c.coc, 'pct', 'Year-one cash flow divided by cash invested'),
    R('Debt service coverage (DSCR)', c.dscr, 'x', 'Lenders often want 1.20 or more'),
    R('Gross rent multiplier', c.grm, 'x', 'Price divided by yearly gross rent'),
    R('Monthly rent as % of price', c.onePct, 'pct', 'The "1% rule" is a rough screen, not a verdict'),
    R('Break-even occupancy', c.beo, 'pct', 'Share of gross rent needed to pay costs and debt'),
    R('Cash invested', c.cash, 'money', 'Down payment, closing and up-front work'),
    R(`Total gain after ${c.yrs} years`, c.totalGain, 'money', 'Cash flow + loan paydown + appreciation; before tax and selling costs'),
    R('Average yearly return on cash', c.avgReturn, 'pct'),
  ];

  /* ---------- modes ---------- */
  const MODES = {};
  const add = (m) => { MODES[m.id] = m; return m; };
  const loanFields = (price, down, rate, term) => [
    F.money('price', 'Purchase price', price), F.pct('downPct', 'Down payment', down, '% of price'),
    F.pct('rate', 'Interest rate', rate, 'Annual, from a lender quote'), F.num('term', 'Loan term', term, '', 'years'),
  ];

  add({
    id: 'home', group: 'Live in it', label: 'Home', blurb: 'A primary home: the full monthly cost, cash to close and how much income a lender expects.',
    fields: [...loanFields(450000, 20, 6.5, 30), F.pct('closingPct', 'Closing costs', 3, '% of price'),
      F.pct('taxPct', 'Property tax', 1.2, '% of price per year'), F.money('insYr', 'Home insurance', 1800, 'per year'),
      F.pct('maintPct', 'Maintenance', 1, '% of price per year'), F.money('hoaMo', 'HOA dues', 0, 'per month'),
      F.pct('growth', 'Appreciation', 3, 'per year'), F.num('years', 'Years you hold it', 5, '', 'years')],
    expFields: ['insYr', 'hoaMo'], rentFields: [],
    compute(v) {
      const f = financing(v), tax = (v.price * v.taxPct) / 1200, ins = v.insYr / 12, mt = (v.price * v.maintPct) / 1200;
      const pmi = v.downPct < 20 ? (f.loan * 0.005) / 12 : 0;
      const total = f.pi + tax + ins + mt + v.hoaMo + pmi;
      const yrs = Math.max(1, Math.round(v.years)), val = v.price * Math.pow(1 + v.growth / 100, yrs);
      const bal = balance(f.loan, v.rate, v.term, yrs * 12), eq = val - bal, net = eq - val * 0.06;
      return {
        headline: R('Total monthly cost', total, 'money'), key: total, keyLabel: 'Monthly cost', higherIsBetter: false,
        rows: [R('Loan amount', f.loan), R('Principal and interest', f.pi), R('Property tax', tax), R('Home insurance', ins),
          R('Maintenance reserve', mt, 'money', 'Budget, not a bill'), R('HOA dues', v.hoaMo),
          ...(pmi ? [R('Mortgage insurance (estimate)', pmi, 'money', 'Under 20% down; about 0.5% of the loan per year')] : []),
          R('Cash to close', f.down + (v.price * v.closingPct) / 100, 'money', 'Down payment plus closing costs', true),
          R('Income a lender expects', (total / 0.28) * 12, 'money', 'Per year, from the common 28% housing-cost guide'),
          R(`Equity after ${yrs} years`, eq, 'money', 'Value minus loan balance'),
          R('Equity after a 6% sale cost', net, 'money', 'What you could keep, before tax')],
        warn: pmi ? ['With less than 20% down, lenders usually require mortgage insurance.'] : [],
      };
    },
  });

  const rentalOwnerFields = [
    F.money('price', 'Purchase price', 415300), F.pct('downPct', 'Down payment', 20, '% of price'),
    F.pct('rate', 'Interest rate', 6.5), F.num('term', 'Loan term', 30, '', 'years'),
    F.money('piOverride', 'Fixed monthly P&I (optional)', 0, 'Leave 0 to compute from the loan'),
    F.money('taxMo', 'Property tax', 600, 'per month'), F.money('insMo', 'Home and landlord insurance', 180, 'per month'),
    F.money('floodMo', 'Flood insurance', 100, 'per month'), F.money('utilMo', 'Owner-paid utilities', 120, 'per month'),
    F.money('maintMo', 'Maintenance and reserve', 200, 'per month'),
    F.money('rent', 'Rent per rented unit', 2000, 'per month, full occupancy'), F.num('units', 'Units rented', 1, '', 'units'),
    F.pct('vacancy', 'Vacancy', 5), F.pct('mgmt', 'Management fee', 8, '% of rent collected'),
    F.money('ownerOnly', 'Owner-only home to compare', 2550, 'monthly cost'), F.money('extraCash', 'Extra cash vs that home', 60000, 'up front'),
    F.pct('badOcc', 'Bad-year occupancy', 75), F.money('badLoss', 'Bad-year uninsured loss', 6000, 'per year'),
  ];
  function ownerRental(v) {
    const f = financing(v);
    const carry = f.pi + v.taxMo + v.insMo + v.floodMo + v.utilMo + v.maintMo;
    const coll = v.rent * v.units * (1 - v.vacancy / 100), mg = coll * (v.mgmt / 100), net = coll - mg;
    const owner = carry - net;
    const bo = v.rent * v.units * (v.badOcc / 100), bnet = bo - bo * (v.mgmt / 100), bad = carry - bnet;
    const bestFull = v.rent * v.units;
    const need = (carry / ((1 - v.vacancy / 100) * (1 - v.mgmt / 100)));
    const save = v.ownerOnly - owner;
    return { f, carry, coll, mg, net, owner, bad, badYear: bad * 12 + v.badLoss, need, save, bestFull };
  }
  add({
    id: 'home-rental', group: 'Live in it', label: 'Home with a rental', blurb: 'Live in the home and rent a unit, ADU or basement. Shows what you still pay after rent, and a bad year.',
    fields: rentalOwnerFields, expFields: ['taxMo', 'insMo', 'floodMo', 'utilMo', 'maintMo'], rentFields: ['rent'], sens: true,
    example: { piOverride: 2100, price: 415300 },
    compute(v) {
      const o = ownerRental(v);
      return {
        headline: R('You still pay per month', o.owner, 'money'), key: o.owner, keyLabel: 'Owner monthly cost', higherIsBetter: false,
        rows: [R('Total carrying cost before rent', o.carry, 'money', '', true), R('Rent collected', o.coll, 'money', `After ${v.vacancy}% vacancy`),
          R('Management', -o.mg), R('Rent available toward costs', o.net, 'money', '', true), R('Share of carrying cost covered by rent', o.carry ? (o.net / o.carry) * 100 : 0, 'pct'),
          R('Savings vs the owner-only home', o.save, 'money', 'Per month, before income tax'),
          R('Months to recover the extra cash', o.save > 0 ? v.extraCash / o.save : 0, 'months', o.save > 0 ? 'Simple payback, excludes tax and resale' : 'No monthly saving, so no payback'),
          R('Gross rent needed to cover everything', o.need, 'money', 'Total scheduled rent per month'),
          R('Bad year: monthly cost at ' + v.badOcc + '% occupancy', o.bad, 'money'),
          R('Bad year: total outlay including the loss', o.badYear, 'money', 'Plus the uninsured loss; counts once')],
        warn: ['Principal paid is already in the payment. It is not extra spendable income.'],
      };
    },
  });

  add({
    id: 'condo', group: 'Live in it', label: 'Condo', blurb: 'Condo costs hinge on dues and assessments. Shows the all-in monthly figure and what share is dues.',
    fields: [...loanFields(380000, 20, 6.5, 30), F.pct('closingPct', 'Closing costs', 3), F.money('taxMo', 'Property tax', 450, 'per month'),
      F.money('hoaMo', 'HOA / common charges', 520, 'per month'), F.money('specialMo', 'Special assessment reserve', 100, 'per month'),
      F.money('ho6Yr', 'Condo (HO-6) insurance', 600, 'per year'), F.money('utilMo', 'Utilities', 150, 'per month'),
      F.pct('growth', 'Appreciation', 2, 'per year'), F.num('years', 'Years you hold it', 5, '', 'years')],
    expFields: ['hoaMo', 'specialMo', 'ho6Yr', 'utilMo'], rentFields: [],
    compute(v) {
      const f = financing(v), ins = v.ho6Yr / 12, total = f.pi + v.taxMo + v.hoaMo + v.specialMo + ins + v.utilMo;
      const yrs = Math.max(1, Math.round(v.years)), val = v.price * Math.pow(1 + v.growth / 100, yrs), eq = val - balance(f.loan, v.rate, v.term, yrs * 12);
      return {
        headline: R('Total monthly cost', total), key: total, keyLabel: 'Monthly cost', higherIsBetter: false,
        rows: [R('Principal and interest', f.pi), R('Property tax', v.taxMo), R('HOA / common charges', v.hoaMo), R('Special assessment reserve', v.specialMo),
          R('Condo insurance', ins), R('Utilities', v.utilMo), R('Dues as a share of the monthly cost', total ? ((v.hoaMo + v.specialMo) / total) * 100 : 0, 'pct'),
          R('Cash to close', f.down + (v.price * v.closingPct) / 100, 'money', '', true), R(`Equity after ${yrs} years`, eq)],
        warn: ['Ask for the condo budget, reserve study and any planned assessments. Some lenders limit loans in buildings with litigation or low reserves.'],
      };
    },
  });

  add({
    id: 'coop', group: 'Live in it', label: 'Co-op', blurb: 'A co-op is shares in a building. Monthly maintenance covers the building\'s taxes and often its mortgage; selling may trigger a flip tax.',
    fields: [F.money('price', 'Share purchase price', 360000), F.pct('downPct', 'Down payment', 25, 'Many co-ops want 20% to 50%'), F.pct('rate', 'Interest rate', 6.9),
      F.num('term', 'Loan term', 30, '', 'years'), F.pct('closingPct', 'Closing costs', 2.5), F.money('maintMo', 'Monthly maintenance', 1450, 'Often includes property tax and heat'),
      F.money('insYr', 'Contents / HO-6 insurance', 500, 'per year'), F.money('boardFee', 'Board application and move-in fees', 1500),
      F.pct('flipTaxPct', 'Flip tax on sale', 2, '% of sale price; varies by building'), F.money('salePrice', 'Expected sale price', 400000),
      F.num('years', 'Years you hold it', 7, '', 'years'), F.pct('sellCostPct', 'Selling costs', 3, '% of sale price')],
    expFields: ['maintMo', 'insYr'], rentFields: [],
    compute(v) {
      const f = financing(v), total = f.pi + v.maintMo + v.insYr / 12, yrs = Math.max(1, Math.round(v.years));
      const flip = v.salePrice * (v.flipTaxPct / 100), sell = v.salePrice * (v.sellCostPct / 100), bal = balance(f.loan, v.rate, v.term, yrs * 12);
      const proceeds = v.salePrice - flip - sell - bal;
      return {
        headline: R('Total monthly cost', total), key: total, keyLabel: 'Monthly cost', higherIsBetter: false,
        rows: [R('Principal and interest', f.pi), R('Monthly maintenance', v.maintMo), R('Insurance', v.insYr / 12),
          R('Cash to close', f.down + (v.price * v.closingPct) / 100 + v.boardFee, 'money', 'Down payment, closing costs and board fees', true),
          R('Flip tax at sale', flip), R('Selling costs', sell), R(`Loan balance after ${yrs} years`, bal),
          R('Estimated cash at sale', proceeds, 'money', 'Before income tax', true)],
        warn: ['A co-op owns shares, not real property. Boards can set rules on subletting, financing and who may buy.'],
      };
    },
  });

  add({
    id: 'house-hacker', group: 'Live in it', label: 'House hacker', blurb: 'Buy a 2 to 4 unit property, live in one unit and rent the rest. Shows your housing cost now and the numbers if you later move out.',
    fields: [F.money('price', 'Purchase price', 680000), F.pct('downPct', 'Down payment', 5, 'Some owner-occupied loans allow low down payments'),
      F.pct('rate', 'Interest rate', 6.5), F.num('term', 'Loan term', 30, '', 'years'), F.pct('closingPct', 'Closing costs', 3),
      F.num('unitsTotal', 'Units in the building', 3, '', 'units'), F.num('unitsRented', 'Units you rent out', 2, '', 'units'),
      F.money('rent', 'Rent per unit', 2200, 'per month'), F.money('miMo', 'Mortgage insurance', 200, 'per month'),
      F.money('taxMo', 'Property tax', 700, 'per month'), F.money('insMo', 'Insurance', 300, 'per month'), F.money('utilMo', 'Owner-paid utilities', 200, 'per month'),
      F.money('maintMo', 'Maintenance and reserve', 400, 'per month'), F.pct('vacancy', 'Vacancy', 5), F.pct('mgmt', 'Management', 0, 'Self-managed is 0%'),
      F.money('ownerOnly', 'Renting a comparable home instead', 2600, 'per month'), F.pct('growth', 'Appreciation', 3), F.pct('rentGrowth', 'Rent growth', 3)],
    expFields: ['taxMo', 'insMo', 'utilMo', 'maintMo', 'miMo'], rentFields: ['rent'], sens: true,
    compute(v) {
      const f = financing(v), carry = f.pi + v.miMo + v.taxMo + v.insMo + v.utilMo + v.maintMo;
      const coll = v.rent * v.unitsRented * (1 - v.vacancy / 100), net = coll * (1 - v.mgmt / 100), housing = carry - net;
      const cash = f.down + (v.price * v.closingPct) / 100;
      const all = rentalCore({ price: v.price, down: f.down, closing: (v.price * v.closingPct) / 100, loan: f.loan, pi: f.pi + v.miMo, grossMo: v.rent * v.unitsTotal,
        otherMo: 0, vacancy: v.vacancy, mgmtPct: v.mgmt, opexYr: (v.taxMo + v.insMo + v.utilMo + v.maintMo) * 12, growth: v.growth, rentGrowth: v.rentGrowth, years: 5, rate: v.rate, term: v.term });
      return {
        headline: R('Your housing cost per month', housing), key: housing, keyLabel: 'Your housing cost', higherIsBetter: false,
        rows: [R('Total carrying cost', carry), R('Rent collected from other units', net), R('Rent needed for "live free"', carry / ((1 - v.vacancy / 100) * (1 - v.mgmt / 100) * Math.max(v.unitsRented, 1)), 'money', 'Per rented unit'),
          R('Savings vs renting a comparable home', v.ownerOnly - housing, 'money', 'Per month'), R('Cash to close', cash, 'money', '', true),
          R('If you move out and rent every unit: cash flow per month', all.cf / 12, 'money', '', true), R('...cap rate', all.cap, 'pct'), R('...cash-on-cash return', all.coc, 'pct'),
          R('...DSCR', all.dscr, 'x')],
        warn: ['Owner-occupant loans usually require that you live in the property, often for a year. Confirm with a lender before planning to move out.'],
      };
    },
  });

  add({
    id: 'vacation', group: 'Second homes and land', label: 'Vacation home', blurb: 'A second home you use part of the year and may rent. Includes the IRS 14-day test and cost per personal day.',
    fields: [...loanFields(600000, 25, 7, 30), F.pct('closingPct', 'Closing costs', 3), F.money('taxMo', 'Property tax', 500, 'per month'),
      F.money('insMo', 'Insurance (incl. wind/flood)', 350, 'per month'), F.money('hoaMo', 'HOA dues', 200, 'per month'), F.money('utilMo', 'Utilities and internet', 250, 'per month'),
      F.money('maintMo', 'Maintenance and reserve', 300, 'per month'), F.num('personalDays', 'Personal-use days', 45, '', 'days per year'),
      F.num('rentedDays', 'Days rented at fair price', 100, '', 'days per year'), F.money('nightly', 'Average nightly rate', 320),
      F.pct('feePct', 'Platform, cleaning and management', 25, '% of rent'), F.pct('lodgingTax', 'Lodging tax collected and paid', 10, '% of rent; not income')],
    expFields: ['taxMo', 'insMo', 'hoaMo', 'utilMo', 'maintMo'], rentFields: ['nightly'],
    compute(v) {
      const f = financing(v), fixed = (f.pi + v.taxMo + v.insMo + v.hoaMo + v.utilMo + v.maintMo) * 12;
      const gross = v.rentedDays * v.nightly, fees = gross * (v.feePct / 100), net = gross - fees;
      const cost = fixed - net, perDay = v.personalDays > 0 ? cost / v.personalDays : 0;
      const limit = Math.max(14, 0.1 * v.rentedDays), residence = v.personalDays > limit, short = v.rentedDays < 15;
      const perNight = v.nightly * (1 - v.feePct / 100);
      const beNights = perNight > 0 ? fixed / perNight : 0;
      const warn = [];
      if (short && v.rentedDays > 0) warn.push('Rented fewer than 15 days: under IRS rules you generally report no rental income and deduct no rental expenses.');
      else if (residence) warn.push(`Personal use (${v.personalDays} days) is above the limit of ${Math.round(limit * 10) / 10} days (greater of 14 or 10% of rented days), so the home counts as a residence and rental deductions are limited.`);
      else warn.push('Personal use is within the limit, so the home is generally treated as a rental property for tax. Confirm with a tax professional.');
      warn.push('Check HOA, zoning, lodging registration and insurance rules before counting any rental income.');
      return {
        headline: R('Net cost per year', cost), key: cost / 12, keyLabel: 'Net monthly cost', higherIsBetter: false,
        rows: [R('Yearly cost to carry', fixed, 'money', 'Loan, tax, insurance, dues, utilities, upkeep'), R('Rental income', gross), R('Fees and management', -fees), R('Net rental income', net),
          R('Net cost per month', cost / 12), R('Net cost per personal day', perDay, 'money', 'What each day you use it really costs', true),
          R('Break-even rented nights', beNights, 'num', 'To cover the whole yearly cost from rent alone'), R('Personal-day limit for rental treatment', limit, 'num', 'Greater of 14 days or 10% of rented days'),
          R('Cash to close', f.down + (v.price * v.closingPct) / 100, 'money', '', true)],
        warn,
      };
    },
  });

  add({
    id: 'land', group: 'Second homes and land', label: 'Land and build', blurb: 'Buy a lot and build. Counts the months with no rent and the cost of delays.',
    fields: [F.money('price', 'Land price', 120000), F.pct('downPct', 'Land down payment', 30, 'Land loans often need more'), F.pct('rate', 'Land loan rate', 8),
      F.num('term', 'Land loan term', 15, '', 'years'), F.pct('closingPct', 'Closing costs', 3), F.money('taxYr', 'Property tax on the land', 1800, 'per year'),
      F.money('siteWork', 'Utilities, septic, driveway', 30000), F.money('buildCost', 'Construction cost', 350000), F.money('soft', 'Design, permits, inspections', 25000),
      F.pct('contingency', 'Contingency', 10, '% of construction'), F.pct('buildRate', 'Construction loan rate', 8.5), F.num('buildMonths', 'Build time', 10, '', 'months'),
      F.num('delayMonths', 'Delay', 3, '', 'extra months'), F.num('sqft', 'Home size', 2200, '', 'sq ft')],
    expFields: ['siteWork', 'buildCost', 'soft', 'taxYr'], rentFields: [],
    compute(v) {
      const f = financing(v), vacantMo = f.pi + v.taxYr / 12;
      const cont = v.buildCost * (v.contingency / 100), hard = v.siteWork + v.buildCost + cont + v.soft;
      const months = v.buildMonths + v.delayMonths;
      const interest = hard * 0.5 * (v.buildRate / 100) * (months / 12);
      const carryDuring = vacantMo * months;
      const all = v.price + (v.price * v.closingPct) / 100 + hard + interest + carryDuring;
      const delayCost = (vacantMo + (hard * 0.5 * (v.buildRate / 100)) / 12) * v.delayMonths;
      return {
        headline: R('All-in project cost', all), key: all, keyLabel: 'All-in cost', higherIsBetter: false,
        rows: [R('Land carrying cost while empty', vacantMo, 'money', 'Per month: loan plus tax'), R('Site work, build, permits and contingency', hard), R('Construction interest (estimate)', interest, 'money', 'Assumes about half drawn on average'),
          R(`Land carrying cost over ${months} months`, carryDuring), R('Cost of the delay alone', delayCost, 'money', `${v.delayMonths} extra months`, true),
          R('All-in cost per sq ft', v.sqft > 0 ? all / v.sqft : 0, 'money'), R('Cash needed for the land up front', f.down + (v.price * v.closingPct) / 100, 'money', '', true),
          R('Rent during design and build', 0, 'money', 'Zero until the home is ready')],
        warn: ['Confirm zoning, legal access, water and septic, flood zone and permits before buying. A short delay can cost thousands.'],
      };
    },
  });

  add({
    id: 'investment', group: 'Earn from it', label: 'Investment property', blurb: 'Buy and hold a rental. Cap rate, cash-on-cash, DSCR, break-even occupancy and a multi-year gain.',
    fields: [...loanFields(500000, 25, 7, 30), F.pct('closingPct', 'Closing costs', 3), F.money('rehab', 'Up-front repairs', 0),
      F.money('rent', 'Monthly rent (all units)', 3800), F.money('otherMo', 'Other income', 0, 'per month'), F.pct('vacancy', 'Vacancy', 6), F.pct('mgmt', 'Management', 8, '% of rent collected'),
      F.money('taxYr', 'Property tax', 6500, 'per year'), F.money('insYr', 'Landlord insurance', 2400, 'per year'), F.pct('repairsPct', 'Repairs', 6, '% of rent'),
      F.pct('capexPct', 'Capital reserve', 5, '% of rent'), F.money('utilMo', 'Owner-paid utilities and dues', 0, 'per month'),
      F.pct('growth', 'Appreciation', 3), F.pct('rentGrowth', 'Rent growth', 3), F.num('years', 'Years you hold it', 5, '', 'years')],
    expFields: ['taxYr', 'insYr', 'utilMo'], rentFields: ['rent'], sens: true,
    compute(v) {
      const f = financing(v), g = (v.rent + v.otherMo) * 12;
      const opex = v.taxYr + v.insYr + g * (v.repairsPct / 100) + g * (v.capexPct / 100) + v.utilMo * 12;
      const c = rentalCore({ price: v.price, down: f.down, closing: (v.price * v.closingPct) / 100, capex: v.rehab, loan: f.loan, pi: f.pi, grossMo: v.rent, otherMo: v.otherMo,
        vacancy: v.vacancy, mgmtPct: v.mgmt, opexYr: opex, growth: v.growth, rentGrowth: v.rentGrowth, years: v.years, rate: v.rate, term: v.term });
      const warn = [];
      if (c.dscr && c.dscr < 1.2) warn.push('DSCR is under 1.20. Many lenders would want more cushion.');
      if (c.cf < 0) warn.push('Negative cash flow: you would pay in every month before tax.');
      warn.push('Rental income is taxable; depreciation can reduce taxable income. See the Investment property resource page.');
      return { headline: R('Cash flow per month', c.cf / 12), key: c.cf / 12, keyLabel: 'Monthly cash flow', higherIsBetter: true, rows: rentalRows(c, v.price), warn };
    },
  });

  add({
    id: 'pure-rental', group: 'Earn from it', label: 'Pure rental income', blurb: 'Rentals as retirement income. How many units reach your monthly target, and how fragile it is.',
    fields: [F.num('units', 'Units owned', 4, '', 'units'), F.money('rent', 'Average rent per unit', 1800, 'per month'), F.pct('vacancy', 'Vacancy', 6),
      F.pct('mgmt', 'Management', 8), F.money('opexUnit', 'Taxes, insurance and repairs per unit', 350, 'per month'), F.money('debtMo', 'Total loan payments', 2200, 'per month'),
      F.money('target', 'Monthly income target', 5000), F.pct('taxRate', 'Your tax rate on rental income', 22, 'Rough marginal rate')],
    expFields: ['opexUnit'], rentFields: ['rent'], sens: true,
    compute(v) {
      const gross = v.units * v.rent, eff = gross * (1 - v.vacancy / 100), mg = eff * (v.mgmt / 100), ox = v.units * v.opexUnit;
      const noi = eff - mg - ox, cf = noi - v.debtMo, after = cf * (1 - v.taxRate / 100);
      const perUnit = (v.rent * (1 - v.vacancy / 100) * (1 - v.mgmt / 100) - v.opexUnit);
      const need = perUnit > 0 ? Math.ceil((v.target + v.debtMo) / perUnit) : 0;
      const stressVac = Math.min(v.vacancy + 10, 100), eff2 = gross * (1 - stressVac / 100), cf2 = eff2 - eff2 * (v.mgmt / 100) - ox - v.debtMo;
      return {
        headline: R('Cash flow per month', cf), key: cf, keyLabel: 'Monthly cash flow', higherIsBetter: true,
        rows: [R('Gross rent', gross), R('Collected after vacancy', eff), R('Management', -mg), R('Taxes, insurance and repairs', -ox), R('Net operating income', noi, 'money', 'Per month', true),
          R('Loan payments', -v.debtMo), R('Cash flow before tax', cf, 'money', '', true), R('Rough cash flow after tax', after, 'money', 'Ignores depreciation, which can lower tax'),
          R('Share of your target', v.target > 0 ? (cf / v.target) * 100 : 0, 'pct'), R('Units needed to reach the target', need, 'num', 'At the same loan payments'),
          R(`Cash flow if vacancy hits ${stressVac}%`, cf2, 'money', 'A stress check')],
        warn: cf < 0 ? ['Rents do not cover costs and loan payments at these assumptions.'] : [],
      };
    },
  });

  add({
    id: 'flipper', group: 'Earn from it', label: 'House flipper', blurb: 'Buy, renovate and sell. Profit, return on cash, the 70% rule and what a lower sale price does.',
    fields: [F.money('price', 'Purchase price', 280000), F.money('rehab', 'Renovation budget', 60000), F.pct('contingency', 'Renovation contingency', 10), F.money('arv', 'Expected sale price (ARV)', 430000),
      F.num('months', 'Months to buy, fix and sell', 6, '', 'months'), F.pct('ltv', 'Loan on the purchase price', 85, '% of price'), F.pct('rehabFin', 'Share of renovation financed', 100, '%'),
      F.pct('rate', 'Loan rate', 11), F.pct('points', 'Loan points', 2, '% of loan'), F.pct('buyCosts', 'Buying costs', 2), F.pct('sellCosts', 'Selling costs', 7, 'agent, closing and transfer'),
      F.money('holdMo', 'Taxes, insurance and utilities', 1500, 'per month')],
    expFields: ['rehab', 'holdMo'], rentFields: ['arv'],
    stressOverrides: true,
    compute(v) {
      const rehab = v.rehab * (1 + v.contingency / 100), loan = v.price * (v.ltv / 100) + rehab * (v.rehabFin / 100);
      const interest = loan * (v.rate / 100) * (v.months / 12), points = loan * (v.points / 100), buy = v.price * (v.buyCosts / 100);
      const hold = v.holdMo * v.months, sell = v.arv * (v.sellCosts / 100);
      const totalCost = v.price + rehab + interest + points + buy + hold + sell, profit = v.arv - totalCost;
      const cash = v.price + rehab + buy + hold + interest + points - loan;
      const roi = cash > 0 ? (profit / cash) * 100 : 0, ann = v.months > 0 ? roi * (12 / v.months) : 0;
      const maxOffer = v.arv * 0.7 - rehab, lower = v.arv * 0.9;
      const profitLow = lower - (totalCost - sell + lower * (v.sellCosts / 100));
      const be = (totalCost - sell) / (1 - v.sellCosts / 100);
      return {
        headline: R('Profit', profit), key: profit, keyLabel: 'Profit', higherIsBetter: true,
        rows: [R('Renovation with contingency', rehab), R('Loan amount', loan), R('Interest', interest), R('Points', points), R('Holding costs', hold), R('Buying and selling costs', buy + sell),
          R('Total cost', totalCost, 'money', '', true), R('Cash you put in', cash, 'money', 'After the loan'), R('Return on cash', roi, 'pct'), R('Annualized return', ann, 'pct', 'Simple, not compounded'),
          R('70% rule: highest purchase price', maxOffer, 'money', 'ARV x 70% minus renovation', true), R('Break-even sale price', be, 'money'), R('Profit if it sells for 10% less', profitLow)],
        warn: [profit < 0 ? 'At these numbers the flip loses money.' : 'Renovations run over and homes sit. Test a longer hold and a lower sale price before you buy.', 'Flip profit is generally taxed as ordinary income, not capital gain.'],
      };
    },
  });

  add({
    id: 'renter', group: 'Renter', label: 'Renter + business + investments', blurb: 'You rent and invest. Compares your net worth with buying a home and investing the rest, over time.',
    fields: [F.money('rent', 'Your monthly rent', 2800), F.pct('rentGrowth', 'Rent growth', 3), F.money('rentersIns', "Renter's insurance", 25, 'per month'), F.money('saved', 'Cash you would have used to buy', 100000),
      F.pct('invest', 'Investment return', 6, 'per year, after fees'), F.money('bizMo', 'Business or side income you invest', 0, 'per month, same in both cases'),
      F.money('price', 'Home you would buy', 500000), F.pct('downPct', 'Down payment', 20), F.pct('rate', 'Mortgage rate', 6.5), F.num('term', 'Loan term', 30, '', 'years'),
      F.pct('ownCostPct', 'Tax, insurance and upkeep', 2.2, '% of home value per year'), F.pct('growth', 'Home appreciation', 3), F.pct('sellPct', 'Selling costs', 6), F.num('years', 'Compare after', 10, '', 'years')],
    expFields: ['rent', 'rentersIns'], rentFields: [],
    compute(v) {
      const yrs = Math.max(1, Math.round(v.years)), f = financing(v), down = f.down, close = v.price * 0.03;
      let renterPort = Math.max(v.saved, 0), buyPort = Math.max(v.saved - down - close, 0), rent = v.rent, val = v.price, ownCost = v.price * (v.ownCostPct / 100) / 12;
      const rm = Math.pow(1 + v.invest / 100, 1 / 12) - 1;
      let breakYear = 0, y1Rent = rent + v.rentersIns, y1Own = f.pi + ownCost;
      for (let y = 1; y <= yrs; y++) {
        for (let m = 0; m < 12; m++) {
          const renterOut = rent + v.rentersIns, buyerOut = f.pi + ownCost;
          renterPort = renterPort * (1 + rm) + v.bizMo + Math.max(buyerOut - renterOut, 0);
          buyPort = buyPort * (1 + rm) + v.bizMo + Math.max(renterOut - buyerOut, 0);
        }
        rent *= 1 + v.rentGrowth / 100; val *= 1 + v.growth / 100; ownCost *= 1 + v.growth / 100;
        const eq = val - balance(f.loan, v.rate, v.term, y * 12) - val * (v.sellPct / 100);
        if (!breakYear && eq + buyPort >= renterPort) breakYear = y;
      }
      const eqEnd = val - balance(f.loan, v.rate, v.term, yrs * 12) - val * (v.sellPct / 100), buyer = eqEnd + buyPort;
      return {
        headline: R(`Renting ahead by (after ${yrs} years)`, renterPort - buyer, 'money', renterPort >= buyer ? 'Renting and investing comes out ahead' : 'Buying comes out ahead'),
        key: renterPort - buyer, keyLabel: 'Renter minus buyer', higherIsBetter: true,
        rows: [R('Renter net worth', renterPort, 'money', 'Investments only', true), R('Buyer net worth', buyer, 'money', 'Home equity after selling costs, plus investments', true),
          R('Buyer: home equity', eqEnd), R('Buyer: leftover investments', buyPort), R('Year-one monthly cost: renting', y1Rent), R('Year-one monthly cost: buying', y1Own),
          R('First year buying pulls ahead', breakYear, 'num', breakYear ? 'Year number' : 'Not within this period')],
        warn: ['Both sides invest whatever the cheaper option saves. Results depend heavily on the return and appreciation you assume.'],
      };
    },
  });

  /* income houses: shared core */
  function incomeHouse(v, grossMo, opts) {
    const f = financing(v), g = grossMo * 12;
    const opex = v.taxPct / 100 * v.price + v.insYr + v.maintPct / 100 * v.price + (v.utilMo + v.staffMo + (v.otherMo || 0)) * 12;
    const c = rentalCore({ price: v.price, down: f.down, closing: (v.price * v.closingPct) / 100, capex: v.capex, loan: f.loan, pi: f.pi, grossMo, otherMo: 0, vacancy: v.vacancy, mgmtPct: 0,
      opexYr: opex, growth: v.growth, rentGrowth: 2, years: 5, rate: v.rate, term: v.term });
    const unitBe = opts.rooms > 0 ? ((c.opex + c.debt) / 12) / (opts.rooms * (1 - v.vacancy / 100)) : 0;
    const rows = [R('Gross income per month', grossMo, 'money', opts.grossNote), ...rentalRows(c, v.price).slice(1)];
    rows.splice(1, 0, R('Break-even rent per bedroom', unitBe, 'money', 'If rooms alone had to cover every cost and the loan'));
    return { c, rows };
  }
  const mansionBase = (price, tax) => [F.money('price', 'Purchase price', price), F.pct('downPct', 'Down payment', 30, 'Commercial and large loans often need more'),
    F.pct('rate', 'Interest rate', 7.5), F.num('term', 'Loan term', 25, '', 'years'), F.pct('closingPct', 'Closing costs', 3)];
  const mansionCosts = (ins, staff, util, cap) => [F.pct('taxPct', 'Property tax', 1.3, '% of price per year'), F.money('insYr', 'Insurance (liability heavy)', ins, 'per year'),
    F.pct('maintPct', 'Maintenance', 1.5, '% of price per year'), F.money('utilMo', 'Utilities and internet', util, 'per month'), F.money('staffMo', 'Staff, cleaning and security', staff, 'per month'),
    F.money('otherMo', 'Other monthly costs', 0), F.money('capex', 'Fit-out and equipment up front', cap), F.pct('vacancy', 'Vacancy and gaps', 12), F.pct('growth', 'Appreciation', 2)];
  const mansionWarn = ['Confirm zoning, certificate of occupancy, fire and life-safety rules and short-term rental licensing. Rooms rented to unrelated tenants or the public can change both the permitted use and the insurance.'];

  add({
    id: 'influencer-house', group: 'Income houses', label: 'Influencer house (commercial mansion)', blurb: 'A large home that earns from creator rooms, content-studio rentals and brand events.',
    fields: [...mansionBase(3200000), F.num('rooms', 'Creator bedrooms', 6, '', 'rooms'), F.money('roomRate', 'Rent per bedroom', 2500, 'per month'), F.num('studioHrs', 'Studio hours rented', 80, '', 'hours per month'),
      F.money('studioRate', 'Studio rate', 150, 'per hour'), F.num('events', 'Brand events or shoots', 2, '', 'per month'), F.money('eventRate', 'Fee per event', 4000),
      F.money('sponsorMo', 'Sponsorship income you count', 0, 'per month; treat as unproven'), ...mansionCosts(24000, 6000, 3500, 80000)],
    expFields: ['insYr', 'staffMo', 'utilMo'], rentFields: ['roomRate', 'studioRate', 'eventRate'], sens: true,
    compute(v) {
      const gross = v.rooms * v.roomRate + v.studioHrs * v.studioRate + v.events * v.eventRate + v.sponsorMo;
      const { c, rows } = incomeHouse(v, gross, { rooms: v.rooms, grossNote: 'Rooms + studio + events + sponsorship' });
      return { headline: R('Cash flow per month', c.cf / 12), key: c.cf / 12, keyLabel: 'Monthly cash flow', higherIsBetter: true, rows,
        warn: [...mansionWarn, 'Sponsorship and event income is the least predictable line. Run the numbers with it at zero.'] };
    },
  });
  add({
    id: 'hacker-house', group: 'Income houses', label: 'Hacker house (tech house, GitHub edition)', blurb: 'A shared house for builders: bedrooms, coworking passes and hackathons, with fast internet and shared costs.',
    fields: [...mansionBase(1250000), F.num('rooms', 'Bedrooms', 8, '', 'rooms'), F.money('roomRate', 'Rent per bedroom', 1400, 'per month'), F.num('passes', 'Coworking day passes', 40, '', 'per month'),
      F.money('passRate', 'Price per day pass', 25), F.num('hackathons', 'Hackathons or demo nights', 1, '', 'per month'), F.money('hackRate', 'Fee per event', 1500),
      ...mansionCosts(7000, 900, 1800, 25000)],
    expFields: ['insYr', 'staffMo', 'utilMo'], rentFields: ['roomRate', 'passRate', 'hackRate'], sens: true,
    compute(v) {
      const gross = v.rooms * v.roomRate + v.passes * v.passRate + v.hackathons * v.hackRate;
      const { c, rows } = incomeHouse(v, gross, { rooms: v.rooms, grossNote: 'Rooms + day passes + events' });
      return { headline: R('Cash flow per month', c.cf / 12), key: c.cf / 12, keyLabel: 'Monthly cash flow', higherIsBetter: true, rows,
        warn: [...mansionWarn, 'Fast, redundant internet, power and shared-space rules are costs too. Turnover between residents is the usual leak.'] };
    },
  });
  add({
    id: 'music-mansion', group: 'Income houses', label: 'Music producer mansion with rentals', blurb: 'A mansion with recording rooms rented by the hour, residency bedrooms and shoot or event bookings.',
    fields: [...mansionBase(2400000), F.num('studios', 'Studio rooms', 3, '', 'rooms'), F.num('hoursEach', 'Hours booked per studio', 90, '', 'per month'), F.money('hourly', 'Studio rate', 85, 'per hour'),
      F.num('rooms', 'Residency bedrooms', 5, '', 'rooms'), F.money('roomRate', 'Rent per bedroom', 2200, 'per month'), F.num('events', 'Shoots and events', 3, '', 'per month'), F.money('eventRate', 'Fee per booking', 2500),
      ...mansionCosts(18000, 4000, 2800, 120000)],
    expFields: ['insYr', 'staffMo', 'utilMo', 'capex'], rentFields: ['hourly', 'roomRate', 'eventRate'], sens: true,
    compute(v) {
      const gross = v.studios * v.hoursEach * v.hourly + v.rooms * v.roomRate + v.events * v.eventRate;
      const { c, rows } = incomeHouse(v, gross, { rooms: v.rooms, grossNote: 'Studio hours + bedrooms + bookings' });
      return { headline: R('Cash flow per month', c.cf / 12), key: c.cf / 12, keyLabel: 'Monthly cash flow', higherIsBetter: true, rows,
        warn: [...mansionWarn, 'Soundproofing, noise ordinances and neighbors decide whether hourly studio use is allowed at all.'] };
    },
  });

  /* ---------- helpers for UI/tests ---------- */
  const defaults = (mode) => Object.fromEntries(mode.fields.map((f) => [f.id, f.def]));
  const run = (id, values) => { const m = MODES[id]; return m.compute({ ...defaults(m), ...(values || {}) }); };
  function stressTests(id, values) {
    const m = MODES[id], v = { ...defaults(m), ...values }, base = m.compute(v).key, out = [];
    const has = (k) => m.fields.some((f) => f.id === k);
    const mul = (keys, p) => { const w = { ...v }; keys.forEach((k) => { w[k] = v[k] * p; }); return w; };
    if (m.rentFields && m.rentFields.length) out.push({ label: 'Income down 10%', v: mul(m.rentFields, 0.9) });
    if (has('vacancy')) out.push({ label: 'Vacancy up 10 points', v: { ...v, vacancy: Math.min(v.vacancy + 10, 100) } });
    if (has('rate')) out.push({ label: 'Interest rate up 1 point', v: { ...v, rate: v.rate + 1 } });
    if (m.expFields && m.expFields.length) out.push({ label: 'Costs up 10%', v: mul(m.expFields, 1.1) });
    return out.map((s) => { const k = m.compute(s.v).key; return { label: s.label, value: k, delta: k - base }; });
  }
  function sensitivity(id, values) {
    const m = MODES[id], v = { ...defaults(m), ...values };
    if (!m.sens || !m.fields.some((f) => f.id === 'vacancy') || !m.fields.some((f) => f.id === 'rate')) return null;
    const vac = [v.vacancy, Math.min(v.vacancy + 10, 100), Math.min(v.vacancy + 20, 100)], rates = [Math.max(v.rate - 1, 0), v.rate, v.rate + 1];
    return { vac, rates, grid: vac.map((vc) => rates.map((r) => m.compute({ ...v, vacancy: vc, rate: r }).key)) };
  }
  /* savings bridge: deposits at month end, draws at month start, effective monthly rates, real (inflation-adjusted) dollars */
  function bridge(v) {
    const eff = (a) => Math.pow(1 + a / 100, 1 / 12) - 1, r = eff(v.ret), n = Math.round(v.years * 12);
    const fvAnn = (d) => (r === 0 ? d * n : d * ((Math.pow(1 + r, n) - 1) / r));
    const end = v.start * Math.pow(1 + r, n) + fvAnn(v.deposit);
    const rd = eff(v.drawRet), m = Math.round(v.drawYears * 12);
    const pvFactor = rd === 0 ? m : ((1 - Math.pow(1 + rd, -m)) / rd) * (1 + rd);
    const draw = pvFactor > 0 ? end / pvFactor : 0, need = v.gap * pvFactor;
    const depNeeded = Math.max(((need - v.start * Math.pow(1 + r, n)) * (r === 0 ? 1 / n : r / (Math.pow(1 + r, n) - 1))), 0);
    return { end, draw, need, shortfall: need - end, depNeeded, deposited: v.start + v.deposit * n, growth: end - v.start - v.deposit * n };
  }
  return { pmt, balance, MODES, defaults, run, stressTests, sensitivity, rentalCore, bridge };
});
