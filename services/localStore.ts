import { decrypt, encrypt } from "../utils/crypto";
import { AuditLog, Credential, Customer, ConflictRecord } from "../types";

export interface PendingOp {
  id: string;
  entityType: "customer" | "credential";
  action: "create" | "update" | "delete";
}

export interface LocalDb {
  customers: Customer[];
  credentials: Credential[];
  logs: AuditLog[];
  pending: PendingOp[];
  conflicts: ConflictRecord[];
  lastSyncAt: number;
  offlineCustomerIds: string[];
}

const STORAGE_KEY = "wtg_local_db";

const DEFAULT_DB: LocalDb = {
  customers: [],
  credentials: [],
  logs: [],
  pending: [],
  conflicts: [],
  lastSyncAt: 0,
  offlineCustomerIds: []
};

export async function loadDb(): Promise<LocalDb> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_DB };

  try {
    const parsed = JSON.parse(raw) as { data: string; iv: string };
    if (!parsed?.data || !parsed?.iv) return { ...DEFAULT_DB };
    const decrypted = await decrypt(parsed.data, parsed.iv);
    const payload = JSON.parse(decrypted) as LocalDb;
    return {
      ...DEFAULT_DB,
      ...payload,
      customers: payload.customers || [],
      credentials: payload.credentials || [],
      logs: payload.logs || [],
      pending: payload.pending || [],
      conflicts: payload.conflicts || [],
      lastSyncAt: payload.lastSyncAt || 0,
      offlineCustomerIds: payload.offlineCustomerIds || []
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

export async function saveDb(db: LocalDb): Promise<void> {
  const serialized = JSON.stringify(db);
  const encrypted = await encrypt(serialized);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}
