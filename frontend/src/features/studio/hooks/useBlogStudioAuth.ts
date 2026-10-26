/**
 * Hook to verify Blog Studio permissions
 * Forwards to the unified server-backed useBlogRole hook.
 */

import { useBlogRole } from './useBlogRole';

export function useBlogStudioAuth() {
  const { isLoading, role, active, address, hasAccess, refetch } = useBlogRole();
  return {
    loading: isLoading,
    authorized: hasAccess,
    role,
    active,
    address,
    refetch,
  };
}

export { useBlogRole };

