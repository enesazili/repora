"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="app-ambient" aria-hidden="true" />

      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex" />

      <div
        className="app-frame min-h-dvh lg:pl-[248px]"
        inert={mobileNavOpen ? true : undefined}
      >
        <Topbar onOpenNav={openMobileNav} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>

      <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
    </ThemeProvider>
  );
}
