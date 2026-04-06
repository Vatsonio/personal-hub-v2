"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookMarked, User, Settings, ShieldCheck } from "lucide-react";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import {
  readSettings,
  SETTINGS_EVENT_NAME,
  DEFAULT_BOTTOM_NAV_ITEMS,
  type BottomNavItemConfig
} from "@/lib/settings";

const NAV_META: Record<string, { icon: React.ElementType; label: string }> = {
  "/dashboard": { icon: LayoutDashboard, label: "Головна" },
  "/dashboard/saved": { icon: BookMarked, label: "Saved" },
  "/dashboard/profile": { icon: User, label: "Профіль" },
  "/dashboard/settings": { icon: Settings, label: "Налаштування" },
  "/dashboard/admin": { icon: ShieldCheck, label: "Адмін" }
};

export default function BottomNav({ session }: { session: Session }) {
  const pathname = usePathname();
  const isAdmin = (session.user as { role?: string }).role === "admin";

  const [hidden, setHidden] = useState(false);
  const [autoHide, setAutoHide] = useState(false);
  const [navItems, setNavItems] = useState<BottomNavItemConfig[]>(DEFAULT_BOTTOM_NAV_ITEMS);

  useEffect(() => {
    function apply() {
      const s = readSettings();
      setHidden(s.bottomNavHidden);
      setAutoHide(s.bottomNavAutoHide);
      setNavItems(s.bottomNavItems);
    }
    apply();
    window.addEventListener(SETTINGS_EVENT_NAME, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  const isInApp = pathname !== "/dashboard";
  if (hidden || (autoHide && isInApp)) return null;

  // Build ordered visible items from settings, then append admin if applicable
  const visibleItems = navItems
    .filter((item) => item.visible)
    .map((item) => ({ href: item.href, ...NAV_META[item.href] }))
    .filter(Boolean);

  if (isAdmin) {
    visibleItems.push({ href: "/dashboard/admin", ...NAV_META["/dashboard/admin"] });
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 h-14">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
