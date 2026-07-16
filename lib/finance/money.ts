const DECIMAL_MONEY = /^(\d+)(?:\.(\d+))?$/;

export function assertValidPaise(value: unknown, field = "amountPaise"): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(`${field} must be a non-negative safe integer.`);
  }
}

export function rupeesToPaise(value: number | string): number {
  if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) {
    throw new Error("Rupee amount must be finite and non-negative.");
  }

  const normalized = String(value).trim();
  const match = DECIMAL_MONEY.exec(normalized);
  if (!match) throw new Error("Rupee amount is invalid.");

  const whole = Number(match[1]);
  if (!Number.isSafeInteger(whole)) throw new Error("Rupee amount is unsafe.");

  const decimals = match[2] ?? "";
  const paiseDigits = `${decimals}00`.slice(0, 2);
  const roundDigit = Number(decimals[2] ?? "0");
  const paise = whole * 100 + Number(paiseDigits) + (roundDigit >= 5 ? 1 : 0);
  assertValidPaise(paise);
  return paise;
}

export function normalizeLegacyMoneyToPaise(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  try {
    return rupeesToPaise(value);
  } catch {
    return null;
  }
}

export function paiseToDisplayRupees(value: number): number {
  assertValidPaise(value);
  return value / 100;
}

export function safeAddPaise(...values: number[]): number {
  const total = values.reduce((sum, value) => {
    assertValidPaise(value);
    const next = sum + value;
    assertValidPaise(next);
    return next;
  }, 0);
  return total;
}

export function roundHalfUpDivide(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || numerator < 0) {
    throw new Error("Finance numerator must be a non-negative safe integer.");
  }
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error("Finance denominator must be a positive safe integer.");
  }
  const result = Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
  assertValidPaise(result);
  return result;
}
