
import React, { useState, useEffect } from 'react';
import { Credential, Customer } from '../types';
import { generatePassword, decrypt } from '../utils/crypto';
import { checkPasswordStrength } from '../services/geminiService';

interface PasswordModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  editingCred: Credential | null;
  customers: Customer[];
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSave, editingCred, customers }) => {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    customerId: '',
    notes: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [strengthFeedback, setStrengthFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (editingCred) {
      const loadData = async () => {
        const pass = await decrypt(editingCred.encryptedPassword, editingCred.iv);
        setFormData({
          title: editingCred.title,
          username: editingCred.username,
          password: pass,
          url: editingCred.url || '',
          customerId: editingCred.customerId,
          notes: editingCred.notes || ''
        });
      };
      loadData();
    } else if (customers.length > 0) {
      setFormData(prev => ({ ...prev, customerId: customers[0].id }));
    }
  }, [editingCred, customers]);

  const handleStrengthCheck = async () => {
    if (!formData.password) return;
    setIsChecking(true);
    const feedback = await checkPasswordStrength(formData.password);
    setStrengthFeedback(feedback);
    setIsChecking(false);
  };

  const handleGenerate = () => {
    setFormData({ ...formData, password: generatePassword(20) });
    setStrengthFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {editingCred ? 'Edit Credential' : 'Add New Credential'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service / Title</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Google, AWS, etc."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {customers.length === 0 && <option disabled>No customers found</option>}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username / Email</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                required
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-32 font-mono"
                value={formData.password}
                onChange={e => { setFormData({ ...formData, password: e.target.value }); setStrengthFeedback(null); }}
              />
              <div className="absolute inset-y-0 right-2 flex items-center space-x-1">
                <button 
                  type="button"
                  onClick={handleGenerate}
                  className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                >
                  Generate
                </button>
                <button 
                  type="button"
                  onClick={handleStrengthCheck}
                  disabled={isChecking}
                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isChecking ? 'Checking...' : 'Audit'}
                </button>
              </div>
            </div>
            {strengthFeedback && (
              <p className="mt-1 text-xs text-indigo-600 font-medium animate-in slide-in-from-top-1 duration-200 italic">
                {strengthFeedback}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website URL</label>
            <input 
              type="url" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
            <textarea 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Save Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
