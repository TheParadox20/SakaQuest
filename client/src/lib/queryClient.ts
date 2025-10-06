import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      // Force fresh content for mobile browsers
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    // Disable browser caching
    cache: 'no-store'
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers: {
        ...headers,
        // Force fresh content for mobile browsers
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: "include",
      // Disable browser caching
      cache: 'no-store'
    });

    if (unauthorizedBehavior === "returnNull" && (res.status === 401 || res.status === 403)) {
      return null;
    }

    // Handle auth errors by clearing tokens
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("authToken");
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when app comes back to foreground on mobile
      staleTime: 0, // Always fetch fresh data for mobile compatibility
      gcTime: 5 * 60 * 1000, // 5 minutes cache time
      retry: (failureCount, error: any) => {
        // Don't retry auth errors (401 or 403)
        if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
