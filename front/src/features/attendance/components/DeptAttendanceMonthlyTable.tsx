import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Pencil } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { getAttendanceStatusBadge } from '../lib/attendanceStatusBadge'
import { formatOvertimeMinutes } from '../lib/formatOvertimeMinutes'
import type { AttendanceEditTarget, DeptAttendanceRow } from '../model/deptAttendance'

/**
 * 부서 월별 근태 표(F305, ROADMAP2 T3.4-a/T4.3). `AttendanceTable`(T1.5)·`BoardListTable`(T10.3)의
 * 컬럼 헬퍼 패턴을 그대로 복제한다: `createColumnHelper<DeptAttendanceRow>()` +
 * `getCoreRowModel()`만 사용(정렬/그룹 로우모델 도입 금지).
 *
 * `DeptAttendanceRow`는 사원 1인당 1행이며, `attendanceInfo`가 그 사원의 해당 월 근태 상세
 * **배열**(각 원소 attendanceId 포함)이라는 점이 `DeptPendingRow`(단건, T3.4-b 대상)와의 핵심
 * 차이다. 배열을 별도 로우모델(expanding)로 펼치지 않고, 한 셀 안에 일자(MM-DD)+상태배지+[수정]
 * 아이콘 버튼 조각을 `flex-wrap`으로 나열해 사원별 한 행 규칙을 유지한다.
 *
 * [수정] 버튼(T4.3)은 항목별(`isApproved===false`인 것만)로 노출한다 — 이미 승인된 근태는 서버가
 * 수정 자체를 거부하므로(F307) 버튼을 아예 숨긴다.
 */
const columnHelper = createColumnHelper<DeptAttendanceRow>()

interface DeptAttendanceMonthlyTableProps {
  data: DeptAttendanceRow[]
  /** 미승인 근태 항목의 [수정] 버튼 클릭 시 대상 근태를 상위(DeptAttendancePage)에 전달한다. */
  onEdit: (target: AttendanceEditTarget) => void
}

/** 부서 월별 근태 1페이지(content)만 렌더하는 표. */
export function DeptAttendanceMonthlyTable({ data, onEdit }: DeptAttendanceMonthlyTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.empInfo.empNo, {
        id: 'empNo',
        header: '사번',
      }),
      columnHelper.accessor((row) => row.empInfo.empName, {
        id: 'empName',
        header: '이름',
      }),
      columnHelper.accessor((row) => row.empInfo.positionName, {
        id: 'positionName',
        header: '직급',
      }),
      columnHelper.accessor('summary', {
        header: '요약',
        cell: (info) => {
          const summary = info.getValue()
          return (
            <span className="inline-flex flex-wrap items-center gap-2 text-xs whitespace-nowrap">
              <span>승인 {summary.approvedAttendanceCount}</span>
              <span>대기 {summary.pendingAttendanceCount}</span>
              <span>전체 {summary.totalAttendanceCount}</span>
              <span>초과 {formatOvertimeMinutes(summary.overtimeMinutes)}</span>
            </span>
          )
        },
      }),
      columnHelper.accessor('attendanceInfo', {
        header: '상세',
        cell: (info) => {
          const items = info.getValue()
          if (items.length === 0) {
            return <span className="text-muted-foreground">-</span>
          }
          const empId = info.row.original.empInfo.empId
          return (
            <div className="flex flex-wrap gap-1">
              {items.map((item) => {
                const { label, variant } = getAttendanceStatusBadge(item.attendanceStatus)
                return (
                  <span key={item.attendanceId} className="inline-flex items-center gap-0.5">
                    <Badge variant={variant} className="whitespace-nowrap">
                      {dayjs(item.attendanceDate).format('MM-DD')} {label}
                    </Badge>
                    {!item.isApproved && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="수정"
                        onClick={() =>
                          onEdit({
                            targetEmpId: empId,
                            attendanceId: item.attendanceId,
                            startAt: item.startAt,
                            endAt: item.endAt,
                          })
                        }
                      >
                        <Pencil />
                        <span className="sr-only">수정</span>
                      </Button>
                    )}
                  </span>
                )
              })}
            </div>
          )
        },
      }),
    ],
    [onEdit],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">부서원 근태 기록이 없습니다.</p>
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
            <tr key={row.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={cn('px-4 py-3 align-top text-muted-foreground')}>
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
