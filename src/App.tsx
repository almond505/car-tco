import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  calculateComparison,
  createEmptyOperatingCosts,
  validateInputs,
  type CalculatorInputs,
  type CustomCost,
  type OperatingCosts,
} from "./calculations";
import GuidedCalculator from "./GuidedCalculator";
import Results, { LiveSummary } from "./Results";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
  const root = useRef<HTMLElement>(null);
  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const result = useMemo(
    () =>
      Object.keys(errors).length === 0 ? calculateComparison(inputs) : null,
    [errors, inputs],
  );

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

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

  const handleReset = () => {
    clearSavedInputs();
    setInputs(createDefaultInputs());
  };

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
            <br className="hero-mobile-break" />
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
          <LiveSummary result={result} holdingYears={inputs.global.holdingYears} />
        </div>
        <button className="text-action" type="button" onClick={handleReset}>
          ล้างข้อมูล
        </button>
      </section>
      <Results
        result={result}
        holdingYears={inputs.global.holdingYears}
        incomeCeilingPercent={inputs.global.incomeCeilingPercent}
      />
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
}
