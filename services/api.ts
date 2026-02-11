import { AuditLog, Credential, Customer, Role, AuthUser, AdminUser } from "../types";

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "wtg_token";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function withAuthHeaders(headers?: HeadersInit): HeadersInit {
  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  return {
    "Content-Type": "application/json",
    ...authHeader,
    ...headers
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: withAuthHeaders(options.headers)
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new UnauthorizedError();
    }
    let message = `Request failed (${res.status})`;
    try {
      const payload = await res.json();
      if (payload?.error) message = JSON.stringify(payload.error);
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

function mapCustomer(input: any): Customer {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    company: input.company ?? "",
    updatedAt: input.updatedAt ? Date.parse(input.updatedAt) : Date.now(),
    version: input.version ?? 1,
    synced: true,
    deleted: Boolean(input.deletedAt)
  };
}

function mapCredential(input: any): Credential {
  return {
    id: input.id,
    customerId: input.customerId,
    title: input.title,
    username: input.username,
    encryptedPassword: input.encryptedPassword,
    iv: input.iv,
    url: input.url ?? "",
    notes: input.notes ?? "",
    updatedAt: input.updatedAt ? Date.parse(input.updatedAt) : Date.now(),
    version: input.version ?? 1,
    synced: true,
    deleted: Boolean(input.deletedAt)
  };
}

function mapAudit(input: any): AuditLog {
  return {
    id: input.id,
    entityId: input.entityId,
    entityType: input.entityType,
    action: input.action,
    timestamp: input.createdAt ? Date.parse(input.createdAt) : Date.now(),
    details: input.details
  };
}

function mapAdminUser(input: any): AdminUser {
  return {
    id: input.id,
    username: input.username,
    role: input.role,
    active: Boolean(input.active),
    createdAt: input.createdAt ? Date.parse(input.createdAt) : Date.now()
  };
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const payload = await request<{ token: string; user: { id: string; username: string; role: Role } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  return { token: payload.token, user: payload.user };
}

export async function bootstrapAdmin(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const payload = await request<{ token: string; user: { id: string; username: string; role: Role } }>("/auth/bootstrap", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  return { token: payload.token, user: payload.user };
}

export async function getCustomers(): Promise<Customer[]> {
  const payload = await request<{ customers: any[] }>("/customers");
  return payload.customers.map(mapCustomer);
}

export async function createCustomer(data: { id?: string; name: string; email: string; company?: string }): Promise<Customer> {
  const payload = await request<{ customer: any }>("/customers", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return mapCustomer(payload.customer);
}

export async function updateCustomer(id: string, data: { name: string; email: string; company?: string }): Promise<Customer> {
  const payload = await request<{ customer: any }>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
  return mapCustomer(payload.customer);
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const payload = await request<{ customer: any }>(`/customers/${id}`, {
    method: "DELETE"
  });
  return mapCustomer(payload.customer);
}

export async function getCredentials(): Promise<Credential[]> {
  const payload = await request<{ credentials: any[] }>("/credentials");
  return payload.credentials.map(mapCredential);
}

export async function createCredential(data: {
  id?: string;
  customerId: string;
  title: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  url?: string;
  notes?: string;
}): Promise<Credential> {
  const payload = await request<{ credential: any }>("/credentials", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return mapCredential(payload.credential);
}

export async function updateCredential(
  id: string,
  data: {
    customerId: string;
    title: string;
    username: string;
    encryptedPassword: string;
    iv: string;
    url?: string;
    notes?: string;
  }
): Promise<Credential> {
  const payload = await request<{ credential: any }>(`/credentials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
  return mapCredential(payload.credential);
}

export async function deleteCredential(id: string): Promise<Credential> {
  const payload = await request<{ credential: any }>(`/credentials/${id}`, {
    method: "DELETE"
  });
  return mapCredential(payload.credential);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const payload = await request<{ logs: any[] }>("/audit");
  return payload.logs.map(mapAudit);
}

export async function getUsers(): Promise<AdminUser[]> {
  const payload = await request<{ users: any[] }>("/users");
  return payload.users.map(mapAdminUser);
}

export async function createUser(data: { username: string; password: string; role: Role }): Promise<AdminUser> {
  const payload = await request<{ user: any }>("/users", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return mapAdminUser(payload.user);
}

export async function updateUser(
  id: string,
  data: { password?: string; role?: Role; active?: boolean }
): Promise<AdminUser> {
  const payload = await request<{ user: any }>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
  return mapAdminUser(payload.user);
}

export async function syncPull(since: number): Promise<{ customers: any[]; credentials: any[]; serverTime: number }> {
  return request(`/sync/pull?since=${since}`);
}

export async function syncPush(payload: {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    company?: string;
    version: number;
    deleted?: boolean;
  }>;
  credentials: Array<{
    id: string;
    customerId: string;
    title: string;
    username: string;
    encryptedPassword: string;
    iv: string;
    url?: string;
    notes?: string;
    version: number;
    deleted?: boolean;
  }>;
}): Promise<{ applied: { customers: any[]; credentials: any[] }; conflicts: { customers: any[]; credentials: any[] }; serverTime: number }> {
  return request("/sync/push", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
