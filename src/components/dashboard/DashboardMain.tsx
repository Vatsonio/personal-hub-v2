"use client";

import { usePathname } from "next/navigation";

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSaved = pathname?.startsWith("/dashboard/saved");

  // On /dashboard/saved we hide the global header, so reduce top padding accordingly.
  return (
    <main
      className="dashboard-main px-4 max-w-6xl mx-auto"
      style={{
        paddingTop: isSaved
          ? "env(safe-area-inset-top)"
          : "calc(4rem + env(safe-area-inset-top) + 1rem)"
      }}
    >
      {children}
    </main>
  );
}
