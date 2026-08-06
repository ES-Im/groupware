import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationCalendarItem } from '../model/franchise'

export async function getFranchiseEducationCalendar(params?: {
  start?: string
  end?: string
}): Promise<FranchiseEducationCalendarItem[]> {
  const query: Record<string, string> = {}
  if (params?.start) {
    query.start = params.start
  }
  if (params?.end) {
    query.end = params.end
  }
  const { data } = await apiClient.get<FranchiseEducationCalendarItem[]>(
    '/api/franchise-educations/calendar',
    { params: query },
  )
  return data
}
