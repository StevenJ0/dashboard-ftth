'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plus, Search, Pencil, Trash2, X, Save, AlertCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Sorting types
type SortDirection = 'asc' | 'desc' | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

// Sortable Header Component
const SortableHeader = ({ 
  label, 
  sortKey, 
  currentSort, 
  onSort,
  className = ''
}: { 
  label: string; 
  sortKey: string; 
  currentSort: SortConfig; 
  onSort: (key: string) => void;
  className?: string;
}) => {
  const isActive = currentSort.key === sortKey;
  
  return (
    <th 
      className={`px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group border-b border-slate-200 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {isActive && currentSort.direction === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : isActive && currentSort.direction === 'desc' ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    </th>
  );
};

// Generic sort function
function sortData<T>(data: T[], sortConfig: SortConfig, getNestedValue: (item: T, key: string) => any): T[] {
  if (!sortConfig.key || !sortConfig.direction) return data;
  
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, sortConfig.key);
    const bVal = getNestedValue(b, sortConfig.key);
    
    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
    
    // Number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

interface Vendor {
  vendor_code: string;
  vendor_name: string;
}

export default function MonitoringVendorView() {
  const [search, setSearch] = useState('');
  const { data: vendors, error, mutate, isLoading } = useSWR<Vendor[]>(
    `/api/master-data/vendors?search=${search}`,
    fetcher
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({ vendor_code: '', vendor_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

  // Handle sort toggle
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  // Helper to get nested values for sorting
  const getNestedValue = (item: any, key: string): any => {
    const keys = key.split('.');
    let value = item;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  // Sorted data using useMemo
  const sortedVendors = useMemo(() => 
    sortData(vendors || [], sortConfig, getNestedValue), 
    [vendors, sortConfig]
  );

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({ vendor_code: vendor.vendor_code, vendor_name: vendor.vendor_name });
    } else {
      setEditingVendor(null);
      setFormData({ vendor_code: '', vendor_name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData({ vendor_code: '', vendor_name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingVendor) {
        // Update Logic
        const res = await fetch(`/api/master-data/vendors?code=${editingVendor.vendor_code}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendor_name: formData.vendor_name }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        // Create Logic
        const res = await fetch('/api/master-data/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
           const data = await res.json();
           throw new Error(data.error || 'Failed to create');
        }
      }
      mutate(); // Refresh data
      handleCloseModal();
    } catch (err: any) { // Sudah benar pakai any
      console.error(err);
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vendor_code: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const res = await fetch(`/api/master-data/vendors?code=${vendor_code}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Failed to delete');
      }
      mutate(); 
    } catch (err : any) { 
      console.error(err);
      alert(err.message || 'An error occurred');
    }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring Vendor</h1>
          <p className="text-slate-500 text-sm">Manage vendor master data used in projects.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <SortableHeader label="Vendor Code" sortKey="vendor_code" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Vendor Name" sortKey="vendor_name" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-6 py-3 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                 <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-red-600"/>
                       <p className="text-xs text-slate-500 mt-2">Loading data...</p>
                    </td>
                 </tr>
              ) : error ? (
                <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-red-500">
                       <AlertCircle className="h-6 w-6 mx-auto mb-2"/>
                       Failed to load data
                    </td>
                 </tr>
              ) : sortedVendors?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                sortedVendors?.map((vendor) => (
                  <tr key={vendor.vendor_code} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{vendor.vendor_code}</td>
                    <td className="px-6 py-3 text-slate-600">{vendor.vendor_name}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(vendor)}
                          className="p-1.5 text-slate-500 hover:bg-white hover:text-blue-600 rounded-md border border-transparent hover:border-slate-200 transition-all"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.vendor_code)}
                          className="p-1.5 text-slate-500 hover:bg-white hover:text-red-600 rounded-md border border-transparent hover:border-slate-200 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor_code}
                  onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                  disabled={!!editingVendor}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="e.g. VEND001"
                />
                {editingVendor && <p className="text-xs text-slate-400 mt-1">Vendor Code cannot be changed.</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="e.g. PT. Vendor Sejahtera"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
