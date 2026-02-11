
import React, { useState } from 'react';
import { Credential, Customer } from '../types';
import { createCredentialLocal, deleteCredentialLocal, updateCredentialLocal } from '../services/dataService';
import { encrypt, decrypt, generatePassword } from '../utils/crypto';
import PasswordModal from './PasswordModal';

interface VaultProps {
  credentials: Credential[];
  customers: Customer[];
  onUpdate: () => void;
}

const Vault: React.FC<VaultProps> = ({ credentials, customers, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, string>>({});

  const filtered = credentials.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReveal = async (cred: Credential) => {
    if (revealedIds[cred.id]) {
      const newRevealed = { ...revealedIds };
      delete newRevealed[cred.id];
      setRevealedIds(newRevealed);
    } else {
      const pass = await decrypt(cred.encryptedPassword, cred.iv);
      setRevealedIds({ ...revealedIds, [cred.id]: pass });
    }
  };

  const handleSave = async (data: any) => {
    const { data: encrypted, iv } = await encrypt(data.password);
    const payload = {
      customerId: data.customerId,
      title: data.title,
      username: data.username,
      encryptedPassword: encrypted,
      iv,
      url: data.url,
      notes: data.notes
    };

    try {
      if (editingCred) {
        await updateCredentialLocal(editingCred.id, payload);
      } else {
        await createCredentialLocal(payload);
      }
      setIsModalOpen(false);
      setEditingCred(null);
      onUpdate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to save credential');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      deleteCredentialLocal(id)
        .then(onUpdate)
        .catch(err => {
          window.alert(err instanceof Error ? err.message : 'Failed to delete credential');
        });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input
            type="text"
            placeholder="Search vault..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditingCred(null); setIsModalOpen(true); }}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          New Credential
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title / Service</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Password</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sync</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filtered.map((cred) => (
              <tr key={cred.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{cred.title}</div>
                      <div className="text-xs text-slate-500">{cred.url || 'No URL'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-700 font-medium">{cred.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      {revealedIds[cred.id] || '••••••••••••'}
                    </span>
                    <button 
                      onClick={() => handleReveal(cred)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title={revealedIds[cred.id] ? "Hide" : "Reveal"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={revealedIds[cred.id] ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}></path></svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight ${cred.synced ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {cred.synced ? 'Synced' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingCred(cred); setIsModalOpen(true); }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(cred.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <p className="text-slate-500 font-medium">No credentials found in your vault.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PasswordModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          editingCred={editingCred}
          customers={customers}
        />
      )}
    </div>
  );
};

export default Vault;
