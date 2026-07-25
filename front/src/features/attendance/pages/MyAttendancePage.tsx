import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useCheckInMutation } from '../api/useCheckInMutation'
import { useCheckOutMutation } from '../api/useCheckOutMutation'
import { useMyAttendanceMonthlyQuery } from '../api/useMyAttendanceMonthlyQuery'
import { useMyAttendanceMonthlySummaryQuery } from '../api/useMyAttendanceMonthlySummaryQuery'
import { deriveTodayAttendanceButtonState } from '../lib/deriveTodayAttendanceButtonState'
import { attendanceStatusBadgeMap } from '../lib/attendanceStatusBadge'
import type { AttendanceStatus } from '../model/attendance'
import { AttendanceSummaryCard } from '../components/AttendanceSummaryCard'
import { AttendanceTable } from '../components/AttendanceTable'

/** 근태 상태 필터 셀렉트 옵션 순서(도메인모델 실측 6개, attendanceStatusBadgeMap과 동일 리터럴 순서). */
const STATUS_OPTIONS: AttendanceStatus[] = [
  'NORMAL',
  'LATE_EARLY',
  'HALF_DAY_LEAVE',
  'ALL_DAY_LEAVE',
  'SICK_LEAVE',
  'ABSENT',
]

export function MyAttendancePage() {
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [status, setStatus] = useState<AttendanceStatus | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  const listQuery = useMyAttendanceMonthlyQuery({ yearMonth, status, page, size })
  const summaryQuery = useMyAttendanceMonthlySummaryQuery({ yearMonth })

  const currentYearMonth = dayjs().format('YYYY-MM')
  const todayAttendanceQuery = useMyAttendanceMonthlyQuery({
    yearMonth: currentYearMonth,
    status: undefined,
    page: 0,
    size: 100,
  })
  const { canCheckIn, canCheckOut } = todayAttendanceQuery.isSuccess
    ? deriveTodayAttendanceButtonState(todayAttendanceQuery.data?.content ?? [])
    : { canCheckIn: false, canCheckOut: false }
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()

  useEffect(() => {
    if (!listQuery.error) {
      return
    }
    handleApiError(listQuery.error, { toast })
  }, [listQuery.error])

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  useEffect(() => {
    if (!todayAttendanceQuery.error) {
      return
    }
    handleApiError(todayAttendanceQuery.error, { toast })
  }, [todayAttendanceQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  function handleStatusChange(value: string) {
    setStatus(value === '' ? undefined : (value as AttendanceStatus))
    resetPage()
  }

  const pageInfo: PageMeta = listQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">내 근태</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canCheckIn || checkInMutation.isPending}
            onClick={() => checkInMutation.mutate()}
          >
            출근
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canCheckOut || checkOutMutation.isPending}
            onClick={() => checkOutMutation.mutate()}
          >
            퇴근
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <AttendanceSummaryCard summary={summaryQuery.data} isLoading={summaryQuery.isLoading} />
      </div>

      <Card className="h-fit">
        <CardContent className="space-y-4">
          {/* 필터 툴바: 조회 월(yyyy-MM) + 근태 상태 필터. 검색창이 없는 2개 필터라 양끝 배치 대신
              좌측 필터 클러스터로 묶는다(BoardListPage 툴바 톤 유지, 모바일은 세로 스택). */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="attendance-month" className="sr-only">
                조회 월
              </label>
              <Input
                id="attendance-month"
                type="month"
                value={yearMonth}
                onChange={(event) => handleYearMonthChange(event.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="attendance-status-select" className="sr-only">
                근태 상태 필터
              </label>
              <select
                id="attendance-status-select"
                value={status ?? ''}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {attendanceStatusBadgeMap[option].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 표 영역: 로딩/에러/빈 상태는 AttendanceTable이 빈 배열로 자체 처리, 로딩/에러만 여기서 분기 */}
          {listQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : listQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              근태 목록을 불러오지 못했습니다.
            </p>
          ) : (
            <AttendanceTable data={listQuery.data?.content ?? []} />
          )}

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>
    </div>
  )
}
