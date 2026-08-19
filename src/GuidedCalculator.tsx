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

type OperatingNumberKey = Exclude<keyof OperatingCosts, "energyType" | "custom">;

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

interface OperatingEditorProps {
  idPrefix: "current.operating" | "next.operating";
  value: OperatingCosts;
  errors: FieldErrors;
  onChange: (value: OperatingCosts) => void;
}

function OperatingEditor({ idPrefix, value, errors, onChange }: OperatingEditorProps) {
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
          const error = errors[idPrefix + ".custom." + index];
          const errorId = idPrefix + ".custom." + index + ".amount-error";
          return (
            <div className="custom-cost-row" key={cost.id}>
              <label>
                <span>ชื่อค่าใช้จ่าย</span>
                <input
                  value={cost.name}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => updateCustom(cost.id, { name: event.target.value })}
                />
              </label>
              <NumberField
                id={idPrefix + ".custom." + index + ".amount"}
                label="จำนวนเงิน"
                value={cost.amount}
                suffix="บาท"
                error={error}
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
                { id: crypto.randomUUID(), name: "", amount: 0, frequency: "once" },
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

const steps = ["ข้อมูลการเงิน", "รถปัจจุบัน", "รถใหม่", "ตรวจผล"];

export default function GuidedCalculator({
  inputs,
  errors,
  activeStep,
  onStepChange,
  onChange,
}: GuidedCalculatorProps) {
  const setGlobal = (field: keyof CalculatorInputs["global"], value: number) =>
    onChange({ ...inputs, global: { ...inputs.global, [field]: value } });
  const setCurrentNumber = (
    field: Exclude<keyof CalculatorInputs["current"], "name" | "operating">,
    value: number,
  ) => onChange({ ...inputs, current: { ...inputs.current, [field]: value } });
  const setNextNumber = (
    field: Exclude<keyof CalculatorInputs["next"], "name" | "operating">,
    value: number,
  ) => onChange({ ...inputs, next: { ...inputs.next, [field]: value } });
  const netNewPrice = Math.max(0, inputs.next.cashPrice - inputs.next.discount);

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
            <NumberField id="global.grossIncomeMonthly" label="รายได้รวมต่อเดือน" value={inputs.global.grossIncomeMonthly} suffix="บาท" error={errors["global.grossIncomeMonthly"]} onChange={(value) => setGlobal("grossIncomeMonthly", value)} />
            <NumberField id="global.holdingYears" label="ระยะเวลาถือครอง" value={inputs.global.holdingYears} min={1} max={20} suffix="ปี" error={errors["global.holdingYears"]} onChange={(value) => setGlobal("holdingYears", value)} />
            <NumberField id="global.distanceMonthlyKm" label="ระยะทางต่อเดือน" value={inputs.global.distanceMonthlyKm} suffix="กม." error={errors["global.distanceMonthlyKm"]} onChange={(value) => setGlobal("distanceMonthlyKm", value)} />
            <label className="range-field" htmlFor="global.incomeCeilingPercent">
              <span>เพดานค่าเดินทาง {inputs.global.incomeCeilingPercent}% ของรายได้</span>
              <input id="global.incomeCeilingPercent" type="range" min="10" max="40" step="1" value={inputs.global.incomeCeilingPercent} aria-invalid={Boolean(errors["global.incomeCeilingPercent"])} aria-describedby={errors["global.incomeCeilingPercent"] ? "global.incomeCeilingPercent-error" : undefined} onChange={(event) => setGlobal("incomeCeilingPercent", Number(event.target.value))} />
              {errors["global.incomeCeilingPercent"] && <small id="global.incomeCeilingPercent-error" className="field-error">{errors["global.incomeCeilingPercent"]}</small>}
              <small>10% คือเกณฑ์ดั้งเดิม ค่าสูงกว่านี้คือการปรับส่วนบุคคล</small>
            </label>
          </fieldset>
        )}

        {activeStep === 1 && (
          <fieldset>
            <legend>รถปัจจุบัน</legend>
            <label className="field" htmlFor="current.name"><span>ชื่อรถ</span><input id="current.name" value={inputs.current.name} onChange={(event) => onChange({ ...inputs, current: { ...inputs.current, name: event.target.value } })} /></label>
            {([ ["marketValue", "มูลค่าขายปัจจุบัน", "บาท"], ["endValue", "มูลค่าเมื่อสิ้นสุดการถือครอง", "บาท"], ["outstandingPayoff", "ยอดปิดบัญชีปัจจุบัน", "บาท"], ["monthlyInstallment", "ค่างวดปัจจุบัน", "บาท/เดือน"], ["monthsRemaining", "จำนวนงวดคงเหลือ", "เดือน"], ["earlySettlementFee", "ค่าปิดบัญชีก่อนกำหนด", "บาท"], ] as const).map(([field, label, suffix]) => <NumberField key={field} id={"current." + field} label={label} value={inputs.current[field]} suffix={suffix} error={errors["current." + field]} onChange={(value) => setCurrentNumber(field, value)} />)}
            <OperatingEditor idPrefix="current.operating" value={inputs.current.operating} errors={errors} onChange={(operating) => onChange({ ...inputs, current: { ...inputs.current, operating } })} />
          </fieldset>
        )}

        {activeStep === 2 && (
          <fieldset>
            <legend>รถใหม่</legend>
            <label className="field" htmlFor="next.name"><span>ชื่อรถ</span><input id="next.name" value={inputs.next.name} onChange={(event) => onChange({ ...inputs, next: { ...inputs.next, name: event.target.value } })} /></label>
            {([ ["cashPrice", "ราคารถ", "บาท"], ["discount", "ส่วนลด", "บาท"], ["purchaseFees", "ค่าธรรมเนียมซื้อรถ", "บาท"], ["downPaymentPercent", "เงินดาวน์เป็นเปอร์เซ็นต์", "%"], ["flatRatePercent", "ดอกเบี้ย Flat Rate ต่อปี", "%"], ["financeMonths", "ระยะเวลาผ่อน", "เดือน"], ["endValue", "มูลค่าขายต่อปลายงวด", "บาท"], ] as const).map(([field, label, suffix]) => <NumberField key={field} id={"next." + field} label={label} value={inputs.next[field]} suffix={suffix} error={errors["next." + field]} max={field === "downPaymentPercent" ? 100 : undefined} step={field === "flatRatePercent" ? 0.01 : 1} onChange={(value) => setNextNumber(field, value)} />)}
            <NumberField id="next.downPaymentAmount" label="เงินดาวน์เป็นจำนวนเงิน" value={netNewPrice * (inputs.next.downPaymentPercent / 100)} suffix="บาท" onChange={(amount) => setNextNumber("downPaymentPercent", netNewPrice > 0 ? (amount / netNewPrice) * 100 : 0)} />
            <OperatingEditor idPrefix="next.operating" value={inputs.next.operating} errors={errors} onChange={(operating) => onChange({ ...inputs, next: { ...inputs.next, operating } })} />
          </fieldset>
        )}

        {activeStep === 3 && <div className="review-stage"><h3>ตรวจข้อมูลก่อนดูผล</h3><p>{Object.keys(errors).length === 0 ? "ข้อมูลพร้อมแล้ว ผลเปรียบเทียบแสดงด้านล่าง" : "ยังมีข้อมูลที่ต้องแก้ก่อนคำนวณ"}</p></div>}

        <div className="stage-actions">
          <button type="button" disabled={activeStep === 0} onClick={() => onStepChange(activeStep - 1)}>ย้อนกลับ</button>
          <button type="button" disabled={activeStep === steps.length - 1} onClick={() => onStepChange(activeStep + 1)}>ถัดไป</button>
        </div>
      </div>
    </div>
  );
}
