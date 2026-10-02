import { useEffect } from "react";

const API_BASE = "https://dataangkatan-production.up.railway.app/api";

export function getStoredToken(): string | null {
  return localStorage.getItem("if26_token");
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem("if26_token", token);
  } else {
    localStorage.removeItem("if26_token");
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (isJson && data?.message) ||
      response.statusText ||
      "Terjadi kesalahan pada permintaan";
    const error = new Error(errorMsg) as Error & { status: number; data: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// React Hook for SSE Realtime updates
export function useRealtimeEvents(
  onEvent: (event: { type: string; payload?: any; timestamp: string }) => void,
) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      eventSource = new EventSource("/api/events");

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data);
        } catch (err) {
          // ignore keepalive
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 4000);
      };
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [onEvent]);
}
