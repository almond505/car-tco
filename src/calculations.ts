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
  noCar?: boolean;
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

export type SimpleAffordability = "low" | "within" | "high";

export interface SimplePlan {
  months: number;
  downPayment: number;
  installment: number;
  incomeSharePercent: number;
  affordability: SimpleAffordability;
}

export interface SimplePlanRow {
  downPaymentPercent: number;
  plans: SimplePlan[];
}

export interface SimplePlansResult {
  terms: number[];
  rows: SimplePlanRow[];
  recommendedDownPaymentPercent: number | null;
  recommendedMonths: number | null;
}

export interface OperatingSummary {
  energyMonthly: number;
  fixedMonthly: number;
  fixedCosts: {
    insurance: number;
    compulsoryInsurance: number;
    tax: number;
    inspection: number;
    maintenance: number;
    repairs: number;
  };
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
  noCar?: boolean;
  current: ScenarioResult;
  next: ScenarioResult;
  difference: number;
  winner: "current" | "new" | "equal";
  switchDayCash: number;
  breakEvenMonth: number | null;
  affordability: AffordabilityResult;
}

export type FieldErrors = Record<string, string>;

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

export function calculateFlatLoan(
  input: Pick<
    NewCarInputs,
    | "cashPrice"
    | "discount"
    | "downPaymentPercent"
    | "flatRatePercent"
    | "financeMonths"
  >,
): LoanResult {
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

export function calculateSimplePlans(
  monthlyIncome: number,
  carPrice: number,
  interestRatePercent: number,
): SimplePlansResult {
  const terms = [48, 60, 72, 84];
  const rows = Array.from({ length: 9 }, (_, index) => {
    const downPaymentPercent = 10 + index * 5;
    const plans = terms.map((months) => {
      const loan = calculateFlatLoan({
        cashPrice: carPrice,
        discount: 0,
        downPaymentPercent,
        flatRatePercent: interestRatePercent,
        financeMonths: months,
      });
      const incomeSharePercent = monthlyIncome > 0
        ? (loan.installment / monthlyIncome) * 100
        : Number.POSITIVE_INFINITY;
      const affordability: SimpleAffordability = incomeSharePercent < 20
        ? "low"
        : incomeSharePercent <= 30
          ? "within"
          : "high";
      return {
        months,
        downPayment: loan.downPayment,
        installment: loan.installment,
        incomeSharePercent,
        affordability,
      };
    });
    return { downPaymentPercent, plans };
  });
  let recommendedRow: SimplePlanRow | undefined;
  let recommendedMonths: number | null = null;
  for (const [planIndex, months] of terms.entries()) {
    recommendedRow = [...rows]
      .reverse()
      .find((row) => row.plans[planIndex].affordability === "within");
    if (recommendedRow) {
      recommendedMonths = months;
      break;
    }
  }

  return {
    terms,
    rows,
    recommendedDownPaymentPercent:
      recommendedRow?.downPaymentPercent ?? null,
    recommendedMonths,
  };
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
  const fixedCosts = {
    insurance: input.insuranceAnnual * global.holdingYears,
    compulsoryInsurance: input.compulsoryInsuranceAnnual * global.holdingYears,
    tax: input.taxAnnual * global.holdingYears,
    inspection: input.inspectionAnnual * global.holdingYears,
    maintenance: input.maintenanceAnnual * global.holdingYears,
    repairs: input.repairsAnnual * global.holdingYears,
  };
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
    fixedCosts,
    periodicMonthly,
    lifestyleMonthly,
    customRecurringMonthly,
    oneTime,
    recurringMonthly,
    totalForHorizon: recurringMonthly * holdingMonths + oneTime,
  };
}

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
  if (inputs.current.noCar) {
    return calculateCurrentScenario({ ...inputs, current: {
      name: "ไม่มีรถ", marketValue: 0, endValue: 0, outstandingPayoff: 0,
      monthlyInstallment: 0, monthsRemaining: 0, earlySettlementFee: 0,
      operating: createEmptyOperatingCosts(),
    } });
  }
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
    (inputs.current.noCar ? 0 : inputs.current.outstandingPayoff +
    inputs.current.earlySettlementFee - inputs.current.marketValue);

  return {
    noCar: Boolean(inputs.current.noCar),
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
    breakEvenMonth: inputs.current.noCar ? null : findBreakEvenMonth(switchDayCash, current, next),
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

function requireNonNegative(
  errors: FieldErrors,
  path: string,
  value: unknown,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
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
    requireNonNegative(errors, prefix + "." + field, operating[field]);
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
    !Number.isFinite(inputs.global.incomeCeilingPercent) ||
    inputs.global.incomeCeilingPercent < 10 ||
    inputs.global.incomeCeilingPercent > 100
  ) {
    errors["global.incomeCeilingPercent"] = "เลือกเพดานระหว่าง 10–100%";
  }
  requireNonNegative(
    errors,
    "global.distanceMonthlyKm",
    inputs.global.distanceMonthlyKm,
  );

  if (!inputs.current.noCar) {
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
  if (
    !Number.isFinite(inputs.current.marketValue) ||
    inputs.current.marketValue <= 0
  ) {
    errors["current.marketValue"] = "กรุณาระบุมูลค่าขายปัจจุบัน";
  }

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
  validateOperating(errors, "current.operating", inputs.current.operating);
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
    (!inputs.current.noCar && holdingMonths < inputs.current.monthsRemaining)
  ) {
    errors["global.holdingYears"] =
      "ระยะเวลาถือครองต้องครอบคลุมระยะเวลาผ่อนทั้งหมด";
  }

  validateOperating(errors, "next.operating", inputs.next.operating);
  return errors;
}
