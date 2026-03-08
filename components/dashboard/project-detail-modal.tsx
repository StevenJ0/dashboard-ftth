'use client';

import { X, Calendar, DollarSign, MapPin, Briefcase, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectDetailModalProps {
  item: any;
  onClose: () => void;
}

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy');
};

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

export default function ProjectDetailModal({ item, onClose }: ProjectDetailModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 rounded-t-xl">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">{item.wbs_id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                         item.progress_percent === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                        {item.progress_percent}%
                    </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">{item.project_name || 'No Project Name'}</h3>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
            </button>
        </div>

        <div className="p-6 space-y-8">
            
            {/* General Information */}
            <section>
                <div className="flex items-center gap-2 mb-4 pb-1 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-bold uppercase text-slate-500">General Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Regional" value={item.regional} />
                    <DetailItem label="Witel" value={item.witel} />
                    <DetailItem label="Sub-District" value={item.sub_district} />
                    <DetailItem label="Port Location" value={item.port_location} />
                    <DetailItem label="Vendor" value={item.vendor_name} />
                    <DetailItem label="Program" value={item.identification_project} />
                    <DetailItem label="Plant Code" value={item.plant} />
                    <DetailItem label="Project Type" value={item.project_type} />
                    <DetailItem label="Contract No" value={item.contract_number} />
                    <DetailItem label="Contract Date" value={formatDate(item.contract_date)} />
                </div>
            </section>

            {/* Financials Grid */}
            <section className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold uppercase text-emerald-600">Financials</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FinancialCard label="PR Amount" amount={item.pr_amount} date={item.pr_date} number={item.pr_number} labelColor="text-blue-600" />
                    <FinancialCard label="PO Amount" amount={item.po_amount} date={item.po_date} number={item.po_number} labelColor="text-indigo-600" />
                    <FinancialCard label="GR Amount" amount={item.gr_amount} date={item.gr_date} labelColor="text-violet-600" />
                    <FinancialCard label="IR Amount" amount={item.ir_amount} labelColor="text-fuchsia-600" />
                </div>
            </section>

             {/* Description & Status */}
             <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase text-slate-500">Description</h4>
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
                        {item.short_text || <span className="text-slate-400 italic">No description provided.</span>}
                    </p>
                </div>
                <div>
                     <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase text-slate-500">Field Status</h4>
                    </div>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                             <span className="text-xs font-semibold text-slate-500 uppercase">Status Lapangan</span>
                             <span className="text-sm font-medium text-slate-800">{item.status_lapangan || '-'}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                             <span className="text-xs font-semibold text-slate-500 uppercase">Stage (Tomps)</span>
                             <span className="text-sm font-bold text-red-600">{item.status_tomps || '-'}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                             <span className="text-xs font-semibold text-slate-500 uppercase">Delivery Date</span>
                             <span className="text-sm font-medium text-slate-800">{formatDate(item.delivery_date)}</span>
                         </div>
                    </div>
                </div>
             </section>

        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || '-'}</dd>
        </div>
    );
}

function FinancialCard({ label, amount, date, number, labelColor }: any) {
    return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                <span className={`text-xs font-bold uppercase ${labelColor}`}>{label}</span>
                <div className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
                    {formatCurrency(amount)}
                </div>
            </div>
            {(date || number) && (
                <div className="mt-3 text-xs space-y-1 pt-3 border-t border-slate-100">
                    {number && <div className="flex justify-between"><span className="text-slate-400">No:</span> <span className="font-mono text-slate-700">{number}</span></div>}
                    {date && <div className="flex justify-between"><span className="text-slate-400">Date:</span> <span className="text-slate-700">{formatDate(date)}</span></div>}
                </div>
            )}
        </div>
    );
}
