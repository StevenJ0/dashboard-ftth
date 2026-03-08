'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, AlertCircle, CalendarIcon, Check, Loader2 } from 'lucide-react';

// --- Zod Schema Helper ---
// Explicitly define input types to avoid 'unknown' inference which confuses RHF types
const optionalNumber = z.union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const parsed = Number(val);
    return isNaN(parsed) ? null : parsed;
  });

const projectSchema = z.object({
  // Header
  wbs_id: z.string().min(1, "WBS ID is required"),
  project_name: z.string().optional(),
  contract_number: z.string().optional(),
  contract_date: z.string().optional().nullable(),
  identification_project: z.string().optional(),
  project_type: z.string().optional(),
  
  // Dimensions
  regional_id: optionalNumber,
  witel_id: optionalNumber,
  sub_district: z.string().optional(),
  port_location: z.string().optional(),
  plant_code: z.string().optional(),
  program_id: optionalNumber,
  vendor_code: z.string().optional(),

  // Item Details
  pr_number: z.string().optional(),
  po_number: z.string().optional(),
  pr_amount: optionalNumber,
  po_amount: optionalNumber,
  gr_amount: optionalNumber,
  ir_amount: optionalNumber,
  
  pr_date: z.string().optional().nullable(),
  po_date: z.string().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
  gr_date: z.string().optional().nullable(),

  short_text: z.string().optional(),
  status_lapangan: z.string().optional(),
  status_tomps: z.string().optional(),
  
  // Progress (0-100)
  progress_percent: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
        if (val === '' || val === null || val === undefined) return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    })
    .pipe(z.number().min(0).max(100)),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectForm({ initialData, onClose, onSuccess }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Options State
  const [regionals, setRegionals] = useState<any[]>([]);
  const [witels, setWitels] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  
  // Loading State
  const [loadingWitels, setLoadingWitels] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    // Cast resolver to any to bypass strict type mismatch between Zod Input (string|number) and RHF Values (number)
    // This is necessary when using Zod transforms (preprocess/transform) with RHF
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      wbs_id: '',
      progress_percent: 0,
    },
  });

  // Load Options on Mount
  useEffect(() => {
    const fetchOptions = async () => {
      // Fetch independent options in parallel
      const endpoints = [
        { key: 'regionals', url: '/api/master-data/options?type=regionals', setter: setRegionals },
        { key: 'vendors', url: '/api/master-data/vendors', setter: setVendors },
        { key: 'plants', url: '/api/master-data/options?type=plants', setter: setPlants },
        { key: 'programs', url: '/api/master-data/options?type=programs', setter: setPrograms },
      ];

      await Promise.all(
        endpoints.map(async (ep) => {
          try {
            const res = await fetch(ep.url);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) ep.setter(data);
            }
          } catch (err) {
            console.error(`Failed to fetch ${ep.key}`, err);
          }
        })
      );
    };
    fetchOptions();
  }, []);

  // Initialize Form with Data
  useEffect(() => {
    if (initialData) {
      // Helper to format date for input type="date" (YYYY-MM-DD)
      const safeDate = (dateString: any) => {
          if (!dateString) return '';
          try {
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
          } catch (e) {
            return '';
          }
      };

      reset({
        ...initialData,
        regional_id: initialData.regional_id ? Number(initialData.regional_id) : null,
        witel_id: initialData.witel_id ? Number(initialData.witel_id) : null,
        program_id: initialData.program_id ? Number(initialData.program_id) : null,
        
        contract_date: safeDate(initialData.contract_date),
        pr_date: safeDate(initialData.pr_date),
        po_date: safeDate(initialData.po_date),
        delivery_date: safeDate(initialData.delivery_date),
        gr_date: safeDate(initialData.gr_date),

        pr_amount: initialData.pr_amount ? Number(initialData.pr_amount) : null,
        po_amount: initialData.po_amount ? Number(initialData.po_amount) : null,
        gr_amount: initialData.gr_amount ? Number(initialData.gr_amount) : null,
        ir_amount: initialData.ir_amount ? Number(initialData.ir_amount) : null,
        progress_percent: initialData.progress_percent ? Number(initialData.progress_percent) : 0,
      });

      // Fetch witels if regional is present
      if (initialData.regional_id) {
        fetchWitels(Number(initialData.regional_id));
      }
    }
  }, [initialData, reset]);

  // Watch Regional to trigger Witel fetch
  const selectedRegional = watch('regional_id');

  const fetchWitels = async (regId: number) => {
    setLoadingWitels(true);
    try {
      const res = await fetch(`/api/master-data/options?type=witels&regional_id=${regId}`);
      if (res.ok) {
        const data = await res.json();
        setWitels(Array.isArray(data) ? data : []);
      } else {
        setWitels([]);
      }
    } catch (e) {
      setWitels([]);
    } finally {
      setLoadingWitels(false);
    }
  };

  const handleRegionalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const val = e.target.value ? Number(e.target.value) : null;
     setValue('regional_id', val);
     setValue('witel_id', null); // Reset witel
     if (val) fetchWitels(val);
     else setWitels([]);
  };

  const onSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
       const url = '/api/projects'; // Pastikan route ini handle POST & PUT
       // Logic: Kalau ada initialData.id, kita pakai PUT (Update), kalau tidak ada pakai POST (Create)
       const method = initialData?.id ? 'PUT' : 'POST'; 
       
       // Prepare Payload (Ensure numbers are strictly numbers)
       const payload = {
           id: initialData?.id, 
           ...data,
           // Explicit conversions to prevent string issues
           regional_id: data.regional_id != null ? Number(data.regional_id) : null,
           witel_id: data.witel_id != null ? Number(data.witel_id) : null,
           program_id: data.program_id != null ? Number(data.program_id) : null,
           pr_amount: data.pr_amount != null ? Number(data.pr_amount) : null,
           po_amount: data.po_amount != null ? Number(data.po_amount) : null,
           gr_amount: data.gr_amount != null ? Number(data.gr_amount) : null,
           ir_amount: data.ir_amount != null ? Number(data.ir_amount) : null,
           progress_percent: Number(data.progress_percent || 0), // Fix Task 3 bug
       };

       const res = await fetch(url, {
           method,
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
       });

       if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Failed to save project');
       }

       onSuccess();
       onClose();

    } catch (err: any) {
        console.error(err);
        alert(`Error: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
       {/* HEADER */}
       <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 rounded-t-xl shrink-0">
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {initialData ? 'Edit Project Data' : 'Add New Project Data'}
        </h3>
        <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
        </button>
       </div>

       {/* SCROLLABLE FORM BODY */}
       <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* --- SECTION 1: HEADER DATA --- */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-700 uppercase">Project Header Information</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     {/* WBS ID */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">WBS ID <span className="text-red-500">*</span></label>
                         <input {...register('wbs_id')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-slate-100 disabled:text-slate-400" disabled={!!initialData} placeholder="e.g. Q-24001" />
                         {errors.wbs_id && <p className="text-xs text-red-500 mt-1">{errors.wbs_id.message}</p>}
                     </div>

                     {/* Project Name */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Project Name</label>
                         <input {...register('project_name')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Project Name..." />
                     </div>
                     
                     {/* Regional */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Regional</label>
                         <select 
                            value={watch('regional_id') ?? ''}
                            onChange={handleRegionalChange}
                            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                         >
                             <option value="">Select Regional...</option>
                             {regionals.map(r => <option key={r.id} value={r.id}>{r.regional_name}</option>)}
                         </select>
                     </div>

                     {/* Witel */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Witel</label>
                         <select {...register('witel_id')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-slate-100" disabled={!selectedRegional}>
                             <option value="">Select Witel...</option>
                             {witels.map(w => <option key={w.id} value={w.id}>{w.witel_name}</option>)}
                         </select>
                         {loadingWitels && <span className="text-xs text-blue-500 flex items-center mt-1"><Loader2 className="h-3 w-3 animate-spin mr-1"/> Loading Witels...</span>}
                     </div>

                     {/* Sub District */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sub-District (Kecamatan)</label>
                         <input {...register('sub_district')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Kecamatan..." />
                     </div>

                     {/* Port Location */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Port Location</label>
                         <input {...register('port_location')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Port / Site Name..." />
                     </div>
                     
                     {/* Plant */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Plant Code</label>
                         <select {...register('plant_code')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500">
                             <option value="">Select Plant...</option>
                             {plants.map(p => <option key={p.plant_code} value={p.plant_code}>{p.plant_code}</option>)}
                         </select>
                     </div>

                     {/* Vendor */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vendor</label>
                         <select {...register('vendor_code')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500">
                             <option value="">Select Vendor...</option>
                             {vendors.map(v => <option key={v.vendor_code} value={v.vendor_code}>{v.vendor_name}</option>)}
                         </select>
                     </div>

                     {/* Program */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Program</label>
                         <select {...register('program_id')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500">
                             <option value="">Select Program...</option>
                             {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
                         </select>
                     </div>

                     {/* Contract Info */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contract Number</label>
                         <input {...register('contract_number')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="No. Kontrak" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contract Date</label>
                         <input type="date" {...register('contract_date')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                 </div>
            </div>

            {/* --- SECTION 2: ITEMS & FINANCIALS --- */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-700 uppercase">Project Items & Financials</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Short Text / Description</label>
                         <input {...register('short_text')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Description..." />
                     </div>
                     <div className="md:col-span-1">
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Project Type</label>
                         <input {...register('project_type')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="Type..." />
                     </div>
                     <div className="md:col-span-1">
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Identification Project</label>
                         <input {...register('identification_project')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="ID Project..." />
                     </div>
                 </div>

                 {/* Financial Card */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     {/* PR */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PR Number</label>
                         <input {...register('pr_number')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PR Date</label>
                         <input type="date" {...register('pr_date')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PR Amount (IDR)</label>
                         <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">Rp</span>
                            <input type="number" step="0.01" {...register('pr_amount')} className="block w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-right" placeholder="0" />
                         </div>
                     </div>

                     {/* PO */}
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PO Number</label>
                         <input {...register('po_number')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PO Date</label>
                         <input type="date" {...register('po_date')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">PO Amount (IDR)</label>
                         <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 text-sm">Rp</span>
                            <input type="number" step="0.01" {...register('po_amount')} className="block w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-right" placeholder="0" />
                         </div>
                     </div>
                 </div>

                 {/* Dates & Other Amounts */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">GR Date</label>
                         <input type="date" {...register('gr_date')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Delivery Date</label>
                         <input type="date" {...register('delivery_date')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">GR Amount (IDR)</label>
                         <input type="number" step="0.01" {...register('gr_amount')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-right" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">IR Amount (IDR)</label>
                         <input type="number" step="0.01" {...register('ir_amount')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-right" />
                     </div>
                 </div>

                 {/* STATUS & PROGRESS */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status Lapangan</label>
                         <input {...register('status_lapangan')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="e.g. Instalasi ODP..." />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status Tomps (Stage)</label>
                         <select {...register('status_tomps')} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500">
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
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Progress (%)</label>
                         <div className="relative">
                             <input type="number" min="0" max="100" {...register('progress_percent', { valueAsNumber: true })} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold text-right" />
                             <span className="absolute right-8 top-2 text-slate-400 text-sm">%</span>
                         </div>
                     </div>
                 </div>
            </div>
       </form>

       {/* FOOTER ACTION */}
       <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-xl shrink-0">
           <button onClick={onClose} type="button" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
               Cancel
           </button>
           <button 
             onClick={handleSubmit(onSubmit)} 
             disabled={isSubmitting}
             type="button" 
             className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
           >
               {isSubmitting ? (
                   <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
               ) : (
                   <><Save className="h-4 w-4" /> Save Data</>
               )}
           </button>
       </div>
    </div>
  );
}