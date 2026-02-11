
import React from 'react';
import { Credential } from '../types';

interface SecurityDashboardProps {
  advice: string;
  credentials: Credential[];
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ advice, credentials }) => {
  const stats = [
    { label: 'Total Passwords', value: credentials.length, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: 'Pending Sync', value: credentials.filter(c => !c.synced).length, icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Health Score', value: '92%', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
           <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
             <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">AI Security Assistant</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Vault Security Analysis</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <p className="text-lg text-indigo-50 leading-relaxed font-medium italic">
              "{advice}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Recommendations</h3>
        <div className="space-y-4">
          {[
            { title: 'Enable Biometric Lock', desc: 'Add an extra layer of protection to your local desktop app.', type: 'Action Required', color: 'bg-amber-100 text-amber-700' },
            { title: 'Rotate Legacy Credentials', desc: '3 credentials have not been updated for over 180 days.', type: 'Warning', color: 'bg-red-100 text-red-700' },
            { title: 'Master Password Strength', desc: 'Your derived master secret is within safe parameters.', type: 'Good', color: 'bg-green-100 text-green-700' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${item.color}`}>
                {item.type}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
