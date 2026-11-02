export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${trimTrailingZero(millions.toFixed(1))}m`;
  }

  if (Math.abs(value) >= 1_000) {
    const thousands = value / 1_000;
    return `${trimTrailingZero(thousands.toFixed(1))}k`;
  }

  return formatNumber(value);
}

export function formatPercent(value: number): string {
  return `${trimTrailingZero(value.toFixed(1))}%`;
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}
