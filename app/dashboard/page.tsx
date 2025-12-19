// app/dashboard/page.tsx
import { Suspense } from 'react';
import DashboardContent from '../../components/DashboardContent';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}