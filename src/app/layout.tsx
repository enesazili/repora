import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeScript } from "@/lib/theme/theme-script";
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_PALETTE_ID,
} from "@/config/themes";
import { LocaleProvider } from "@/i18n";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Repora — GitHub Analytics",
    template: "%s · Repora",
  },
  description:
    "Repora is a GitHub analytics platform for understanding your repositories, contributions and development activity. Phase 1 design prototype.",
  applicationName: "Repora",
  authors: [{ name: "Repora" }],
  keywords: [
    "GitHub analytics",
    "developer dashboard",
    "contribution graph",
    "repository insights",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-palette={DEFAULT_PALETTE_ID}
      data-mode={DEFAULT_COLOR_MODE}
      data-glass="on"
      data-motion="full"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body><LocaleProvider><AuthProvider>{children}</AuthProvider></LocaleProvider></body>
    </html>
  );
}
