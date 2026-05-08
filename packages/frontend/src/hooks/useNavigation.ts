import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback((href: string) => { router.push(href); }, [router]);
  const goBack = useCallback(() => { router.back(); }, [router]);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return { navigate, goBack, isActive, pathname };
}
