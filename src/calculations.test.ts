import { describe, expect, it } from "vitest";
import {
  calculateComparison,
  calculateFlatLoan,
  calculateOperatingCosts,
  createEmptyOperatingCosts,
  type CalculatorInputs,
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
    expect(calculateComparison(cashPurchase).affordability.termPass).toBe(
      true,
    );
  });
});
