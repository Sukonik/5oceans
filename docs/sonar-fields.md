# Dolphin Sonar: what it reads

Sonar reads these facts from a listing link and pasted listing text (or the bookmarklet and link reader), entirely in the browser. It reads **only what is on the page you give it** and never agent names, phone numbers or emails. Each fact is optional: whatever a listing does not show is simply not reported.

Generated from `assets/calc/sonar.js` (`FIELDS`); a test keeps this list in sync.

## Price and payment

| Fact | Kind | Key |
|---|---|---|
| Status | text | `status` |
| Price | dollars | `price` |
| Listing site payment estimate | dollars | `estMonthly` |
| Site value estimate | dollars | `estValue` |
| Down payment | percent | `downPct` |
| Down payment amount | dollars | `downAmt` |
| Interest rate shown | percent | `rate` |
| Loan term (years) | whole number | `term` |
| Loan type | text | `loanType` |
| Price per square foot | dollars | `pricePerSqft` |

## Monthly costs

| Fact | Kind | Key |
|---|---|---|
| Principal and interest | dollars | `pi` |
| Property tax per month | dollars | `taxMo` |
| Property tax per year | dollars | `taxYr` |
| Home insurance per month | dollars | `insMo` |
| Mortgage insurance per month | dollars | `miMo` |
| HOA per month | dollars | `hoaMo` |
| Common charges per month | dollars | `commonMo` |
| Co-op maintenance per month | dollars | `maintMo` |
| Flip tax | percent | `flipTaxPct` |
| Financing allowed | percent | `financingPct` |

## Property

| Fact | Kind | Key |
|---|---|---|
| Property type | text | `type` |
| Style | text | `style` |
| Bedrooms | number | `beds` |
| Bathrooms | number | `baths` |
| Full bathrooms | whole number | `fullBaths` |
| Half bathrooms | whole number | `halfBaths` |
| Square feet | whole number | `sqft` |
| Year built | year | `year` |
| Year renovated | year | `yearRenovated` |
| Stories | whole number | `stories` |
| Units | whole number | `units` |
| New construction | text | `newConstruction` |

## Building and lot

| Fact | Kind | Key |
|---|---|---|
| Lot size (sq ft) | whole number | `lotSqft` |
| Lot size (acres) | number | `lotAcres` |
| Zoning | text | `zoning` |
| Garage spaces | whole number | `garage` |
| Parking spaces | whole number | `parking` |
| Basement | text | `basement` |
| County | text | `county` |
| Parcel number (APN) | text | `apn` |

## Features

| Fact | Kind | Key |
|---|---|---|
| Features | list | `features` |
| Worth a closer look | list | `flags` |

## Market

| Fact | Kind | Key |
|---|---|---|
| Days on market | whole number | `dom` |
| Days on this site | whole number | `domSite` |
| Average days to pending nearby | whole number | `avgDom` |
| Sale-to-list ratio | percent | `saleToList` |
| Offer the site calls strong | dollars | `offerAt` |
| Chance to win at that offer | percent | `offerChance` |
| Views | whole number | `views` |
| Saves or favorites | whole number | `saves` |

## Price history

| Fact | Kind | Key |
|---|---|---|
| Highest recent list price | dollars | `peakPrice` |
| Date of that price | text | `peakDate` |
| Reduced from that peak | percent | `reducedPct` |
| Price changes in the last year | whole number | `priceCuts` |
| Last sold price | dollars | `lastSoldPrice` |
| Last sold date | text | `lastSoldDate` |

## Rental

| Fact | Kind | Key |
|---|---|---|
| Rent estimate per month | dollars | `rent` |
| Rent figure comes from | text | `rentSource` |
| Past rental listing per month | dollars | `pastRent` |
| Past rental listing date | text | `pastRentDate` |

## Location

| Fact | Kind | Key |
|---|---|---|
| Walkability | text | `walk` |
| Bikeability | text | `bike` |
| Transit | text | `transit` |
| Quietness | text | `quiet` |
| Calm | text | `calm` |
| Schools nearby | list | `schools` |

## Risk

| Fact | Kind | Key |
|---|---|---|
| Flood risk | text | `flood` |
| Flood zone | text | `floodZone` |
| Other climate risks | text | `otherRisk` |
| Sun exposure | text | `sun` |

## Listing

| Fact | Kind | Key |
|---|---|---|
| Listing source | text | `mls` |
| MLS number | text | `mlsNo` |
| Brokerage | text | `brokerage` |
| Listing updated | text | `listingUpdated` |

## Also derived

- Property tax per month and per year (one from the other), price per square foot
- **What Sonar noticed**: plain-English notes such as the tax rate, price cuts from the recent high, days on market against the local average, rental yield, flood and coastal warnings, accessory-unit and as-is flags, co-op maintenance reminders
- A suggested calculator (house, home with a rental, condo, co-op, multi-family, land)

## Fills the calculators

Price, down payment, interest rate, loan term, property tax, insurance, HOA or common charges, co-op maintenance and flip tax, rent (a site estimate or a plausible past rental listing), units and home size are mapped onto whichever calculator you choose.
