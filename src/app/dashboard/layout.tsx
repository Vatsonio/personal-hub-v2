import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BottomNav from "@/components/dashboard/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  let savedCount = 0;
  try {
    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM saved_items
      WHERE user_id = ${session.user.id} AND deleted_at IS NULL
    `;
    savedCount = rows[0]?.count ?? 0;
  } catch {}

  return (
    <div className="min-h-screen bg-gray-950">
      <DashboardHeader session={session} savedCount={savedCount} />
      <main
        className="dashboard-main px-4 max-w-6xl mx-auto"
        style={{ paddingTop: "calc(4rem + env(safe-area-inset-top) + 1rem)" }}
      >
        {children}
      </main>
      <BottomNav session={session} />
    </div>
  );
}
