
import { Credential, Customer, AuditLog } from '../types';

const STORAGE_KEYS = {
  CREDENTIALS: 'wtg_credentials',
  CUSTOMERS: 'wtg_customers',
  AUDIT: 'wtg_audit'
};

/**
 * We simulate a database using LocalStorage for persistence.
 * In a real production app, this would use IndexedDB or a robust local database.
 */

export const db = {
  getCredentials: (): Credential[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    return data ? JSON.parse(data).filter((c: Credential) => !c.deleted) : [];
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },

  getAuditLogs: (): AuditLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return data ? JSON.parse(data) : [];
  },

  saveCredential: (cred: Credential) => {
    const all = db.getCredentials();
    const idx = all.findIndex(c => c.id === cred.id);
    const newAll = idx > -1 ? [...all] : [...all, cred];
    if (idx > -1) newAll[idx] = cred;
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(newAll));
    
    db.logAudit({
      id: crypto.randomUUID(),
      entityId: cred.id,
      entityType: 'credential',
      action: idx > -1 ? 'update' : 'create',
      timestamp: Date.now(),
      details: `${idx > -1 ? 'Updated' : 'Created'} credential for ${cred.title}`
    });
  },

  deleteCredential: (id: string) => {
    const all = db.getCredentials();
    const cred = all.find(c => c.id === id);
    if (!cred) return;
    
    // Soft delete for sync logic
    const updated = { ...cred, deleted: true, synced: false, updatedAt: Date.now() };
    const idx = all.findIndex(c => c.id === id);
    all[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(all));

    db.logAudit({
      id: crypto.randomUUID(),
      entityId: id,
      entityType: 'credential',
      action: 'delete',
      timestamp: Date.now(),
      details: `Deleted credential: ${cred.title}`
    });
  },

  saveCustomer: (cust: Customer) => {
    const all = db.getCustomers();
    const idx = all.findIndex(c => c.id === cust.id);
    const newAll = idx > -1 ? [...all] : [...all, cust];
    if (idx > -1) newAll[idx] = cust;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newAll));

    db.logAudit({
      id: crypto.randomUUID(),
      entityId: cust.id,
      entityType: 'customer',
      action: idx > -1 ? 'update' : 'create',
      timestamp: Date.now(),
      details: `${idx > -1 ? 'Updated' : 'Created'} customer ${cust.name}`
    });
  },

  logAudit: (log: AuditLog) => {
    const all = db.getAuditLogs();
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([log, ...all].slice(0, 500)));
  },

  // Mock sync function
  sync: async (): Promise<boolean> => {
    // Check connectivity
    if (!navigator.onLine) return false;
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    const creds = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '[]');
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    
    const unsyncedCreds = creds.filter((c: any) => !c.synced);
    const unsyncedCusts = customers.filter((c: any) => !c.synced);
    
    if (unsyncedCreds.length === 0 && unsyncedCusts.length === 0) return true;

    // Simulate "uploading" to server
    const syncedCreds = creds.map((c: any) => ({ ...c, synced: true }));
    const syncedCusts = customers.map((c: any) => ({ ...c, synced: true }));

    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(syncedCreds));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(syncedCusts));

    return true;
  }
};
