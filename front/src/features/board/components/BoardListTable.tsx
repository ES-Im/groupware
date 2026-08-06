import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Eye, Heart, MessageCircle, Paperclip } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { BoardSummary } from '../model/board'
import { InitialsAvatar } from './InitialsAvatar'

const columnHelper = createColumnHelper<BoardSummary>()

const COLUMN_ALIGN: Record<string, string> = {
  isFileAttached: 'text-center',
}

function alignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

function MetricStat({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon className="size-3.5" aria-hidden="true" />
      {value.toLocaleString()}
    </span>
  )
}

interface BoardListTableProps {
  data: BoardSummary[]
  onRowClick: (boardId: number) => void
}

export function BoardListTable({ data, onRowClick }: BoardListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('boardId', {
        header: '번호',
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            #{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('boardTitle', {
        header: '제목',
        cell: (info) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-semibold text-foreground group-hover:underline">
              {info.getValue()}
            </span>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <MetricStat icon={Eye} value={info.row.original.viewCount} />
              <MetricStat icon={Heart} value={info.row.original.likeCount} />
              <MetricStat icon={MessageCircle} value={info.row.original.commentCount} />
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('authorName', {
        header: '작성자',
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <InitialsAvatar name={info.getValue()} className="size-7" />
            <span className="truncate font-medium text-foreground">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('publishedAt', {
        header: '발행일',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm'),
      }),
      columnHelper.accessor('isFileAttached', {
        header: '첨부',
        cell: (info) =>
          info.getValue() ? (
            <Paperclip className="inline size-4 text-muted-foreground" aria-label="첨부파일 있음" />
          ) : (
            <span className="text-muted-foreground/60" aria-label="첨부파일 없음">
              -
            </span>
          ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">게시글이 없습니다.</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground',
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
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row.original.boardId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRowClick(row.original.boardId)
                }
              }}
              className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'px-3 py-3 align-middle whitespace-nowrap text-muted-foreground',
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
  )
}
