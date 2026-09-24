const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";
const TOKEN_KEY = "rhia.accessToken";
const ACTIVE_TENANT_KEY = "rhia.activeTenantId";

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getActiveTenantId() {
  return localStorage.getItem(ACTIVE_TENANT_KEY);
}

export function setActiveTenantId(tenantId: string) {
  localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

export function clearActiveTenantId() {
  localStorage.removeItem(ACTIVE_TENANT_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const activeTenantId = getActiveTenantId();
  if (activeTenantId) headers.set("x-tenant-id", activeTenantId);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => undefined) as { error?: string; details?: unknown } | undefined;
  if (!response.ok) throw new ApiClientError(response.status, body?.error ?? "API request failed", body?.details);
  return body as T;
}

export async function publicApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => undefined) as { error?: string; details?: unknown } | undefined;
  if (!response.ok) throw new ApiClientError(response.status, body?.error ?? "API request failed", body?.details);
  return body as T;
}
