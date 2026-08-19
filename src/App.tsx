import { useEffect, useMemo, useState } from "react";
import {
  calculateComparison,
  createEmptyOperatingCosts,
  validateInputs,
  type CalculatorInputs,
  type CustomCost,
  type OperatingCosts,
} from "./calculations";

export const STORAGE_KEY = "car-tco-th:v1";

export function createDefaultInputs(): CalculatorInputs {
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasNumbers(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => isFiniteNumber(value[field]));
}

function isCustomCost(value: unknown): value is CustomCost {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isFiniteNumber(value.amount) &&
    (value.frequency === "once" ||
      value.frequency === "monthly" ||
      value.frequency === "annual")
  );
}

function isOperatingCosts(value: unknown): value is OperatingCosts {
  return (
    isRecord(value) &&
    (value.energyType === "fuel" || value.energyType === "electric") &&
    hasNumbers(value, [
      "efficiencyKmPerUnit",
      "unitPrice",
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
    ]) &&
    Array.isArray(value.custom) &&
    value.custom.every(isCustomCost)
  );
}

function isCalculatorInputs(value: unknown): value is CalculatorInputs {
  if (!isRecord(value) || !isRecord(value.global) || !isRecord(value.current) || !isRecord(value.next)) {
    return false;
  }

  return (
    hasNumbers(value.global, [
      "grossIncomeMonthly",
      "incomeCeilingPercent",
      "holdingYears",
      "distanceMonthlyKm",
    ]) &&
    typeof value.current.name === "string" &&
    hasNumbers(value.current, [
      "marketValue",
      "endValue",
      "outstandingPayoff",
      "monthlyInstallment",
      "monthsRemaining",
      "earlySettlementFee",
    ]) &&
    isOperatingCosts(value.current.operating) &&
    typeof value.next.name === "string" &&
    hasNumbers(value.next, [
      "cashPrice",
      "discount",
      "purchaseFees",
      "downPaymentPercent",
      "flatRatePercent",
      "financeMonths",
      "endValue",
    ]) &&
    isOperatingCosts(value.next.operating)
  );
}

export function loadInputs(): CalculatorInputs {
  const fallback = createDefaultInputs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored) || stored.version !== 1 || !isRecord(stored.inputs)) {
      return fallback;
    }
    return isCalculatorInputs(stored.inputs) ? stored.inputs : fallback;
  } catch {
    return fallback;
  }
}

export function saveInputs(inputs: CalculatorInputs): void {
  if (Object.keys(validateInputs(inputs)).length > 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, inputs }));
  } catch {
    // Storage can be unavailable or full; the in-memory calculator still works.
  }
}

export function clearSavedInputs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable; reset still clears the in-memory inputs.
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
    saveInputs(inputs);
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
        <button
          type="button"
          onClick={() => setActiveStep((activeStep + 1) % 4)}
        >
          ขั้นตอน {activeStep + 1} จาก 4
        </button>
        <button
          type="button"
          onClick={() => {
            clearSavedInputs();
            setInputs(createDefaultInputs());
          }}
        >
          ล้างข้อมูล
        </button>
      </section>
    </main>
  );
}
