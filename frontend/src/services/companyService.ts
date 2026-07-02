import type { ApiResponse } from '@/types/api'
import type { Company, CompanyDetail } from '@/types/company'
import { getCompanies, getCompanyById } from '@/data/companies'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchCompanies(): Promise<ApiResponse<Company[]>> {
  await delay(300)
  return {
    success: true,
    message: 'Operation successful',
    data: getCompanies(),
  }
}

export async function fetchCompanyById(
  id: string,
): Promise<ApiResponse<CompanyDetail>> {
  await delay(200)
  const company = getCompanyById(id)
  if (!company) {
    throw new Error('Company not found')
  }
  return {
    success: true,
    message: 'Operation successful',
    data: company,
  }
}