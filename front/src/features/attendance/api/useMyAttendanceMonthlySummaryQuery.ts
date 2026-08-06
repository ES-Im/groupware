import { useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import { getMyAttendanceMonthlySummary } from './getMyAttendanceMonthlySummary'

export function useMyAttendanceMonthlySummaryQuery(params?: { yearMonth?: string }) {
  return useQuery({
    queryKey: attendanceKeys.mySummary(params?.yearMonth),
    queryFn: () => getMyAttendanceMonthlySummary(params),
  })
}
