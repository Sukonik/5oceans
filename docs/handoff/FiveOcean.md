# FiveOceans
## Product handoff for Cole
Planning edition 1.0 · November 5, 2026

FiveOceans helps someone decide when they can work less or retire near water. Start from a life decision (“Can I leave municipal work at 45?”) or a place (“Can I stay in Long Beach and spend winters in the Caribbean?”). End with spendable income by month, housing and health costs, accessible reserves, the earliest gap, and a next step backed by a primary source.

**Confirmed by Nathan:** FiveOceans; seawater and freshwater families; six plan types; the exact 36 animal names below. Estuary, lagoon and delta are geographic details on a city page. **Proposed for Cole’s review:** the plan subtitles, source matches, routing, build order and examples below. Animals are branded planning paths; an animal never determines financial eligibility. Keep Giant Squid distinct from Colossal Squid, and use Rhesus Macaque Monkey for Spring.

## Navigation
| Page | User action |
|---|---|
| Home | Choose Build a plan or Explore places. Resume a scenario by explicit user action if local saving is added. |
| Plans | Browse Seawater (CoastalSea, CentralSea, DeepSea) or Freshwater (Spring, Lake, River). Filter by decision, animal or program. |
| Map and Cities | Browse cities and compare waterfront, water-view and walking-distance options using the same income assumptions. Attribute each local figure and date it. |
| Sea, Spring, Lake and River | Choose a destination by water body; reuse plan logic across cities. The proposed 150-seas collection is an editorial roadmap. |
| Guides | Open [Guides](Guides.md), [Insurance](Insurance.md), [Programs](Programs.md), [Investments](Investments.md), [Taxes](Taxes.md) or [Real Estate](RealEstate.md) from every relevant plan. |

## What an animal card must deliver
1. Start with a visitor’s question and show the animal plus the plain-language plan name.
2. Ask only the branching questions that change the answer: work status, jurisdiction, plan type, occupancy, timing or household eligibility.
3. Surface one primary opportunity and at most two related ones. Explain why each appeared, the access restriction or eligibility check, the official link, and the action to take. Make “I don’t know” a valid answer.
4. Separate confirmed income from opportunities to investigate. A future Saver’s Match, unapproved rent, unvested pension or unconfirmed health subsidy is never spendable in the base case.
5. Show a monthly result, compare two alternatives and indicate which input most changes the outcome. Tag each input Statement, Quote, Estimate or Unknown; separately tag tax basis and dollar year.

**Example route:** “I have NY ERS and want to reduce hours at 45.” Open Pink River Dolphin for the pension estimates; open Yeti Crab to test 457(b) access after separation; open Spider Monkey to see any coverage gap. A person staying with the same employer at reduced hours can use a cash or taxable bridge while waiting for an independently confirmed distribution event.

**Property route:** “Could a tenant pay part of my housing cost?” Hermit Crab compares buying and building, Royal Tern adds seasonal occupancy, and Goblin Shark tests vacancy plus flood displacement. [Worked example and break-even rent](RealEstate.md#worked-example)

## Build sequence and acceptance
| Slice | Ship | Pass when |
|---|---|---|
| 1 · Catalog and routing | Six collections, all names below, six resource guides, decision and program search. Start with one Long Beach scenario using fictional figures. | Six animals in each collection; 36 unique IDs; every animal opens its guide and official source from mobile or keyboard. Search for “457(b)” and “ERS” without knowing an animal name. |
| 2 · Three worked paths | Port the existing Yeti Crab concept, add Pink River Dolphin’s ERS comparison and Hermit Crab’s rental model. | Changing from exit to same-employer part-time prompts a 457(b) access check. Both ERS estimates show their service end dates. Zero rent, delayed construction and a no-loan purchase each calculate correctly. |
| 3 · Full timeline and city comparison | Distinct dates for pension, Social Security, healthcare and work changes; flood and property quotes per address. | A pension at 63 and Social Security at 67 produce a visible four-year interval. Indoor housing, flood costs and net rent are each counted once. One-time expenses appear in the correct month. |
| Later · WhaleMap | Consider an attributed outbound “Whales along this coast” link on relevant Atlantic city pages, subject to checking the destination. Research integration or co-marketing terms separately. | Describe survey observations accurately, retain attribution and review data-use permissions before embedding, redistributing or implying a partnership. [Consortium project description](https://www.narwc.org/whalemap.html) |

**Implementation notes.** Use static files, relative paths and synthetic data for the GitHub Pages demo. The suggested repo slug is `fiveoceans`. Treat the earlier DeepSea package as a prototype input and its fictional examples as regression fixtures. Keep financial inputs in the visitor’s browser; omit them from URLs, analytics and logs. Build from one animal registry and one resource registry so a changed IRS or city link can be updated once. Suggested keys: animal ID, display name, family, plan type, subtitle, decision, eligibility trigger, guide anchor, source owner, URL, jurisdiction, last review date and next action. Review dated tax and benefit rules at least annually and after announced changes. Test zero balances, zero return, overlapping benefits, duplicate income, inaccessible accounts, missing quotes and no-income months. Confirm release links on production before announcing a public launch.

## Animal directory
Each entry is an implementation brief with one linked guide section and one direct resource. Cross-link animals when a decision spans more than one plan. The same program may appear in multiple places for different reasons.

## CoastalSea

### Hermit Crab
**Right-size my home.** Compare a smaller home with buying a duplex or building a permitted accessory dwelling unit (ADU). Show the monthly housing cost the owner still pays after rent.

[RealEstate guide](RealEstate.md#buy-build-or-rent) · [Fannie Mae ADU options](https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/accessory-dwelling-units)

### Sea Lion
**Retire near family.** Compare local housing costs with travel and paid support elsewhere. Ask an Area Agency on Aging what help exists at each address.

[Guides guide](Guides.md#family-and-care) · [Eldercare Locator](https://eldercare.acl.gov/)

### Royal Tern
**Split the year.** Model months at each home and permitted rental months while away. Show vacancy, management, owner-use days and two sets of carrying costs.

[RealEstate guide](RealEstate.md#seasonal-use) · [IRS rental and personal-use rules](https://www.irs.gov/publications/p527)

### Green Sea Turtle
**Return to my coast.** Compare renting first, buying now and buying later. Bring the local estimates to a housing counselor before treating purchase financing as available.

[RealEstate guide](RealEstate.md#buy-build-or-rent) · [HUD housing counseling](https://www.hud.gov/counseling)

### Peacock Flounder
**Find the waterfront premium.** Compare waterfront, water-view and walk-to-water homes. Enter a separate flood quote and deductible for each address.

[Insurance guide](Insurance.md#waterfront-cover) · [NFIP flood zones and maps](https://www.floodsmart.gov/flood-zones-and-maps)

### Red Cushion Sea Star
**Build my coastal cushion.** Add storm deductibles, displacement costs and uncovered repairs. Test access to the reserve in an insured deposit account.

[Insurance guide](Insurance.md#waterfront-cover) · [FDIC deposit insurance estimator](https://edie.fdic.gov/)

## CentralSea

### Blue Whale
**My big retirement year.** Budget a full year away, including the return move. Compare a short Treasury bill maturity schedule with the months cash is needed.

[Investments guide](Investments.md#cash-and-treasuries) · [Treasury bills](https://www.treasurydirect.gov/marketable-securities/treasury-bills/)

### Giant Squid
**Untangle two homes.** Separate rental, personal-use and vacant days for each home. Compare holding both with selling one and estimate the after-tax cash available.

[Taxes guide](Taxes.md#property-and-rent) · [IRS home sale rules](https://www.irs.gov/publications/p523)

### Giant Manta Ray
**Healthcare away from home.** Enter coverage territory, network and return-for-care costs. A Medicare enrollee traveling abroad should check the limited circumstances for coverage.

[Insurance guide](Insurance.md#travel-and-care) · [Medicare outside the US](https://www.medicare.gov/coverage/travel-outside-the-u.s.)

### Wandering Albatross
**Travel without a home base.** Compare continuous travel with a fixed base; enter a domicile assumption, local health cover and US filing costs abroad.

[Taxes guide](Taxes.md#moving-and-travel) · [IRS guidance for US citizens abroad](https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad)

### Sailfish
**Try a city for 90 days.** Fund a trial stay with a return date. Compare fully refundable cash with a bill maturing before the lease payment.

[Investments guide](Investments.md#cash-and-treasuries) · [Treasury bill terms](https://www.treasurydirect.gov/marketable-securities/treasury-bills/)

### Great White Shark
**My return-home reserve.** Price lease exit, travel, deposit and three months back home. Check deposit protection by bank and ownership category.

[Investments guide](Investments.md#cash-and-treasuries) · [FDIC EDIE](https://edie.fdic.gov/)

## DeepSea

### Yeti Crab
**Early retirement bridge.** Model spending after leaving municipal employment. Separate original governmental 457(b) money, rolled-in balances and taxable savings. Compare with staying part-time.

[Programs guide](Programs.md#governmental-457b) · [IRS early-distribution exceptions](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions)

### Goblin Shark
**Retirement stress test.** Run a market fall at exit, six months of displacement and a year with zero side income. Show the first month accessible cash runs out.

[Insurance guide](Insurance.md#waterfront-cover) · [NFIP coverage details](https://www.floodsmart.gov/whats-covered)

### Colossal Squid
**Lifetime income map.** Put NY ERS, Social Security and accessible savings on separate timelines. Enter each payment start date and a pension estimate based on the intended last work date.

[Programs guide](Programs.md#new-york-ers) · [NYSLRS vested benefits](https://www.osc.ny.gov/retirement/members/are-you-vested-and-what-it-means)

### Dumbo Octopus
**Phased retirement.** Compare four days, three days and full exit. Check employer health eligibility at each schedule and ask the pension system how part-time service is credited.

[Insurance guide](Insurance.md#leaving-work) · [Marketplace for early retirees](https://www.healthcare.gov/retirees/)

### Sea Pig
**Paycheck savings plan.** Test small deposits to an IRA and check the federal saving incentive for the relevant tax year, showing only matches the saver is eligible to receive.

[Programs guide](Programs.md#saving-incentives) · [IRS Saver’s Match](https://www.irs.gov/credits-deductions/savers-match)

### Black Seadevil
**Side-income target.** Calculate sales required to replace a workday after expenses, taxes and working hours. Flag a solo 401(k) only after qualifying business earnings.

[Programs guide](Programs.md#self-employed-and-specialized) · [IRS one-participant 401(k)](https://www.irs.gov/retirement-plans/one-participant-401k-plans)

## Spring

### Rhesus Macaque Monkey
**Start a family savings plan.** Assign an IRA contribution goal to each spouse. Check filing status, compensation, limits and eligibility separately, including spousal IRA rules.

[Programs guide](Programs.md#iras-and-family-saving) · [IRS IRA contribution limits](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits)

### West Indian Manatee
**Build my first reserve.** Set a target in months of essential bills, then test access to insured savings during the first week of an emergency.

[Investments guide](Investments.md#cash-and-treasuries) · [FDIC coverage estimator](https://edie.fdic.gov/)

### Black Bear
**Save for a season without pay.** Schedule seasonal bills by month. Leave immediate cash accessible and match later costs with Treasury bill maturities.

[Investments guide](Investments.md#cash-and-treasuries) · [TreasuryDirect bills](https://www.treasurydirect.gov/marketable-securities/treasury-bills/)

### Bobcat
**Plan on one income.** Calculate the monthly amount one paycheck can sustain. Check future Social Security using that person’s own earnings history.

[Programs guide](Programs.md#social-security) · [SSA retirement estimate](https://www.ssa.gov/prepare/plan-retirement)

### Alligator
**Pay down debt and start saving.** Compare two splits of the same paycheck between debt and saving. Record debt APR and any verified employer match. Show interest paid and vested savings separately.

[Guides guide](Guides.md#paycheck-decisions) · [IRS saving incentive eligibility](https://www.irs.gov/credits-deductions/savers-match)

### Largemouth Bass
**Save part of every raise.** Direct a chosen share of the next raise to a governmental 457(b) if offered, then compare with accessible brokerage savings. Show take-home pay and accessible balance at 45.

[Programs guide](Programs.md#governmental-457b) · [NY deferred compensation plan](https://www.nysdcp.com/)

## Lake

### Painted Turtle
**Compare lake access.** Compare private shoreline and public launch access, with taxes, flood quotes, storage and launch fees on the same monthly basis.

[Insurance guide](Insurance.md#waterfront-cover) · [NFIP flood map guide](https://www.floodsmart.gov/flood-zones-and-maps)

### Common Loon
**Try four seasons.** Compare a one-year lease with buying. Include winter utilities, closing costs and access to year-round health services.

[RealEstate guide](RealEstate.md#four-season-homes) · [CFPB Loan Estimate explainer](https://www.consumerfinance.gov/owning-a-home/loan-estimate/)

### Hippopotamus
**Make the lake house year-round.** Compare renovation with buying an existing year-round home. Screen for FHA 203(k) rehabilitation financing and obtain contractor and insurance quotes.

[RealEstate guide](RealEstate.md#four-season-homes) · [HUD FHA 203(k)](https://www.hud.gov/program_offices/housing/sfh/203k/203k--df)

### Swan
**Age in place together.** Price accessibility work and transport. Check USDA Section 504 repair assistance by address, income, ownership, age and grant purpose.

[Programs guide](Programs.md#housing-and-care-support) · [USDA repair loans and grants](https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-repair-loans-grants)

### Pike
**Price the boat and dock.** Compare cost per actual outing with renting. Budget liability cover, storage, insurance, dock work and replacement as separate annual expenses.

[Insurance guide](Insurance.md#recreation-and-liability) · [NFIP property coverage](https://www.floodsmart.gov/whats-covered)

### Capybara
**Share a family lake house.** Test a co-owner’s exit, a buyout and a missed season of contributions. Add personal-use and fair-rent days before estimating rental deductions.

[RealEstate guide](RealEstate.md#shared-ownership) · [IRS residential rental property](https://www.irs.gov/publications/p527)

## River

### Giant Otter
**Retire as a household.** Compare two retirement dates, dependent health coverage and survivor income. Obtain benefit estimates before selecting a survivor payment option.

[Programs guide](Programs.md#social-security) · [SSA survivor benefits](https://www.ssa.gov/benefits/survivors/)

### Scarlet Ibis
**Move closer to family.** Compare housing, family travel and care. Show which state or local support programs need a fresh eligibility review after moving.

[Guides guide](Guides.md#family-and-care) · [US Eldercare Locator](https://eldercare.acl.gov/)

### Pink River Dolphin
**Compare my routes.** Compare NY ERS estimates with service frozen at 45, part-time service and continued full-time work. Use the same pension start age for the first comparison.

[Programs guide](Programs.md#new-york-ers) · [NYSLRS tier and eligibility](https://www.osc.ny.gov/retirement/members/are-you-vested-and-what-it-means)

### Green Anaconda
**Fund a career break.** Model a defined return-to-work date. Compare cash, taxable investments and documented regular Roth IRA contribution basis for the gap.

[Investments guide](Investments.md#spendable-balances) · [IRS IRA distribution ordering](https://www.irs.gov/publications/p590b)

### Electric Eel
**Rehearse a smaller paycheck.** Move the fifth day’s take-home pay to savings in a trial budget. Recheck withholding and benefits before a real work schedule change.

[Taxes guide](Taxes.md#paychecks-and-withdrawals) · [IRS withholding estimator](https://www.irs.gov/individuals/tax-withholding-estimator)

### Spider Monkey
**Move between benefits.** Map final paycheck, end of coverage, 457(b) distribution eligibility and first ERS deposit on one calendar. Compare COBRA and Marketplace for uncovered months.

[Insurance guide](Insurance.md#leaving-work) · [Labor Department COBRA guide](https://www.dol.gov/agencies/ebsa/laws-and-regulations/laws/cobra)
