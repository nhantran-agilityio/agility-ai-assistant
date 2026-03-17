import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      router.replace('/login');
    }
  }, []);
}
