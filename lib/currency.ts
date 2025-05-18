// Exchange rate constants
export const USD_TO_INR_RATE = 83.5

/**
 * Converts USD value to INR
 * @param usdValue Value in USD
 * @returns Value in INR
 */
export const convertToInr = (usdValue: number): number => {
  return usdValue * USD_TO_INR_RATE
}

/**
 * Converts INR value to USD
 * @param inrValue Value in INR
 * @returns Value in USD
 */
export const convertToUsd = (inrValue: number): number => {
  return inrValue / USD_TO_INR_RATE
}

/**
 * Formats a number as INR currency
 * @param value Value to format (in INR)
 * @returns Formatted INR string
 */
export const formatInr = (value?: number): string => {
  if (value === undefined) return "N/A"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a USD value as INR currency (converts and formats)
 * @param usdValue Value in USD
 * @returns Formatted INR string
 */
export const formatUsdToInr = (usdValue?: number): string => {
  if (usdValue === undefined) return "N/A"
  return formatInr(convertToInr(usdValue))
}
