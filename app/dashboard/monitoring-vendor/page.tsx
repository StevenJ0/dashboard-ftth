import MonitoringVendorView from '@/components/dashboard/monitoring-vendor-view';
import { getUserSession } from '@/lib/auth/session';

export const dynamic = "force-dynamic";

export const metadata = {
  title: 'Monitoring Vendor | Dashboard',
};

export default async function MonitoringVendorPage() {
  const user = await getUserSession();
  const userRole = (user?.role as string) || 'STAFF';

  return <MonitoringVendorView userRole={userRole} />;
}
