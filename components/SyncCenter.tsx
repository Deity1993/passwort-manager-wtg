import React from "react";
import { ConflictRecord, Credential, Customer } from "../types";

interface SyncCenterProps {
  conflicts: ConflictRecord[];
  pendingCount: number;
  onSyncNow: () => void;
  onResolvePushLocal: (id: string) => void;
  onResolveUseServer: (id: string) => void;
}

const SyncCenter: React.FC<SyncCenterProps> = ({
  conflicts,
  pendingCount,
  onSyncNow,
  onResolvePushLocal,
  onResolveUseServer
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sync Center</h2>
          <p className="text-slate-500 text-sm">Pending changes: {pendingCount}</p>
        </div>
        <button
          onClick={onSyncNow}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700"
        >
          Sync Now
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Conflicts</h3>
        {conflicts.length === 0 && (
          <div className="text-sm text-slate-500">No conflicts detected.</div>
        )}
        {conflicts.map((conflict) => {
          const isCustomer = conflict.entityType === "customer";
          const local = conflict.local as Customer | Credential;
          const server = conflict.server as Customer | Credential;

          return (
            <div key={conflict.id} className="border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-800">
                  {isCustomer ? "Customer" : "Credential"} conflict
                </div>
                <div className="text-xs text-slate-400">ID: {conflict.id.slice(0, 8)}...</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Local</p>
                  <p className="text-sm text-slate-800 font-semibold">{"title" in local ? local.title : local.name}</p>
                  <p className="text-xs text-slate-500">Version: {local.version}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Server</p>
                  <p className="text-sm text-slate-800 font-semibold">{"title" in server ? server.title : server.name}</p>
                  <p className="text-xs text-slate-500">Version: {server.version}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => onResolvePushLocal(conflict.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
                >
                  Push Local
                </button>
                <button
                  onClick={() => onResolveUseServer(conflict.id)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
                >
                  Use Server
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyncCenter;
