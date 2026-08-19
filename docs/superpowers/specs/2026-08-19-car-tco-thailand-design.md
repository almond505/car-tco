# Car Total Cost of Ownership — Product and Technical Design

Date: 2026-08-19  
Status: Approved in brainstorming; awaiting written-spec review

## 1. Product summary

Build a Thai-language, client-only web calculator that answers three questions:

1. What does each car cost to own per month and across the selected holding period?
2. Does the proposed new car fit the user's income under the original 20/4/10 guideline or a user-adjusted Thai-context ceiling?
3. Is changing from the current car financially better than keeping it, and when does the extra cash outlay break even?

The product uses manual inputs only. It does not provide vehicle listings, market prices, lender approval, or financial advice.

## 2. Locked decisions

- Interface language: Thai only.
- Build target: React, Vite, and TypeScript.
- Runtime: client only; no backend, account, database, or live APIs.
- Financing: Thai flat-rate calculation only.
- Affordability: original 20/4/10 checks plus an adjustable income-share ceiling from 10% to 40%.
- Current vehicle: optional remaining payoff, installment, remaining months, and early-settlement fee.
- Verdict: financial factors only.
- Layout: Guided Studio.
- Visual direction: Obsidian Satin.
- Persistence: automatic local browser storage.

## 3. Scope

### Included

- New-car financing and ownership-cost calculation.
- Current-car future ownership-cost calculation.
- Current-versus-new comparison over one shared holding period.
- Average monthly economic ownership cost.
- Actual monthly cash burden while finance is active.
- Switch-day cash requirement.
- Original and adjusted 20/4/10 status.
- Full cost breakdown, total difference, and cash-flow break-even.
- Thai inline validation and explanatory copy.
- Responsive, keyboard-accessible interface with reduced-motion support.

### Excluded from v1

- Vehicle database or automatic Thai market prices.
- Live fuel, electricity, insurance, tax, or finance rates.
- Accounts, cloud sync, shared links, PDF export, or saved scenario library.
- Tax advice, loan approval prediction, credit scoring, or qualitative scoring.
- Inflation, present-value discounting, opportunity return on cash, and uncertain-price simulation.
- Multiple new-car candidates in one comparison.
- Selling a financed comparison vehicle before its loan matures; settlement rebates and payoff rules are contract-specific.

These exclusions keep assumptions visible and avoid pretending that changing external prices are authoritative.

## 4. User experience

### Page flow

1. Minimal floating navigation.
2. Two-line editorial hero explaining the decision supported by the calculator.
3. Four-stage Guided Studio calculator.
4. Pinned current-versus-new comparison chapter.
5. Financial verdict, affordability status, and restart action.
6. Compact methodology and disclaimer footer.

### Guided Studio stages

#### Stage 1: Financial context

- Gross monthly income.
- Adjustable transport-cost ceiling, 10% to 40%; default 10%.
- Planned holding period, 1 to 20 years.
- Holding period must cover both the new finance term and any remaining current-car finance term.
- Distance driven per month.
- Energy prices used by the two vehicles.

#### Stage 2: Current car

- Vehicle name.
- Current market or sale value.
- Expected value at the end of the holding period.
- Energy type and efficiency.
- Optional outstanding payoff.
- Optional current monthly installment and months remaining.
- Optional early-settlement fee.
- All operating-cost inputs listed in section 5.

#### Stage 3: New car

- Vehicle name.
- Cash price, discount, and purchase fees.
- Down payment amount or percentage, synchronized in the interface.
- Annual flat rate and finance term in months.
- Expected resale value at the end of the holding period.
- Energy type and efficiency.
- All operating-cost inputs listed in section 5.

#### Stage 4: Decision

- Lower-TCO vehicle and exact difference.
- Affordability status.
- Average monthly ownership cost.
- Monthly cash burden during finance.
- Switch-day cash requirement.
- Cash-flow break-even month or explicit “no break-even within period.”
- Expandable cost details and accessible chart data.

### Responsive behavior

- Desktop: inputs on the left; sticky live result on the right.
- Tablet: narrower split layout until readability requires stacking.
- Mobile: compact live summary first, then collapsible input groups.
- No horizontal scrolling at 375, 768, 1024, or 1440 px.

## 5. Cost catalogue

Each vehicle supports the same operating-cost structure so comparisons remain symmetrical.

### Energy

- Fuel or electricity unit price.
- Efficiency in km/litre or km/kWh.
- Shared monthly distance.

Monthly energy cost:

```text
monthly distance ÷ efficiency × unit price
```

### Annual fixed costs

- Voluntary insurance.
- Compulsory insurance (พ.ร.บ.).
- Annual vehicle tax.
- Required inspection.
- Scheduled service or maintenance budget.
- Unexpected repair budget.

Annual values are divided by 12 for monthly cash-flow comparison and multiplied by the selected holding period for TCO.

### Periodic costs

- Tires: replacement amount and interval in months.
- Starter battery or EV traction-battery provision: amount and interval.

Monthly equivalent:

```text
replacement amount ÷ replacement interval in months
```

### Lifestyle costs

- Parking.
- Tolls.
- Cleaning and detailing.

### One-time and custom costs

- Accessories.
- Home charger and installation.
- Transfer or acquisition fees.
- Custom cost rows with one-time, monthly, or annual frequency.

## 6. Financial calculations

All monetary results are estimates in Thai baht. Calculations use unrounded numeric values; rounding occurs only for display.

### New-car flat-rate financing

```text
net vehicle price = cash price − discount
down payment = entered amount or net vehicle price × entered percentage
financed principal = net vehicle price − down payment
total flat interest = financed principal × annual flat rate × loan years
monthly installment = (financed principal + total flat interest) ÷ finance months
```

The down payment is part of the purchase price, not an additional TCO cost.

### New-car TCO

```text
new-car TCO =
  net vehicle price
  + total flat interest
  + purchase and one-time costs
  + operating costs across the holding period
  − expected end value
```

### Current-car remaining finance interest

When the current car is financed:

```text
remaining scheduled payments = monthly installment × months remaining
remaining finance interest = max(0, remaining scheduled payments − outstanding payoff)
```

The outstanding principal is an existing liability. Principal repayment is shown in cash flow but is not counted again as an economic ownership cost.

### Current-car TCO from today

```text
current-car TCO =
  current market value
  − expected end value
  + remaining finance interest
  + operating costs across the holding period
```

Current market value is the economic opportunity cost of keeping the asset.

### Average monthly ownership cost

```text
average monthly ownership cost = TCO ÷ holding-period months
```

This includes depreciation and should not be described as the monthly amount leaving the user's bank account.

### Active-finance monthly cash burden

```text
monthly cash burden =
  active monthly installment
  + monthly energy
  + monthly fixed-cost equivalents
  + monthly periodic-cost equivalents
  + monthly lifestyle costs
```

One-time costs and depreciation are excluded from this affordability cash-flow measure.

### Switch-day cash requirement

```text
switch-day cash =
  new-car down payment
  + new-car purchase fees paid upfront
  + new-car one-time custom costs
  + current-car payoff
  + early-settlement fee
  − current-car sale value
```

A negative result means the transaction releases cash rather than requiring it.

## 7. Affordability logic

The original 20/4/10 guideline is displayed as three independent checks:

- Down payment is at least 20%.
- Finance term is at most 48 months.
- Total monthly transportation cash costs are at most 10% of gross monthly income.

The user-selected 10% to 40% ceiling changes only the third check. The interface always preserves the original 10% result beside the custom result. A higher custom ceiling is labeled as a personal adjustment, not as a modified universal rule.

```text
income share = active-finance monthly cash burden ÷ gross monthly income × 100
```

Affordability never changes the TCO winner. Instead, verdict copy combines the two dimensions, for example:

> รถใหม่ประหยัดกว่า ฿184,000 ใน 8 ปี แต่ภาระรายเดือน 34% เกินเพดาน 30%

## 8. Comparison and break-even

### Financial winner

```text
TCO difference = new-car TCO − current-car TCO
```

- Negative: changing cars has lower TCO.
- Positive: keeping the current car has lower TCO.
- Zero: equal under entered assumptions.

The app reports the exact amount and holding period. It does not create an opaque score.

### Cash-flow break-even

Generate monthly prospective cash-flow arrays for both paths. The switch path begins with switch-day cash and then adds new-car monthly cash costs. The keep path adds current-car monthly cash costs. The first month where cumulative switching cash outflow is no greater than cumulative keeping cash outflow is the cash-flow break-even.

This metric intentionally excludes non-cash depreciation and is labeled accordingly. If no crossing occurs inside the holding period, the app says so rather than extrapolating.

## 9. Results and charts

Primary results:

- Average ownership cost per month.
- Monthly cash burden during finance.
- Total TCO.
- Total finance interest.
- Switch-day cash required.
- Original and custom affordability status.
- TCO savings or extra cost.
- Cash-flow break-even.
- Expected end values.

Visuals:

- Horizontal grouped bars for current-versus-new cost categories.
- Waterfall from purchase value through interest and running costs to residual value and net TCO.
- Cumulative cash-flow line for break-even.
- A semantic value table immediately following every chart.

Invalid or incomplete inputs produce a neutral incomplete state. They never produce a zero-cost winner.

## 10. Visual system

### Obsidian Satin palette

- Background: `#08090A`.
- Raised surface: `#101213`.
- Primary text: `#F3F1EC`.
- Muted text: minimum accessible contrast against its surface.
- Structural accent: muted champagne metal.
- Positive: restrained green.
- Negative: restrained red.

Green and red communicate financial meaning only; neither is the sole indicator.

### Typography

- Thai body and form copy: Noto Sans Thai.
- Display headings and numeric results: Geist.
- Hero heading: maximum width equivalent to `max-w-6xl`, limited to two or three lines.
- No Inter, numbered meta-labels, stamp icons, hero badges, or raw hero statistics.

### Layout density

The primary desktop result bento uses a dense 12-column, two-row grid:

```text
7 × 2 main result = 14 cells
5 × 1 affordability = 5 cells
5 × 1 switch cash = 5 cells
total = 24 of 24 cells
```

Use dense grid flow; no empty corner cells.

## 11. Motion

- Form-stage transitions: 250–350 ms with ease-out entry.
- Numeric interpolation only for values that changed.
- Sticky result updates without layout jumps.
- Desktop comparison chapter uses GSAP scroll pinning.
- Verdict explanation uses a restrained scrubbed text reveal.
- Horizontal cost-category accordion supports detail exploration.
- Hero may contain one inline vehicle-detail image and a slow cost-category marquee.
- Marquee pauses on interaction and becomes static when reduced motion is requested.
- No scroll-jacking, bouncing elements, autoplay carousel, or perpetual motion elsewhere.

`prefers-reduced-motion` removes scrubbed and continuous effects while preserving every interaction and result.

## 12. Architecture

Minimal source structure:

```text
src/
  App.tsx
  GuidedCalculator.tsx
  Results.tsx
  calculations.ts
  calculations.test.ts
  styles.css
```

Responsibilities:

- `App.tsx`: scenario state, stage navigation, and versioned localStorage persistence.
- `GuidedCalculator.tsx`: labeled inputs, validation display, and stage controls.
- `Results.tsx`: verdict, affordability, summaries, tables, and charts.
- `calculations.ts`: pure loan, operating-cost, TCO, affordability, and comparison functions.
- `calculations.test.ts`: financial regression and boundary checks.
- `styles.css`: tokens, layout, responsive behavior, focus styles, and reduced-motion fallbacks.

Libraries:

- React, Vite, and TypeScript.
- GSAP and `@gsap/react` for approved motion.
- Chart.js for charts, continuing the sample application's existing approach.

No router, state-management library, backend client, form framework, component framework, or icon library is required.

Data flow:

```text
validated inputs
→ pure loan and operating-cost calculations
→ current/new scenario results
→ affordability and comparison
→ verdict, tables, and charts
→ versioned localStorage snapshot
```

## 13. Validation and failure behavior

- Monetary values, rates, distances, and periods cannot be negative.
- Efficiency must exceed zero.
- Holding period must be from 1 to 20 years.
- Holding-period months cannot be shorter than the new finance term or the current car's remaining finance months.
- Down payment cannot exceed net vehicle price.
- Loan term and flat rate are required only when financed principal is above zero.
- Current payoff fields remain optional as one group; partial entry prompts completion.
- Optional blank costs evaluate as zero.
- Required blank or invalid values suspend dependent results.
- Errors appear in Thai beside the responsible field and are announced to assistive technology.
- Stored data with an unknown schema version is ignored safely and replaced only after new valid input.

## 14. Accessibility and responsive requirements

- Every input has a persistent associated label.
- Keyboard focus uses a visible `focus-visible` treatment.
- Click targets meet comfortable touch sizing.
- Color is reinforced with text and icons or shapes.
- Charts have equivalent tables.
- Dynamic result summaries use non-disruptive live-region announcements.
- Reduced motion is honored.
- Thai copy and numbers remain readable at 200% zoom.
- Verify 375, 768, 1024, and 1440 px widths with no horizontal overflow.

## 15. Verification plan

### Calculation checks

- Bank of Thailand-style flat-rate example: ฿100,000 principal, 3% per year, two years gives ฿6,000 total interest and approximately ฿4,416.67 per month.
- Cash purchase.
- Zero-interest finance.
- Down payment at 0%, 20%, and 100%.
- Outstanding current-car payoff and remaining interest.
- ICE and EV energy calculations.
- One-time, monthly, annual, and periodic custom costs.
- Residual value and TCO difference.
- Break-even exists and no-break-even cases.
- Affordability exactly at 10% and 40% boundaries.
- Incomplete required inputs do not create a verdict.

### Interface checks

- Complete flow with keyboard only.
- Local persistence and safe schema reset.
- Chart table equivalence.
- Reduced-motion mode.
- Responsive layouts at all required widths.
- No horizontal overflow.
- Visible focus and readable error states.

## 16. Acceptance criteria

The design is complete when the implemented app:

1. Calculates Thai flat-rate installments, finance interest, both TCO paths, average monthly ownership cost, and monthly cash burden from manual inputs.
2. Includes every approved ownership-cost category and custom costs.
3. Shows original 20/4/10 and adjustable 10%–40% income-share results without presenting either as lending approval.
4. Handles an optionally financed current car and computes switch-day cash.
5. Gives a transparent financial verdict, exact difference, and cash-flow break-even.
6. Uses the approved Guided Studio and Obsidian Satin experience.
7. Preserves data locally without requiring an account.
8. Passes calculation, accessibility, reduced-motion, and responsive checks.

## 17. Sources informing formulas and guidance

- Bank of Thailand, “ดอกเบี้ยเงินกู้แบบเงินต้นคงที่”: https://www.bot.or.th/th/satang-story/rights-responsibility/flat-effective.html
- Bank of Thailand, “เช่าซื้อรถ”: https://www.bot.or.th/th/satang-story/managing-debt/hirepurchase-loan.html
- Chase, “The 20/4/10 Rule for Buying a Car”: https://www.chase.com/personal/auto/education/buying/what-is-the-20-4-10-rule-for-buying-a-car
