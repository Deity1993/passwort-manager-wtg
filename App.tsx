
import React, { useState, useEffect, useCallback } from 'react';
import { View, Credential, Customer, AuditLog, AuthUser, ConflictRecord } from './types';
import { clearToken, getToken, UnauthorizedError } from './services/api';
import { analyzeSecurity } from './services/geminiService';
import Sidebar from './components/Sidebar';
import Vault from './components/Vault';
import CustomersList from './components/CustomersList';
import HistoryLog from './components/HistoryLog';
import SecurityDashboard from './components/SecurityDashboard';
import AuthGate from './components/AuthGate';
import SyncCenter from './components/SyncCenter';
import UserAdmin from './components/UserAdmin';
import {
  getLocalState,
  refreshFromServer,
  resolveConflictPushLocal,
  resolveConflictUseServer,
  syncNow
} from './services/dataService';

const App: React.FC = () => {
  const [view, setView] = useState<View>('vault');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [creds, setCreds] = useState<Credential[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityAdvice, setSecurityAdvice] = useState<string>('Loading security analysis...');
  const [token, setToken] = useState<string | null>(() => getToken());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [offlineCustomerIds, setOfflineCustomerIds] = useState<string[]>([]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const local = await getLocalState();
      setCreds(local.credentials);
      setCustomers(local.customers);
      setLogs(local.logs);
      setConflicts(local.conflicts);
      setPendingCount(local.pendingCount);
      setOfflineCustomerIds(local.offlineCustomerIds || []);

      if (navigator.onLine) {
        await refreshFromServer();
        const updated = await getLocalState();
        setCreds(updated.credentials);
        setCustomers(updated.customers);
        setLogs(updated.logs);
        setConflicts(updated.conflicts);
        setPendingCount(updated.pendingCount);
        setOfflineCustomerIds(updated.offlineCustomerIds || []);
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearToken();
        setToken(null);
        setAuthUser(null);
      } else {
        console.error('Failed to refresh data', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshData();
    
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [refreshData]);

  // Initial Security Analysis
  useEffect(() => {
    const fetchAdvice = async () => {
      const advice = await analyzeSecurity(creds.length, logs.filter(l => l.timestamp > Date.now() - 86400000).length);
      setSecurityAdvice(advice);
    };
    if (creds.length > 0) {
      fetchAdvice();
    } else {
      setSecurityAdvice("Add your first customer and credential to start secure management.");
    }
  }, [creds.length, logs.length]);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncNow();
      setConflicts(result.conflicts);
      setPendingCount(result.pendingCount);
      await refreshData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuth = (nextToken: string, user: AuthUser) => {
    setToken(nextToken);
    setAuthUser(user);
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setAuthUser(null);
    setCreds([]);
    setCustomers([]);
    setLogs([]);
    setConflicts([]);
    setPendingCount(0);
  };

  const handleResolvePushLocal = async (id: string) => {
    await resolveConflictPushLocal(id);
    await refreshData();
  };

  const handleResolveUseServer = async (id: string) => {
    await resolveConflictUseServer(id);
    await refreshData();
  };

  if (!token) {
    return <AuthGate onAuth={handleAuth} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        isAdmin={authUser?.role === 'ADMIN'}
        pendingCount={pendingCount}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header / Status Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </h1>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:transform active:scale-95 disabled:opacity-50'
              }`}
            >
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              )}
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Logout{authUser ? ` (${authUser.username})` : ''}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading && (
            <div className="mb-4 text-sm text-slate-500">Loading latest data...</div>
          )}
          {view === 'vault' && (
            <Vault credentials={creds} customers={customers} onUpdate={refreshData} />
          )}
          {view === 'customers' && (
            <CustomersList
              customers={customers}
              onUpdate={refreshData}
              offlineCustomerIds={offlineCustomerIds}
            />
          )}
          {view === 'sync' && (
            <SyncCenter
              conflicts={conflicts}
              pendingCount={pendingCount}
              onSyncNow={handleSync}
              onResolvePushLocal={handleResolvePushLocal}
              onResolveUseServer={handleResolveUseServer}
            />
          )}
          {view === 'history' && (
            <HistoryLog logs={logs} />
          )}
          {view === 'security' && (
            <SecurityDashboard advice={securityAdvice} credentials={creds} />
          )}
          {view === 'admin' && authUser?.role === 'ADMIN' && (
            <UserAdmin />
          )}
        </div>

        {/* Floating Mini Info */}
        {!isOnline && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Working Offline - Changes will sync when back online</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
