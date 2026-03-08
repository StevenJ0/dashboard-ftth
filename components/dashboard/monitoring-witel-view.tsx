'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Plus, Pencil, Trash2, Search, AlertTriangle, AlertCircle, X, Save, Check, Map, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Loading from '@/components/ui/loading';
import { motion } from 'framer-motion';

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
      className={`px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group ${className}`}
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

const Tabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  return (
    <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-6">
      {['regionals', 'witels', 'locations'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all ${
            activeTab === tab
              ? 'bg-white text-red-600 shadow font-bold'
              : 'text-slate-500 hover:bg-white/[0.6] hover:text-slate-800'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MonitoringWitelView() {

    const [activeTab, setActiveTab] = useState('regionals');
  
    // State for Lists
    const [regionals, setRegionals] = useState<any[]>([]);
    const [witels, setWitels] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    
    // Location Pagination & Filter
    const [locPage, setLocPage] = useState(1);
    const [locTotalPages, setLocTotalPages] = useState(1);
    const [locTotalItems, setLocTotalItems] = useState(0);
    const [locLimit] = useState(20);
    const [locSearch, setLocSearch] = useState('');
    const [filterRegional, setFilterRegional] = useState('');
    const [filterWitel, setFilterWitel] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({}); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

    // Reset sort when changing tabs
    useEffect(() => {
      setSortConfig({ key: '', direction: null });
    }, [activeTab]);

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
    const sortedRegionals = useMemo(() => 
      sortData(regionals, sortConfig, getNestedValue), 
      [regionals, sortConfig]
    );

    const sortedWitels = useMemo(() => 
      sortData(witels, sortConfig, getNestedValue), 
      [witels, sortConfig]
    );

    const sortedLocations = useMemo(() => 
      sortData(locations, sortConfig, getNestedValue), 
      [locations, sortConfig]
    );

    // --- FETCH DATA ---

    const refreshData = () => {
        setIsLoading(true);
        if (activeTab === 'regionals') {
            fetch('/api/master-data/regionals')
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setRegionals(data); })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        } else if (activeTab === 'witels') {
            fetch('/api/master-data/witels')
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setWitels(data); })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        } else if (activeTab === 'locations') {
            const query = new URLSearchParams({
                page: locPage.toString(),
                limit: locLimit.toString(),
                search: locSearch,
                regional_id: filterRegional,
                witel_id: filterWitel
            });
            fetch(`/api/master-data/locations?${query.toString()}`)
                .then(res => res.json())
                .then(res => {
                    setLocations(Array.isArray(res.data) ? res.data : []);
                    setLocTotalPages(res.pagination?.totalPages ?? 1);
                    setLocTotalItems(res.pagination?.totalItems ?? 0);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(() => {
        refreshData();
    }, [activeTab, locPage, locSearch, filterRegional, filterWitel]);


    // Only need Regionals list for dropdowns when in Witel/Location tab
    useEffect(() => {
        if ((activeTab === 'witels' || activeTab === 'locations') && regionals.length === 0) {
            fetch('/api/master-data/regionals').then(res => res.json()).then(data => { if (Array.isArray(data)) setRegionals(data); });
        }
    }, [activeTab]);


    const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const res = await fetch(`/api/master-data/${activeTab}?id=${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (!res.ok) {
            setErrorMsg(result.error || 'Failed to delete');
            setTimeout(() => setErrorMsg(null), 5000);
        } else {
            refreshData();
        }
    } catch (err) {
        console.error(err);
        setErrorMsg('Network error');
    }
  };

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const method = editingItem ? 'PUT' : 'POST';
          const payload = { ...formData, id: editingItem?.id };
          
          const res = await fetch(`/api/master-data/${activeTab}`, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (!res.ok) throw new Error('Failed to save');
          
          setIsModalOpen(false);
          refreshData();
      } catch (err) {
          console.error(err);
          alert('Error saving data');
      } finally {
          setIsSubmitting(false);
      }
  };


  const openAddModal = () => {
      setEditingItem(null);
      setFormData({});
      setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
      setEditingItem(item);
      setFormData(item);
      setIsModalOpen(true);
  };

  return (
    <motion.div 
      className="space-y-6 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Monitoring Witel</h2>
          <p className="text-sm text-slate-500 mt-1">Manage Master Data for Regionals, Witels, and Locations</p>
        </div>
        <div>
             <button 
                onClick={openAddModal}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
             >
                 <Plus className="mr-2 h-4 w-4" />
                 Add New {activeTab.slice(0,-1)}
             </button>
        </div>
      </div>

      {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">{errorMsg}</p>
          </div>
      )}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Toolbar (Search & Filters for Locations) */}
      {activeTab === 'locations' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="relative flex-1 w-full">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search Location..." 
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                 />
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                 <select 
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    value={filterRegional}
                    onChange={(e) => { setFilterRegional(e.target.value); setFilterWitel(''); }}
                 >
                     <option value="">All Regions</option>
                     {regionals.map(r => <option key={r.id} value={r.id}>{r.regional_name}</option>)}
                 </select>
            </div>
      </div>
      )}

      {/* Content Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {isLoading && (
              <div className="flex items-center justify-center p-12">
                  <Loading />
              </div>
          )}
          
          {!isLoading && activeTab === 'regionals' && (
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                          <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} className="min-w-[80px]" />
                          <SortableHeader label="Regional Name" sortKey="regional_name" currentSort={sortConfig} onSort={handleSort} className="w-full" />
                          <SortableHeader label="Total Witels" sortKey="_count.dim_witels" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                          <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {sortedRegionals.map((r) => (
                          <tr key={r.id} className="hover:bg-red-50 transition-colors">
                              <td className="px-6 py-3 text-slate-900">{r.id}</td>
                              <td className="px-6 py-3 text-slate-700 font-medium">{r.regional_name}</td>
                              <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                      {r._count?.dim_witels || 0}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditModal(r)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4"/></button>
                                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4"/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {sortedRegionals.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data found</td></tr>}
                  </tbody>
              </table>
          )}

          {!isLoading && activeTab === 'witels' && (
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                          <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} className="min-w-[80px]" />
                          <SortableHeader label="Witel Name" sortKey="witel_name" currentSort={sortConfig} onSort={handleSort} className="w-full" />
                          <SortableHeader label="Regional Parent" sortKey="dim_regionals.regional_name" currentSort={sortConfig} onSort={handleSort} />
                          <SortableHeader label="Locations" sortKey="_count.dim_locations" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                          <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {sortedWitels.map((w) => (
                          <tr key={w.id} className="hover:bg-red-50 transition-colors">
                              <td className="px-6 py-3 text-slate-900">{w.id}</td>
                              <td className="px-6 py-3 text-slate-700 font-medium">{w.witel_name}</td>
                              <td className="px-6 py-3 text-slate-500">{w.dim_regionals?.regional_name}</td>
                              <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center justify-center bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                      {w._count?.dim_locations || 0}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditModal(w)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4"/></button>
                                      <button onClick={() => handleDelete(w.id)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4"/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                       {sortedWitels.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No data found</td></tr>}
                  </tbody>
              </table>
          )}

          {!isLoading && activeTab === 'locations' && (
               <>
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                          <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} className="min-w-[80px]" />
                          <SortableHeader label="Sub District" sortKey="sub_district" currentSort={sortConfig} onSort={handleSort} />
                          <SortableHeader label="Port" sortKey="port_location" currentSort={sortConfig} onSort={handleSort} />
                          <SortableHeader label="Witel" sortKey="dim_witels.witel_name" currentSort={sortConfig} onSort={handleSort} />
                          <SortableHeader label="Regional" sortKey="dim_witels.dim_regionals.regional_name" currentSort={sortConfig} onSort={handleSort} />
                          <SortableHeader label="Projects" sortKey="_count.project_items" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                          <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {sortedLocations.map((l) => (
                          <tr key={l.id} className="hover:bg-red-50 transition-colors">
                              <td className="px-6 py-3 text-slate-900">{l.id}</td>
                              <td className="px-6 py-3 text-slate-700 font-medium">{l.sub_district}</td>
                              <td className="px-6 py-3 text-slate-500">{l.port_location || '-'}</td>
                              <td className="px-6 py-3 text-slate-500">{l.dim_witels?.witel_name}</td>
                              <td className="px-6 py-3 text-slate-500">{l.dim_witels?.dim_regionals?.regional_name}</td>
                              <td className="px-6 py-3 text-center">
                                  {l._count?.project_items > 0 ? (
                                      <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                          {l._count?.project_items} Use
                                      </span>
                                  ): (
                                      <span className="text-slate-400 text-xs">-</span>
                                  )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditModal(l)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded transition-colors" title="Edit"><Pencil className="h-4 w-4"/></button>
                                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded transition-colors" title="Delete"><Trash2 className="h-4 w-4"/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                       {sortedLocations.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No data found</td></tr>}
                  </tbody>
              </table>

              {/* Pagination */}
              {locTotalItems > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium">
                    Showing {(locPage - 1) * locLimit + 1} to {Math.min(locPage * locLimit, locTotalItems)} of {locTotalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => setLocPage(p => Math.max(1, p-1))} disabled={locPage===1} className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4"/></button>
                      <button onClick={() => setLocPage(p => Math.min(locTotalPages, p+1))} disabled={locPage===locTotalPages} className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4"/></button>
                  </div>
                </div>
              )}
              </>
          )}
      </div>

    {/* MODAL */}
    {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200">
                 <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                      {editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
                    </h3>
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                 </div>
                 
                 <form onSubmit={handleSave} className="p-6 space-y-4">
                     
                     {activeTab === 'regionals' && (
                         <div>
                             <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Regional Name *</label>
                             <input className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.regional_name || ''} onChange={e => setFormData({...formData, regional_name: e.target.value})} required/>
                         </div>
                     )}

                     {activeTab === 'witels' && (
                         <>
                         <div>
                             <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Witel Name *</label>
                             <input className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.witel_name || ''} onChange={e => setFormData({...formData, witel_name: e.target.value})} required/>
                         </div>
                         <div>
                             <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Parent Regional *</label>
                             <select className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.regional_id || ''} onChange={e => setFormData({...formData, regional_id: e.target.value})} required>
                                 <option value="">Select Regional...</option>
                                 {regionals.map(r => <option key={r.id} value={r.id}>{r.regional_name}</option>)}
                             </select>
                         </div>
                         </>
                     )}

                     {activeTab === 'locations' && (
                          <LocationFormFields formData={formData} setFormData={setFormData} regionals={regionals} />
                     )}

                     <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                         <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:shadow-md disabled:bg-red-400 disabled:cursor-not-allowed transition-all">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                         </button>
                     </div>
                 </form>
             </div>
        </div>
    )}

    </motion.div>
  );
}

// Sub-component for Location Form to handle its own effect for witels
function LocationFormFields({ formData, setFormData, regionals }: any) {
    const [witels, setWitels] = useState<any[]>([]);
    
    // Fetch witels when regional selected
    useEffect(() => {
        if (formData.regional_id) {
             fetch(`/api/master-data/options?type=witels&regional_id=${formData.regional_id}`)
                .then(r => r.json())
                .then(setWitels);
        } else {
             // Reset if no reg?
             setWitels([]);
        }
    }, [formData.regional_id]);

    // On Mount/Edit: if we have witel info but no regional, try to infer or just let user pick?
    // If we have witel object in formData (from table), we can set regional_id
    useEffect(() => {
        if (formData.witel?.regional_id && !formData.regional_id) {
             setFormData((prev: any) => ({ ...prev, regional_id: formData.witel.regional_id }));
        }
    }, []);

    return (
        <div className="space-y-4">
             <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Regional *</label>
                <select className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.regional_id || ''} onChange={e => setFormData({...formData, regional_id: e.target.value, witel_id: ''})} required>
                    <option value="">Select Regional...</option>
                    {regionals.map((r: any) => <option key={r.id} value={r.id}>{r.regional_name}</option>)}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Witel *</label>
                <select className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.witel_id || ''} onChange={e => setFormData({...formData, witel_id: e.target.value})} required disabled={!formData.regional_id}>
                    <option value="">Select Witel...</option>
                    {witels.map((w: any) => <option key={w.id} value={w.id}>{w.witel_name}</option>)}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Sub District *</label>
                <input className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.sub_district || ''} onChange={e => setFormData({...formData, sub_district: e.target.value})} required/>
            </div>
             <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase">Port *</label>
                <input className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors" value={formData.port_location || ''} onChange={e => setFormData({...formData, port_location: e.target.value})} required/>
            </div>
        </div>
    )
}