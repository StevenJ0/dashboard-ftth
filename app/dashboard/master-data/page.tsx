import type { Metadata } from 'next';
import MasterDataView from '@/components/dashboard/master-data-view';
import { getUserSession } from '@/lib/auth/session';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Project Data | FTTH Dashboard',
  description: 'Manage master data for software projects.',
};

export default async function MasterDataPage() {
  const user = await getUserSession();
  const userRole = (user?.role as string) || 'STAFF';

  return (
    <MasterDataView userRole={userRole} />
  );
}
