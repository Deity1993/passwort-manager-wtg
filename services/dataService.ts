import { AuditLog, ConflictRecord, Credential, Customer } from "../types";
import {
  createCredential,
  createCustomer,
  deleteCredential,
  deleteCustomer,
  getAuditLogs,
  getCredentials,
  getCustomers,
  syncPull,
  syncPush,
  updateCredential,
  updateCustomer
} from "./api";
import { loadDb, saveDb, PendingOp } from "./localStore";

function now() {
  return Date.now();
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((entry) => entry.id === item.id);
  if (idx === -1) return [item, ...list];
  const clone = [...list];
  clone[idx] = item;
  return clone;
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((entry) => entry.id !== id);
}

function addPending(pending: PendingOp[], next: PendingOp): PendingOp[] {
  const rest = pending.filter((op) => !(op.id === next.id && op.entityType === next.entityType));
  return [next, ...rest];
}

function createLog(entityType: "credential" | "customer", entityId: string, action: "create" | "update" | "delete", details: string): AuditLog {
  return {
    id: crypto.randomUUID(),
    entityId,
    entityType,
    action,
    timestamp: now(),
    details
  };
}

function mergeServerRecords<T extends { id: string; synced: boolean }>(
  local: T[],
  server: T[]
): T[] {
  let merged = [...local];
  for (const item of server) {
    const existing = local.find((entry) => entry.id === item.id);
    if (existing && existing.synced === false) {
      continue;
    }
    merged = upsertById(merged, item);
  }
  return merged;
}

function mapServerCustomer(input: any): Customer {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    company: input.company ?? "",
    updatedAt: input.updatedAt ? Date.parse(input.updatedAt) : now(),
    version: input.version ?? 1,
    synced: true,
    deleted: Boolean(input.deletedAt)
  };
}

function mapServerCredential(input: any): Credential {
  return {
    id: input.id,
    customerId: input.customerId,
    title: input.title,
    username: input.username,
    encryptedPassword: input.encryptedPassword,
    iv: input.iv,
    url: input.url ?? "",
    notes: input.notes ?? "",
    updatedAt: input.updatedAt ? Date.parse(input.updatedAt) : now(),
    version: input.version ?? 1,
    synced: true,
    deleted: Boolean(input.deletedAt)
  };
}

export async function getLocalState() {
  const db = await loadDb();
  const isOffline = !navigator.onLine;
  const allowedCustomerIds = new Set(db.offlineCustomerIds);
  const customers = db.customers.filter((c) => !c.deleted);
  const filteredCustomers = isOffline
    ? customers.filter((c) => allowedCustomerIds.has(c.id))
    : customers;
  const credentials = db.credentials.filter((c) => !c.deleted);
  const filteredCredentials = isOffline
    ? credentials.filter((c) => allowedCustomerIds.has(c.customerId))
    : credentials;

  return {
    customers: filteredCustomers,
    credentials: filteredCredentials,
    logs: db.logs,
    conflicts: db.conflicts,
    pendingCount: db.pending.length,
    offlineCustomerIds: db.offlineCustomerIds
  };
}

export async function toggleOfflineCustomer(id: string, enabled: boolean) {
  const db = await loadDb();
  if (enabled) {
    if (!db.offlineCustomerIds.includes(id)) {
      db.offlineCustomerIds = [id, ...db.offlineCustomerIds];
    }
  } else {
    db.offlineCustomerIds = db.offlineCustomerIds.filter((entry) => entry !== id);
  }
  await saveDb(db);
}

export async function refreshFromServer() {
  const db = await loadDb();
  const [serverCustomers, serverCredentials, serverLogs] = await Promise.all([
    getCustomers(),
    getCredentials(),
    getAuditLogs()
  ]);

  db.customers = mergeServerRecords(db.customers, serverCustomers);
  db.credentials = mergeServerRecords(db.credentials, serverCredentials);
  db.logs = serverLogs;
  await saveDb(db);
}

export async function createCustomerLocal(data: { name: string; email: string; company?: string }) {
  const db = await loadDb();
  const customer: Customer = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    company: data.company,
    updatedAt: now(),
    version: 1,
    synced: false,
    deleted: false
  };

  db.customers = upsertById(db.customers, customer);
  db.logs = [createLog("customer", customer.id, "create", `Created customer ${customer.name}`), ...db.logs];
  db.pending = addPending(db.pending, { id: customer.id, entityType: "customer", action: "create" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await createCustomer({ ...data, id: customer.id });
      db.customers = upsertById(db.customers, { ...server, synced: true });
      db.pending = removeById(db.pending, customer.id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to create customer online", err);
    }
  }
}

export async function updateCustomerLocal(id: string, data: { name: string; email: string; company?: string }) {
  const db = await loadDb();
  const existing = db.customers.find((entry) => entry.id === id);
  if (!existing) return;

  const updated: Customer = {
    ...existing,
    ...data,
    updatedAt: now(),
    version: existing.version + 1,
    synced: false
  };

  db.customers = upsertById(db.customers, updated);
  db.logs = [createLog("customer", id, "update", `Updated customer ${updated.name}`), ...db.logs];
  db.pending = addPending(db.pending, { id, entityType: "customer", action: "update" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await updateCustomer(id, data);
      db.customers = upsertById(db.customers, { ...server, synced: true });
      db.pending = removeById(db.pending, id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to update customer online", err);
    }
  }
}

export async function deleteCustomerLocal(id: string) {
  const db = await loadDb();
  const existing = db.customers.find((entry) => entry.id === id);
  if (!existing) return;

  const updated: Customer = {
    ...existing,
    deleted: true,
    updatedAt: now(),
    version: existing.version + 1,
    synced: false
  };

  db.customers = upsertById(db.customers, updated);
  db.logs = [createLog("customer", id, "delete", `Deleted customer ${existing.name}`), ...db.logs];
  db.pending = addPending(db.pending, { id, entityType: "customer", action: "delete" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await deleteCustomer(id);
      db.customers = upsertById(db.customers, { ...server, synced: true });
      db.pending = removeById(db.pending, id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to delete customer online", err);
    }
  }
}

export async function createCredentialLocal(data: {
  customerId: string;
  title: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  url?: string;
  notes?: string;
}) {
  const db = await loadDb();
  const credential: Credential = {
    id: crypto.randomUUID(),
    customerId: data.customerId,
    title: data.title,
    username: data.username,
    encryptedPassword: data.encryptedPassword,
    iv: data.iv,
    url: data.url,
    notes: data.notes,
    updatedAt: now(),
    version: 1,
    synced: false,
    deleted: false
  };

  db.credentials = upsertById(db.credentials, credential);
  db.logs = [createLog("credential", credential.id, "create", `Created credential ${credential.title}`), ...db.logs];
  db.pending = addPending(db.pending, { id: credential.id, entityType: "credential", action: "create" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await createCredential({ ...data, id: credential.id });
      db.credentials = upsertById(db.credentials, { ...server, synced: true });
      db.pending = removeById(db.pending, credential.id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to create credential online", err);
    }
  }
}

export async function updateCredentialLocal(
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
) {
  const db = await loadDb();
  const existing = db.credentials.find((entry) => entry.id === id);
  if (!existing) return;

  const updated: Credential = {
    ...existing,
    ...data,
    updatedAt: now(),
    version: existing.version + 1,
    synced: false
  };

  db.credentials = upsertById(db.credentials, updated);
  db.logs = [createLog("credential", id, "update", `Updated credential ${updated.title}`), ...db.logs];
  db.pending = addPending(db.pending, { id, entityType: "credential", action: "update" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await updateCredential(id, data);
      db.credentials = upsertById(db.credentials, { ...server, synced: true });
      db.pending = removeById(db.pending, id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to update credential online", err);
    }
  }
}

export async function deleteCredentialLocal(id: string) {
  const db = await loadDb();
  const existing = db.credentials.find((entry) => entry.id === id);
  if (!existing) return;

  const updated: Credential = {
    ...existing,
    deleted: true,
    updatedAt: now(),
    version: existing.version + 1,
    synced: false
  };

  db.credentials = upsertById(db.credentials, updated);
  db.logs = [createLog("credential", id, "delete", `Deleted credential ${existing.title}`), ...db.logs];
  db.pending = addPending(db.pending, { id, entityType: "credential", action: "delete" });
  await saveDb(db);

  if (navigator.onLine) {
    try {
      const server = await deleteCredential(id);
      db.credentials = upsertById(db.credentials, { ...server, synced: true });
      db.pending = removeById(db.pending, id);
      await saveDb(db);
    } catch (err) {
      console.error("Failed to delete credential online", err);
    }
  }
}

export async function syncNow() {
  const db = await loadDb();
  if (!navigator.onLine) {
    return { conflicts: db.conflicts, pendingCount: db.pending.length };
  }

  const pendingCustomers = db.customers.filter((c) => !c.synced);
  const pendingCredentials = db.credentials.filter((c) => !c.synced);

  if (pendingCustomers.length > 0 || pendingCredentials.length > 0) {
    try {
      const response = await syncPush({
        customers: pendingCustomers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          version: c.version,
          deleted: Boolean(c.deleted)
        })),
        credentials: pendingCredentials.map((c) => ({
          id: c.id,
          customerId: c.customerId,
          title: c.title,
          username: c.username,
          encryptedPassword: c.encryptedPassword,
          iv: c.iv,
          url: c.url,
          notes: c.notes,
          version: c.version,
          deleted: Boolean(c.deleted)
        }))
      });

      for (const applied of response.applied.customers) {
        db.customers = upsertById(db.customers, mapServerCustomer(applied));
      }
      for (const applied of response.applied.credentials) {
        db.credentials = upsertById(db.credentials, mapServerCredential(applied));
      }

      db.pending = db.pending.filter((op) => {
        if (op.entityType === "customer") {
          return !response.applied.customers.find((item: any) => item.id === op.id);
        }
        return !response.applied.credentials.find((item: any) => item.id === op.id);
      });

      const conflicts: ConflictRecord[] = [];
      for (const serverCustomer of response.conflicts.customers) {
        const local = db.customers.find((entry) => entry.id === serverCustomer.id);
        if (local) {
          conflicts.push({ id: serverCustomer.id, entityType: "customer", local, server: mapServerCustomer(serverCustomer) });
        }
      }
      for (const serverCredential of response.conflicts.credentials) {
        const local = db.credentials.find((entry) => entry.id === serverCredential.id);
        if (local) {
          conflicts.push({ id: serverCredential.id, entityType: "credential", local, server: mapServerCredential(serverCredential) });
        }
      }
      db.conflicts = conflicts;

      db.lastSyncAt = response.serverTime || now();
      await saveDb(db);
    } catch (err) {
      console.error("Sync push failed", err);
    }
  }

  try {
    const pull = await syncPull(db.lastSyncAt || 0);
    db.customers = mergeServerRecords(db.customers, pull.customers.map(mapServerCustomer));
    db.credentials = mergeServerRecords(db.credentials, pull.credentials.map(mapServerCredential));
    db.lastSyncAt = pull.serverTime || now();
    await saveDb(db);
  } catch (err) {
    console.error("Sync pull failed", err);
  }

  return { conflicts: db.conflicts, pendingCount: db.pending.length };
}

export async function resolveConflictPushLocal(conflictId: string) {
  const db = await loadDb();
  const conflict = db.conflicts.find((entry) => entry.id === conflictId);
  if (!conflict) return;

  const serverVersion = (conflict.server as { version: number }).version;
  if (conflict.entityType === "customer") {
    const local = conflict.local as Customer;
    await syncPush({
      customers: [{
        id: local.id,
        name: local.name,
        email: local.email,
        company: local.company,
        version: serverVersion + 1,
        deleted: Boolean(local.deleted)
      }],
      credentials: []
    });
    db.customers = upsertById(db.customers, { ...local, version: serverVersion + 1, synced: true });
  } else {
    const local = conflict.local as Credential;
    await syncPush({
      customers: [],
      credentials: [{
        id: local.id,
        customerId: local.customerId,
        title: local.title,
        username: local.username,
        encryptedPassword: local.encryptedPassword,
        iv: local.iv,
        url: local.url,
        notes: local.notes,
        version: serverVersion + 1,
        deleted: Boolean(local.deleted)
      }]
    });
    db.credentials = upsertById(db.credentials, { ...local, version: serverVersion + 1, synced: true });
  }

  db.pending = db.pending.filter((op) => op.id !== conflictId);
  db.conflicts = db.conflicts.filter((entry) => entry.id !== conflictId);
  await saveDb(db);
}

export async function resolveConflictUseServer(conflictId: string) {
  const db = await loadDb();
  const conflict = db.conflicts.find((entry) => entry.id === conflictId);
  if (!conflict) return;

  if (conflict.entityType === "customer") {
    db.customers = upsertById(db.customers, { ...(conflict.server as Customer), synced: true });
  } else {
    db.credentials = upsertById(db.credentials, { ...(conflict.server as Credential), synced: true });
  }

  db.pending = db.pending.filter((op) => op.id !== conflictId);
  db.conflicts = db.conflicts.filter((entry) => entry.id !== conflictId);
  await saveDb(db);
}
