import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseEducationCalendar } from './getFranchiseEducationCalendar'

/**
 * 가맹점 교육 캘린더 조회 훅(`FRANCHISE_EDUCATION_CALENDAR`, ROADMAP(FRANCHISE) T4.1, F1609).
 * range(FullCalendar 뷰 기간)가 바뀌면 queryKey(franchiseKeys.education.calendar(start, end))가
 * 달라져 자동으로 재조회된다(useMyMeetingReservationsCalendarQuery 동형). 실패는 throw로
 * 위임하고 handleApiError는 소비 페이지가 처리한다.
 */
export function useFranchiseEducationCalendarQuery(start?: string, end?: string) {
  return useQuery({
    queryKey: franchiseKeys.education.calendar(start, end),
    queryFn: () => getFranchiseEducationCalendar({ start, end }),
  })
}
