import AppGrid from "@/components/dashboard/AppGrid";
import { Announcements } from "@/components/dashboard/Announcements";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <Announcements />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Мій Хаб</h1>
        <p className="text-gray-400">Що робимо сьогодні?</p>
      </div>

      <QuickActions />

      <AppGrid />
    </div>
  );
}
