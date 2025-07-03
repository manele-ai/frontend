export function getPeriodKeys(ts: Date) {
    const y = ts.getUTCFullYear();
    const m = `${ts.getUTCMonth() + 1}`.padStart(2, "0");
    const d = `${ts.getUTCDate()}`.padStart(2, "0");
  
    // ――― ISO-8601 week number (1‥53) ―――
    const startOfYear = Date.UTC(y, 0, 1);        // 00:00 UTC Jan-01
    const dayOfYear   = Math.floor((ts.getTime() - startOfYear) / 86_400_000) + 1;
    const isoWeek     = Math.ceil((dayOfYear + 6 - (ts.getUTCDay() || 7)) / 7);
  
    return {
      day:   `${y}${m}${d}`,               // 20250703
      week:  `${y}-W${String(isoWeek).padStart(2, "0")}`, // 2025-W27
      month: `${y}${m}`,                   // 202507
      year:  `${y}`,                       // 2025
    };
  }