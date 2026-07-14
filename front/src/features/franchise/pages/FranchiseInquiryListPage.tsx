import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { MessageSquare, Search, Store, User, X } from 'lucide-react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
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
import { useFranchiseInquiriesQuery } from '../api/useFranchiseInquiriesQuery'
import { FranchiseManagerPicker } from '../components/FranchiseManagerPicker'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import { FranchiseStatusPill } from '../components/FranchiseStatusPill'
import type { FranchiseInquiry } from '../model/franchise'

/** 검색 디바운스 지연(ms). FranchiseListPage 등 목록 페이지 공통 값. */
const SEARCH_DEBOUNCE_MS = 300

/** 답변여부 필터 값. 'all'은 isAnswered 쿼리 파라미터 생략(전체)을 의미한다. */
type AnsweredFilter = 'all' | 'true' | 'false'

const columnHelper = createColumnHelper<FranchiseInquiry>()

/**
 * P6 가맹점 문의 목록 페이지(F1617 FRANCHISE_INQUIRY_LIST, ROADMAP(FRANCHISE) T5.1).
 * /franchise-inquiries 라우트에 마운트된다(T1.2 배선 완료).
 *
 * FranchiseListPage(T2.1) 구조를 동형 복제한다: usePageState+PaginationControls 페이징 표
 * (react-table, board 표준 UI 페이지 번호 number+1), 검색어 300ms 디바운스, 담당자 필터는
 * Popover 프리미티브 부재로 Dialog+EmployeePicker(단일 선택) 조합. 필터 4종(답변여부 select·
 * 담당자·검색어·기간 from/to `yyyy-MM-dd`) 전부 변경 시 resetPage()로 페이지를 0으로 되돌린다.
 *
 * 문의 등록 버튼은 두지 않는다 — 문의는 외부 API 싱크로만 생성되며 등록 계약 자체가 없다
 * (PRD §범위 외). 행 클릭은 `/franchise-inquiries/:inquiryId`로 이동하는데, 식별자가 가맹점
 * 목록의 `id`와 달리 `inquiryId`다(§계약 실측 메모 '식별자 필드 상이').
 */
export function FranchiseInquiryListPage() {
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [answeredFilter, setAnsweredFilter] = useState<AnsweredFilter>('all')
  const [manager, setManager] = useState<EmployeePickerEmployee | null>(null)
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  // 다이얼로그 안에서 고르는 임시 선택값. [적용]을 눌러야만 실제 필터(manager)에 반영된다
  // (탐색 중 클릭마다 목록이 재조회되는 것을 막는다).
  const [managerDraft, setManagerDraft] = useState<EmployeePickerEmployee[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { page, size, onPageChange, resetPage } = usePageState()

  // 세그먼트(전체 문의 / 내 담당 문의) 전용 본인 정보. 담당자 필터(manager)를 나로 세팅/해제하는
  // 얇은 시각 토글이며, 데이터 파이프라인은 기존 담당자 필터(assignedManagerId)를 그대로 재사용한다
  // (신규 쿼리·상태 추가 없음 — 브리프 §7 최소 배선). empId/이름은 EmployeePickerEmployee 형태로 맞춘다.
  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const myName = meQuery.data?.empBasicInfo.name

  // 세그먼트 건수 배지(목업 cbadge): 전체=필터 없는 totalElements, 내 담당=assignedManagerId=me의
  // totalElements(size=1 count 쿼리). myEmpId 로딩 전에는 assignedManagerId undefined라 전체 쿼리와
  // 동일 캐시를 공유해 추가 요청이 없고, 내 담당 배지는 myEmpId가 있을 때만 노출한다.
  const allCountQuery = useFranchiseInquiriesQuery({ page: 0, size: 1 })
  const mineCountQuery = useFranchiseInquiriesQuery({
    assignedManagerId: myEmpId ?? undefined,
    page: 0,
    size: 1,
  })
  const allCount = allCountQuery.data?.totalElements
  const mineCount = myEmpId != null ? mineCountQuery.data?.totalElements : undefined

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

  const inquiriesQuery = useFranchiseInquiriesQuery({
    isAnswered: answeredFilter === 'all' ? undefined : answeredFilter === 'true',
    assignedManagerId: manager?.empId,
    keyword: keyword || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    size,
  })

  useEffect(() => {
    if (!inquiriesQuery.error) {
      return
    }
    handleApiError(inquiriesQuery.error, { toast })
  }, [inquiriesQuery.error])

  function handleAnsweredFilterChange(value: AnsweredFilter) {
    setAnsweredFilter(value)
    resetPage()
  }

  function handleFromChange(value: string) {
    setFrom(value)
    resetPage()
  }

  function handleToChange(value: string) {
    setTo(value)
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

  // 세그먼트 활성 상태 파생: 담당자 필터가 비었으면 '전체', 나로 지정됐으면 '내 담당'. 제3의
  // 담당자가 지정된 경우 어느 쪽도 활성화되지 않는다(담당자 버튼 라벨이 그 상태를 대신 표시).
  const isMineScope = manager != null && myEmpId != null && manager.empId === myEmpId
  const isAllScope = manager == null

  function handleScopeAll() {
    if (manager == null) {
      return
    }
    setManager(null)
    resetPage()
  }

  function handleScopeMine() {
    // 본인 정보 로딩 전이거나 이미 나로 지정된 상태면 무시한다.
    if (myEmpId == null || myName == null || manager?.empId === myEmpId) {
      return
    }
    setManager({ empId: myEmpId, empName: myName })
    resetPage()
  }

  // 필터 초기화(Ubold [초기화] 이식): 기존 상태 setter만 조합해 검색어·답변여부·담당자·기간을
  // 비운다(데이터 로직 신설 없음 — 순수 UI 편의).
  function handleResetFilters() {
    setSearchInput('')
    setAnsweredFilter('all')
    setManager(null)
    setFrom('')
    setTo('')
    resetPage()
  }

  const rows = inquiriesQuery.data?.content ?? []
  const pageInfo: PageMeta = inquiriesQuery.data ?? {
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
      columnHelper.accessor('franchiseName', {
        // 가맹점명(강조) + 외부 식별자(externalId, 보조 텍스트)를 한 셀에 합친다(A안 톤 `.who` 셀 —
        // 좌측 store 아이콘 타일 + 이름/식별자).
        header: '가맹점',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
              <Store aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{info.getValue()}</div>
              <div className="truncate text-xs text-muted-foreground">
                {info.row.original.externalId}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('inquiryTitle', {
        header: '문의제목',
      }),
      columnHelper.accessor('inquiryAt', {
        header: '문의일시',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm'),
      }),
      columnHelper.accessor('isAnswered', {
        header: '답변여부',
        cell: (info) => (
          <FranchiseStatusPill variant={info.getValue() ? 'default' : 'secondary'}>
            {info.getValue() ? '답변완료' : '미답변'}
          </FranchiseStatusPill>
        ),
      }),
      columnHelper.accessor('assignedManagerName', {
        header: '담당자명',
        // 담당 사원이 없는 가맹점에서 생성된 문의는 담당자 없이 조회될 수 있다(T5.4 실측).
        cell: (info) => info.getValue() ?? '미배정',
      }),
      columnHelper.accessor('isDeleted', {
        // isDeleted는 "삭제 요청 여부"다(response-fields.adoc — 이미 삭제됨이 아님).
        header: '삭제 요청',
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="destructive">삭제 요청</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
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
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchisePageHeader
        title="가맹점 질의응답"
        description="가맹점 문의를 답변 여부와 담당자 기준으로 확인합니다."
      />

      {/* 세그먼트: 전체 문의 / 내 담당 문의(담당자 필터를 나로 토글하는 얇은 시각 레이어). */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="문의 범위"
          className="inline-flex items-center rounded-lg bg-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isAllScope}
            onClick={handleScopeAll}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isAllScope
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            전체 문의
            {allCount !== undefined && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 text-xs font-semibold tabular-nums',
                  isAllScope ? 'bg-primary/15 text-primary' : 'bg-foreground/10 text-muted-foreground',
                )}
              >
                {allCount}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isMineScope}
            onClick={handleScopeMine}
            disabled={myEmpId == null}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
              isMineScope
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <User className="size-3.5" aria-hidden />
            내 담당 문의
            {mineCount !== undefined && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 text-xs font-semibold tabular-nums',
                  isMineScope ? 'bg-primary/15 text-primary' : 'bg-foreground/10 text-muted-foreground',
                )}
              >
                {mineCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" aria-hidden />
              문의 목록
            </CardTitle>
            {inquiriesQuery.data && (
              <Badge variant="secondary" className="tabular-nums">
                {pageInfo.totalElements}건
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 툴바: 검색어 + 답변여부 + 담당자 + 기간(from/to) + 초기화 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="문의 제목 검색"
                aria-label="문의 제목 검색"
                className="h-9 w-full pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="franchise-inquiry-answered" className="sr-only">
                답변여부 필터
              </label>
              <select
                id="franchise-inquiry-answered"
                value={answeredFilter}
                onChange={(event) =>
                  handleAnsweredFilterChange(event.target.value as AnsweredFilter)
                }
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="all">답변여부 전체</option>
                <option value="true">답변완료</option>
                <option value="false">미답변</option>
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
            <div className="flex items-center gap-2">
              <label htmlFor="franchise-inquiry-from" className="sr-only">
                조회 시작일
              </label>
              <Input
                id="franchise-inquiry-from"
                type="date"
                value={from}
                onChange={(event) => handleFromChange(event.target.value)}
                aria-label="조회 시작일"
                className="h-9 w-40"
              />
              <span className="text-sm text-muted-foreground">~</span>
              <label htmlFor="franchise-inquiry-to" className="sr-only">
                조회 종료일
              </label>
              <Input
                id="franchise-inquiry-to"
                type="date"
                value={to}
                onChange={(event) => handleToChange(event.target.value)}
                aria-label="조회 종료일"
                className="h-9 w-40"
              />
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

          <div className="flex min-h-[56rem] flex-col">
            {inquiriesQuery.isLoading ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                불러오는 중...
              </p>
            ) : inquiriesQuery.error ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                문의 목록을 불러오지 못했습니다.
              </p>
            ) : rows.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                조회 조건에 해당하는 문의가 없습니다.
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
                      onClick={() => navigate(`/franchise-inquiries/${row.original.inquiryId}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          navigate(`/franchise-inquiries/${row.original.inquiryId}`)
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
          </div>

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
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
              문의 목록을 담당 사원 기준으로 좁혀 봅니다. 사원을 선택하지 않고 적용하면 전체를
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
    </div>
  )
}
