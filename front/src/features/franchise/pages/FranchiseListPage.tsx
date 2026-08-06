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

const SEARCH_DEBOUNCE_MS = 300

type StatusFilter = BusinessStatusCode | 'all'

const columnHelper = createColumnHelper<Franchise>()

export function FranchiseListPage() {
  const navigate = useNavigate()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [manager, setManager] = useState<EmployeePickerEmployee | null>(null)
  const [managerDialogOpen, setManagerDialogOpen] = useState(false)
  const [managerDraft, setManagerDraft] = useState<EmployeePickerEmployee[]>([])

  const { page, size, onPageChange, resetPage } = usePageState()

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
