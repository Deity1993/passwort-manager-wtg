
export interface Credential {
  id: string;
  customerId: string;
  title: string;
  username: string;
  encryptedPassword: string; // Base64 AES-GCM
  iv: string; // Base64 Initialization Vector
  url?: string;
  notes?: string;
  updatedAt: number;
  version: number;
  synced: boolean;
  deleted?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  updatedAt: number;
  version: number;
  synced: boolean;
  deleted?: boolean;
}

export interface AuditLog {
  id: string;
  entityId: string;
  entityType: 'credential' | 'customer';
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  details: string;
}

export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface AdminUser {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt: number;
}

export type ConflictRecord = {
  id: string;
  entityType: 'customer' | 'credential';
  local: Customer | Credential;
  server: Customer | Credential;
};

export type View = 'vault' | 'customers' | 'history' | 'security' | 'sync' | 'admin';
