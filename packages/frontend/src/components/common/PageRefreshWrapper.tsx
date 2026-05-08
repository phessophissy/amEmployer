'use client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

interface PageRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PageRefreshWrapper({ onRefresh, children }: PageRefreshWrapperProps) {
  const { pullY, refreshing } = usePullToRefresh({ onRefresh });
  return (
    <div>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      {children}
    </div>
  );
}
