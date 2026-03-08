import { getDashboardData } from "@/app/actions/getDashboardData";
import DashboardView from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();
  return (
    <main>
      <DashboardView data={dashboardData} />
    </main>
  );
}
