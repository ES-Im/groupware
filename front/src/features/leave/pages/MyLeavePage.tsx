import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '@/features/approval/lib/approvalStatusBadge'
import type { ApprovalStatus } from '@/features/approval/model/approval'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { useMyLeaveHistoryQuery } from '../api/useMyLeaveHistoryQuery'
import { useMyLeaveSummaryQuery } from '../api/useMyLeaveSummaryQuery'

/** 결재 상태 필터 셀렉트 옵션(approvalStatusBadgeMap 키 그대로 파생 — MyBusinessTripHistoryPage 동형, 별도 배열 중복 선언 금지). */
const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

/** 조회 연도 입력 디바운스 지연(ms). DepartmentsPage/DeptAttendancePage의 keyword 검색 디바운스와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 내 휴가 페이지(F742·F743, ROADMAP(LEAVE) M3 T3.2, PRD §페이지별 상세(내 휴가 페이지)).
 *
 * 잔여 휴가 카드(useMyLeaveSummaryQuery, T3.1)는 연차/특별/포상 3종의 부여·사용 값을 받아 잔여를
 * 프론트에서 계산한다(부여−사용, §PRD에서 확정된 결정 — 서버가 잔여 필드를 내려주지 않는다).
 * year 기본값은 올해(dayjs().year()). `type=number` 입력은 keyword 검색(DepartmentsPage/
 * DeptAttendancePage)과 동일한 300ms 디바운스 패턴으로 처리한다 — 로컬 입력값(yearInput)을 즉시
 * 반영하되, 확정 `year`(쿼리 키)는 입력이 멈춘 뒤에만 갱신해 매 keystroke마다 쿼리가 발화하는
 * 것을 막는다(code-reviewer 지적, non-minor).
 *
 * 신청 이력(useMyLeaveHistoryQuery, T3.1, 배열 응답·페이징 없음)은 결재상태(enum 코드)/조회월
 * 필터와 연동한다. yearMonth는 미입력 시 서버가 현재 월로 응답하므로(§계약 실측 메모) 필터
 * 기본값을 당월로 맞추고 안내 문구를 노출한다 — MyBusinessTripHistoryPage/MyAttendancePage와
 * 동일한 톤(배열 응답이라 PaginationControls/usePageState 미사용).
 *
 * leaveType/approvalStatus는 이력 응답이 이미 표시명 문자열로 내려주므로 그대로 렌더한다(클라
 * 매핑 불필요). approvalStatus 배지만 approval `getApprovalStatusBadge`(표시명→코드 역매핑)를
 * 재사용해 variant를 얻는다.
 *
 * [휴가 신청] 버튼은 `/approval/drafts/leaves/new`(ROADMAP(LEAVE) M6 T6.1에서 배선 완료)로 navigate한다.
 * 행 클릭은 draftId로 기안서 상세(①공통, 이미 배선된 라우트)로 이동한다.
 */
export function MyLeavePage() {
  const navigate = useNavigate()
  const [year, setYear] = useState(() => dayjs().year())
  const [yearInput, setYearInput] = useState(() => String(dayjs().year()))
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)

  const summaryQuery = useMyLeaveSummaryQuery(year)
  const historyQuery = useMyLeaveHistoryQuery({ approvalStatus, yearMonth })

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  // 조회 연도 입력 디바운스(DeptAttendancePage 검색 디바운스와 동일 패턴): 300ms 유예 후 유효한
  // 연도일 때만 확정 year로 반영해 매 keystroke마다 요약 쿼리가 재요청되는 것을 막는다. 빈 문자열/
  // 파싱 불가 값(예: "202" 입력 중)은 확정하지 않고 입력이 안정될 때까지 기다린다.
  useEffect(() => {
    const parsed = Number(yearInput)
    if (yearInput.trim() === '' || Number.isNaN(parsed) || parsed === year) {
      return
    }
    const timer = setTimeout(() => {
      setYear(parsed)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearInput, year])

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
  }

  const rows = historyQuery.data ?? []
  const summary = summaryQuery.data
  const leaveCategories = summary
    ? [
        { key: 'annual', label: '연차', grant: summary.annualBaseGrantDays, used: summary.annualUsedDays },
        { key: 'special', label: '특별휴가', grant: summary.specialGrantDays, used: summary.specialUsedDays },
        {
          key: 'compensatory',
          label: '포상휴가',
          grant: summary.compensatoryGrantDays,
          used: summary.compensatoryUsedDays,
        },
      ]
    : []

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">내 휴가</h1>
        <Button type="button" onClick={() => navigate('/approval/drafts/leaves/new')}>
          휴가 신청
        </Button>
      </div>

      <Card className="mb-6 h-fit">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>잔여 휴가</CardTitle>
              <CardDescription>연차·특별·포상 휴가의 부여·사용·잔여 일수입니다.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="leave-summary-year" className="sr-only">
                조회 연도
              </label>
              <Input
                id="leave-summary-year"
                type="number"
                value={yearInput}
                onChange={(event) => setYearInput(event.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : !summary ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              잔여 휴가 정보를 불러오지 못했습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {leaveCategories.map((category) => (
                <div key={category.key} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-foreground">{category.label}</p>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">부여</dt>
                      <dd className="tabular-nums">{category.grant}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">사용</dt>
                      <dd className="tabular-nums">{category.used}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">잔여</dt>
                      <dd className="tabular-nums font-semibold text-foreground">
                        {category.grant - category.used}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>신청 이력</CardTitle>
          <CardDescription>내가 신청한 휴가 기안 이력을 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 툴바: 조회 월(yyyy-MM, 기본=당월) + 결재 상태 필터(MyBusinessTripHistoryPage 툴바 톤 유지) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="leave-history-month" className="sr-only">
                조회 월
              </label>
              <Input
                id="leave-history-month"
                type="month"
                value={yearMonth}
                onChange={(event) => setYearMonth(event.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="leave-history-status" className="sr-only">
                결재 상태 필터
              </label>
              <select
                id="leave-history-status"
                value={approvalStatus ?? ''}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {approvalStatusBadgeMap[option].label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              {yearMonth} 이력만 표시됩니다. 다른 달을 보려면 조회 월을 변경하세요.
            </p>
          </div>

          {/* 표 영역: placeholderData: keepPreviousData가 필터 변경 중 이전 목록을 유지하므로
              isLoading은 최초 로딩에서만 true가 되어 깜빡임이 없다. */}
          {historyQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : historyQuery.error ? (
            // 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태 문구만 표시한다.
            <p className="py-8 text-center text-sm text-muted-foreground">
              휴가 이력을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 휴가 이력이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      유형
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      기간
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      신청일수
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      결재 상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { label, variant } = getApprovalStatusBadge(row.approvalStatus)
                    return (
                      <tr
                        key={row.draftId}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/approval/drafts/${row.draftId}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/approval/drafts/${row.draftId}`)
                          }
                        }}
                        className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      >
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          {row.leaveType}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          {row.startAt} ~ {row.endAt}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                          {row.requestedLeaveDays}
                        </td>
                        <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                          <Badge variant={variant}>{label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
