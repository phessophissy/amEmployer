'use client';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/worker/EmptyState';

interface DataFetchWrapperProps<T> {
  loading: boolean;
  data: T[];
  emptyMessage?: string;
  emptySubtext?: string;
  skeletonCount?: number;
  children: (data: T[]) => React.ReactNode;
}

export function DataFetchWrapper<T>({ loading, data, emptyMessage, emptySubtext, skeletonCount = 3, children }: DataFetchWrapperProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} subtext={emptySubtext} />;
  }
  return <>{children(data)}</>;
}
