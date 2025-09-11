import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getVisitorId } from "./visitorId";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle search limit exceeded (429)
    if (res.status === 429) {
      const errorData = await res.json();
      if (errorData.code === 'search_limit_exceeded') {
        // Throw with specific error type for popup handling
        const error = new Error(errorData.message) as any;
        error.isSearchLimitExceeded = true;
        error.data = errorData;
        throw error;
      }
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get visitor ID for anonymous tracking
  const visitorId = await getVisitorId();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "X-Visitor-ID": visitorId,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    // Get visitor ID for anonymous tracking
    const visitorId = await getVisitorId();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: {
        "X-Visitor-ID": visitorId,
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
