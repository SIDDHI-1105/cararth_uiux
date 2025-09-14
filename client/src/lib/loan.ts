/**
 * Comprehensive loan calculation utility with correct amortized formulas
 * Handles all edge cases including 0% interest rates and proper input validation
 */

export interface LoanInputs {
  /** Car price in INR */
  carPrice: number;
  /** Down payment amount in INR */
  downPayment?: number;
  /** Trade-in value in INR */
  tradeInValue?: number;
  /** Annual interest rate as percentage (e.g., 7.5 for 7.5%) */
  annualInterestRate: number;
  /** Loan tenure in months */
  tenureMonths: number;
  /** Processing fee and other charges */
  processingFee?: number;
  /** Insurance amount to be financed */
  insurance?: number;
}

export interface LoanResult {
  /** Principal loan amount after down payment and trade-in */
  principalAmount: number;
  /** Monthly EMI amount */
  monthlyEMI: number;
  /** Total amount to be paid over the loan tenure */
  totalPayment: number;
  /** Total interest to be paid */
  totalInterest: number;
  /** Monthly interest rate (for reference) */
  monthlyRate: number;
  /** Annual interest rate (for reference) */
  annualRate: number;
  /** Loan tenure in months */
  tenure: number;
  /** Breakdown of the principal calculation */
  principalBreakdown: {
    carPrice: number;
    downPayment: number;
    tradeInValue: number;
    processingFee: number;
    insurance: number;
  };
}

/**
 * Safely converts input to number, handling formatted strings and edge cases
 */
function safeNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(0, value);
  }
  
  if (typeof value === 'string') {
    // Remove common formatting characters
    const cleanValue = value.replace(/[,\s₹]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  }
  
  return defaultValue;
}

/**
 * Calculate loan EMI and related details using the standard amortized loan formula
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * Where: P = Principal, r = monthly rate, n = tenure in months
 */
export function calculateLoan(inputs: LoanInputs): LoanResult {
  // Safely convert all inputs to numbers
  const carPrice = safeNumber(inputs.carPrice);
  const downPayment = safeNumber(inputs.downPayment, 0);
  const tradeInValue = safeNumber(inputs.tradeInValue, 0);
  const annualRate = safeNumber(inputs.annualInterestRate);
  const tenureMonths = Math.max(1, safeNumber(inputs.tenureMonths, 12));
  const processingFee = safeNumber(inputs.processingFee, 0);
  const insurance = safeNumber(inputs.insurance, 0);

  // Calculate principal amount
  const principalAmount = Math.max(0, 
    carPrice - downPayment - tradeInValue + processingFee + insurance
  );

  // Convert annual rate to monthly rate
  const monthlyRate = annualRate > 0 ? (annualRate / 12) / 100 : 0;

  let monthlyEMI: number;
  let totalPayment: number;
  let totalInterest: number;

  if (monthlyRate === 0) {
    // Zero interest case (0% APR offers)
    monthlyEMI = principalAmount / tenureMonths;
    totalPayment = principalAmount;
    totalInterest = 0;
  } else {
    // Standard amortized loan calculation
    const powerFactor = Math.pow(1 + monthlyRate, tenureMonths);
    monthlyEMI = (principalAmount * monthlyRate * powerFactor) / (powerFactor - 1);
    totalPayment = monthlyEMI * tenureMonths;
    totalInterest = totalPayment - principalAmount;
  }

  return {
    principalAmount,
    monthlyEMI: Math.round(monthlyEMI), // Round for display
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    monthlyRate,
    annualRate,
    tenure: tenureMonths,
    principalBreakdown: {
      carPrice,
      downPayment,
      tradeInValue,
      processingFee,
      insurance,
    },
  };
}

/**
 * Format currency amount for Indian context
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format amount in lakhs for easier readability
 */
export function formatInLakhs(amount: number): string {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(1)} Lakh${lakhs !== 1 ? 's' : ''}`;
  }
  return formatIndianCurrency(amount);
}

/**
 * Validate loan inputs and return validation errors
 */
export function validateLoanInputs(inputs: LoanInputs): string[] {
  const errors: string[] = [];
  
  const carPrice = safeNumber(inputs.carPrice);
  const downPayment = safeNumber(inputs.downPayment, 0);
  const tradeInValue = safeNumber(inputs.tradeInValue, 0);
  const annualRate = safeNumber(inputs.annualInterestRate);
  const tenure = safeNumber(inputs.tenureMonths);

  if (carPrice <= 0) {
    errors.push('Car price must be greater than zero');
  }

  if (downPayment + tradeInValue >= carPrice) {
    errors.push('Down payment and trade-in value cannot exceed car price');
  }

  if (annualRate < 0 || annualRate > 50) {
    errors.push('Interest rate must be between 0% and 50%');
  }

  if (tenure < 6 || tenure > 180) {
    errors.push('Loan tenure must be between 6 months and 180 months (15 years)');
  }

  return errors;
}