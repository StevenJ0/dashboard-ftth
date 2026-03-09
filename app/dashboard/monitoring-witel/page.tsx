import type { Metadata } from 'next';
import MonitoringWitelView from '@/components/dashboard/monitoring-witel-view';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Monitoring Witel | FTTH Project',
  description: 'Manage Regionals, Witels, and Locations.',
};

export default function MonitoringWitelPage() {
  return (
    <MonitoringWitelView />
  );
}
