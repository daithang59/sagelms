import { useCallback } from 'react';
import api from '@/lib/api';
import type { PublicUserProfile } from '@/types/auth';

export function useUserProfiles() {
  const fetchPublicUserProfiles = useCallback(async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return [];
    const params = new URLSearchParams();
    params.set('ids', uniqueIds.join(','));
    return api.get<PublicUserProfile[]>(`/users/public-profiles?${params.toString()}`);
  }, []);

  return { fetchPublicUserProfiles };
}
