import { useQuery } from '@tanstack/react-query'
import { fetchCompanies, fetchCompanyById } from '@/services/companyService'
import type { Company, CompanyDetail } from '@/types/company'

export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetchCompanies()
      if (!response.success) throw new Error(response.message)
      return response.data
    },
  })
}

export function useCompany(id: string) {
  return useQuery<CompanyDetail>({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await fetchCompanyById(id)
      if (!response.success) throw new Error(response.message)
      return response.data
    },
    enabled: !!id,
  })
}