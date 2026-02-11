
import React, { useState } from 'react';
import { Customer } from '../types';
import { createCustomerLocal, toggleOfflineCustomer } from '../services/dataService';

interface CustomersListProps {
  customers: Customer[];
  onUpdate: () => void;
  offlineCustomerIds: string[];
}

const CustomersList: React.FC<CustomersListProps> = ({ customers, onUpdate, offlineCustomerIds }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomerLocal({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined
      });
      setFormData({ name: '', email: '', company: '' });
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to create customer');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500">Organize your passwords by client or project.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
        >
          {isAdding ? 'Close Form' : 'Add New Customer'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
          <input 
            required
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <input 
            required
            type="email"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Company"
            value={formData.company}
            onChange={e => setFormData({...formData, company: e.target.value})}
          />
          <div className="md:col-span-3 flex justify-end">
             <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700">Create</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-slate-300">
               {customer.synced ? 'Synced' : 'Pending'}
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 font-bold text-xl">
              {customer.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
            <p className="text-slate-500 text-sm mb-1">{customer.email}</p>
            <p className="text-indigo-600 text-xs font-semibold">{customer.company || 'Private Entity'}</p>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">ID: {customer.id.slice(0, 8)}...</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleOfflineCustomer(customer.id, !offlineCustomerIds.includes(customer.id)).then(onUpdate)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg"
                >
                  {offlineCustomerIds.includes(customer.id) ? 'Offline On' : 'Offline Off'}
                </button>
                <button className="text-indigo-600 text-xs font-bold hover:underline">View Vault Items</button>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-medium">No customers created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersList;
