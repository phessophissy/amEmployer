import { useEffect, useState } from 'react';
import { isMiniPay, fetchCUSDBalance } from '@/lib/minipay';

export function useMiniPay(address: `0x${string}` | null) {
  const [isMPEnv, setIsMPEnv] = useState(false);
  const [cusdBalance, setCusdBalance] = useState('0.00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMPEnv(isMiniPay());
  }, []);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetchCUSDBalance(address)
      .then(setCusdBalance)
      .finally(() => setLoading(false));
  }, [address]);

  const refresh = () => {
    if (!address) return;
    fetchCUSDBalance(address).then(setCusdBalance);
  };

  return { isMPEnv, cusdBalance, loading, refresh };
}
