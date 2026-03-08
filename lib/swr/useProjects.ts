import useSWR from 'swr';

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ProjectData {
  id: number;
  wbs_id: string;
  project_name: string | null;
  regional: string | null;
  witel: string | null;
  plant: string | null;
  vendor_code: string | null;
  vendor_name: string | null;
  pr_number: string | null;
  po_number: string | null;
  pr_amount: number | null;
  po_amount: number | null;
  short_text: string | null;
  sub_district: string | null;
  port_location: string | null;
  status_lapangan: string | null;
  status_tomps: string | null;
  progress_percent: number;
  port_location: string | null;
  sub_district: string | null;
  project_type: string | null;
  program_name: string | null;
  contract_number: string | null;
  contract_date: string | null;
  delivery_date: string | null;
  gr_amount: number | null;
  ir_amount: number | null;
  gr_date: string | null;
  pr_date: string | null;
  po_date: string | null;
  regional_id: number | null;
  witel_id: number | null;
  program_id: number | null;
  identification_project: string | null;
  // Extras
  regional_name?: string; 
  witel_name?: string;
  plant_code?: string;
}

export interface ProjectsResponse {
  data: ProjectData[];
  pagination: Pagination;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useProjects({ page = 1, limit = 50, search = '' }: UseProjectsParams) {
  const key = [`/api/projects?page=${page}&limit=${limit}&search=${search}`];

  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(
    key, 
    ([url]) => fetcher(url),
    {
      keepPreviousData: true, // Prevents flickering
      revalidateOnFocus: false,
    }
  );

  return {
    items: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
