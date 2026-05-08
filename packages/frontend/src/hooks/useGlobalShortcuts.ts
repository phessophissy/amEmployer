import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export function useGlobalShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') { e.preventDefault(); document.querySelector<HTMLElement>('[data-search]')?.focus(); }
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.target === document.body) {
        if (e.key === '1') router.push('/');
        if (e.key === '2') router.push('/employer');
        if (e.key === '3') router.push('/worker');
        if (e.key === '4') router.push('/simulation');
        if (e.key === '5') router.push('/treasury');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
}
