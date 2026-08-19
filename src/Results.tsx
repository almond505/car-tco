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
