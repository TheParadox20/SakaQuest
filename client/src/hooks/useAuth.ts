import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAuthToken, removeAuthToken } from "@/lib/authUtils";

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const hasToken = !!getAuthToken();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    enabled: hasToken, // Only run query if we have a token
    retry: false,
    staleTime: 0, // Always fresh data for immediate updates
    refetchOnMount: true, // Refetch when component mounts
  });

  // Handle authentication errors by clearing invalid tokens
  useEffect(() => {
    if (error && hasToken) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.includes('Invalid or expired token')) {
        removeAuthToken();
        queryClient.clear(); // Clear all cached data
        // Reload the page to ensure clean state
        window.location.reload();
      }
    }
  }, [error, hasToken, queryClient]);

  // If we had a token but got an error, we're no longer authenticated
  const isAuthenticated = hasToken && !!user && !error;
  const shouldShowLoading = hasToken && isLoading && !error;

  return {
    user: error ? null : user,
    isLoading: shouldShowLoading,
    isAuthenticated,
  };
}
