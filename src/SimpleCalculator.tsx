import { useMemo, useState } from "react";
import { calculateSimplePlans } from "./calculations";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

interface SimpleNumberFieldProps {
  id: string;
  label: string;
  value: string;
  suffix: string;
  max?: number;
  step?: number;
  formatThousands?: boolean;
  onChange: (value: string) => void;
}

function SimpleNumberField({
  id,
  label,
  value,
  suffix,
  max,
  step = 1,
  formatThousands = false,
  onChange,
}: SimpleNumberFieldProps) {
  return (
    <label className="simple-field" htmlFor={id}>
      <span>{label}</span>
      <span className="simple-input-shell">
        <input
          id={id}
          type={formatThousands ? "text" : "number"}
          inputMode="decimal"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(
            formatThousands
              ? formatAmountInput(event.target.value)
              : event.target.value,
          )}
        />
        <span aria-hidden="true">{suffix}</span>
      </span>
    </label>
  );
}

export default function SimpleCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [carPrice, setCarPrice] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const incomeValue = Number(monthlyIncome.replaceAll(",", ""));
  const carPriceValue = Number(carPrice.replaceAll(",", ""));
  const result = useMemo(
    () => incomeValue > 0 && carPriceValue > 0
      ? calculateSimplePlans(incomeValue, carPriceValue, Number(interestRate))
      : null,
    [incomeValue, carPriceValue, interestRate],
  );
  const recommendation = result?.recommendedDownPaymentPercent == null
      || result.recommendedMonths == null
    ? null
    : result.rows.find(
      (row) => row.downPaymentPercent === result.recommendedDownPaymentPercent,
    )?.plans.find((plan) => plan.months === result.recommendedMonths);

  return (
    <div className="simple-calculator">
      <div className="simple-inputs">
        <SimpleNumberField
          id="simple-income"
          label="รายได้ต่อเดือน"
          value={monthlyIncome}
          suffix="บาท"
          formatThousands
          onChange={setMonthlyIncome}
        />
        <SimpleNumberField
          id="simple-car-price"
          label="ราคารถใหม่"
          value={carPrice}
          suffix="บาท"
          formatThousands
          onChange={setCarPrice}
        />
        <SimpleNumberField
          id="simple-interest"
          label="อัตราดอกเบี้ย Flat Rate"
          value={interestRate}
          suffix="% ต่อปี"
          max={100}
          step={0.01}
          onChange={setInterestRate}
        />
      </div>

      <div className="simple-guidance" aria-live="polite">
        {!result && (
          <>
            <p>กรอกสองตัวเลขหลักเพื่อดูแผนผ่อนทั้งหมด</p>
            <span>เป้าหมายค่างวดที่เหมาะสม: 20–30% ของรายได้ต่อเดือน</span>
          </>
        )}
        {result && recommendation && (
          <>
            <p>
              แผนแนะนำ: ดาวน์ {result.recommendedDownPaymentPercent}% ผ่อน {result.recommendedMonths} เดือน
            </p>
            <strong>{money.format(recommendation.installment)} / เดือน</strong>
            <span>
              ค่างวดนี้คิดเป็น {recommendation.incomeSharePercent.toFixed(1)}% ของรายได้ต่อเดือน
              {recommendation.affordability === "low"
                ? " ต่ำกว่าช่วงแนะนำ 20–30% ของรายได้ต่อเดือน"
                : " และอยู่ในช่วงแนะนำ 20–30% ของรายได้ต่อเดือน"}
            </span>
          </>
        )}
        {result && !recommendation && (
          <>
            <p>ยังไม่มีแผนที่ค่างวดอยู่ในช่วง 20–30% ของรายได้</p>
            <span>เพิ่มเงินดาวน์ ลดราคารถ หรือเลือกดูระยะผ่อนที่ยาวขึ้น</span>
          </>
        )}
      </div>

      <div className="simple-table-scroll" tabIndex={0}>
        <table className="simple-plan-table">
          <caption>เปรียบเทียบเงินดาวน์และค่างวดรายเดือน</caption>
          <thead>
            <tr>
              <th scope="col">เงินดาวน์</th>
              {[48, 60, 72, 84].map((months) => (
                <th
                  key={months}
                  scope="col"
                  className={months === 48 ? "recommended-term" : undefined}
                >
                  <strong>{months} เดือน</strong>
                  {months === 48 && <span>แนะนำ</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!result && (
              <tr className="simple-empty-row">
                <td colSpan={5}>ตารางจะคำนวณทันทีเมื่อกรอกรายได้และราคารถ</td>
              </tr>
            )}
            {result?.rows.map((row) => (
              <tr
                key={row.downPaymentPercent}
                data-recommended={
                  row.downPaymentPercent === result.recommendedDownPaymentPercent
                    ? "true"
                    : undefined
                }
              >
                <th scope="row">
                  <strong>{row.downPaymentPercent}%</strong>
                  <span>{money.format(row.plans[0].downPayment)}</span>
                </th>
                {row.plans.map((plan) => (
                  <td
                    key={plan.months}
                    className={plan.months === 48 ? "recommended-term" : undefined}
                    data-affordability={plan.affordability}
                  >
                    <strong>{money.format(plan.installment)}</strong>
                    <span>{plan.incomeSharePercent.toFixed(1)}% ของรายได้</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="simple-note">
        คำนวณดอกเบี้ยแบบ Flat Rate ตัวเลขเป็นประมาณการและยังไม่รวมค่าธรรมเนียม ประกัน และค่าใช้จ่ายรถ
      </p>
    </div>
  );
}
