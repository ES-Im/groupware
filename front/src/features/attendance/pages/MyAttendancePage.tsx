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

/**
 * 내 근태 페이지(F303·F304, ROADMAP2.md T1.5, docs/prd/5.attendance-prd.md §페이지별 상세(내 근태 페이지)).
 *
 * 월(yearMonth, yyyy-MM, 기본=현재월)·근태 상태 필터를 useMyAttendanceMonthlyQuery(F303)·
 * useMyAttendanceMonthlySummaryQuery(F304)에 동일하게 연동한다. 필터 변경 시 resetPage()로
 * 페이지를 0으로 되돌려 존재하지 않는 페이지를 조회하는 것을 방지한다(BoardListPage/
 * DepartmentMembersPage와 동일 컨벤션 — usePageState/PaginationControls 그대로 재사용).
 *
 * 출근/퇴근 버튼(F301/F302, ROADMAP2.md T2.3)은 오늘 월별 목록(useMyAttendanceMonthlyQuery)에서
 * deriveTodayAttendanceButtonState(T2.1)로 canCheckIn/canCheckOut을 파생해 활성/비활성을 결정하고,
 * useCheckInMutation/useCheckOutMutation(T2.2)을 그대로 호출한다. 두 mutation 훅이 이미 성공/실패
 * 토스트와 attendanceKeys invalidate를 자체 처리하므로(T2.2 JSDoc 참조) 이 페이지에서는 onError나
 * handleApiError를 중복 호출하지 않는다 — 중복 호출 시 토스트가 두 번 노출된다.
 *
 * canCheckIn/canCheckOut 파생은 화면 표시용 listQuery(yearMonth/status/page/size가 사용자
 * 조작으로 바뀌는 목록)가 아니라, **이 페이지가 별도로 호출하는 전용 쿼리**(`todayAttendanceQuery`)의
 * content만 소비한다. 파라미터를 `{ yearMonth: currentYearMonth, status: undefined, page: 0,
 * size: 100 }`로 고정해 화면 필터·페이지 이동과 완전히 독립적으로 유지한다(size=100은 한 달
 * 최대 일수(31)에 반차 분할까지 고려해도 넉넉한 상한 — 서버 PAGE_SIZE 기본값 10을 훨씬 넘겨
 * 당월 전체가 한 페이지에 들어오게 한다).
 *
 * 이렇게 분리하는 이유(Open Q#3 — 당일 단건 조회 API 부재로 월별 목록 재사용이 전제): 화면
 * 표시용 listQuery를 그대로 파생에 썼다면 (1) 서버가 attendanceDate 오름차순 정렬 + 기본
 * size=10로 응답하므로 당월 기록이 10건을 넘으면 오늘 레코드가 마지막 페이지에 있어 기본
 * 화면(page 0)의 content에는 없고, (2) 사용자가 오늘 레코드와 다른 상태로 필터링하면 서버가
 * 오늘 레코드 자체를 응답에서 제외하며, (3) 사용자가 조회 월 필터를 과거/미래 달로 바꾸면 그 달의
 * 목록엔 애초에 오늘 레코드가 없다 — 세 경우 모두 "오늘 레코드가 실제로 없는 상태"로 오판해 이미
 * 출근한 사용자에게도 '출근' 버튼이 활성으로 보이는 동일한 근본 문제(중복 출근 위험)를 낳는다.
 * 파라미터를 고정한 전용 쿼리는 화면 필터/페이지와 무관하게 항상 "당월 전체"를 담으므로 세 경로
 * 모두 원천적으로 해소된다. 게이팅은 이 전용 쿼리의 `isSuccess`만 기준으로 한다(로딩 중이거나
 * 실패면 `content`를 신뢰할 수 없으므로 두 버튼 모두 비활성) — 쿼리 키 파라미터가 고정이라
 * useMyAttendanceMonthlyQuery의 `placeholderData: keepPreviousData`도 실질적으로 다른 키 간
 * 전환이 없어 stale 데이터로 판정될 여지가 없다.
 *
 * 조회 실패는 태스크 지시대로 handleApiError(공용 에러 코드 분기)로 처리한다 — VALIDATION_ERROR
 * 계열은 setError 컨텍스트가 없어 토스트로 폴백, ROLE_002(재발급 실패 신호)는 navigate 컨텍스트를
 * 넘기지 않아 여기서는 토스트만 남긴다(DepartmentDetailPage의 mutation 에러 처리와 동일하게
 * `{ toast }`만 전달하는 컨벤션 — 전역 재로그인 유도는 T0.1 axios 인터셉터의 몫). 이 페이지엔
 * not-found 전용 UX가 PRD에 명시되어 있지 않아 board/department의 normalizeApiError+isNotFound
 * 수동 분기 대신 handleApiError 단일 진입점을 그대로 소비한다. listQuery/summaryQuery뿐 아니라
 * todayAttendanceQuery도 동일한 useEffect+handleApiError 패턴으로 에러를 토스트에 연결한다 —
 * 화면 목록(listQuery)은 정상 응답했는데 전용 쿼리만 실패하는 경로(예: 과거월 조회 중 현재월
 * 전용 쿼리만 실패)에서도 사용자가 원인 없이 버튼만 비활성인 상태에 빠지지 않도록 한다.
 */
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
