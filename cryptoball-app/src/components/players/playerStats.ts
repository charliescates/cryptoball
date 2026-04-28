export const formatSignedDelta = (delta: bigint): string => {
  if (delta >= 0n) {
    return `+${delta.toString()}`;
  }

  return delta.toString();
};

export const getDeltaClassName = (delta: bigint): string => {
  if (delta > 0n) return "stat-delta-positive";
  if (delta < 0n) return "stat-delta-negative";
  return "stat-delta-neutral";
};
