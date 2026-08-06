import { useCallback, useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Check } from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { useApproveAttendanceMutation } from '../api/useApproveAttendanceMutation'
import { getAttendanceStatusBadge } from '../lib/attendanceStatusBadge'
import type { AttendanceStatus } from '../model/attendance'
import type { AttendanceEditTarget, DeptPendingRow } from '../model/deptAttendance'

const columnHelper = createColumnHelper<DeptPendingRow>()

const FILTERABLE_STATUSES = ['LATE_EARLY', 'ABSENT'] as const satisfies AttendanceStatus[]

interface DeptAttendancePendingTableProps {
  data: DeptPendingRow[]
  totalElements: number
  onEdit: (target: AttendanceEditTarget) => void
  status: AttendanceStatus | undefined
  onStatusChange: (status: AttendanceStatus | undefined) => void
}

function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '-'
}

export function DeptAttendancePendingTable({
  data,
  totalElements,
  onEdit,
  status,
  onStatusChange,
}: DeptAttendancePendingTableProps) {
  const approveMutation = useApproveAttendanceMutation()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  const selectableIds = useMemo(
    () => data.filter((row) => !row.attendanceInfo.isApproved).map((row) => row.attendanceInfo.attendanceId),
    [data],
  )

  const selectedVisibleCount = selectableIds.filter((id) => selectedIds.has(id)).length
  const allSelected = selectableIds.length > 0 && selectedVisibleCount === selectableIds.length
  const headerChecked: boolean | 'indeterminate' = allSelected
    ? true
    : selectedVisibleCount > 0
      ? 'indeterminate'
      : false

  const toggleOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const everySelected = selectableIds.length > 0 && selectableIds.every((id) => next.has(id))
      if (everySelected) {
        selectableIds.forEach((id) => next.delete(id))
      } else {
        selectableIds.forEach((id) => next.add(id))
      }
      return next
    })
  }, [selectableIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  function handleBulkApprove() {
    data
      .filter((row) => !row.attendanceInfo.isApproved && selectedIds.has(row.attendanceInfo.attendanceId))
      .forEach((row) =>
        approveMutation.mutate({
          attendanceId: row.attendanceInfo.attendanceId,
          targetEmpId: row.empInfo.empId,
        }),
      )
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => (
          <Checkbox
            checked={headerChecked}
            onCheckedChange={toggleAll}
            disabled={selectableIds.length === 0}
            aria-label="전체 선택"
          />
        ),
        cell: (info) => {
          const row = info.row.original
          const id = row.attendanceInfo.attendanceId
          return (
            <Checkbox
              checked={selectedIds.has(id)}
              onCheckedChange={() => toggleOne(id)}
              disabled={row.attendanceInfo.isApproved}
              aria-label={`${row.empInfo.empName} 근태 선택`}
            />
          )
        },
      }),
      columnHelper.display({
        id: 'emp',
        header: '사원',
        cell: (info) => {
          const emp = info.row.original.empInfo
          return (
            <div className="flex items-center gap-2.5">
              <BlobAvatar
                empId={emp.empId}
                fileId={undefined}
                fallbackText={emp.empName}
                className="size-7"
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{emp.empName}</p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-mono">{emp.empNo}</span> · {emp.positionName}
                </p>
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor((row) => row.attendanceInfo.attendanceDate, {
        id: 'attendanceDate',
        header: '일자',
        cell: (info) => (
          <span className="font-mono text-xs">{dayjs(info.getValue()).format('YYYY-MM-DD')}</span>
        ),
      }),
      columnHelper.accessor((row) => row.attendanceInfo.attendanceStatus, {
        id: 'attendanceStatus',
        header: '상태',
        cell: (info) => {
          const { label, variant } = getAttendanceStatusBadge(info.getValue())
          return <Badge variant={variant}>{label}</Badge>
        },
      }),
      columnHelper.accessor((row) => row.attendanceInfo.startAt, {
        id: 'startAt',
        header: '출근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor((row) => row.attendanceInfo.endAt, {
        id: 'endAt',
        header: '퇴근',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: '처리',
        cell: (info) => {
          const row = info.row.original
          if (row.attendanceInfo.isApproved) {
            return null
          }
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                size="sm"
                disabled={approveMutation.isPending}
                onClick={() =>
                  approveMutation.mutate({
                    attendanceId: row.attendanceInfo.attendanceId,
                    targetEmpId: row.empInfo.empId,
                  })
                }
              >
                <Check />
                승인
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onEdit({
                    targetEmpId: row.empInfo.empId,
                    attendanceId: row.attendanceInfo.attendanceId,
                    startAt: row.attendanceInfo.startAt,
                    endAt: row.attendanceInfo.endAt,
                  })
                }
              >
                수정
              </Button>
            </div>
          )
        },
      }),
    ],
    [onEdit, approveMutation, selectedIds, headerChecked, selectableIds, toggleAll, toggleOne],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          미승인 <span className="font-semibold text-foreground">{totalElements}</span>건
        </p>
        <label htmlFor="dept-attendance-pending-status-select" className="sr-only">
          근태 상태 필터
        </label>
        <select
          id="dept-attendance-pending-status-select"
          value={status ?? ''}
          onChange={(event) =>
            onStatusChange(event.target.value === '' ? undefined : (event.target.value as AttendanceStatus))
          }
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">전체</option>
          {FILTERABLE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {getAttendanceStatusBadge(option).label}
            </option>
          ))}
        </select>
      </div>

      {selectedVisibleCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selectedVisibleCount}개 선택</span>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              선택 해제
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={approveMutation.isPending}
              onClick={handleBulkApprove}
            >
              <Check />
              선택 승인
            </Button>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {status ? '선택한 상태의 승인 대기 근태가 없습니다.' : '승인 대기 중인 근태가 없습니다.'}
        </p>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-left font-medium whitespace-nowrap text-muted-foreground"
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
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn('px-4 py-3 align-middle text-muted-foreground')}>
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
  )
}
