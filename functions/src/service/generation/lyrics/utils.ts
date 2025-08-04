export function formatMoneyRON(value: number): string {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("Value must be a positive integer");
    }
  
    const units: Record<number, string> = {
      1:  "un",
      2:  "doi",
      3:  "trei",
      4:  "patru",
      5:  "cinci",
      6:  "șase",
      7:  "șapte",
      8:  "opt",
      9:  "nouă",
      10: "zece",
      11: "unșpe",
      12: "doișpe",
      13: "treișpe",
      14: "paișpe",
      15: "cincișpe",
      16: "șaișpe",
      17: "șaptișpe",
      18: "optișpe",
      19: "nouășpe"
    };
  
    const tens: Record<number, string> = {
      20: "douăzeci",
      30: "treizeci",
      40: "patruzeci",
      50: "cincizeci",
      60: "șaizeci",
      70: "șaptezeci",
      80: "optzeci",
      90: "nouăzeci"
    };
  
    // 1–19 → “[word] leu/lei”
    if (value < 20) {
      const w = units[value]!;
      return `${w} ${value === 1 ? "leu" : "lei"}`;
    }
  
    // 20–99 → spelled tens or numeric + “de lei”
    if (value < 100) {
      if (value % 10 === 0) {
        const w = tens[value]!;
        return `${w} de lei`;
      } else {
        return `${value} de lei`;
      }
    }
  
    // ≥100 → slang counting in "milioane" by flooring to nearest lower hundred
    const millionsCount = Math.floor(value / 100);
    const countWord = millionsCount === 1
      ? "un"
      : (units[millionsCount] ?? millionsCount.toString());
    const millionWord = millionsCount === 1
      ? "milion"
      : "milioane";
  
    return `${countWord} ${millionWord}`;
}
  