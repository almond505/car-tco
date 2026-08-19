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
import type {
  AffordabilityResult,
  ComparisonResult,
  ScenarioResult,
} from "./calculations";

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

function verdict(result: ComparisonResult, holdingYears: number): string {
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
  return periodResult + " ใน " + holdingYears + " ปี " + affordability;
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

function ComparisonCharts({ result }: { result: ComparisonResult }) {
  const categories = categoryRows(result);
  const currentCumulative = cumulative(
    result.current.operating.oneTime,
    result.current.monthlyCashFlow,
  );
  const nextCumulative = cumulative(
    result.switchDayCash,
    result.next.monthlyCashFlow,
  );
  const groupedRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!groupedRef.current || !lineRef.current) return;

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
      line.destroy();
    };
  }, [result]);

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

export default function Results({
  result,
  holdingYears,
  incomeCeilingPercent,
}: {
  result: ComparisonResult | null;
  holdingYears: number;
  incomeCeilingPercent: number;
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
        <p>{verdict(result, holdingYears)}</p>
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
            ภาระค่าเดินทางรวมไม่เกิน 10% ของรายได้
          </Status>
          <Status pass={affordability.customIncomePass}>
            เพดานส่วนตัว {incomeCeilingPercent}% ของรายได้
          </Status>
        </ul>
      </div>

      <ComparisonCharts result={result} />

      <div className="result-tables">
        <ScenarioTable title={"ต้นทุนรถปัจจุบันใน " + holdingYears + " ปี"} scenario={result.current} />
        <ScenarioTable title={"ต้นทุนรถใหม่ใน " + holdingYears + " ปี"} scenario={result.next} />
      </div>
    </section>
  );
}
