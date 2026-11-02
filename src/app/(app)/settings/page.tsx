"use client";
import { PageHeader } from "@/components/layout/page-header";
import { AboutSettings } from "@/components/settings/about-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { DashboardSettings } from "@/components/settings/dashboard-settings";
import { LanguageSettings } from "@/components/settings/language-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/i18n";

export default function SettingsPage() {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("preferencesEyebrow")}
        title={t("settings")}
        description={t("settingsDescription")}
        actions={<Badge variant="outline">{t("savedLocally")}</Badge>}
      />

      <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 xl:hidden">
        <SettingsNav variant="horizontal" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <SettingsNav />
        </aside>

        <div className="min-w-0 space-y-5">
          <AppearanceSettings />
          <DashboardSettings />
          <LanguageSettings />
          <AccountSettings />
          <PreferencesSettings />
          <AboutSettings />
        </div>
      </div>
    </div>
  );
}
