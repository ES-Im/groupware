import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationCalendar } from './getFranchiseEducationCalendar'

export function useFranchiseEducationCalendarQuery(start?: string, end?: string) {
  return useQuery({
    queryKey: franchiseKeys.education.calendar(start, end),
    queryFn: () => getFranchiseEducationCalendar({ start, end }),
  })
}
