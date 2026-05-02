import type { Metadata } from 'next';
import MonitoringWitelView from '@/components/dashboard/monitoring-witel-view';
import { getUserSession } from '@/lib/auth/session';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Monitoring Witel | FTTH Project',
  description: 'Manage Regionals, Witels, and Locations.',
};

export default async function MonitoringWitelPage() {
  const user = await getUserSession();
  const userRole = (user?.role as string) || 'STAFF';

  return (
    <MonitoringWitelView userRole={userRole} />
  );
}
