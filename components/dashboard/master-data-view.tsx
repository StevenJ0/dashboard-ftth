'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useProjects, ProjectData } from '@/lib/swr/useProjects';
import { mutate as globalMutate } from 'swr';
import * as XLSX from 'xlsx';
import { Plus, Download, Pencil, Trash2, X, Save, AlertCircle, Check, Search, ChevronLeft, ChevronRight, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Loading from '@/components/ui/loading';
import { motion } from 'framer-motion';
import ProjectForm from './project-form';
import ProjectDetailModal from './project-detail-modal';

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
      scope="col"
      className={`px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors select-none group ${className}`}
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

// --- QUICK EDIT COMPONENT ---
interface QuickEditProps {
  item: ProjectData;
  onUpdate: (id: number, newStage: string, newPercent: number) => Promise<void>;
}

const QuickEditCell = ({ item, onUpdate }: QuickEditProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState(item.status_tomps || '');
  const [percent, setPercent] = useState(item.progress_percent || 0);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset state when opening/closing
  useEffect(() => {
      if (!isOpen) {
          setStage(item.status_tomps || '');
          setPercent(item.progress_percent || 0);
      }
  }, [isOpen, item]);

  const handleSave = async () => {
    await onUpdate(item.id, stage, percent);
    setIsOpen(false);
  };

  const getColor = (p: number) => {
    if (p >= 100) return 'bg-emerald-500';
    if (p >= 76) return 'bg-blue-500';
    if (p >= 26) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleSliderChange = (val: number) => {
      setPercent(val);
      if (val === 100) setStage('CLOSED');
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer group flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Click to Quick Edit"
      >
        <span className="text-xs font-bold w-8 text-right text-slate-900">{item.progress_percent}%</span>
        <div className="h-2.5 w-24 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
           <div 
             className={`h-full rounded-full transition-all duration-500 ${getColor(item.progress_percent)}`} 
             style={{ width: `${item.progress_percent}%` }}
           />
        </div>
      </div>

      {isOpen && (
        <>
          {/* Mobile: Full screen overlay with centered modal */}
          <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div 
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-4 animate-in zoom-in-95 fade-in duration-200"
            >
              <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Quick Update Status</h4>
                      <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="h-4 w-4"/>
                      </button>
                  </div>
                  <div>
                      <label className="text-xs font-medium text-slate-700 mb-1 block">Stage</label>
                      <select 
                          value={stage} 
                          onChange={(e) => setStage(e.target.value)}
                          className="w-full rounded-md border-slate-300 text-sm focus:border-red-500 focus:ring-red-500 py-1.5"
                      >
                          <option value="">Select Stage...</option>
                          <option value="SURVEY">SURVEY</option>
                          <option value="DESIGN">DESIGN</option>
                          <option value="INSTALLATION">INSTALLATION</option>
                          <option value="QC">QC</option>
                          <option value="GO LIVE">GO LIVE</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="CANCEL">CANCEL</option>
                          <option value="ON PROGRESS">ON PROGRESS</option>
                      </select>
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-slate-700">Progress (%)</label>
                          <input 
                              type="number" 
                              min="0" max="100" 
                              value={percent} 
                              onChange={(e) => handleSliderChange(Number(e.target.value))}
                              className="w-12 text-right text-xs border border-slate-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-red-500"
                          />
                      </div>
                      <input 
                          type="range" 
                          min="0" max="100" 
                          value={percent} 
                          onChange={(e) => handleSliderChange(Number(e.target.value))} 
                          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600`}
                      />
                  </div>
                  <button 
                      onClick={handleSave}
                      className="mt-1 flex w-full items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                  >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Save Changes
                  </button>
              </div>
            </div>
          </div>

          {/* Desktop: Popover positioned below the progress bar */}
          <div className="hidden md:block absolute left-0 top-full mt-2 z-50 w-72">
            <div 
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in zoom-in-95 fade-in duration-200"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase text-slate-500">Quick Update Status</h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">Stage</label>
                        <select 
                            value={stage} 
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full rounded-md border-slate-300 text-sm focus:border-red-500 focus:ring-red-500 py-1.5"
                        >
                            <option value="">Select Stage...</option>
                            <option value="SURVEY">SURVEY</option>
                            <option value="DESIGN">DESIGN</option>
                            <option value="INSTALLATION">INSTALLATION</option>
                            <option value="QC">QC</option>
                            <option value="GO LIVE">GO LIVE</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="CANCEL">CANCEL</option>
                            <option value="ON PROGRESS">ON PROGRESS</option>
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-slate-700">Progress (%)</label>
                            <input 
                                type="number" 
                                min="0" max="100" 
                                value={percent} 
                                onChange={(e) => handleSliderChange(Number(e.target.value))}
                                className="w-12 text-right text-xs border border-slate-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={percent} 
                            onChange={(e) => handleSliderChange(Number(e.target.value))} 
                            className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600`}
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        className="mt-1 flex w-full items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                    >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Save Changes
                    </button>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function MasterDataView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Use Custom Hook for Projects
  const { items, pagination, isLoading, isError, mutate } = useProjects({ 
    page, 
    limit, 
    search: debouncedSearch 
  });

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

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
  const sortedItems = useMemo(() => 
    sortData(items || [], sortConfig, getNestedValue), 
    [items, sortConfig]
  );

  const handleAddNew = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: ProjectData) => {
    setSelectedProject(item);
    setIsFormOpen(true);
  };

  const handleView = (item: ProjectData) => {
      setSelectedProject(item);
      setIsDetailOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutate();
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    }
  };

  const handleQuickUpdate = async (id: number, newStage: string, newPercent: number) => {
      try {
          const res = await fetch('/api/projects', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, status_tomps: newStage, progress_percent: newPercent })
          });
          if (!res.ok) throw new Error('API Error');
          mutate();
      } catch (err) {
          console.error(err);
          alert('Failed to update status');
      }
  };

  const handleDownloadExcel = async () => {
    const exportUrl = `/api/projects?limit=10000&search=${debouncedSearch}`;
    const res = await fetch(exportUrl);
    const result = await res.json();
    
    if (result.data) {
      const worksheet = XLSX.utils.json_to_sheet(result.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data');
      XLSX.writeFile(workbook, 'Master_Data_Export.xlsx');
    }
  };

  if (isError) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Failed to load data</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      className="space-y-6 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Monitoring Data</h2>
          <p className="text-sm text-slate-500 mt-1">Manage software project data</p>
        </div>
        <div className="flex gap-2">

                <button
                  onClick={handleDownloadExcel}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </button>

                {/* Import Excel Button & Input */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    id="excel-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!confirm(`Import data from ${file.name}?`)) {
                        e.target.value = ''; // Reset
                        return;
                      }

                      const formData = new FormData();
                      formData.append('file', file);

                      try {
                        const res = await fetch('/api/projects/import', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!res.ok) throw new Error('Import failed');
                        
                        const result = await res.json();
                        alert(`Success! Processed ${result.count} rows.`);
                        globalMutate('/api/projects'); // Refresh data
                        mutate();
                        
                      } catch (err) {
                        console.error(err);
                        alert('Error importing Excel file');
                      } finally {
                        e.target.value = ''; // Reset input
                      }
                    }}
                  />
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Download className="mr-2 h-4 w-4 rotate-180" /> {/* Rotate for Upload icon effect */}
                    Import Excel
                  </label>
                </div>

                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                placeholder="Search by WBS ID or Project Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative max-h-[65vh] overflow-x-auto">
                {isLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <Loading />
                  </div>
                )}
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-20 bg-slate-100 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <SortableHeader label="WBS ID" sortKey="wbs_id" currentSort={sortConfig} onSort={handleSort} className="min-w-[120px]" />
                      <SortableHeader label="Project Name" sortKey="project_name" currentSort={sortConfig} onSort={handleSort} className="min-w-[200px]" />
                      <SortableHeader label="Regional" sortKey="regional" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="Witel" sortKey="witel" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="Vendor" sortKey="vendor_name" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="PR Amount" sortKey="pr_amount" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="Status (Stage)" sortKey="status_tomps" currentSort={sortConfig} onSort={handleSort} className="text-center min-w-[140px]" />
                      <SortableHeader label="Progress (%)" sortKey="progress_percent" currentSort={sortConfig} onSort={handleSort} className="text-left min-w-[180px]" />
                      <th scope="col" className="px-4 py-3 text-right sticky right-0 bg-slate-100 z-30 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedItems?.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-red-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-inherit z-1">{item.wbs_id}</td>
                        <td className="px-4 py-3 text-slate-600 line-clamp-2 max-w-[300px]" title={item.project_name || ''}>{item.project_name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.regional}</td>
                        <td className="px-4 py-3 text-slate-600">{item.witel}</td>
                        <td className="px-4 py-3 text-slate-600">{item.vendor_name}</td>
                        <td className="px-4 py-3 text-slate-900 whitespace-nowrap">
                          {item.pr_amount 
                            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.pr_amount)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status_tomps === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 
                            item.status_tomps === 'GO LIVE' ? 'bg-blue-100 text-blue-700' :
                            item.status_tomps === 'ON PROGRESS' ? 'bg-amber-100 text-amber-700' :
                            item.status_tomps === 'CANCEL' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status_tomps || 'N/A'}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 text-left">
                          <QuickEditCell item={item} onUpdate={handleQuickUpdate} />
                        </td>

                        <td className="px-4 py-3 text-right sticky right-0 bg-white z-10 shadow-[-5px_0px_5px_-5px_rgba(0,0,0,0.1)]">
                          <div className="flex justify-end gap-2">
                             <button 
                              onClick={() => handleView(item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEdit(item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!sortedItems || sortedItems.length === 0) && !isLoading && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-12 w-12 text-slate-300 mb-3" />
                            <p className="text-sm font-medium">No project data found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              
               {pagination && pagination.totalItems > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium">
                    Showing {(page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.totalItems)} of{' '}
                    {pagination.totalItems} results
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                page === pageNum
                                  ? "bg-red-600 text-white font-semibold"
                                  : "border border-slate-300 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === 2 && page > 3) ||
                          (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2)
                        ) {
                          return (
                            <span key={pageNum} className="px-1 text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                      className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Form Modal */}
            {isFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden">
                       <ProjectForm 
                        initialData={selectedProject} 
                        onClose={() => setIsFormOpen(false)} 
                        onSuccess={() => {
                            mutate();
                            // setIsFormOpen(false); // Handled by onClose in ProjectForm usually, but double check
                        }} 
                       />
                  </div>
              </div>
            )}

            {/* Project Detail Modal */}
            {isDetailOpen && selectedProject && (
                <ProjectDetailModal 
                    item={selectedProject} 
                    onClose={() => setIsDetailOpen(false)} 
                />
            )}
    </motion.div>
  );
}