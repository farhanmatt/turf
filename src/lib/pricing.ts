export interface TimePricingRule {
  id?: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
}

export interface PricingSegment {
  startTime: number;
  endTime: number;
  hours: number;
  pricePerHour: number;
  amount: number;
}

export interface PricingBreakdown {
  totalAmount: number;
  segments: PricingSegment[];
}

const TIME_PATTERN = /^([01]\d|2[0-3]):00$/;

export function parsePricingHour(time: string): number | null {
  if (!TIME_PATTERN.test(time)) {
    return null;
  }

  return parseInt(time.split(":")[0], 10);
}

function getRuleHours(startHour: number, endHour: number): number[] {
  if (startHour === endHour) {
    return [];
  }

  if (startHour < endHour) {
    return Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  }

  return [
    ...Array.from({ length: 24 - startHour }, (_, index) => startHour + index),
    ...Array.from({ length: endHour }, (_, index) => index),
  ];
}

function doesRuleApply(hour: number, rule: TimePricingRule): boolean {
  const startHour = parsePricingHour(rule.startTime);
  const endHour = parsePricingHour(rule.endTime);

  if (startHour === null || endHour === null || startHour === endHour) {
    return false;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
}

export function getHourlyRate(
  hour: number,
  fallbackPricePerHour: number,
  pricingRules: TimePricingRule[] = []
): number {
  const matchingRule = pricingRules.find((rule) => doesRuleApply(hour % 24, rule));
  return matchingRule ? matchingRule.pricePerHour : fallbackPricePerHour;
}

export function calculateBookingAmount(
  startTime: number,
  endTime: number,
  fallbackPricePerHour: number,
  pricingRules: TimePricingRule[] = []
): PricingBreakdown {
  if (!Number.isInteger(startTime) || !Number.isInteger(endTime) || startTime < 0 || endTime > 24 || startTime >= endTime) {
    throw new Error("Invalid booking time range");
  }

  const segments: PricingSegment[] = [];

  for (let hour = startTime; hour < endTime; hour++) {
    const pricePerHour = getHourlyRate(hour, fallbackPricePerHour, pricingRules);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && lastSegment.endTime === hour && lastSegment.pricePerHour === pricePerHour) {
      lastSegment.endTime = hour + 1;
      lastSegment.hours += 1;
      lastSegment.amount += pricePerHour;
    } else {
      segments.push({
        startTime: hour,
        endTime: hour + 1,
        hours: 1,
        pricePerHour,
        amount: pricePerHour,
      });
    }
  }

  const totalAmount = segments.reduce((sum, segment) => sum + segment.amount, 0);

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    segments: segments.map((segment) => ({
      ...segment,
      amount: Number(segment.amount.toFixed(2)),
    })),
  };
}

export function validatePricingRules(input: unknown): { rules: TimePricingRule[]; error?: string } {
  if (!Array.isArray(input)) {
    return { rules: [], error: "Pricing rules must be an array" };
  }

  const occupiedHours = new Set<number>();
  const rules: TimePricingRule[] = [];

  for (const [index, rawRule] of input.entries()) {
    if (!rawRule || typeof rawRule !== "object") {
      return { rules: [], error: `Pricing rule ${index + 1} is invalid` };
    }

    const rule = rawRule as Record<string, unknown>;
    const startTime = typeof rule.startTime === "string" ? rule.startTime : "";
    const endTime = typeof rule.endTime === "string" ? rule.endTime : "";
    const pricePerHour = Number(rule.pricePerHour);
    const startHour = parsePricingHour(startTime);
    const endHour = parsePricingHour(endTime);

    if (startHour === null || endHour === null) {
      return { rules: [], error: `Pricing rule ${index + 1} must use hourly HH:00 times` };
    }

    if (startHour === endHour) {
      return { rules: [], error: `Pricing rule ${index + 1} must have different start and end times` };
    }

    if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) {
      return { rules: [], error: `Pricing rule ${index + 1} must have a valid price` };
    }

    for (const hour of getRuleHours(startHour, endHour)) {
      if (occupiedHours.has(hour)) {
        return { rules: [], error: `Pricing rule ${index + 1} overlaps with another pricing rule` };
      }
      occupiedHours.add(hour);
    }

    rules.push({
      startTime,
      endTime,
      pricePerHour,
    });
  }

  return { rules };
}
