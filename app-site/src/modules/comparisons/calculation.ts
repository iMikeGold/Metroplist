import type { DirectionalComparison } from "./types";

function assertComparableValue(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite, non-negative number.`);
  }
}

export function calculateDirectionalComparison(
  originValue: number,
  targetValue: number,
): DirectionalComparison {
  assertComparableValue(originValue, "originValue");
  assertComparableValue(targetValue, "targetValue");

  if (originValue === 0 || targetValue === 0) {
    throw new RangeError(
      "Directional ratios require non-zero values. Use an explicit zero-value presentation rule.",
    );
  }

  return {
    originValue,
    targetValue,
    absoluteDifference: Math.abs(originValue - targetValue),
    ratioOriginToTarget: originValue / targetValue,
    ratioTargetToOrigin: targetValue / originValue,
    targetAsPercentOfOrigin: (targetValue / originValue) * 100,
    direction:
      originValue === targetValue
        ? "equal"
        : originValue > targetValue
          ? "origin_higher"
          : "target_higher",
  };
}

export function createCanonicalComparisonKey(input: {
  indicatorId: string;
  placeAId: string;
  placeBId: string;
  observationAId: string;
  observationBId: string;
}): string {
  const places = [input.placeAId, input.placeBId].sort();
  const observations = [input.observationAId, input.observationBId].sort();

  return [
    input.indicatorId,
    ...places,
    ...observations,
  ].join(":");
}
