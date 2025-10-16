/**
 * Number Formatting Utility
 * Converts large numbers to human-readable format (K, M)
 * 
 * Examples:
 * - formatCount(1000) → "1K"
 * - formatCount(1200) → "1.2K"
 * - formatCount(1000000) → "1M"
 * - formatCount(1500000) → "1.5M"
 * - formatCount(500) → "500"
 * 
 * Used for displaying:
 * - Follower counts
 * - Streaming counts
 * - View counts
 * - Play counts
 */

export const formatCount = (count: number): string => {
  if (!Number.isFinite(count)) return String(count ?? '0');

  // Format millions
  if (count >= 1_000_000) {
    const v = count / 1_000_000;
    // Show no decimal for whole millions (e.g. 1M) otherwise one decimal (e.g. 1.2M)
    return Number.isInteger(v) ? `${v}M` : `${+v.toFixed(1)}M`;
  }

  // Format thousands
  if (count >= 1_000) {
    const v = count / 1_000;
    return Number.isInteger(v) ? `${v}K` : `${+v.toFixed(1)}K`;
  }

  // Return as-is for numbers less than 1000
  return String(count);
};

