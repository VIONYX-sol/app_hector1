import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCompany() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['company-public'],
    queryFn: () => base44.entities.Company.list('-created_date', 1),
    staleTime: 5 * 60 * 1000,
  });

  return { company: companies[0] || null, isLoading };
}