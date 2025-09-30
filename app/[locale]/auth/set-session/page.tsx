'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SetSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const setSessionAndRedirect = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const redirect = searchParams.get('redirect') || '/dashboard';

      if (!accessToken || !refreshToken) {
        console.error('[SetSession] Missing tokens');
        router.replace('/auth/login');
        return;
      }

      try {
        // Call API route to set cookies server-side
        const response = await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: 86400
          }),
        });

        const result = await response.json();
        console.log('[SetSession] Cookie setting result:', result);

        if (result.success) {
          // Give browser time to process cookies
          await new Promise(resolve => setTimeout(resolve, 100));

          // Full page redirect to ensure cookies are sent
          window.location.href = redirect;
        } else {
          console.error('[SetSession] Failed to set cookies:', result);
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[SetSession] Error:', error);
        router.replace('/auth/login');
      }
    };

    setSessionAndRedirect();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Setting up your session...</p>
      </div>
    </div>
  );
}