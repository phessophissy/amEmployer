'use client';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
interface CreateJobFABProps { onClick: () => void; }
export function CreateJobFAB({ onClick }: CreateJobFABProps) {
  return <FloatingActionButton icon="+" label="Create Job" onClick={onClick} />;
}
