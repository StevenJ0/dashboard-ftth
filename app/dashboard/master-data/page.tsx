import type { Metadata } from 'next';
import MasterDataView from '@/components/dashboard/master-data-view';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Master Data Dashboard | FTTH Project',
  description: 'Manage Project Data, WBS, PO/PR, and Dimensions.',
};

export default function MasterDataPage() {
  return (
    <MasterDataView />
  );
}

