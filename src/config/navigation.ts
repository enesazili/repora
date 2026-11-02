import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarRange,
  FolderGit2,
  Languages,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `true` when the module exists as a real screen. */
  available: boolean;
  /** Phase that will deliver this module (used on the coming-soon screen). */
  phase?: number;
  /** One-line explanation for the coming-soon screen. */
  description?: string;
  /** Short list of what the module will contain. */
  preview?: readonly string[];
}

export const ANALYTICS_NAV: readonly NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: "Repositories",
    href: "/repositories",
    icon: FolderGit2,
    available: true,
    phase: 5,
    description:
      "Repository health, growth and maintenance signals across every project you own or contribute to.",
    preview: [
      "Stars, forks and clone trends",
      "Maintenance and release cadence",
      "Side-by-side repository comparison",
    ],
  },
  {
    label: "Contributions",
    href: "/contributions",
    icon: CalendarRange,
    available: true,
    phase: 6,
    description:
      "A complete view of your contribution history, streaks and consistency over time.",
    preview: [
      "Year-by-year contribution heatmaps",
      "Streaks, rest days and consistency",
      "Commit, review and issue breakdowns",
    ],
  },
  {
    label: "Languages",
    href: "/languages",
    icon: Languages,
    available: true,
    phase: 7,
    description:
      "Understand the languages and technologies that shape your work, not just line counts.",
    preview: [
      "Language distribution by project",
      "Technology shifts over time",
      "Ecosystem and tooling insights",
    ],
  },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
    available: true,
    phase: 6,
    description:
      "Commits, pull requests, reviews and releases in one chronological activity stream.",
    preview: [
      "Daily and weekly activity rhythm",
      "Pull request and review throughput",
      "Release and issue timelines",
    ],
  },
  {
    label: "Insights",
    href: "/insights",
    icon: TrendingUp,
    available: true,
    phase: 8,
    description:
      "Higher-level analysis that turns raw activity into patterns you can act on.",
    preview: [
      "Momentum and focus scores",
      "Project comparison and benchmarks",
      "Personal growth narratives",
    ],
  },
];

export const SETTINGS_NAV: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  available: true,
};

export const ALL_NAV: readonly NavItem[] = [...ANALYTICS_NAV, SETTINGS_NAV];

export function getNavItemByFeature(feature: string): NavItem | undefined {
  return ANALYTICS_NAV.find(
    (item) => item.href === `/coming-soon/${feature}`,
  );
}

export function getPageTitle(pathname: string): string {
  if (pathname === "/settings") {
    return "Settings";
  }

  const match = ALL_NAV.find((item) => item.href === pathname);
  if (match) {
    return match.label;
  }

  if (pathname.startsWith("/coming-soon/")) {
    const feature = pathname.split("/").filter(Boolean).at(-1);
    return (
      ALL_NAV.find((item) => item.href === `/coming-soon/${feature}`)?.label ??
      "Coming soon"
    );
  }

  return "Overview";
}
