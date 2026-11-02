export const DASHBOARD_WIDGET_IDS = [
  "summary",
  "recent",
  "languages",
  "favorites",
  "activity",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export const DEFAULT_DASHBOARD_ORDER: readonly DashboardWidgetId[] = [
  ...DASHBOARD_WIDGET_IDS,
];

export interface DashboardLayout {
  /** Complete, de-duplicated order. Unknown and missing ids are normalised. */
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
  /** Full name of the featured favorite repository, when one is stored. */
  repository: string | null;
  /** The untouched stored object, so unrelated keys survive a save. */
  raw: Record<string, unknown>;
}

function isWidgetId(value: unknown): value is DashboardWidgetId {
  return (
    typeof value === "string" &&
    (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value)
  );
}

/**
 * Parse the stored `widget_config` JSON. Older layouts may contain fewer
 * sections (or the retired decorative widget keys); they are upgraded to the
 * current complete order instead of being discarded.
 */
export function parseDashboardLayout(
  widgetConfig: string | null | undefined,
): DashboardLayout {
  let raw: Record<string, unknown> = {};
  if (widgetConfig) {
    try {
      const parsed = JSON.parse(widgetConfig) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        raw = parsed as Record<string, unknown>;
      }
    } catch {
      // Corrupt preference: fall back to the defaults.
    }
  }

  const proposed = Array.isArray(raw.overviewOrder) ? raw.overviewOrder : [];
  const order: DashboardWidgetId[] = [];
  for (const id of proposed) {
    if (isWidgetId(id) && !order.includes(id)) {
      order.push(id);
    }
  }
  for (const id of DEFAULT_DASHBOARD_ORDER) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }

  const hidden = Array.isArray(raw.overviewHidden)
    ? [...new Set(raw.overviewHidden.filter(isWidgetId))]
    : [];

  const repository =
    typeof raw.overviewRepository === "string" && raw.overviewRepository.length > 0
      ? raw.overviewRepository
      : null;

  return { order, hidden, repository, raw };
}

export function serializeDashboardLayout(
  layout: DashboardLayout,
  overrides: Partial<Pick<DashboardLayout, "order" | "hidden" | "repository">> = {},
): string {
  const order = overrides.order ?? layout.order;
  const hidden = overrides.hidden ?? layout.hidden;
  const repository =
    overrides.repository === undefined ? layout.repository : overrides.repository;

  return JSON.stringify({
    ...layout.raw,
    overviewOrder: order,
    overviewHidden: hidden,
    ...(repository ? { overviewRepository: repository } : { overviewRepository: "" }),
  });
}
