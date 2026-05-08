'use client';
import { EmptyState } from '@/components/worker/EmptyState';
interface EmptyJobsStateProps { onLaunchDemo: () => void; }
export function EmptyJobsState({ onLaunchDemo }: EmptyJobsStateProps) {
  return (
    <EmptyState
      message="No jobs yet"
      subtext="Launch the demo economy to see the AI create, assign, validate, and pay workers automatically."
      action={{ label: '⚡ Launch Demo Economy', onClick: onLaunchDemo }}
    />
  );
}
