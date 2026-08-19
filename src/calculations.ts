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

export interface OperatingSummary {
  energyMonthly: number;
  fixedMonthly: number;
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

export function calculateFlatLoan(input: NewCarInputs): LoanResult {
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
    periodicMonthly,
    lifestyleMonthly,
    customRecurringMonthly,
    oneTime,
    recurringMonthly,
    totalForHorizon: recurringMonthly * holdingMonths + oneTime,
  };
}
