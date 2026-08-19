# Car TCO Thailand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build the approved Thai-language Guided Studio calculator for current-versus-new car TCO, affordability, and cash-flow break-even.

**Architecture:** A client-only React/Vite application keeps one versioned calculator state in App.tsx. Pure functions in calculations.ts own every financial rule; form and result components only edit inputs or render returned results. Chart.js renders three progressive-enhancement charts, while semantic tables remain the accessible source of the displayed chart values.

**Tech Stack:** React, Vite, TypeScript, GSAP with @gsap/react, Chart.js, Vitest, CSS.

**Spec:** docs/superpowers/specs/2026-08-19-car-tco-thailand-design.md

## Global Constraints

- Interface copy is Thai only.
- Runtime is client only: no backend, accounts, database, router, state library, form library, or live APIs.
- Use Thai flat-rate financing only.
- Keep original 20/4/10 results visible; custom income ceiling ranges from 10% through 40%.
- Holding-period months must cover the new finance term and remaining current-car finance months.
- Verdict is financial only and always exposes the exact amounts behind it.
- Preserve Car TCO Comparison.html unchanged as the reference implementation.
- Use Noto Sans Thai for Thai copy and Geist for display numerals/headings; never use Inter.
- Respect prefers-reduced-motion and preserve full function without animation.
- Support 375, 768, 1024, and 1440 px without horizontal overflow.
- Workspace is not currently a Git repository. Before execution, ask once whether to run git init. If declined, run all verification steps and omit only commit steps.

## File Map

- package.json — scripts and runtime/development dependencies.
- .gitignore — excludes dependencies, builds, local companion artifacts, and macOS metadata.
- index.html — Thai document shell and font preconnects.
- tsconfig.json — strict TypeScript configuration.
- vite.config.ts — Vite React and Vitest configuration.
- src/main.tsx — React entry point.
- src/App.tsx — application state, storage, stage state, page composition, and top-level motion.
- src/GuidedCalculator.tsx — all four form stages, operating-cost controls, validation display, and stage navigation.
- src/Results.tsx — verdict, affordability, result cards, cost accordion, charts, and accessible data tables.
- src/calculations.ts — domain types, validation, flat-rate formulas, TCO, affordability, monthly cash flows, and break-even.
- src/calculations.test.ts — financial regression and boundary checks.
- src/styles.css — Obsidian Satin tokens, responsive layout, focus states, charts, accordion, and reduced-motion fallbacks.
- public/car-detail.jpg — the single automotive detail image used inside the hero heading.

---

### Task 1: Bootstrap the React/Vite shell

**Files:**
- Create: package.json
- Create: .gitignore
- Create: index.html
- Create: tsconfig.json
- Create: vite.config.ts
- Create: src/main.tsx
- Create: src/App.tsx
- Create: src/styles.css
- Preserve: Car TCO Comparison.html

**Interfaces:**
- Consumes: none.
- Produces: a buildable React root component and global stylesheet imported by src/main.tsx.

- [ ] **Step 1: Create package metadata and install only approved dependencies**

Run:

~~~bash
shasum -a 256 "Car TCO Comparison.html"
npm init -y
npm install react react-dom gsap @gsap/react chart.js
npm install -D vite typescript @types/node @types/react @types/react-dom @vitejs/plugin-react vitest
npm pkg set type=module
npm pkg set scripts.dev=vite
npm pkg set scripts.build="tsc --noEmit && vite build"
npm pkg set scripts.test="vitest run"
npm pkg set "scripts.test:watch=vitest"
~~~

Expected: record the printed sample-file hash in the execution notes; package.json contains only the listed direct dependencies and scripts.

Create .gitignore:

~~~text
node_modules/
dist/
.superpowers/
.DS_Store
~~~

- [ ] **Step 2: Create strict TypeScript and Vite configuration**

Create tsconfig.json:

~~~json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["vite/client"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vite.config.ts"]
}
~~~

Create vite.config.ts:

~~~ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
~~~

- [ ] **Step 3: Create the HTML and React entry points**

Create index.html:

~~~html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#08090A" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <title>ต้นทุนรถของคุณ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
~~~

Create src/main.tsx:

~~~tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
~~~

Create src/App.tsx:

~~~tsx
export default function App() {
  return (
    <main>
      <nav aria-label="เมนูหลัก">
        <a href="#calculator">ต้นทุนรถของคุณ</a>
      </nav>
      <header>
        <h1>รถคันต่อไป ควรคุ้มตั้งแต่วันแรก</h1>
        <p>เปรียบเทียบต้นทุนจริง ภาระรายเดือน และจุดคุ้มทุนจากข้อมูลของคุณ</p>
        <a href="#calculator">เริ่มคำนวณ</a>
      </header>
      <section id="calculator" aria-labelledby="calculator-title">
        <h2 id="calculator-title">เริ่มจากข้อมูลของคุณ</h2>
      </section>
    </main>
  );
}
~~~

Create src/styles.css:

~~~css
:root {
  color: #f3f1ec;
  background: #08090a;
  font-family: "Noto Sans Thai", sans-serif;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
}

a {
  color: inherit;
}
~~~

- [ ] **Step 4: Verify the empty shell**

Run:

~~~bash
npm run build
~~~

Expected: TypeScript and Vite build succeed; dist/index.html exists; Car TCO Comparison.html is unchanged.

- [ ] **Step 5: Commit the shell if Git was approved**

~~~bash
git add .gitignore package.json package-lock.json index.html tsconfig.json vite.config.ts src
git commit -m "chore: bootstrap car TCO app"
~~~

---

### Task 2: Add domain types, flat-rate finance, and operating-cost math

**Files:**
- Create: src/calculations.ts
- Create: src/calculations.test.ts

**Interfaces:**
- Consumes: none.
- Produces:
  - createEmptyOperatingCosts(): OperatingCosts
  - calculateFlatLoan(input: NewCarInputs): LoanResult
  - calculateOperatingCosts(input: OperatingCosts, global: GlobalInputs): OperatingSummary
  - CalculatorInputs and result types used by every later task.

- [ ] **Step 1: Write failing tests for Bank of Thailand flat-rate math and operating costs**

Create src/calculations.test.ts:

~~~ts
import { describe, expect, it } from "vitest";
import {
  calculateFlatLoan,
  calculateOperatingCosts,
  createEmptyOperatingCosts,
  type GlobalInputs,
  type NewCarInputs,
} from "./calculations";

const global: GlobalInputs = {
  grossIncomeMonthly: 45_000,
  incomeCeilingPercent: 10,
  holdingYears: 5,
  distanceMonthlyKm: 1_200,
};

function newCar(): NewCarInputs {
  return {
    name: "รถใหม่",
    cashPrice: 100_000,
    discount: 0,
    purchaseFees: 0,
    downPaymentPercent: 0,
    flatRatePercent: 3,
    financeMonths: 24,
    endValue: 0,
    operating: createEmptyOperatingCosts(),
  };
}

describe("calculateFlatLoan", () => {
  it("matches the BOT flat-rate example", () => {
    const result = calculateFlatLoan(newCar());
    expect(result.principal).toBe(100_000);
    expect(result.totalInterest).toBe(6_000);
    expect(result.installment).toBeCloseTo(4_416.6667, 4);
  });

  it("handles a cash purchase without dividing by zero", () => {
    const input = newCar();
    input.downPaymentPercent = 100;
    input.financeMonths = 0;
    const result = calculateFlatLoan(input);
    expect(result.principal).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.installment).toBe(0);
  });
});

describe("calculateOperatingCosts", () => {
  it("normalizes energy, annual, periodic, lifestyle, and custom costs", () => {
    const input = createEmptyOperatingCosts();
    input.efficiencyKmPerUnit = 15;
    input.unitPrice = 37.5;
    input.insuranceAnnual = 12_000;
    input.tiresAmount = 16_000;
    input.tiresIntervalMonths = 40;
    input.parkingMonthly = 1_000;
    input.custom = [
      { id: "once", name: "อุปกรณ์", amount: 20_000, frequency: "once" },
      { id: "annual", name: "สมาชิก", amount: 1_200, frequency: "annual" },
    ];

    const result = calculateOperatingCosts(input, global);
    expect(result.energyMonthly).toBe(3_000);
    expect(result.fixedMonthly).toBe(1_000);
    expect(result.periodicMonthly).toBe(400);
    expect(result.lifestyleMonthly).toBe(1_000);
    expect(result.customRecurringMonthly).toBe(100);
    expect(result.oneTime).toBe(20_000);
    expect(result.totalForHorizon).toBe(350_000);
  });
});
~~~

- [ ] **Step 2: Run tests and verify the module is missing**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: FAIL because src/calculations.ts does not exist.

- [ ] **Step 3: Define the exact domain model**

Create the type section of src/calculations.ts:

~~~ts
export type EnergyType = "fuel" | "electric";
export type CostFrequency = "once" | "monthly" | "annual";

export interface CustomCost {
  id: string;
  name: string;
  amount: number;
  frequency: CostFrequency;
}

export interface OperatingCosts {
  energyType: EnergyType;
  efficiencyKmPerUnit: number;
  unitPrice: number;
  insuranceAnnual: number;
  compulsoryInsuranceAnnual: number;
  taxAnnual: number;
  inspectionAnnual: number;
  maintenanceAnnual: number;
  repairsAnnual: number;
  tiresAmount: number;
  tiresIntervalMonths: number;
  batteryAmount: number;
  batteryIntervalMonths: number;
  parkingMonthly: number;
  tollsMonthly: number;
  cleaningMonthly: number;
  custom: CustomCost[];
}

export interface GlobalInputs {
  grossIncomeMonthly: number;
  incomeCeilingPercent: number;
  holdingYears: number;
  distanceMonthlyKm: number;
}

export interface CurrentCarInputs {
  name: string;
  marketValue: number;
  endValue: number;
  outstandingPayoff: number;
  monthlyInstallment: number;
  monthsRemaining: number;
  earlySettlementFee: number;
  operating: OperatingCosts;
}

export interface NewCarInputs {
  name: string;
  cashPrice: number;
  discount: number;
  purchaseFees: number;
  downPaymentPercent: number;
  flatRatePercent: number;
  financeMonths: number;
  endValue: number;
  operating: OperatingCosts;
}

export interface CalculatorInputs {
  global: GlobalInputs;
  current: CurrentCarInputs;
  next: NewCarInputs;
}

export interface LoanResult {
  netPrice: number;
  downPayment: number;
  principal: number;
  totalInterest: number;
  installment: number;
}

export interface OperatingSummary {
  energyMonthly: number;
  fixedMonthly: number;
  periodicMonthly: number;
  lifestyleMonthly: number;
  customRecurringMonthly: number;
  oneTime: number;
  recurringMonthly: number;
  totalForHorizon: number;
}

export interface CostBreakdown {
  acquisition: number;
  financeInterest: number;
  fees: number;
  energy: number;
  fixed: number;
  periodic: number;
  lifestyle: number;
  custom: number;
  resaleCredit: number;
}

export interface ScenarioResult {
  tco: number;
  averageMonthlyTco: number;
  monthlyCashBurden: number;
  installment: number;
  downPayment: number;
  totalFinanceInterest: number;
  endValue: number;
  operating: OperatingSummary;
  breakdown: CostBreakdown;
  monthlyCashFlow: number[];
}

export interface AffordabilityResult {
  downPaymentPass: boolean;
  termPass: boolean;
  originalIncomePass: boolean;
  customIncomePass: boolean;
  incomeSharePercent: number;
}

export interface ComparisonResult {
  current: ScenarioResult;
  next: ScenarioResult;
  difference: number;
  winner: "current" | "new" | "equal";
  switchDayCash: number;
  breakEvenMonth: number | null;
  affordability: AffordabilityResult;
}

export type FieldErrors = Record<string, string>;
~~~

- [ ] **Step 4: Implement the minimal flat-rate and operating functions**

Append to src/calculations.ts:

~~~ts
export function createEmptyOperatingCosts(): OperatingCosts {
  return {
    energyType: "fuel",
    efficiencyKmPerUnit: 0,
    unitPrice: 0,
    insuranceAnnual: 0,
    compulsoryInsuranceAnnual: 0,
    taxAnnual: 0,
    inspectionAnnual: 0,
    maintenanceAnnual: 0,
    repairsAnnual: 0,
    tiresAmount: 0,
    tiresIntervalMonths: 0,
    batteryAmount: 0,
    batteryIntervalMonths: 0,
    parkingMonthly: 0,
    tollsMonthly: 0,
    cleaningMonthly: 0,
    custom: [],
  };
}

export function calculateFlatLoan(input: NewCarInputs): LoanResult {
  const netPrice = input.cashPrice - input.discount;
  const downPayment = netPrice * (input.downPaymentPercent / 100);
  const principal = netPrice - downPayment;
  const loanYears = input.financeMonths / 12;
  const totalInterest = principal * (input.flatRatePercent / 100) * loanYears;
  const installment =
    principal > 0 && input.financeMonths > 0
      ? (principal + totalInterest) / input.financeMonths
      : 0;

  return { netPrice, downPayment, principal, totalInterest, installment };
}

export function calculateOperatingCosts(
  input: OperatingCosts,
  global: GlobalInputs,
): OperatingSummary {
  const holdingMonths = global.holdingYears * 12;
  const energyMonthly =
    input.efficiencyKmPerUnit > 0
      ? (global.distanceMonthlyKm / input.efficiencyKmPerUnit) * input.unitPrice
      : 0;
  const fixedMonthly =
    (input.insuranceAnnual +
      input.compulsoryInsuranceAnnual +
      input.taxAnnual +
      input.inspectionAnnual +
      input.maintenanceAnnual +
      input.repairsAnnual) /
    12;
  const periodicMonthly =
    (input.tiresAmount > 0 && input.tiresIntervalMonths > 0
      ? input.tiresAmount / input.tiresIntervalMonths
      : 0) +
    (input.batteryAmount > 0 && input.batteryIntervalMonths > 0
      ? input.batteryAmount / input.batteryIntervalMonths
      : 0);
  const lifestyleMonthly =
    input.parkingMonthly + input.tollsMonthly + input.cleaningMonthly;
  const customRecurringMonthly = input.custom.reduce((sum, cost) => {
    if (cost.frequency === "monthly") return sum + cost.amount;
    if (cost.frequency === "annual") return sum + cost.amount / 12;
    return sum;
  }, 0);
  const oneTime = input.custom.reduce(
    (sum, cost) => sum + (cost.frequency === "once" ? cost.amount : 0),
    0,
  );
  const recurringMonthly =
    energyMonthly +
    fixedMonthly +
    periodicMonthly +
    lifestyleMonthly +
    customRecurringMonthly;

  return {
    energyMonthly,
    fixedMonthly,
    periodicMonthly,
    lifestyleMonthly,
    customRecurringMonthly,
    oneTime,
    recurringMonthly,
    totalForHorizon: recurringMonthly * holdingMonths + oneTime,
  };
}
~~~

- [ ] **Step 5: Run the focused tests**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: all three tests pass.

- [ ] **Step 6: Commit the financial primitives if Git was approved**

~~~bash
git add src/calculations.ts src/calculations.test.ts
git commit -m "feat: add flat-rate and operating cost math"
~~~

---

### Task 3: Add scenarios, affordability, comparison, and break-even

**Files:**
- Modify: src/calculations.ts
- Modify: src/calculations.test.ts

**Interfaces:**
- Consumes: calculateFlatLoan(), calculateOperatingCosts(), and all Task 2 domain types.
- Produces:
  - calculateCurrentScenario(inputs: CalculatorInputs): ScenarioResult
  - calculateNewScenario(inputs: CalculatorInputs): ScenarioResult
  - calculateComparison(inputs: CalculatorInputs): ComparisonResult

- [ ] **Step 1: Add a complete scenario fixture and failing comparison tests**

Append to src/calculations.test.ts:

~~~ts
import {
  calculateComparison,
  type CalculatorInputs,
} from "./calculations";

function comparisonInputs(): CalculatorInputs {
  const currentOperating = createEmptyOperatingCosts();
  currentOperating.efficiencyKmPerUnit = 15;
  currentOperating.unitPrice = 37.5;

  const nextOperating = createEmptyOperatingCosts();
  nextOperating.energyType = "electric";
  nextOperating.efficiencyKmPerUnit = 6;
  nextOperating.unitPrice = 4;

  return {
    global: {
      grossIncomeMonthly: 100_000,
      incomeCeilingPercent: 40,
      holdingYears: 5,
      distanceMonthlyKm: 1_200,
    },
    current: {
      name: "รถปัจจุบัน",
      marketValue: 300_000,
      endValue: 150_000,
      outstandingPayoff: 120_000,
      monthlyInstallment: 11_000,
      monthsRemaining: 12,
      earlySettlementFee: 2_000,
      operating: currentOperating,
    },
    next: {
      name: "รถใหม่",
      cashPrice: 600_000,
      discount: 0,
      purchaseFees: 10_000,
      downPaymentPercent: 20,
      flatRatePercent: 3,
      financeMonths: 48,
      endValue: 300_000,
      operating: nextOperating,
    },
  };
}

describe("calculateComparison", () => {
  it("keeps economic TCO separate from monthly cash burden", () => {
    const result = calculateComparison(comparisonInputs());
    expect(result.current.tco).toBe(342_000);
    expect(result.next.tco).toBe(415_600);
    expect(result.current.monthlyCashBurden).toBe(14_000);
    expect(result.next.installment).toBe(11_200);
    expect(result.next.monthlyCashBurden).toBe(12_000);
    expect(result.winner).toBe("current");
    expect(result.difference).toBe(73_600);
  });

  it("calculates switch-day cash from equity and upfront costs", () => {
    const result = calculateComparison(comparisonInputs());
    expect(result.switchDayCash).toBe(-48_000);
    expect(result.breakEvenMonth).toBe(0);
  });

  it("shows original and adjusted income tests independently", () => {
    const input = comparisonInputs();
    input.global.grossIncomeMonthly = 40_000;
    input.global.incomeCeilingPercent = 40;
    const result = calculateComparison(input);
    expect(result.affordability.incomeSharePercent).toBe(30);
    expect(result.affordability.originalIncomePass).toBe(false);
    expect(result.affordability.customIncomePass).toBe(true);
    expect(result.affordability.downPaymentPass).toBe(true);
    expect(result.affordability.termPass).toBe(true);
  });

  it("returns no break-even when switching never catches up", () => {
    const input = comparisonInputs();
    input.current.marketValue = 0;
    input.current.outstandingPayoff = 0;
    input.current.monthlyInstallment = 0;
    input.current.monthsRemaining = 0;
    expect(calculateComparison(input).breakEvenMonth).toBeNull();
  });

  it("treats exact 10% and 40% income boundaries as passing", () => {
    const atTen = comparisonInputs();
    atTen.global.grossIncomeMonthly = 120_000;
    atTen.global.incomeCeilingPercent = 10;
    expect(calculateComparison(atTen).affordability).toMatchObject({
      incomeSharePercent: 10,
      originalIncomePass: true,
      customIncomePass: true,
    });

    const atForty = comparisonInputs();
    atForty.global.grossIncomeMonthly = 30_000;
    atForty.global.incomeCeilingPercent = 40;
    expect(calculateComparison(atForty).affordability).toMatchObject({
      incomeSharePercent: 40,
      originalIncomePass: false,
      customIncomePass: true,
    });

    const cashPurchase = comparisonInputs();
    cashPurchase.next.downPaymentPercent = 100;
    cashPurchase.next.financeMonths = 84;
    expect(calculateComparison(cashPurchase).affordability.termPass).toBe(true);
  });
});
~~~

- [ ] **Step 2: Run tests and verify the missing export failures**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: FAIL because calculateComparison is not exported.

- [ ] **Step 3: Implement current and new scenario calculations**

Append to src/calculations.ts:

~~~ts
function buildBreakdown(
  acquisition: number,
  financeInterest: number,
  fees: number,
  endValue: number,
  operating: OperatingSummary,
  holdingMonths: number,
): CostBreakdown {
  return {
    acquisition,
    financeInterest,
    fees,
    energy: operating.energyMonthly * holdingMonths,
    fixed: operating.fixedMonthly * holdingMonths,
    periodic: operating.periodicMonthly * holdingMonths,
    lifestyle: operating.lifestyleMonthly * holdingMonths,
    custom:
      operating.customRecurringMonthly * holdingMonths + operating.oneTime,
    resaleCredit: -endValue,
  };
}

function totalBreakdown(breakdown: CostBreakdown): number {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}

export function calculateCurrentScenario(
  inputs: CalculatorInputs,
): ScenarioResult {
  const holdingMonths = inputs.global.holdingYears * 12;
  const operating = calculateOperatingCosts(
    inputs.current.operating,
    inputs.global,
  );
  const remainingInterest = Math.max(
    0,
    inputs.current.monthlyInstallment * inputs.current.monthsRemaining -
      inputs.current.outstandingPayoff,
  );
  const breakdown = buildBreakdown(
    inputs.current.marketValue,
    remainingInterest,
    0,
    inputs.current.endValue,
    operating,
    holdingMonths,
  );
  const tco = totalBreakdown(breakdown);
  const monthlyCashFlow = Array.from(
    { length: holdingMonths },
    (_, month) =>
      operating.recurringMonthly +
      (month < inputs.current.monthsRemaining
        ? inputs.current.monthlyInstallment
        : 0),
  );

  return {
    tco,
    averageMonthlyTco: tco / holdingMonths,
    monthlyCashBurden:
      operating.recurringMonthly + inputs.current.monthlyInstallment,
    installment: inputs.current.monthlyInstallment,
    downPayment: 0,
    totalFinanceInterest: remainingInterest,
    endValue: inputs.current.endValue,
    operating,
    breakdown,
    monthlyCashFlow,
  };
}

export function calculateNewScenario(
  inputs: CalculatorInputs,
): ScenarioResult {
  const holdingMonths = inputs.global.holdingYears * 12;
  const loan = calculateFlatLoan(inputs.next);
  const operating = calculateOperatingCosts(inputs.next.operating, inputs.global);
  const breakdown = buildBreakdown(
    loan.netPrice,
    loan.totalInterest,
    inputs.next.purchaseFees,
    inputs.next.endValue,
    operating,
    holdingMonths,
  );
  const tco = totalBreakdown(breakdown);
  const monthlyCashFlow = Array.from(
    { length: holdingMonths },
    (_, month) =>
      operating.recurringMonthly +
      (month < inputs.next.financeMonths ? loan.installment : 0),
  );

  return {
    tco,
    averageMonthlyTco: tco / holdingMonths,
    monthlyCashBurden: operating.recurringMonthly + loan.installment,
    installment: loan.installment,
    downPayment: loan.downPayment,
    totalFinanceInterest: loan.totalInterest,
    endValue: inputs.next.endValue,
    operating,
    breakdown,
    monthlyCashFlow,
  };
}
~~~

- [ ] **Step 4: Implement affordability and monthly break-even**

Append to src/calculations.ts:

~~~ts
function findBreakEvenMonth(
  switchDayCash: number,
  current: ScenarioResult,
  next: ScenarioResult,
): number | null {
  let keepCumulative = current.operating.oneTime;
  let switchCumulative = switchDayCash;
  if (switchCumulative <= keepCumulative) return 0;

  for (let month = 0; month < current.monthlyCashFlow.length; month += 1) {
    keepCumulative += current.monthlyCashFlow[month];
    switchCumulative += next.monthlyCashFlow[month];
    if (switchCumulative <= keepCumulative) return month + 1;
  }
  return null;
}

export function calculateComparison(
  inputs: CalculatorInputs,
): ComparisonResult {
  const current = calculateCurrentScenario(inputs);
  const next = calculateNewScenario(inputs);
  const loan = calculateFlatLoan(inputs.next);
  const difference = next.tco - current.tco;
  const incomeSharePercent =
    (next.monthlyCashBurden / inputs.global.grossIncomeMonthly) * 100;
  const switchDayCash =
    loan.downPayment +
    inputs.next.purchaseFees +
    next.operating.oneTime +
    inputs.current.outstandingPayoff +
    inputs.current.earlySettlementFee -
    inputs.current.marketValue;

  return {
    current,
    next,
    difference,
    winner:
      Math.abs(difference) < 0.01
        ? "equal"
        : difference < 0
          ? "new"
          : "current",
    switchDayCash,
    breakEvenMonth: findBreakEvenMonth(switchDayCash, current, next),
    affordability: {
      downPaymentPass: loan.downPayment >= loan.netPrice * 0.2,
      termPass: loan.principal === 0 || inputs.next.financeMonths <= 48,
      originalIncomePass: incomeSharePercent <= 10,
      customIncomePass:
        incomeSharePercent <= inputs.global.incomeCeilingPercent,
      incomeSharePercent,
    },
  };
}
~~~

- [ ] **Step 5: Run all calculation tests**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: all eight tests pass.

- [ ] **Step 6: Commit scenarios and comparison if Git was approved**

~~~bash
git add src/calculations.ts src/calculations.test.ts
git commit -m "feat: compare car ownership scenarios"
~~~

---

### Task 4: Add validation, defaults, and versioned local persistence

**Files:**
- Modify: src/calculations.ts
- Modify: src/calculations.test.ts
- Modify: src/App.tsx

**Interfaces:**
- Consumes: CalculatorInputs and calculateComparison() from Task 3.
- Produces:
  - validateInputs(inputs: CalculatorInputs): FieldErrors
  - createDefaultInputs(): CalculatorInputs inside App.tsx
  - localStorage record shaped as { version: 1, inputs: CalculatorInputs } under key car-tco-th:v1.

- [ ] **Step 1: Write failing validation tests**

Append to src/calculations.test.ts:

~~~ts
import { validateInputs } from "./calculations";

describe("validateInputs", () => {
  it("accepts the complete comparison fixture", () => {
    expect(validateInputs(comparisonInputs())).toEqual({});
  });

  it("requires positive income and both efficiencies", () => {
    const input = comparisonInputs();
    input.global.grossIncomeMonthly = 0;
    input.current.operating.efficiencyKmPerUnit = 0;
    input.next.operating.efficiencyKmPerUnit = 0;
    expect(validateInputs(input)).toMatchObject({
      "global.grossIncomeMonthly": "กรุณาระบุรายได้รวมต่อเดือน",
      "current.operating.efficiencyKmPerUnit": "ค่าประสิทธิภาพต้องมากกว่า 0",
      "next.operating.efficiencyKmPerUnit": "ค่าประสิทธิภาพต้องมากกว่า 0",
    });
  });

  it("rejects a holding period shorter than either finance period", () => {
    const input = comparisonInputs();
    input.global.holdingYears = 1;
    input.next.financeMonths = 48;
    input.current.monthsRemaining = 24;
    expect(validateInputs(input)).toMatchObject({
      "global.holdingYears": "ระยะเวลาถือครองต้องครอบคลุมระยะเวลาผ่อนทั้งหมด",
    });

    const cashPurchase = comparisonInputs();
    cashPurchase.global.holdingYears = 1;
    cashPurchase.current.outstandingPayoff = 0;
    cashPurchase.current.monthlyInstallment = 0;
    cashPurchase.current.monthsRemaining = 0;
    cashPurchase.next.downPaymentPercent = 100;
    cashPurchase.next.financeMonths = 84;
    expect(validateInputs(cashPurchase)["global.holdingYears"]).toBeUndefined();
  });

  it("requires the current finance group to be complete", () => {
    const input = comparisonInputs();
    input.current.monthlyInstallment = 0;
    expect(validateInputs(input)).toMatchObject({
      "current.monthlyInstallment": "กรุณาระบุค่างวดรถปัจจุบัน",
    });
  });

  it("requires a replacement interval when a periodic amount exists", () => {
    const input = comparisonInputs();
    input.next.operating.tiresAmount = 20_000;
    input.next.operating.tiresIntervalMonths = 0;
    expect(validateInputs(input)).toMatchObject({
      "next.operating.tiresIntervalMonths": "กรุณาระบุรอบเปลี่ยนเป็นเดือน",
    });
  });
});
~~~

- [ ] **Step 2: Run tests and verify validation is missing**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: FAIL because validateInputs is not exported.

- [ ] **Step 3: Implement explicit validation**

Append to src/calculations.ts:

~~~ts
function requireNonNegative(
  errors: FieldErrors,
  path: string,
  value: number,
): void {
  if (!Number.isFinite(value) || value < 0) {
    errors[path] = "ค่าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป";
  }
}

function validateOperating(
  errors: FieldErrors,
  prefix: string,
  operating: OperatingCosts,
): void {
  if (
    !Number.isFinite(operating.efficiencyKmPerUnit) ||
    operating.efficiencyKmPerUnit <= 0
  ) {
    errors[prefix + ".efficiencyKmPerUnit"] = "ค่าประสิทธิภาพต้องมากกว่า 0";
  }
  requireNonNegative(errors, prefix + ".unitPrice", operating.unitPrice);

  const nonNegativeFields: Array<keyof OperatingCosts> = [
    "insuranceAnnual",
    "compulsoryInsuranceAnnual",
    "taxAnnual",
    "inspectionAnnual",
    "maintenanceAnnual",
    "repairsAnnual",
    "tiresAmount",
    "tiresIntervalMonths",
    "batteryAmount",
    "batteryIntervalMonths",
    "parkingMonthly",
    "tollsMonthly",
    "cleaningMonthly",
  ];
  for (const field of nonNegativeFields) {
    requireNonNegative(errors, prefix + "." + field, Number(operating[field]));
  }

  if (operating.tiresAmount > 0 && operating.tiresIntervalMonths <= 0) {
    errors[prefix + ".tiresIntervalMonths"] =
      "กรุณาระบุรอบเปลี่ยนเป็นเดือน";
  }
  if (operating.batteryAmount > 0 && operating.batteryIntervalMonths <= 0) {
    errors[prefix + ".batteryIntervalMonths"] =
      "กรุณาระบุรอบเปลี่ยนเป็นเดือน";
  }
  operating.custom.forEach((cost, index) => {
    requireNonNegative(errors, prefix + ".custom." + index, cost.amount);
    if (cost.amount > 0 && cost.name.trim() === "") {
      errors[prefix + ".custom." + index] = "กรุณาระบุชื่อค่าใช้จ่าย";
    }
  });
}

export function validateInputs(inputs: CalculatorInputs): FieldErrors {
  const errors: FieldErrors = {};
  const holdingMonths = inputs.global.holdingYears * 12;

  if (
    !Number.isFinite(inputs.global.grossIncomeMonthly) ||
    inputs.global.grossIncomeMonthly <= 0
  ) {
    errors["global.grossIncomeMonthly"] = "กรุณาระบุรายได้รวมต่อเดือน";
  }
  if (
    !Number.isFinite(inputs.global.holdingYears) ||
    inputs.global.holdingYears < 1 ||
    inputs.global.holdingYears > 20
  ) {
    errors["global.holdingYears"] = "ระยะเวลาถือครองต้องอยู่ระหว่าง 1–20 ปี";
  }
  if (
    inputs.global.incomeCeilingPercent < 10 ||
    inputs.global.incomeCeilingPercent > 40
  ) {
    errors["global.incomeCeilingPercent"] = "เลือกเพดานระหว่าง 10–40%";
  }
  requireNonNegative(
    errors,
    "global.distanceMonthlyKm",
    inputs.global.distanceMonthlyKm,
  );

  const currentNumbers: Array<[string, number]> = [
    ["current.marketValue", inputs.current.marketValue],
    ["current.endValue", inputs.current.endValue],
    ["current.outstandingPayoff", inputs.current.outstandingPayoff],
    ["current.monthlyInstallment", inputs.current.monthlyInstallment],
    ["current.monthsRemaining", inputs.current.monthsRemaining],
    ["current.earlySettlementFee", inputs.current.earlySettlementFee],
  ];
  currentNumbers.forEach(([path, value]) =>
    requireNonNegative(errors, path, value),
  );

  const hasCurrentFinance =
    inputs.current.outstandingPayoff > 0 ||
    inputs.current.monthlyInstallment > 0 ||
    inputs.current.monthsRemaining > 0;
  if (hasCurrentFinance && inputs.current.outstandingPayoff <= 0) {
    errors["current.outstandingPayoff"] = "กรุณาระบุยอดปิดบัญชี";
  }
  if (hasCurrentFinance && inputs.current.monthlyInstallment <= 0) {
    errors["current.monthlyInstallment"] = "กรุณาระบุค่างวดรถปัจจุบัน";
  }
  if (hasCurrentFinance && inputs.current.monthsRemaining <= 0) {
    errors["current.monthsRemaining"] = "กรุณาระบุจำนวนงวดคงเหลือ";
  }

  const nextNumbers: Array<[string, number]> = [
    ["next.cashPrice", inputs.next.cashPrice],
    ["next.discount", inputs.next.discount],
    ["next.purchaseFees", inputs.next.purchaseFees],
    ["next.flatRatePercent", inputs.next.flatRatePercent],
    ["next.financeMonths", inputs.next.financeMonths],
    ["next.endValue", inputs.next.endValue],
  ];
  nextNumbers.forEach(([path, value]) =>
    requireNonNegative(errors, path, value),
  );
  if (inputs.next.cashPrice <= 0) {
    errors["next.cashPrice"] = "กรุณาระบุราคารถใหม่";
  }
  if (inputs.next.discount > inputs.next.cashPrice) {
    errors["next.discount"] = "ส่วนลดต้องไม่เกินราคารถ";
  }
  if (
    inputs.next.downPaymentPercent < 0 ||
    inputs.next.downPaymentPercent > 100
  ) {
    errors["next.downPaymentPercent"] = "เงินดาวน์ต้องอยู่ระหว่าง 0–100%";
  }
  const loan = calculateFlatLoan(inputs.next);
  if (loan.principal > 0 && inputs.next.financeMonths <= 0) {
    errors["next.financeMonths"] = "กรุณาระบุจำนวนเดือนที่ผ่อน";
  }

  if (
    (loan.principal > 0 && holdingMonths < inputs.next.financeMonths) ||
    holdingMonths < inputs.current.monthsRemaining
  ) {
    errors["global.holdingYears"] =
      "ระยะเวลาถือครองต้องครอบคลุมระยะเวลาผ่อนทั้งหมด";
  }

  validateOperating(errors, "current.operating", inputs.current.operating);
  validateOperating(errors, "next.operating", inputs.next.operating);
  return errors;
}
~~~

- [ ] **Step 4: Run validation tests**

Run:

~~~bash
npm test -- src/calculations.test.ts
~~~

Expected: all thirteen tests pass.

- [ ] **Step 5: Add canonical defaults and defensive localStorage loading**

Replace src/App.tsx with:

~~~tsx
import { useEffect, useMemo, useState } from "react";
import {
  calculateComparison,
  createEmptyOperatingCosts,
  validateInputs,
  type CalculatorInputs,
} from "./calculations";

const STORAGE_KEY = "car-tco-th:v1";

function createDefaultInputs(): CalculatorInputs {
  return {
    global: {
      grossIncomeMonthly: 0,
      incomeCeilingPercent: 10,
      holdingYears: 5,
      distanceMonthlyKm: 1_200,
    },
    current: {
      name: "รถปัจจุบัน",
      marketValue: 0,
      endValue: 0,
      outstandingPayoff: 0,
      monthlyInstallment: 0,
      monthsRemaining: 0,
      earlySettlementFee: 0,
      operating: createEmptyOperatingCosts(),
    },
    next: {
      name: "รถใหม่",
      cashPrice: 0,
      discount: 0,
      purchaseFees: 0,
      downPaymentPercent: 20,
      flatRatePercent: 0,
      financeMonths: 48,
      endValue: 0,
      operating: createEmptyOperatingCosts(),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function loadInputs(): CalculatorInputs {
  const fallback = createDefaultInputs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored) || stored.version !== 1 || !isRecord(stored.inputs)) {
      return fallback;
    }
    const candidate = stored.inputs as unknown as CalculatorInputs;
    if (
      !isRecord(candidate.global) ||
      !isRecord(candidate.current) ||
      !isRecord(candidate.next) ||
      !isRecord(candidate.current.operating) ||
      !isRecord(candidate.next.operating) ||
      !Array.isArray(candidate.current.operating.custom) ||
      !Array.isArray(candidate.next.operating.custom)
    ) {
      return fallback;
    }
    return candidate;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [inputs, setInputs] = useState<CalculatorInputs>(loadInputs);
  const [activeStep, setActiveStep] = useState(0);
  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const result = useMemo(
    () =>
      Object.keys(errors).length === 0 ? calculateComparison(inputs) : null,
    [errors, inputs],
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, inputs }),
    );
  }, [inputs]);

  return (
    <main>
      <nav aria-label="เมนูหลัก">
        <a href="#calculator">ต้นทุนรถของคุณ</a>
      </nav>
      <header>
        <h1>รถคันต่อไป ควรคุ้มตั้งแต่วันแรก</h1>
        <p>เปรียบเทียบต้นทุนจริง ภาระรายเดือน และจุดคุ้มทุนจากข้อมูลของคุณ</p>
        <a href="#calculator">เริ่มคำนวณ</a>
      </header>
      <section id="calculator" aria-labelledby="calculator-title">
        <h2 id="calculator-title">เริ่มจากข้อมูลของคุณ</h2>
        <p>
          {result
            ? "ข้อมูลพร้อมสำหรับแสดงผลเปรียบเทียบ"
            : "กรอกข้อมูลที่จำเป็นเพื่อเริ่มเปรียบเทียบ"}
        </p>
        <button type="button" onClick={() => setActiveStep((activeStep + 1) % 4)}>
          ขั้นตอน {activeStep + 1} จาก 4
        </button>
        <button type="button" onClick={() => setInputs(createDefaultInputs())}>
          ล้างข้อมูล
        </button>
      </section>
    </main>
  );
}
~~~

- [ ] **Step 6: Verify persistence code and build**

Run:

~~~bash
npm test
npm run build
~~~

Expected: all tests pass and the production build succeeds.

- [ ] **Step 7: Commit validation and persistence if Git was approved**

~~~bash
git add src/App.tsx src/calculations.ts src/calculations.test.ts
git commit -m "feat: validate and persist calculator inputs"
~~~

---

### Task 5: Build the four-stage Guided Studio form

**Files:**
- Create: src/GuidedCalculator.tsx
- Modify: src/App.tsx

**Interfaces:**
- Consumes: CalculatorInputs and FieldErrors from calculations.ts.
- Produces:
  - GuidedCalculatorProps with inputs, errors, activeStep, onStepChange(), and onChange().
  - Complete edits for global, current, new, operating, and custom-cost inputs.

- [ ] **Step 1: Add shared labeled-input and operating-field definitions**

Create src/GuidedCalculator.tsx with these foundations:

~~~tsx
import type {
  CalculatorInputs,
  CostFrequency,
  CustomCost,
  FieldErrors,
  OperatingCosts,
} from "./calculations";

interface GuidedCalculatorProps {
  inputs: CalculatorInputs;
  errors: FieldErrors;
  activeStep: number;
  onStepChange: (step: number) => void;
  onChange: (inputs: CalculatorInputs) => void;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function NumberField({
  id,
  label,
  value,
  error,
  min = 0,
  max,
  step = 1,
  suffix,
  onChange,
}: NumberFieldProps) {
  const errorId = id + "-error";
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="input-shell">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </span>
      {error && (
        <small id={errorId} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

type OperatingNumberKey = Exclude<
  keyof OperatingCosts,
  "energyType" | "custom"
>;

const operatingFields: Array<{
  key: OperatingNumberKey;
  label: string;
  suffix: string;
}> = [
  { key: "efficiencyKmPerUnit", label: "ประสิทธิภาพ", suffix: "กม./หน่วย" },
  { key: "unitPrice", label: "ราคาพลังงาน", suffix: "บาท/หน่วย" },
  { key: "insuranceAnnual", label: "ประกันภาคสมัครใจ", suffix: "บาท/ปี" },
  { key: "compulsoryInsuranceAnnual", label: "พ.ร.บ.", suffix: "บาท/ปี" },
  { key: "taxAnnual", label: "ภาษีรถยนต์", suffix: "บาท/ปี" },
  { key: "inspectionAnnual", label: "ค่าตรวจสภาพ", suffix: "บาท/ปี" },
  { key: "maintenanceAnnual", label: "บำรุงรักษา", suffix: "บาท/ปี" },
  { key: "repairsAnnual", label: "งบซ่อมฉุกเฉิน", suffix: "บาท/ปี" },
  { key: "tiresAmount", label: "ค่ายางต่อชุด", suffix: "บาท" },
  { key: "tiresIntervalMonths", label: "รอบเปลี่ยนยาง", suffix: "เดือน" },
  { key: "batteryAmount", label: "ค่าแบตเตอรี่", suffix: "บาท" },
  { key: "batteryIntervalMonths", label: "รอบเปลี่ยนแบตเตอรี่", suffix: "เดือน" },
  { key: "parkingMonthly", label: "ค่าที่จอดรถ", suffix: "บาท/เดือน" },
  { key: "tollsMonthly", label: "ค่าทางด่วน", suffix: "บาท/เดือน" },
  { key: "cleaningMonthly", label: "ค่าล้างและดูแลรถ", suffix: "บาท/เดือน" },
];
~~~

- [ ] **Step 2: Implement the reusable operating-cost editor**

Append to src/GuidedCalculator.tsx:

~~~tsx
interface OperatingEditorProps {
  idPrefix: "current.operating" | "next.operating";
  value: OperatingCosts;
  errors: FieldErrors;
  onChange: (value: OperatingCosts) => void;
}

function OperatingEditor({
  idPrefix,
  value,
  errors,
  onChange,
}: OperatingEditorProps) {
  const updateCustom = (id: string, patch: Partial<CustomCost>) => {
    onChange({
      ...value,
      custom: value.custom.map((cost) =>
        cost.id === id ? { ...cost, ...patch } : cost,
      ),
    });
  };

  return (
    <div className="operating-grid">
      <label className="field" htmlFor={idPrefix + ".energyType"}>
        <span>ประเภทพลังงาน</span>
        <select
          id={idPrefix + ".energyType"}
          value={value.energyType}
          onChange={(event) =>
            onChange({
              ...value,
              energyType: event.target.value as OperatingCosts["energyType"],
            })
          }
        >
          <option value="fuel">น้ำมัน</option>
          <option value="electric">ไฟฟ้า</option>
        </select>
      </label>

      {operatingFields.map((field) => {
        const path = idPrefix + "." + field.key;
        return (
          <NumberField
            key={field.key}
            id={path}
            label={field.label}
            value={value[field.key]}
            suffix={field.suffix}
            error={errors[path]}
            onChange={(next) => onChange({ ...value, [field.key]: next })}
          />
        );
      })}

      <div className="custom-costs">
        <h4>ค่าใช้จ่ายเพิ่มเติม</h4>
        {value.custom.map((cost, index) => {
          const errorId = idPrefix + ".custom." + index + ".amount-error";
          return (
            <div className="custom-cost-row" key={cost.id}>
              <label>
                <span>ชื่อค่าใช้จ่าย</span>
                <input
                  value={cost.name}
                  aria-invalid={Boolean(errors[idPrefix + ".custom." + index])}
                  aria-describedby={errors[idPrefix + ".custom." + index] ? errorId : undefined}
                  onChange={(event) =>
                    updateCustom(cost.id, { name: event.target.value })
                  }
                />
              </label>
              <NumberField
                id={idPrefix + ".custom." + index + ".amount"}
                label="จำนวนเงิน"
                value={cost.amount}
                suffix="บาท"
                error={errors[idPrefix + ".custom." + index]}
                onChange={(amount) => updateCustom(cost.id, { amount })}
              />
              <label>
                <span>ความถี่</span>
                <select
                  value={cost.frequency}
                  onChange={(event) =>
                    updateCustom(cost.id, {
                      frequency: event.target.value as CostFrequency,
                    })
                  }
                >
                  <option value="once">ครั้งเดียว</option>
                  <option value="monthly">รายเดือน</option>
                  <option value="annual">รายปี</option>
                </select>
              </label>
              <button
                type="button"
                aria-label={"ลบค่าใช้จ่าย " + (cost.name || String(index + 1))}
                onClick={() =>
                  onChange({
                    ...value,
                    custom: value.custom.filter((item) => item.id !== cost.id),
                  })
                }
              >
                ลบ
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              custom: [
                ...value.custom,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  amount: 0,
                  frequency: "once",
                },
              ],
            })
          }
        >
          เพิ่มค่าใช้จ่าย
        </button>
      </div>
    </div>
  );
}
~~~

- [ ] **Step 3: Implement all four stages and immutable updates**

Append to src/GuidedCalculator.tsx:

~~~tsx
const steps = ["ข้อมูลการเงิน", "รถปัจจุบัน", "รถใหม่", "ตรวจผล"];

export default function GuidedCalculator({
  inputs,
  errors,
  activeStep,
  onStepChange,
  onChange,
}: GuidedCalculatorProps) {
  const setGlobal = (
    field: keyof CalculatorInputs["global"],
    value: number,
  ) => onChange({ ...inputs, global: { ...inputs.global, [field]: value } });

  const setCurrentNumber = (
    field: Exclude<keyof CalculatorInputs["current"], "name" | "operating">,
    value: number,
  ) => onChange({ ...inputs, current: { ...inputs.current, [field]: value } });

  const setNextNumber = (
    field: Exclude<keyof CalculatorInputs["next"], "name" | "operating">,
    value: number,
  ) => onChange({ ...inputs, next: { ...inputs.next, [field]: value } });

  const netNewPrice = Math.max(
    0,
    inputs.next.cashPrice - inputs.next.discount,
  );

  return (
    <div className="guided-studio">
      <ol className="step-tabs" aria-label="ขั้นตอนการคำนวณ">
        {steps.map((step, index) => (
          <li key={step}>
            <button
              type="button"
              aria-current={activeStep === index ? "step" : undefined}
              onClick={() => onStepChange(index)}
            >
              <span>{index + 1}</span>
              {step}
            </button>
          </li>
        ))}
      </ol>

      <div className="stage-panel">
        {activeStep === 0 && (
          <fieldset>
            <legend>ข้อมูลการเงินและการใช้งาน</legend>
            <NumberField
              id="global.grossIncomeMonthly"
              label="รายได้รวมต่อเดือน"
              value={inputs.global.grossIncomeMonthly}
              suffix="บาท"
              error={errors["global.grossIncomeMonthly"]}
              onChange={(value) => setGlobal("grossIncomeMonthly", value)}
            />
            <NumberField
              id="global.holdingYears"
              label="ระยะเวลาถือครอง"
              value={inputs.global.holdingYears}
              min={1}
              max={20}
              suffix="ปี"
              error={errors["global.holdingYears"]}
              onChange={(value) => setGlobal("holdingYears", value)}
            />
            <NumberField
              id="global.distanceMonthlyKm"
              label="ระยะทางต่อเดือน"
              value={inputs.global.distanceMonthlyKm}
              suffix="กม."
              error={errors["global.distanceMonthlyKm"]}
              onChange={(value) => setGlobal("distanceMonthlyKm", value)}
            />
            <label className="range-field" htmlFor="global.incomeCeilingPercent">
              <span>เพดานค่าเดินทาง {inputs.global.incomeCeilingPercent}% ของรายได้</span>
              <input
                id="global.incomeCeilingPercent"
                type="range"
                min="10"
                max="40"
                step="1"
                value={inputs.global.incomeCeilingPercent}
                onChange={(event) =>
                  setGlobal("incomeCeilingPercent", Number(event.target.value))
                }
              />
              <small>10% คือเกณฑ์ดั้งเดิม ค่าสูงกว่านี้คือการปรับส่วนบุคคล</small>
            </label>
          </fieldset>
        )}

        {activeStep === 1 && (
          <fieldset>
            <legend>รถปัจจุบัน</legend>
            <label className="field" htmlFor="current.name">
              <span>ชื่อรถ</span>
              <input
                id="current.name"
                value={inputs.current.name}
                onChange={(event) =>
                  onChange({
                    ...inputs,
                    current: { ...inputs.current, name: event.target.value },
                  })
                }
              />
            </label>
            <NumberField
              id="next.downPaymentAmount"
              label="เงินดาวน์เป็นจำนวนเงิน"
              value={netNewPrice * (inputs.next.downPaymentPercent / 100)}
              suffix="บาท"
              onChange={(amount) =>
                setNextNumber(
                  "downPaymentPercent",
                  netNewPrice > 0 ? (amount / netNewPrice) * 100 : 0,
                )
              }
            />
            {([
              ["marketValue", "มูลค่าขายปัจจุบัน", "บาท"],
              ["endValue", "มูลค่าเมื่อสิ้นสุดการถือครอง", "บาท"],
              ["outstandingPayoff", "ยอดปิดบัญชีปัจจุบัน", "บาท"],
              ["monthlyInstallment", "ค่างวดปัจจุบัน", "บาท/เดือน"],
              ["monthsRemaining", "จำนวนงวดคงเหลือ", "เดือน"],
              ["earlySettlementFee", "ค่าปิดบัญชีก่อนกำหนด", "บาท"],
            ] as const).map(([field, label, suffix]) => (
              <NumberField
                key={field}
                id={"current." + field}
                label={label}
                value={inputs.current[field]}
                suffix={suffix}
                error={errors["current." + field]}
                onChange={(value) => setCurrentNumber(field, value)}
              />
            ))}
            <OperatingEditor
              idPrefix="current.operating"
              value={inputs.current.operating}
              errors={errors}
              onChange={(operating) =>
                onChange({
                  ...inputs,
                  current: { ...inputs.current, operating },
                })
              }
            />
          </fieldset>
        )}

        {activeStep === 2 && (
          <fieldset>
            <legend>รถใหม่</legend>
            <label className="field" htmlFor="next.name">
              <span>ชื่อรถ</span>
              <input
                id="next.name"
                value={inputs.next.name}
                onChange={(event) =>
                  onChange({
                    ...inputs,
                    next: { ...inputs.next, name: event.target.value },
                  })
                }
              />
            </label>
            {([
              ["cashPrice", "ราคารถ", "บาท"],
              ["discount", "ส่วนลด", "บาท"],
              ["purchaseFees", "ค่าธรรมเนียมซื้อรถ", "บาท"],
              ["downPaymentPercent", "เงินดาวน์เป็นเปอร์เซ็นต์", "%"],
              ["flatRatePercent", "ดอกเบี้ย Flat Rate ต่อปี", "%"],
              ["financeMonths", "ระยะเวลาผ่อน", "เดือน"],
              ["endValue", "มูลค่าขายต่อปลายงวด", "บาท"],
            ] as const).map(([field, label, suffix]) => (
              <NumberField
                key={field}
                id={"next." + field}
                label={label}
                value={inputs.next[field]}
                suffix={suffix}
                error={errors["next." + field]}
                max={field === "downPaymentPercent" ? 100 : undefined}
                step={field === "flatRatePercent" ? 0.01 : 1}
                onChange={(value) => setNextNumber(field, value)}
              />
            ))}
            <OperatingEditor
              idPrefix="next.operating"
              value={inputs.next.operating}
              errors={errors}
              onChange={(operating) =>
                onChange({ ...inputs, next: { ...inputs.next, operating } })
              }
            />
          </fieldset>
        )}

        {activeStep === 3 && (
          <div className="review-stage">
            <h3>ตรวจข้อมูลก่อนดูผล</h3>
            <p>
              {Object.keys(errors).length === 0
                ? "ข้อมูลพร้อมแล้ว ผลเปรียบเทียบแสดงด้านล่าง"
                : "ยังมีข้อมูลที่ต้องแก้ก่อนคำนวณ"}
            </p>
          </div>
        )}

        <div className="stage-actions">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => onStepChange(activeStep - 1)}
          >
            ย้อนกลับ
          </button>
          <button
            type="button"
            disabled={activeStep === steps.length - 1}
            onClick={() => onStepChange(activeStep + 1)}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
~~~

- [ ] **Step 4: Wire GuidedCalculator into App**

Add the import:

~~~tsx
import GuidedCalculator from "./GuidedCalculator";
~~~

Replace the calculator section contents after its h2:

~~~tsx
<GuidedCalculator
  inputs={inputs}
  errors={errors}
  activeStep={activeStep}
  onStepChange={setActiveStep}
  onChange={setInputs}
/>
<button type="button" onClick={() => setInputs(createDefaultInputs())}>
  ล้างข้อมูล
</button>
~~~

- [ ] **Step 5: Verify form compilation and keyboard semantics**

Run:

~~~bash
npm test
npm run build
~~~

Expected: tests and build pass. Every control has a label; stage buttons use aria-current; invalid fields expose aria-invalid and associated error text.

- [ ] **Step 6: Commit the Guided Studio form if Git was approved**

~~~bash
git add src/App.tsx src/GuidedCalculator.tsx
git commit -m "feat: add guided TCO input flow"
~~~

---

### Task 6: Render transparent financial results and verdicts

**Files:**
- Create: src/Results.tsx
- Modify: src/App.tsx

**Interfaces:**
- Consumes: ComparisonResult or null.
- Produces: Thai verdict copy, primary metrics, 20/4/10 status, TCO breakdown tables, and an incomplete neutral state.

- [ ] **Step 1: Create formatters and verdict composition**

Create src/Results.tsx:

~~~tsx
import type {
  AffordabilityResult,
  ComparisonResult,
  ScenarioResult,
} from "./calculations";

const baht = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function formatBreakEven(month: number | null): string {
  if (month === null) return "ไม่คุ้มทุนภายในช่วงที่เลือก";
  if (month === 0) return "คุ้มทุนตั้งแต่วันเปลี่ยนรถ";
  const years = Math.floor(month / 12);
  const months = month % 12;
  if (years === 0) return months + " เดือน";
  if (months === 0) return years + " ปี";
  return years + " ปี " + months + " เดือน";
}

function verdict(result: ComparisonResult): string {
  const amount = baht.format(Math.abs(result.difference));
  const periodResult =
    result.winner === "new"
      ? "รถใหม่ประหยัดกว่า " + amount
      : result.winner === "current"
        ? "เก็บรถปัจจุบันประหยัดกว่า " + amount
        : "ต้นทุนรวมเท่ากัน";
  const affordability = result.affordability.customIncomePass
    ? "และภาระรายเดือนอยู่ในเพดานที่ตั้งไว้"
    : "แต่ภาระรายเดือนเกินเพดานที่ตั้งไว้";
  return periodResult + " " + affordability;
}

function Status({
  pass,
  children,
}: {
  pass: boolean;
  children: React.ReactNode;
}) {
  return (
    <li data-status={pass ? "pass" : "fail"}>
      <span aria-hidden="true">{pass ? "ผ่าน" : "ไม่ผ่าน"}</span>
      <span>{children}</span>
    </li>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="metric" data-emphasis={emphasis || undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
~~~

- [ ] **Step 2: Add scenario tables and the complete result layout**

Append to src/Results.tsx:

~~~tsx
function ScenarioTable({
  title,
  scenario,
}: {
  title: string;
  scenario: ScenarioResult;
}) {
  const rows = [
    ["มูลค่ารถ", scenario.breakdown.acquisition],
    ["ดอกเบี้ย", scenario.breakdown.financeInterest],
    ["ค่าธรรมเนียม", scenario.breakdown.fees],
    ["พลังงาน", scenario.breakdown.energy],
    ["ค่าใช้จ่ายรายปี", scenario.breakdown.fixed],
    ["ยางและแบตเตอรี่", scenario.breakdown.periodic],
    ["ที่จอด ทางด่วน และดูแลรถ", scenario.breakdown.lifestyle],
    ["ค่าใช้จ่ายเพิ่มเติม", scenario.breakdown.custom],
    ["หักมูลค่าปลายงวด", scenario.breakdown.resaleCredit],
  ] as const;

  return (
    <table>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th scope="col">หมวดต้นทุน</th>
          <th scope="col">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{baht.format(value)}</td>
          </tr>
        ))}
        <tr>
          <th scope="row">TCO สุทธิ</th>
          <td>{baht.format(scenario.tco)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function Results({
  result,
}: {
  result: ComparisonResult | null;
}) {
  if (!result) {
    return (
      <section className="results results-empty" aria-live="polite">
        <h2>ผลเปรียบเทียบ</h2>
        <p>กรอกข้อมูลที่จำเป็นให้ครบเพื่อดูผลโดยไม่ใช้ค่าศูนย์แทนข้อมูลที่หายไป</p>
      </section>
    );
  }

  const affordability: AffordabilityResult = result.affordability;
  return (
    <section className="results" aria-labelledby="results-title">
      <div className="verdict" aria-live="polite">
        <h2 id="results-title">คำตัดสินจากต้นทุน</h2>
        <p>{verdict(result)}</p>
      </div>

      <dl className="result-bento">
        <Metric
          label="ค่าใช้จ่ายเฉลี่ยรถปัจจุบัน"
          value={baht.format(result.current.averageMonthlyTco) + " / เดือน"}
          emphasis
        />
        <Metric
          label="ค่าใช้จ่ายเฉลี่ยรถใหม่"
          value={baht.format(result.next.averageMonthlyTco) + " / เดือน"}
          emphasis
        />
        <Metric
          label="ภาระเงินสดรถใหม่ระหว่างผ่อน"
          value={baht.format(result.next.monthlyCashBurden) + " / เดือน"}
        />
        <Metric
          label="เงินสดวันเปลี่ยนรถ"
          value={baht.format(result.switchDayCash)}
        />
        <Metric
          label="จุดคุ้มทุนกระแสเงินสด"
          value={formatBreakEven(result.breakEvenMonth)}
        />
        <Metric
          label="ดอกเบี้ยรถใหม่ตลอดสัญญา"
          value={baht.format(result.next.totalFinanceInterest)}
        />
      </dl>

      <div className="affordability">
        <h3>20/4/10 และเพดานของคุณ</h3>
        <p>
          ภาระรถคิดเป็น {affordability.incomeSharePercent.toFixed(1)}% ของรายได้รวมต่อเดือน
        </p>
        <ul>
          <Status pass={affordability.downPaymentPass}>ดาวน์อย่างน้อย 20%</Status>
          <Status pass={affordability.termPass}>ผ่อนไม่เกิน 48 เดือน</Status>
          <Status pass={affordability.originalIncomePass}>
            ค่าเดินทางไม่เกิน 10% ของรายได้
          </Status>
          <Status pass={affordability.customIncomePass}>
            ผ่านเพดานที่ผู้ใช้เลือก
          </Status>
        </ul>
      </div>

      <div className="result-tables">
        <ScenarioTable title="ต้นทุนรถปัจจุบัน" scenario={result.current} />
        <ScenarioTable title="ต้นทุนรถใหม่" scenario={result.next} />
      </div>
    </section>
  );
}
~~~

- [ ] **Step 3: Wire Results into App**

Add the import:

~~~tsx
import Results from "./Results";
~~~

Render it immediately after the calculator section:

~~~tsx
<Results result={result} />
~~~

- [ ] **Step 4: Verify neutral and complete result states**

Run:

~~~bash
npm test
npm run build
~~~

Expected: build passes; blank required values show neutral Thai copy; a valid fixture displays exact TCO, affordability, switch cash, and break-even values.

- [ ] **Step 5: Commit results if Git was approved**

~~~bash
git add src/App.tsx src/Results.tsx
git commit -m "feat: explain TCO results and affordability"
~~~

---

### Task 7: Add comparison, waterfall, and break-even charts

**Files:**
- Modify: src/Results.tsx

**Interfaces:**
- Consumes: ComparisonResult.breakdown and monthlyCashFlow.
- Produces: three Chart.js canvases with deterministic teardown and equivalent semantic tables already present from Task 6.

- [ ] **Step 1: Register only the Chart.js controllers in use**

Add imports and registration at the top of src/Results.tsx:

~~~tsx
import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);
~~~

- [ ] **Step 2: Implement chart data and guaranteed cleanup**

Add this component before the default Results export:

~~~tsx
function cumulative(initial: number, flow: number[]): number[] {
  let total = initial;
  return [total, ...flow.map((value) => (total += value))];
}

function categoryRows(result: ComparisonResult) {
  const values = (scenario: ScenarioResult) => [
    scenario.breakdown.acquisition + scenario.breakdown.resaleCredit,
    scenario.breakdown.financeInterest + scenario.breakdown.fees,
    scenario.breakdown.energy,
    scenario.breakdown.fixed +
      scenario.breakdown.periodic +
      scenario.breakdown.lifestyle +
      scenario.breakdown.custom,
  ];
  const labels = [
    "ค่าเสื่อม",
    "ดอกเบี้ยและค่าธรรมเนียม",
    "พลังงาน",
    "ดูแลและใช้งาน",
  ];
  const current = values(result.current);
  const next = values(result.next);
  return labels.map((label, index) => ({
    label,
    current: current[index],
    next: next[index],
  }));
}

function waterfallRows(result: ComparisonResult): Array<[string, number]> {
  return [
    ["มูลค่ารถ", result.next.breakdown.acquisition],
    ["ดอกเบี้ย", result.next.breakdown.financeInterest],
    ["ค่าธรรมเนียม", result.next.breakdown.fees],
    [
      "ค่าใช้งาน",
      result.next.breakdown.energy +
        result.next.breakdown.fixed +
        result.next.breakdown.periodic +
        result.next.breakdown.lifestyle +
        result.next.breakdown.custom,
    ],
    ["มูลค่าปลายงวด", result.next.breakdown.resaleCredit],
  ];
}

function ComparisonCharts({ result }: { result: ComparisonResult }) {
  const categories = categoryRows(result);
  const waterfallSteps = waterfallRows(result);
  const currentCumulative = cumulative(
    result.current.operating.oneTime,
    result.current.monthlyCashFlow,
  );
  const nextCumulative = cumulative(
    result.switchDayCash,
    result.next.monthlyCashFlow,
  );
  const groupedRef = useRef<HTMLCanvasElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!groupedRef.current || !waterfallRef.current || !lineRef.current) {
      return;
    }

    const chartColor = "#F3F1EC";
    const gridColor = "rgba(243, 241, 236, 0.12)";
    const scaleOptions = {
      ticks: { color: chartColor },
      grid: { color: gridColor },
    };

    const grouped = new Chart(groupedRef.current, {
      type: "bar",
      data: {
        labels: categories.map((row) => row.label),
        datasets: [
          {
            label: "รถปัจจุบัน",
            data: categories.map((row) => row.current),
            backgroundColor: "#8B8E8A",
          },
          {
            label: "รถใหม่",
            data: categories.map((row) => row.next),
            backgroundColor: "#B59B69",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { color: chartColor } } },
        scales: { x: scaleOptions, y: scaleOptions },
      },
    });

    let running = 0;
    const floatingBars: Array<[number, number]> = waterfallSteps.map(
      ([, value]) => {
        const start = running;
        running += value;
        return [start, running];
      },
    );
    const waterfall = new Chart<"bar", [number, number][], string>(
      waterfallRef.current,
      {
        type: "bar",
        data: {
          labels: waterfallSteps.map(([label]) => label),
          datasets: [
            {
              label: "TCO รถใหม่",
              data: floatingBars,
              backgroundColor: waterfallSteps.map(([, value]) =>
                value < 0 ? "#82B99A" : "#B59B69",
              ),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { labels: { color: chartColor } } },
          scales: { x: scaleOptions, y: scaleOptions },
        },
      },
    );

    const line = new Chart(lineRef.current, {
      type: "line",
      data: {
        labels: currentCumulative.map((_, index) =>
          index === 0 ? "วันแรก" : "เดือน " + index,
        ),
        datasets: [
          {
            label: "เก็บรถปัจจุบัน",
            data: currentCumulative,
            borderColor: "#8B8E8A",
            pointRadius: 0,
          },
          {
            label: "เปลี่ยนรถ",
            data: nextCumulative,
            borderColor: "#B59B69",
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { color: chartColor } } },
        scales: { x: scaleOptions, y: scaleOptions },
      },
    });

    return () => {
      grouped.destroy();
      waterfall.destroy();
      line.destroy();
    };
  }, [categories, currentCumulative, nextCumulative, result, waterfallSteps]);

  return (
    <div className="charts">
      <figure>
        <figcaption>เปรียบเทียบหมวดต้นทุน</figcaption>
        <canvas ref={groupedRef} role="img" aria-label="กราฟเปรียบเทียบหมวดต้นทุน" />
        <table className="chart-data">
          <thead><tr><th>หมวด</th><th>รถปัจจุบัน</th><th>รถใหม่</th></tr></thead>
          <tbody>
            {categories.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{baht.format(row.current)}</td>
                <td>{baht.format(row.next)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
      <figure>
        <figcaption>องค์ประกอบ TCO รถใหม่</figcaption>
        <canvas ref={waterfallRef} role="img" aria-label="กราฟองค์ประกอบ TCO รถใหม่" />
        <table className="chart-data">
          <thead><tr><th>องค์ประกอบ</th><th>จำนวนเงิน</th></tr></thead>
          <tbody>
            {waterfallSteps.map(([label, value]) => (
              <tr key={label}><th scope="row">{label}</th><td>{baht.format(value)}</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
      <figure>
        <figcaption>กระแสเงินสดสะสมและจุดคุ้มทุน</figcaption>
        <canvas ref={lineRef} role="img" aria-label="กราฟกระแสเงินสดสะสม" />
        <details>
          <summary>ดูข้อมูลกระแสเงินสดทุกเดือน</summary>
          <table className="chart-data">
            <thead><tr><th>เดือน</th><th>เก็บรถปัจจุบัน</th><th>เปลี่ยนรถ</th></tr></thead>
            <tbody>
              {currentCumulative.map((value, index) => (
                <tr key={index}>
                  <th scope="row">{index === 0 ? "วันแรก" : index}</th>
                  <td>{baht.format(value)}</td>
                  <td>{baht.format(nextCumulative[index])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    </div>
  );
}
~~~

- [ ] **Step 3: Render charts before the detailed scenario tables**

Inside the complete Results state, immediately before result-tables, add:

~~~tsx
<ComparisonCharts result={result} />
~~~

- [ ] **Step 4: Verify chart lifecycle**

Run:

~~~bash
npm test
npm run build
~~~

Expected: build passes. Editing any valid input replaces all three charts without duplicate canvases, stale legends, or console errors.

- [ ] **Step 5: Commit charts if Git was approved**

~~~bash
git add src/Results.tsx
git commit -m "feat: visualize TCO and break-even"
~~~

---

### Task 8: Apply Obsidian Satin, dense bento, accordion, and approved motion

**Files:**
- Create: public/car-detail.jpg
- Modify: src/App.tsx
- Modify: src/Results.tsx
- Modify: src/styles.css

**Interfaces:**
- Consumes: the functional form and results from Tasks 5–7.
- Produces: approved AIDA composition, sticky live summary, 12-by-2 dense result bento, cost accordion, hero image/marquee, GSAP pin/reveal, and animated currency.

- [ ] **Step 1: Add the single automotive detail asset**

Run:

~~~bash
mkdir -p public
curl -L "https://picsum.photos/seed/automotive-detail/1200/800" -o public/car-detail.jpg
~~~

Expected: public/car-detail.jpg opens as a valid raster image and no other decorative image is added.

- [ ] **Step 2: Add live summary, animated numbers, and keyboard cost accordion**

Add GSAP and state imports to src/Results.tsx:

~~~tsx
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
~~~

Replace the Metric value prop declaration with:

~~~tsx
value: React.ReactNode;
~~~

Then add:

~~~tsx
function AnimatedCurrency({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previous.current = value;
      setDisplay(value);
      return;
    }
    const state = { value: previous.current };
    const tween = gsap.to(state, {
      value,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => setDisplay(state.value),
      onComplete: () => {
        previous.current = value;
      },
    });
    return () => tween.kill();
  }, [value]);

  return <>{baht.format(display)}</>;
}

export function LiveSummary({
  result,
}: {
  result: ComparisonResult | null;
}) {
  return (
    <aside className="live-summary" aria-live="polite" aria-atomic="true">
      <p>ค่าใช้จ่ายเฉลี่ยรถใหม่</p>
      <strong>
        {result ? <AnimatedCurrency value={result.next.averageMonthlyTco} /> : "—"}
      </strong>
      <span>ต่อเดือน</span>
      <p>
        {result
          ? verdict(result)
          : "ผลลัพธ์จะแสดงเมื่อข้อมูลที่จำเป็นครบ"}
      </p>
    </aside>
  );
}

function CostAccordion({ result }: { result: ComparisonResult }) {
  const [active, setActive] = useState("acquisition");
  const groups = [
    {
      id: "acquisition",
      label: "ซื้อและจัดไฟแนนซ์",
      current:
        result.current.breakdown.acquisition +
        result.current.breakdown.financeInterest,
      next:
        result.next.breakdown.acquisition +
        result.next.breakdown.financeInterest +
        result.next.breakdown.fees,
    },
    {
      id: "running",
      label: "ใช้งานและดูแล",
      current:
        result.current.breakdown.energy +
        result.current.breakdown.fixed +
        result.current.breakdown.periodic +
        result.current.breakdown.lifestyle +
        result.current.breakdown.custom,
      next:
        result.next.breakdown.energy +
        result.next.breakdown.fixed +
        result.next.breakdown.periodic +
        result.next.breakdown.lifestyle +
        result.next.breakdown.custom,
    },
    {
      id: "resale",
      label: "มูลค่าปลายงวด",
      current: Math.abs(result.current.breakdown.resaleCredit),
      next: Math.abs(result.next.breakdown.resaleCredit),
    },
  ];

  return (
    <div className="cost-accordion">
      {groups.map((group) => (
        <section
          key={group.id}
          data-active={active === group.id || undefined}
        >
          <button
            type="button"
            aria-expanded={active === group.id}
            onClick={() => setActive(group.id)}
          >
            {group.label}
          </button>
          <div hidden={active !== group.id}>
            <p>รถปัจจุบัน <strong>{baht.format(group.current)}</strong></p>
            <p>รถใหม่ <strong>{baht.format(group.next)}</strong></p>
          </div>
        </section>
      ))}
    </div>
  );
}
~~~

Render CostAccordion before ComparisonCharts. Replace numeric currency strings in the primary metrics with AnimatedCurrency nodes.

- [ ] **Step 3: Refactor the result header into the exact dense bento**

Replace result-bento and move affordability inside it:

~~~tsx
<div className="result-bento">
  <dl className="result-main">
    <Metric
      label="ค่าใช้จ่ายเฉลี่ยรถปัจจุบัน"
      value={<><AnimatedCurrency value={result.current.averageMonthlyTco} /> / เดือน</>}
      emphasis
    />
    <Metric
      label="ค่าใช้จ่ายเฉลี่ยรถใหม่"
      value={<><AnimatedCurrency value={result.next.averageMonthlyTco} /> / เดือน</>}
      emphasis
    />
    <Metric
      label="ส่วนต่าง TCO"
      value={<AnimatedCurrency value={Math.abs(result.difference)} />}
    />
  </dl>
  <div className="affordability">
    <h3>20/4/10 และเพดานของคุณ</h3>
    <p>
      ภาระรถคิดเป็น {affordability.incomeSharePercent.toFixed(1)}% ของรายได้รวมต่อเดือน
    </p>
    <ul>
      <Status pass={affordability.downPaymentPass}>ดาวน์อย่างน้อย 20%</Status>
      <Status pass={affordability.termPass}>ผ่อนไม่เกิน 48 เดือน</Status>
      <Status pass={affordability.originalIncomePass}>
        ค่าเดินทางไม่เกิน 10% ของรายได้
      </Status>
      <Status pass={affordability.customIncomePass}>
        ผ่านเพดานที่ผู้ใช้เลือก
      </Status>
    </ul>
  </div>
  <dl className="switch-summary">
    <Metric
      label="เงินสดวันเปลี่ยนรถ"
      value={<AnimatedCurrency value={result.switchDayCash} />}
    />
    <Metric
      label="จุดคุ้มทุนกระแสเงินสด"
      value={formatBreakEven(result.breakEvenMonth)}
    />
  </dl>
</div>
<dl className="secondary-metrics">
  <Metric
    label="เงินดาวน์รถใหม่"
    value={<AnimatedCurrency value={result.next.downPayment} />}
  />
  <Metric
    label="ค่างวดรถใหม่"
    value={<><AnimatedCurrency value={result.next.installment} /> / เดือน</>}
  />
  <Metric
    label="ภาระเงินสดรถใหม่ระหว่างผ่อน"
    value={<><AnimatedCurrency value={result.next.monthlyCashBurden} /> / เดือน</>}
  />
  <Metric
    label="ดอกเบี้ยรถใหม่ตลอดสัญญา"
    value={<AnimatedCurrency value={result.next.totalFinanceInterest} />}
  />
  <Metric
    label="ภาระเงินสดรถปัจจุบัน"
    value={<><AnimatedCurrency value={result.current.monthlyCashBurden} /> / เดือน</>}
  />
</dl>
~~~

This produces 24 occupied desktop cells: result-main 7 columns by 2 rows, affordability 5 columns by 1 row, switch-summary 5 columns by 1 row.

- [ ] **Step 4: Compose the AIDA page and sticky live summary**

Import LiveSummary and add a root scope ref in src/App.tsx:

Replace the existing React import with:

~~~tsx
import { useEffect, useMemo, useRef, useState } from "react";
~~~

Then add:

~~~tsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Results, { LiveSummary } from "./Results";

gsap.registerPlugin(useGSAP, ScrollTrigger);
~~~

Inside App, after the existing state, memo, and persistence hooks, add the root ref and useGSAP block. Replace only App's return block with the return shown below:

~~~tsx
const root = useRef<HTMLElement>(null);

useGSAP(
  () => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        gsap.from(".hero-copy > *", {
          y: 24,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        });
        ScrollTrigger.create({
          trigger: ".results",
          start: "top 96px",
          end: "bottom bottom",
          pin: ".verdict",
          pinSpacing: false,
        });
        gsap.fromTo(
          ".verdict p",
          { opacity: 0.18 },
          {
            opacity: 1,
            scrollTrigger: {
              trigger: ".results",
              start: "top 70%",
              end: "top 25%",
              scrub: true,
            },
          },
        );
      },
    );
    return () => media.revert();
  },
  { scope: root },
);

return (
  <main ref={root} className="app-shell">
    <nav className="floating-nav" aria-label="เมนูหลัก">
      <a href="#top">ต้นทุนรถของคุณ</a>
      <a href="#calculator">เริ่มคำนวณ</a>
    </nav>
    <header id="top" className="hero">
      <div className="hero-copy">
        <p>ตัดสินใจจากต้นทุนจริง</p>
        <h1>
          รถคันต่อไป
          <span className="hero-inline-image" role="img" aria-label="รายละเอียดตัวถังรถ" />
          ควรคุ้มตั้งแต่วันแรก
        </h1>
        <p>เปรียบเทียบต้นทุนจริง ภาระรายเดือน และจุดคุ้มทุนจากข้อมูลของคุณ</p>
        <a className="primary-action" href="#calculator">เริ่มคำนวณ</a>
      </div>
      <div className="cost-marquee" aria-label="หมวดต้นทุนที่รองรับ">
        <div>
          <span>ค่างวด · พลังงาน · ประกัน · ภาษี · บำรุงรักษา · ราคาขายต่อ · </span>
          <span aria-hidden="true">ค่างวด · พลังงาน · ประกัน · ภาษี · บำรุงรักษา · ราคาขายต่อ · </span>
        </div>
      </div>
    </header>
    <section id="calculator" aria-labelledby="calculator-title">
      <h2 id="calculator-title">รู้ต้นทุนทุกบาท ก่อนเปลี่ยนรถ</h2>
      <div className="calculator-workspace">
        <GuidedCalculator
          inputs={inputs}
          errors={errors}
          activeStep={activeStep}
          onStepChange={setActiveStep}
          onChange={setInputs}
        />
        <LiveSummary result={result} />
      </div>
      <button className="text-action" type="button" onClick={() => setInputs(createDefaultInputs())}>
        ล้างข้อมูล
      </button>
    </section>
    <Results result={result} />
    <footer>
      <div>
        <p>ผลลัพธ์เป็นประมาณการจากข้อมูลที่กรอก ไม่ใช่การอนุมัติสินเชื่อหรือคำแนะนำทางการเงิน</p>
        <details>
          <summary>วิธีคำนวณและแหล่งอ้างอิง</summary>
          <p>ดอกเบี้ย Flat Rate คิดจากเงินต้นเต็มจำนวนตลอดอายุสัญญา</p>
          <a href="https://www.bot.or.th/th/satang-story/rights-responsibility/flat-effective.html">
            ธนาคารแห่งประเทศไทย: ดอกเบี้ยแบบเงินต้นคงที่
          </a>
          <p>20/4/10 ใช้เงินดาวน์ 20% ระยะผ่อนไม่เกิน 4 ปี และค่าเดินทาง 10% ของรายได้รวม</p>
          <a href="https://www.chase.com/personal/auto/education/buying/what-is-the-20-4-10-rule-for-car-buying">
            ที่มาของแนวทาง 20/4/10
          </a>
        </details>
      </div>
      <a href="#top">กลับด้านบน</a>
    </footer>
  </main>
);
~~~

- [ ] **Step 5: Replace styles.css with the complete Obsidian Satin system**

Use:

~~~css
:root {
  color: #f3f1ec;
  background: #08090a;
  font-family: "Noto Sans Thai", sans-serif;
  font-synthesis: none;
  --surface: #101213;
  --surface-raised: #17191a;
  --line: rgba(243, 241, 236, 0.14);
  --muted: #a5a7a3;
  --metal: #b59b69;
  --positive: #82b99a;
  --negative: #d98b83;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; }
button, input, select { font: inherit; }
button, select, input[type="range"] { cursor: pointer; }
button, a { transition: color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease; }
button:not(:disabled):hover, a:hover { opacity: 0.82; }
button:disabled { cursor: not-allowed; opacity: 0.45; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
  outline: 2px solid #f3f1ec;
  outline-offset: 3px;
}

.app-shell { width: 100%; max-width: 100%; overflow-x: hidden; }
.floating-nav {
  position: fixed;
  z-index: 20;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  max-width: 1200px;
  margin: auto;
  padding: 12px 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(8, 9, 10, 0.8);
  backdrop-filter: blur(18px);
}
.floating-nav a { color: inherit; text-decoration: none; }

.hero, #calculator, .results, footer {
  width: min(1200px, calc(100% - 32px));
  margin-inline: auto;
}
.hero {
  min-height: 90svh;
  display: grid;
  align-content: center;
  padding: 144px 0 112px;
}
.hero-copy > p:first-child {
  color: var(--metal);
  letter-spacing: 0.1em;
}
.hero h1 {
  max-width: 72rem;
  margin: 16px 0 24px;
  font-family: "Geist", "Noto Sans Thai", sans-serif;
  font-size: clamp(3rem, 7vw, 6.8rem);
  line-height: 0.94;
  letter-spacing: -0.055em;
}
.hero-inline-image {
  display: inline-block;
  width: clamp(80px, 12vw, 170px);
  height: clamp(34px, 5vw, 70px);
  margin: 0 0.16em;
  border-radius: 999px;
  vertical-align: middle;
  background: url("/car-detail.jpg") center / cover;
  filter: grayscale(1) contrast(1.2);
}
.primary-action {
  display: inline-flex;
  margin-top: 20px;
  padding: 13px 20px;
  border-radius: 999px;
  color: #08090a;
  background: #f3f1ec;
  text-decoration: none;
  font-weight: 700;
}
.cost-marquee {
  margin-top: 72px;
  overflow: hidden;
  color: var(--muted);
  white-space: nowrap;
}
.cost-marquee div {
  width: max-content;
  animation: marquee 24s linear infinite;
}
.cost-marquee:hover div { animation-play-state: paused; }
@keyframes marquee { to { transform: translateX(-50%); } }

#calculator { padding: 128px 0 160px; scroll-margin-top: 90px; }
#calculator > h2, .results h2 {
  max-width: 900px;
  font-family: "Geist", "Noto Sans Thai", sans-serif;
  font-size: clamp(2.3rem, 5vw, 4.8rem);
  line-height: 1;
  letter-spacing: -0.04em;
}
.calculator-workspace {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 5fr);
  gap: 20px;
  align-items: start;
  margin-top: 56px;
}
.guided-studio, .live-summary, .verdict, .result-main,
.affordability, .switch-summary, .charts figure, .result-tables table {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 18px;
}
.guided-studio { padding: 20px; }
.live-summary { position: sticky; top: 92px; padding: 28px; }
.live-summary strong {
  display: block;
  margin: 8px 0 0;
  font-family: "Geist", sans-serif;
  font-size: clamp(2.4rem, 5vw, 5.5rem);
  letter-spacing: -0.06em;
}
.live-summary span, .live-summary p { color: var(--muted); }

.step-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 0; list-style: none; }
.step-tabs button {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  background: transparent;
}
.step-tabs button[aria-current="step"] { color: #08090a; background: #f3f1ec; }
.stage-panel { margin-top: 24px; }
fieldset { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 0; padding: 0; border: 0; }
legend { grid-column: 1 / -1; margin-bottom: 12px; font-size: 1.35rem; font-weight: 600; }
.field, .range-field { display: grid; gap: 7px; color: var(--muted); }
.input-shell { display: flex; align-items: center; border: 1px solid var(--line); border-radius: 10px; background: #0c0e0f; }
.input-shell input, .field > input, .field select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: #f3f1ec;
  background: #0c0e0f;
}
.input-shell input { border: 0; background: transparent; }
.input-shell span { padding-right: 12px; white-space: nowrap; }
.field-error { color: var(--negative); }
.operating-grid { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.custom-costs { grid-column: 1 / -1; }
.custom-cost-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end; margin-top: 10px; }
.stage-actions { display: flex; justify-content: space-between; margin-top: 24px; }
.stage-actions button, .custom-costs button, .text-action {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: #f3f1ec;
  background: transparent;
}

.results { padding: 128px 0 160px; }
.verdict { padding: 32px; margin: 40px 0 24px; }
.verdict p { max-width: 900px; font-size: clamp(1.4rem, 3vw, 2.7rem); }
.result-bento {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(170px, auto));
  grid-auto-flow: dense;
  gap: 12px;
}
.result-main { grid-column: span 7; grid-row: span 2; padding: 28px; }
.affordability { grid-column: span 5; grid-row: span 1; padding: 24px; }
.switch-summary { grid-column: span 5; grid-row: span 1; padding: 24px; margin: 0; }
.secondary-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 24px; margin: 20px 0 0; padding: 20px 24px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); }
.metric { display: flex; justify-content: space-between; gap: 20px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.metric dt { color: var(--muted); }
.metric dd { margin: 0; font-family: "Geist", sans-serif; font-size: 1.35rem; }
.affordability ul { display: grid; gap: 8px; padding: 0; list-style: none; }
.affordability li { display: flex; gap: 8px; }
.affordability li[data-status="pass"] > span:first-child { color: var(--positive); }
.affordability li[data-status="fail"] > span:first-child { color: var(--negative); }

.cost-accordion { display: flex; gap: 8px; min-height: 260px; margin-top: 80px; }
.cost-accordion section { flex: 1; overflow: hidden; padding: 18px; border: 1px solid var(--line); border-radius: 16px; transition: flex 0.3s ease; }
.cost-accordion section[data-active] { flex: 2.5; background: var(--surface-raised); }
.cost-accordion button { width: 100%; border: 0; color: #f3f1ec; background: transparent; text-align: left; }
.charts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 80px; }
.charts figure { min-height: 380px; margin: 0; padding: 20px; }
.charts figure:last-child { grid-column: 1 / -1; }
.charts canvas { width: 100% !important; height: 320px !important; }
.result-tables { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
table { width: 100%; border-collapse: collapse; }
caption { padding: 20px; text-align: left; font-size: 1.2rem; font-weight: 700; }
th, td { padding: 11px 16px; border-top: 1px solid var(--line); text-align: left; }
td { text-align: right; font-family: "Geist", sans-serif; }

footer { display: flex; justify-content: space-between; gap: 24px; padding: 56px 0; border-top: 1px solid var(--line); color: var(--muted); }
footer a { color: #f3f1ec; }

@media (max-width: 900px) {
  .calculator-workspace, .charts, .result-tables { grid-template-columns: 1fr; }
  .live-summary { position: static; grid-row: 1; }
  .guided-studio { grid-row: 2; }
  .result-bento { grid-template-columns: 1fr; grid-template-rows: auto; }
  .result-main, .affordability, .switch-summary { grid-column: 1; grid-row: auto; }
  .secondary-metrics { grid-template-columns: 1fr; }
  .charts figure:last-child { grid-column: 1; }
  .cost-accordion { display: grid; }
  .cost-accordion section[data-active] { flex: 1; }
}

@media (max-width: 620px) {
  .hero, #calculator, .results, footer { width: min(100% - 24px, 1200px); }
  .floating-nav { left: 12px; right: 12px; }
  .hero { padding-top: 120px; }
  .step-tabs { grid-template-columns: repeat(2, 1fr); }
  fieldset, .operating-grid { grid-template-columns: 1fr; }
  .custom-cost-row { grid-template-columns: 1fr; }
  footer { display: grid; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .cost-marquee div { animation: none; }
}
~~~

- [ ] **Step 6: Verify visual build and reduced-motion branch**

Run:

~~~bash
npm test
npm run build
~~~

Expected: tests and build pass. Desktop result bento occupies all 24 cells. Mobile stacks summary before inputs. Reduced motion removes pinning, interpolation, marquee, and scrub while leaving every result readable.

- [ ] **Step 7: Commit the approved visual system if Git was approved**

~~~bash
git add public/car-detail.jpg src/App.tsx src/Results.tsx src/styles.css
git commit -m "feat: apply Obsidian Satin experience"
~~~

---

### Task 9: Run financial, accessibility, responsive, and persistence acceptance checks

**Files:**
- Modify only files that fail a check from this task.

**Interfaces:**
- Consumes: complete app from Tasks 1–8 and the acceptance criteria in the spec.
- Produces: verified production build with no known calculation, accessibility, motion, persistence, or responsive failure.

- [ ] **Step 1: Run automated regression and production checks**

Run:

~~~bash
npm test
npm run build
~~~

Expected: all thirteen financial and validation tests pass; TypeScript reports no error; Vite produces dist.

- [ ] **Step 2: Start the production-like preview**

Run:

~~~bash
npm run dev -- --host 127.0.0.1
~~~

Expected: Vite reports a local URL and the app loads with Thai document language, Obsidian Satin hero, and neutral incomplete result.

- [ ] **Step 3: Verify the golden scenario through the UI**

Enter these values:

~~~text
รายได้: 100,000 บาท/เดือน
เพดาน: 40%
ถือครอง: 5 ปี
ระยะทาง: 1,200 กม./เดือน

รถปัจจุบัน:
มูลค่า 300,000
ปลายงวด 150,000
ยอดปิด 120,000
ค่างวด 11,000
เหลือ 12 เดือน
ค่าปิดก่อนกำหนด 2,000
15 กม./ลิตร
37.50 บาท/ลิตร

รถใหม่:
ราคา 600,000
ดาวน์ 20%
Flat Rate 3%
48 เดือน
ค่าธรรมเนียม 10,000
ปลายงวด 300,000
6 กม./kWh
4 บาท/kWh
~~~

Expected:

~~~text
TCO รถปัจจุบัน: 342,000 บาท
TCO รถใหม่: 415,600 บาท
รถปัจจุบันประหยัดกว่า: 73,600 บาท
ภาระรถใหม่: 12,000 บาท/เดือน
สัดส่วนรายได้: 12%
เกณฑ์ 10%: ไม่ผ่าน
เพดาน 40%: ผ่าน
เงินสดวันเปลี่ยนรถ: -48,000 บาท
จุดคุ้มทุน: วันเปลี่ยนรถ
~~~

- [ ] **Step 4: Verify error and storage boundaries**

Check each case:

~~~text
Set income to 0: result becomes neutral and income error appears.
Set either efficiency to 0: no winner appears.
Set holding period below the longest finance term: holding-period error appears.
Enter only current payoff without installment/months: finance-group errors appear.
Add tire amount without interval: interval error appears.
Reload valid data: inputs survive.
Set localStorage car-tco-th:v1 to invalid JSON and reload: defaults load without crash.
~~~

Expected: no invalid case produces a zero-cost winner or uncaught console error.

- [ ] **Step 5: Verify keyboard and assistive structure**

Use only Tab, Shift+Tab, Enter, Space, and arrow keys:

~~~text
Reach both nav links.
Move through every stage tab.
Operate the 10–40% slider.
Add, edit, and remove a custom cost.
Open each cost accordion panel.
Reach reset and footer links.
Confirm visible focus on every interactive control.
Confirm each field error is associated through aria-describedby.
Confirm chart values remain available in tables.
~~~

Expected: no keyboard trap; focus order follows visual order; color is never the only pass/fail signal.

- [ ] **Step 6: Verify responsive and reduced-motion behavior**

Inspect at 375, 768, 1024, and 1440 px:

~~~text
No horizontal scrollbar.
Hero heading stays within two or three lines at desktop widths.
Mobile live summary appears before input groups.
Form fields remain at least 44 px high.
Desktop bento has no empty corner.
Charts fit their containers and tables remain readable.
~~~

Emulate prefers-reduced-motion: reduce.

Expected: marquee is static, GSAP pin and scrub do not run, currency updates immediately, and content order remains unchanged.

- [ ] **Step 7: Verify source preservation and dependency scope**

If Git was approved, run:

~~~bash
git diff -- "Car TCO Comparison.html"
~~~

If Git was declined, run this and compare it with the hash recorded in Task 1:

~~~bash
shasum -a 256 "Car TCO Comparison.html"
~~~

In either case, run:

~~~bash
npm ls --depth=0
~~~

Expected: sample HTML has no diff. Direct dependencies match the approved list; no router, state library, form framework, component framework, or icon library appears.

- [ ] **Step 8: Commit acceptance fixes if Git was approved**

Stage only files changed to fix failed checks:

~~~bash
git add src public
git commit -m "fix: complete TCO acceptance checks"
~~~

If no check required a code change, do not create an empty commit.
