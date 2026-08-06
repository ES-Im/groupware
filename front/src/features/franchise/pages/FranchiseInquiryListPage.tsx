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

const SEARCH_DEBOUNCE_MS = 300

type AnsweredFilter = 'all' | 'true' | 'false'

const columnHelper = createColumnHelper<FranchiseInquiry>()

export function FranchiseInquiryListPage() {
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [answeredFilter, setAnsweredFilter] = useState<AnsweredFilter>('all')
  const [manager, setManager] = useState<EmployeePickerEmployee | null>(null)
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  const [managerDraft, setManagerDraft] = useState<EmployeePickerEmployee[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { page, size, onPageChange, resetPage } = usePageState()

  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const myName = meQuery.data?.empBasicInfo.name

  const allCountQuery = useFranchiseInquiriesQuery({ page: 0, size: 1 })
  const mineCountQuery = useFranchiseInquiriesQuery({
    assignedManagerId: myEmpId ?? undefined,
    page: 0,
    size: 1,
  })
  const allCount = allCountQuery.data?.totalElements
  const mineCount = myEmpId != null ? mineCountQuery.data?.totalElements : undefined

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
    if (myEmpId == null || myName == null || manager?.empId === myEmpId) {
      return
    }
    setManager({ empId: myEmpId, empName: myName })
    resetPage()
  }

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
        cell: (info) => info.getValue() ?? '미배정',
      }),
      columnHelper.accessor('isDeleted', {
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
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:h-full lg:p-8">
      <FranchisePageHeader
        title="가맹점 질의응답"
        description="가맹점 문의를 답변 여부와 담당자 기준으로 확인합니다."
      />

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

      <Card className="flex flex-col lg:min-h-0 lg:flex-1">
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
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
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

          <div className="flex min-h-[20rem] flex-col overflow-y-auto lg:min-h-0 lg:flex-1">
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
            className="shrink-0 border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>

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
