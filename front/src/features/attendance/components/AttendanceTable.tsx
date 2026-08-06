import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { getAttendanceStatusBadge } from '../lib/attendanceStatusBadge'
import type { AttendanceItem } from '../model/attendance'

const columnHelper = createColumnHelper<AttendanceItem>()

const COLUMN_ALIGN: Record<string, string> = {
  startAt: 'text-center',
  endAt: 'text-center',
  isApproved: 'text-center',
}

function headerAlignClass(columnId: string): string {
  return COLUMN_ALIGN[columnId] ?? 'text-left'
}

function cellClass(columnId: string): string {
  if (columnId === 'attendanceDate') {
    return 'font-medium tabular-nums text-foreground'
  }
  if (columnId === 'startAt' || columnId === 'endAt') {
    return 'text-center tabular-nums text-muted-foreground'
  }
  if (columnId === 'isApproved') {
    return 'text-center'
  }
  return 'text-left text-muted-foreground'
}

function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '-'
}

interface AttendanceTableProps {
  data: AttendanceItem[]
}

export function AttendanceTable({ data }: AttendanceTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('attendanceDate', {
        header: '일자',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD'),
      }),
      columnHelper.accessor('attendanceStatus', {
        header: '상태',
        cell: (info) => {
          const { label, variant } = getAttendanceStatusBadge(info.getValue())
          return <Badge variant={variant}>{label}</Badge>
        },
      }),
      columnHelper.accessor('startAt', {
        header: '출근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor('endAt', {
        header: '퇴근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor('isApproved', {
        header: '승인여부',
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="secondary">승인</Badge>
          ) : (
            <Badge variant="outline">대기</Badge>
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
    return <p className="py-8 text-center text-sm text-muted-foreground">근태 기록이 없습니다.</p>
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'px-4 py-2.5 font-medium whitespace-nowrap text-muted-foreground',
                    headerAlignClass(header.column.id),
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
            <tr key={row.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn('px-4 py-3 whitespace-nowrap', cellClass(cell.column.id))}
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
