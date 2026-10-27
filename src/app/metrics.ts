export interface MetricItem {
  tests?: number;
  failures?: number;
  coverage?: number | null;
  coveredLines?: number;
  totalLines?: number;
  measuredAt?: string;
  durationSeconds?: number;
  perTest?: number;
}

export interface RequirementSet {
  unit?: string[];
  e2e?: string[];
}

export interface MetricsFile {
  unit?: MetricItem | null;
  e2e?: MetricItem | null;
  requirements?: Record<string, RequirementSet>;
}

export interface MetricView {
  label: string;
  failed: boolean;
  tip: string;
}

/** `yyyy-mm-dd hh:mm`; the metric file may carry an ISO `T` separator. */
export function formatMeasured(value: string | undefined): string {
  if (!value) {
    return '—';
  }
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(value);
  return match ? `${match[1]} ${match[2]}` : value;
}

function seconds(value: number | undefined, digits: number): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }
  return `${value.toFixed(digits)} s`;
}

/** Three rows, as the contract requires for every test tooltip. */
export function measurementTip(item: MetricItem | null | undefined): string {
  if (!item) {
    return 'not executed';
  }
  const perTest =
    item.perTest ??
    (item.durationSeconds != null && item.tests ? item.durationSeconds / item.tests : undefined);
  return [
    `Measured ${formatMeasured(item.measuredAt)}`,
    `Duration ${seconds(item.durationSeconds, 1)}`,
    `Per test ${seconds(perTest, 2)}`,
  ].join('\n');
}

/** Count and line coverage in one label; a missing run is explicit. */
export function metricLabel(label: string, item: MetricItem | null | undefined): string {
  if (!item || item.tests == null) {
    return `${label} not executed`;
  }
  const parts = [`${label} ${item.tests}`];
  parts.push(item.coverage != null ? `${item.coverage} %` : 'coverage not measured');
  if ((item.failures ?? 0) > 0) {
    parts.push(`${item.failures} fail`);
  }
  return parts.join(' · ');
}

export function metricView(label: string, item: MetricItem | null | undefined): MetricView {
  return {
    label: metricLabel(label, item),
    failed: !item || item.tests == null || (item.failures ?? 0) > 0,
    tip: measurementTip(item),
  };
}
