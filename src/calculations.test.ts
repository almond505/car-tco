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
