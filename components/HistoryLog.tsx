
import React from 'react';
import { AuditLog } from '../types';

interface HistoryLogProps {
  logs: AuditLog[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ logs }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Activity History</h2>
          <p className="text-slate-500">Track all changes and access logs in the vault.</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-10">
              <div className={`absolute left-2.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                log.action === 'create' ? 'bg-green-500' : 
                log.action === 'update' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    log.action === 'create' ? 'text-green-600' : 
                    log.action === 'update' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-slate-800 font-semibold mb-1">{log.details}</h4>
                <div className="flex items-center text-xs text-slate-400 space-x-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <span>System User (Local Access)</span>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">No activity logs recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryLog;
