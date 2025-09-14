/**
 * Proven EMI calculation utility based on open source implementation
 * Uses the standard EMI formula specifically designed for Indian market
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 */

export interface LoanCalculationResult {
  monthlyEMI: string;
  totalPrincipal: string;
  totalInterest: string;
  totalAmount: string;
}

/**
 * Calculate loan EMI and related details using the proven EMI formula
 * This is based on the open source implementation that's widely used
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as percentage, e.g., 7.5 for 7.5%)
 * @param tenureYears - Loan tenure in years
 */
export function calculateLoanDetails(
  principal: number, 
  annualRate: number, 
  tenureYears: number
): LoanCalculationResult {
  const monthlyRate = annualRate / 12 / 100;
  const tenureMonths = tenureYears * 12;
  
  let emi: number;
  
  if (annualRate === 0) {
    // Handle zero interest case
    emi = principal / tenureMonths;
  } else {
    // Standard EMI formula
    emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }
  
  const totalAmount = emi * tenureMonths;
  const totalInterest = totalAmount - principal;

  return {
    monthlyEMI: emi.toFixed(0),
    totalPrincipal: principal.toFixed(0),
    totalInterest: totalInterest.toFixed(0),
    totalAmount: totalAmount.toFixed(0),
  };
}

/**
 * Format currency amount for Indian context
 */
export function formatIndianCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Format amount in lakhs for easier readability
 */
export function formatInLakhs(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount >= 100000) {
    const lakhs = numAmount / 100000;
    return `₹${lakhs.toFixed(1)} Lakh${lakhs !== 1 ? 's' : ''}`;
  }
  return formatIndianCurrency(numAmount);
}