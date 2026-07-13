import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BookOpen, MessageSquare, Search, Store, X } from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useFranchisesQuery } from '../api/useFranchisesQuery'
import { useFranchiseInquiriesQuery } from '../api/useFranchiseInquiriesQuery'
import { useFranchiseEducationCalendarQuery } from '../api/useFranchiseEducationCalendarQuery'
import { FranchiseBusinessStatusBadge } from '../components/FranchiseBusinessStatusBadge'
import { FranchiseCreateDialog } from '../components/FranchiseCreateDialog'
import { FranchiseManagerPicker } from '../components/FranchiseManagerPicker'
import { FranchiseMetricCard } from '../components/FranchiseMetricCard'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import {
  BUSINESS_STATUS_CODES,
  BUSINESS_STATUS_LABEL,
  type BusinessStatusCode,
  type Franchise,
} from '../model/franchise'

/** 검색 디바운스 지연(ms). department 도메인(DepartmentsPage 등)과 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/** 영업상태 필터 값. 'all'은 status 쿼리 파라미터 생략(전체)을 의미한다(DepartmentsPage 동일 패턴). */
type StatusFilter = BusinessStatusCode | 'all'

const columnHelper = createColumnHelper<Franchise>()

/**
 * P1 가맹점 목록 페이지(F1601, ROADMAP(FRANCHISE) T2.1).
 *
 * 기존 useFranchisesQuery(keyword/status/managerId/page/size, keepPreviousData)를 확장 없이
 * 그대로 소비하고, react-table 페이징 표는 usePageState+PaginationControls(MeetingRoomManagementPage
 * 동형, board 표준 UI 페이지 번호 number+1)로 구성한다.
 *
 * 필터 3종:
 * - 검색어: 300ms 디바운스 후에만 keyword로 확정(DepartmentsPage 동형).
 * - 영업상태: 조회 응답은 한글 표시명이지만 **전송은 enum 코드**(§계약 실측 메모 — 두 축 혼용 금지).
 *   select 옵션은 T1.1-a의 BUSINESS_STATUS_CODES/LABEL 상수에서 파생한다.
 * - 담당자: 프로젝트에 Popover 프리미티브가 없어(실측) EmployeePicker(단일 선택)를 Dialog로 감싸는
 *   기존 컨벤션(CirculationAddDialog 동형)으로 구현한다. 매출조회용 FranchisePicker(T1.3)와는
 *   무관한 목록 필터다.
 * 세 필터 모두 변경 시 resetPage()로 페이지를 0으로 되돌린다.
 *
 * 행 클릭은 `/franchises/:franchiseId` 라우트 문자열만 내비게이션한다(P2 상세와 코드 의존 없음).
 * `[가맹점 등록]`(F1603, T2.2)은 헤더 트리거 버튼으로 FranchiseCreateDialog를 여닫는다 — 등록
 * 성공 시 다이얼로그 내부 mutation이 목록 캐시를 invalidate해 자동 재조회된다
 * (MeetingRoomManagementPage 헤더 버튼 배치 동형).
 */
export function FranchiseListPage() {
  const navigate = useNavigate()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [manager, setManager] = useState<EmployeePickerEmployee | null>(null)
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  // 다이얼로그 안에서 고르는 임시 선택값. [적용]을 눌러야만 실제 필터(manager)에 반영된다
  // (탐색 중 클릭마다 목록이 재조회되는 것을 막는다).
  const [managerDraft, setManagerDraft] = useState<EmployeePickerEmployee[]>([])

  const { page, size, onPageChange, resetPage } = usePageState()

  // 검색 입력 디바운스: 300ms 유예 후에만 확정된 keyword로 반영하고 페이지를 0으로 리셋한다.
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
  }, [searchInput, keyword, resetPage])

  // 다이얼로그를 열 때마다 현재 확정 필터로 임시 선택을 시드한다(취소 후 재진입 시 잔상 방지).
  useEffect(() => {
    if (managerDialogOpen) {
      setManagerDraft(manager ? [manager] : [])
    }
  }, [managerDialogOpen, manager])

  const franchisesQuery = useFranchisesQuery({
    keyword: keyword || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    managerId: manager?.empId,
    page,
    size,
  })

  useEffect(() => {
    if (!franchisesQuery.error) {
      return
    }
    handleApiError(franchisesQuery.error, { toast })
  }, [franchisesQuery.error])

  // 상단 KPI 집계: 목록 필터와 무관하게 "전체" 기준으로 본다. 전용 집계 API가 없어 기존 목록 훅에
  // size=1을 넘겨 totalElements만 읽고(가맹점·미답변 문의), 진행중 교육은 당월 캘린더 배열에서 활성
  // 수를 센다(전 가맹점 매출 집계 KPI는 계약상 데이터가 없어 두지 않는다 — 3장 구성).
  const kpiFranchisesQuery = useFranchisesQuery({ page: 0, size: 1 })
  const kpiUnansweredQuery = useFranchiseInquiriesQuery({ isAnswered: false, page: 0, size: 1 })
  const kpiEducationQuery = useFranchiseEducationCalendarQuery(undefined, undefined)
  const kpiFranchiseTotal = kpiFranchisesQuery.data?.totalElements
  const kpiUnansweredTotal = kpiUnansweredQuery.data?.totalElements
  const activeEducationCount = (kpiEducationQuery.data ?? []).filter((item) => item.isActive).length

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value)
    resetPage()
  }

  function handleManagerApply() {
    setManager(managerDraft[0] ?? null)
    resetPage()
    setManagerDialogOpen(false)
  }

  function handleManagerClear() {
    setManager(null)
    resetPage()
  }

  // 필터 초기화(Ubold [초기화] 이식): 기존 상태 setter만 조합해 검색어·영업상태·담당자를 비운다
  // (데이터 로직 신설 없음 — 순수 UI 편의).
  function handleResetFilters() {
    setSearchInput('')
    setStatusFilter('all')
    setManager(null)
    resetPage()
  }

  const rows = franchisesQuery.data?.content ?? []
  const pageInfo: PageMeta = franchisesQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        // 가맹점명(강조) + 주소(보조 텍스트)를 한 셀에 합친다(A안 톤 `.who` 셀 이식 —
        // 좌측 store 아이콘 타일 + 이름/주소). 응답 필드는 그대로 소비한다.
        header: '가맹점',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
              <Store aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{info.getValue()}</div>
              <div className="truncate text-xs text-muted-foreground">{info.row.original.address}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('ownerName', {
        header: '대표자명',
      }),
      columnHelper.accessor('BusinessStatus', {
        // 응답의 한글 표시명을 뱃지로 렌더한다(표시명 원문은 뱃지 안에서 그대로 노출 —
        // 코드 역매핑·가공은 뱃지 변형 선택에만 쓰고 텍스트는 원문 유지).
        header: '영업상태',
        cell: (info) => <FranchiseBusinessStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('managerEmpName', {
        header: '담당자명',
        cell: (info) => info.getValue() || '-',
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8 lg:min-h-full">
      <FranchisePageHeader
        title="가맹점 관리"
        description="전체 가맹점 현황을 조회하고 신규 매장을 등록합니다."
      >
        <Button type="button" onClick={() => setCreateDialogOpen(true)}>
          가맹점 등록
        </Button>
      </FranchisePageHeader>

      {/* 상단 KPI(목업 kpis) — 계약상 데이터가 있는 3종만(이번달 매출 KPI는 전 가맹점 집계 API 부재로 제외). */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FranchiseMetricCard
          title="담당 가맹점"
          value={kpiFranchiseTotal === undefined ? '—' : `${kpiFranchiseTotal.toLocaleString('ko-KR')}개점`}
          description="전체 등록 매장"
          icon={<Store />}
          accent="primary"
        />
        <FranchiseMetricCard
          title="진행중 교육"
          value={`${activeEducationCount.toLocaleString('ko-KR')}건`}
          description="이번 달 신청 가능 교육"
          icon={<BookOpen />}
          accent="muted"
        />
        <FranchiseMetricCard
          title="미답변 문의"
          value={kpiUnansweredTotal === undefined ? '—' : `${kpiUnansweredTotal.toLocaleString('ko-KR')}건`}
          description="답변 대기 중"
          icon={<MessageSquare />}
          accent="destructive"
        />
      </div>

      <Card className="lg:flex-1">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-primary" aria-hidden />
              가맹점 목록
            </CardTitle>
            {franchisesQuery.data && (
              <Badge variant="secondary" className="tabular-nums">
                {pageInfo.totalElements}개 매장
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 툴바: 검색어 + 영업상태 + 담당자 + 초기화 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="가맹점명 또는 주소 검색"
                aria-label="가맹점 검색"
                className="h-9 w-full pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="franchise-list-status" className="sr-only">
                영업상태 필터
              </label>
              <select
                id="franchise-list-status"
                value={statusFilter}
                onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilter)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="all">영업상태 전체</option>
                {BUSINESS_STATUS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {BUSINESS_STATUS_LABEL[code]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setManagerDialogOpen(true)}
              >
                {manager ? `담당자: ${manager.empName}` : '담당자 전체'}
              </Button>
              {manager && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={handleManagerClear}
                  aria-label="담당자 필터 해제"
                >
                  <X />
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleResetFilters}
              className="sm:ml-auto"
            >
              초기화
            </Button>
          </div>

          {franchisesQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : franchisesQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              가맹점 목록을 불러오지 못했습니다.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              조회 조건에 해당하는 가맹점이 없습니다.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-border">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/franchises/${row.original.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          navigate(`/franchises/${row.original.id}`)
                        }
                      }}
                      className={cn(
                        'cursor-pointer border-b border-border transition-colors last:border-0',
                        'hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="개"
          />
        </CardContent>
      </Card>

      {/* 담당자 필터 다이얼로그: Popover 프리미티브 부재로 Dialog + FranchiseManagerPicker(FRANCHISE
          권한 사원만 노출하는 단일 선택) 조합. */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>담당자 필터</DialogTitle>
            <DialogDescription>
              가맹점 목록을 담당 사원 기준으로 좁혀 봅니다. 사원을 선택하지 않고 적용하면 전체를
              조회합니다.
            </DialogDescription>
          </DialogHeader>

          <FranchiseManagerPicker selected={managerDraft} onChange={setManagerDraft} multiple={false} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setManagerDialogOpen(false)}>
              취소
            </Button>
            <Button type="button" onClick={handleManagerApply}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FranchiseCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
