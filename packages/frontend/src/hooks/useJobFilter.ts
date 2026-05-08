import { useMemo, useState } from 'react';
interface Job { title: string; description: string; status: string; [key: string]: any; }
export function useJobFilter(jobs: Job[]) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, statusFilter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length };
    jobs.forEach(j => { c[j.status] = (c[j.status] || 0) + 1; });
    return c;
  }, [jobs]);
  return { filtered, search, setSearch, statusFilter, setStatusFilter, counts };
}
