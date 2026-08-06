import { useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { UseQueryResult } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import {
  formatDraftDateTime,
  getApprovalStatusBadge,
  getFileAttachedIconInfo,
} from '../lib/approvalStatusBadge'
import { getApprovalStatusColor } from '../lib/approvalStatusColor'
import type { DocumentBoxQueryParams, DocumentBoxRow, Page } from '../model/approval'

const SEARCH_DEBOUNCE_MS = 300

type DocumentBoxListQueryHook = (
  params: DocumentBoxQueryParams,
) => UseQueryResult<Page<DocumentBoxRow>>

const columnHelper = createColumnHelper<DocumentBoxRow>()

const COLUMN_ALIGN: Record<string, string> = {
  isFileAttached: 'text-center',
  approvalStatus: 'text-right',
}

function alignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

interface DocumentBoxTableProps {
  useListQuery: DocumentBoxListQueryHook
  emptyMessage?: string
  searchValue: string
  onRowClick?: (draftId: number) => void
}

export function DocumentBoxTable({
  useListQuery,
  emptyMessage = '문서가 없습니다.',
  searchValue,
  onRowClick,
}: DocumentBoxTableProps) {
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, resetPage } = usePageState()

  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchValue, keyword, resetPage])

  const listQuery = useListQuery({ keyword, page, size })

  useEffect(() => {
    if (!listQuery.error) {
      return
    }
    handleApiError(listQuery.error, { toast })
  }, [listQuery.error])

  const columns = useMemo(
    () => [
      columnHelper.accessor('draftTitle', {
        header: '제목',
        cell: (info) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              aria-hidden
            >
              <FileText className="size-4" />
            </span>
            <span className="truncate font-medium text-foreground">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('drafterName', {
        header: '기안자',
        cell: (info) => {
          const name = info.getValue()
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground">{name}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor('submittedAt', {
        header: '상신일시',
        cell: (info) => formatDraftDateTime(info.getValue()),
      }),
      columnHelper.accessor('latestApproverName', {
        header: '최근 결재자',
        cell: (info) => info.getValue() ?? '-',
      }),
      columnHelper.accessor('isFileAttached', {
        header: '첨부',
        cell: (info) => {
          const { Icon, ariaLabel } = getFileAttachedIconInfo(info.getValue())
          return Icon ? (
            <Icon className="inline size-4 text-muted-foreground" aria-label={ariaLabel} />
          ) : (
            <span className="text-muted-foreground/60" aria-label={ariaLabel}>
              -
            </span>
          )
        },
      }),
      columnHelper.accessor('approvalStatus', {
        header: '상태',
        cell: (info) => {
          const value = info.getValue()
          const { label } = getApprovalStatusBadge(value)
          const { className, dotClassName } = getApprovalStatusColor(value)
          return (
            <Badge variant="outline" className={cn('gap-1.5', className)}>
              <span className={cn('size-1.5 rounded-full', dotClassName)} aria-hidden />
              {label}
            </Badge>
          )
        },
      }),
    ],
    [],
  )

  const rows = listQuery.data?.content ?? []

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const pageInfo: PageMeta = listQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const isInteractive = onRowClick != null

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex-1">
        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : listQuery.error ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            목록을 불러오지 못했습니다.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted-foreground',
                        alignClass(header.column.id),
                      )}
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
                  role={isInteractive ? 'button' : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  onClick={isInteractive ? () => onRowClick(row.original.draftId) : undefined}
                  onKeyDown={
                    isInteractive
                      ? (event) => {
                          if (event.key === 'Enter') {
                            onRowClick(row.original.draftId)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b border-border transition-colors last:border-0',
                    isInteractive &&
                      'cursor-pointer hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 py-3 align-middle whitespace-nowrap text-muted-foreground',
                        alignClass(cell.column.id),
                      )}
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
    </div>
  )
}
