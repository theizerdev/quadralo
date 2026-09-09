declare const process: any;

export interface User {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone?: string | null;
  role: string;
  is_superuser: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  success: boolean;
  requires_verification: boolean;
  email: string;
  verification_code?: string;
}

function getApiBaseUrl(): string {
  const envUrl = (
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://127.0.0.1:8001"
  ).replace(/\/$/, "");

  // Si la URL base ya contiene /api/v1 al final, lo removemos para evitar duplicar /api/v1/api/v1/...
  return envUrl.replace(/\/api\/v1$/, "");
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/api/v1")
    ? endpoint
    : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((item: any) => item.msg || JSON.stringify(item))
          .join(", ");
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Usar mensaje predeterminado si el cuerpo no es JSON
    }
    throw new Error(errorMessage);
  }

  // Si no hay contenido (por ejemplo HTTP 204)
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
