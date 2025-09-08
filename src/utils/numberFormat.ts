export const formatCount = (count: number): string => {
  if (!Number.isFinite(count)) return String(count ?? '0');

  // Millions
  if (count >= 1_000_000) {
    const v = count / 1_000_000;
    // Show no decimal for whole millions (e.g. 1M) otherwise one decimal (e.g. 1.2M)
    return Number.isInteger(v) ? `${v}M` : `${+v.toFixed(1)}M`;
  }

  // Thousands
  if (count >= 1_000) {
    const v = count / 1_000;
    return Number.isInteger(v) ? `${v}K` : `${+v.toFixed(1)}K`;
  }

  return String(count);
};
