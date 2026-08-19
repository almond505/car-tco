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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, inputs }));
    } catch {
      // Storage can be unavailable or full; the in-memory calculator still works.
    }
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
        <button type="button" onClick={() => setInputs(createDefaultInputs())}>
          ล้างข้อมูล
        </button>
      </section>
    </main>
  );
}
