import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { usePrimaryDeptId } from '@/features/attendance/model/usePrimaryDeptId'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { useDeptBusinessTripHistoryQuery } from '../api/useDeptBusinessTripHistoryQuery'
import { approvalStatusBadgeMap, getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import type { ApprovalStatus } from '../model/approval'

/** 검색 디바운스 지연(ms). DeptAttendancePage와 동일 값을 재사용한다. */
const SEARCH_DEBOUNCE_MS = 300

/** 결재 상태 필터 셀렉트 옵션(approvalStatusBadgeMap 키 그대로 파생 — 별도 배열 중복 선언 금지). */
const STATUS_OPTIONS = Object.keys(approvalStatusBadgeMap) as ApprovalStatus[]

/**
 * 부서 출장 이력 페이지(ROADMAP(DRAFT-BUSINESSTRIP) M5 T5.2, F734).
 *
 * deptId는 `usePrimaryDeptId()`(strict, 폴백 없음)로 도출한다. useMeQuery가 아직 로딩 중이거나
 * primary 소속이 없으면 deptId가 undefined인데, 이때 `useDeptBusinessTripHistoryQuery`는
 * `enabled:false`로 대기만 할 뿐이라 이 페이지는 `deptId === undefined`를 별도로 감지해
 * 필터/표 대신 "부서 정보를 확인하는 중" 안내만 렌더하는 게이팅 분기를 둔다(DeptAttendancePage 동형).
 *
 * keyword는 로컬 입력값(searchInput)을 300ms 디바운스한 뒤에만 확정 keyword로 반영한다
 * (DeptAttendancePage와 동일 패턴). yearMonth(기본=현재월)·approvalStatus·keyword 중 하나라도
 * 바뀌면 resetPage()로 페이지를 0으로 되돌려 존재하지 않는 페이지를 조회하는 사고를 막는다.
 *
 * yearMonth 미입력 시 서버가 현재 월로 응답하므로(§계약 실측 메모) 월 선택기 기본값을 당월로
 * 맞추고 "이번 달 이력만 표시됩니다" 안내를 둔다(근태 MY_ATTENDANCE_MONTHLY 관례 동형).
 *
 * 조회 실패(타 부서 접근 403 ROLE_003 포함)는 handleApiError 단일 진입점으로 토스트만 남긴다.
 * 행 클릭 → 기안서 상세 페이지(①공통, /approval/drafts/{draftId})로 이동한다.
 */
export function DeptBusinessTripHistoryPage() {
  const navigate = useNavigate()
  const deptId = usePrimaryDeptId()

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | undefined>(undefined)
  const [yearMonth, setYearMonth] = useState(() => dayjs().format('YYYY-MM'))
  const { page, size, onPageChange, resetPage } = usePageState()

  // 검색 입력 디바운스(DeptAttendancePage와 동일 패턴): 300ms 유예 후에만 확정 keyword로 반영 + page 리셋.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, keyword])

  const historyQuery = useDeptBusinessTripHistoryQuery(deptId, {
    keyword: keyword || undefined,
    approvalStatus,
    yearMonth,
    page,
    size,
  })

  useEffect(() => {
    if (!historyQuery.error) {
      return
    }
    handleApiError(historyQuery.error, { toast })
  }, [historyQuery.error])

  function handleYearMonthChange(value: string) {
    setYearMonth(value)
    resetPage()
  }

  function handleStatusChange(value: string) {
    setApprovalStatus(value === '' ? undefined : (value as ApprovalStatus))
    resetPage()
  }

  const rows = historyQuery.data?.content ?? []

  const pageInfo: PageMeta = historyQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  return (
    <div className="w-full p-3">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">부서 출장 이력</h1>
      </div>

      {deptId === undefined ? (
        <Card className="h-fit">
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              부서 정보를 확인하는 중입니다...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-fit">
          <CardContent className="space-y-4">
            {/* 필터 툴바: 사원 이름 검색 + 조회 월(yyyy-MM) + 결재 상태 필터 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="dept-business-trip-keyword" className="sr-only">
                  사원 이름 검색
                </label>
                <Input
                  id="dept-business-trip-keyword"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="사원 이름 검색..."
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dept-business-trip-month" className="sr-only">
                  조회 월
                </label>
                <Input
                  id="dept-business-trip-month"
                  type="month"
                  value={yearMonth}
                  onChange={(event) => handleYearMonthChange(event.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dept-business-trip-status" className="sr-only">
                  결재 상태 필터
                </label>
                <select
                  id="dept-business-trip-status"
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
            </div>

            <p className="text-xs text-muted-foreground">
              {yearMonth} 이력만 표시됩니다. 다른 달을 보려면 조회 월을 변경하세요.
            </p>

            {historyQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
            ) : historyQuery.error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                부서 출장 이력을 불러오지 못했습니다.
              </p>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                출장 이력이 없습니다.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        사원
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        기간
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        목적지
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        목적
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const { label, variant } = getApprovalStatusBadge(
                        row.historyResponse.approvalStatus,
                      )
                      const draftId = row.historyResponse.draftId
                      return (
                        <tr
                          key={draftId}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/approval/drafts/${draftId}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              navigate(`/approval/drafts/${draftId}`)
                            }
                          }}
                          className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        >
                          <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                            {row.empNo} {row.empName}
                          </td>
                          <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                            {row.historyResponse.startAt} ~ {row.historyResponse.endAt}
                          </td>
                          <td className="px-3 py-3 align-middle text-muted-foreground">
                            {row.historyResponse.destination}
                          </td>
                          <td className="px-3 py-3 align-middle text-muted-foreground">
                            {row.historyResponse.purpose}
                          </td>
                          <td className="px-3 py-3 align-middle whitespace-nowrap">
                            <Badge variant={variant}>{label}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
      )}
    </div>
  )
}
