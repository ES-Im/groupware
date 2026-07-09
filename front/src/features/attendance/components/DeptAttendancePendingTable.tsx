import { useMemo } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useApproveAttendanceMutation } from '../api/useApproveAttendanceMutation'
import { getAttendanceStatusBadge } from '../lib/attendanceStatusBadge'
import type { AttendanceEditTarget, DeptPendingRow } from '../model/deptAttendance'

/**
 * 부서 승인 대기 근태 표(F306, ROADMAP2 T3.4-b/T4.3/T4.4). `DeptAttendanceMonthlyTable`(T3.4-a)의
 * 컬럼 헬퍼 패턴을 그대로 복제한다: `createColumnHelper<DeptPendingRow>()` + `getCoreRowModel()`만
 * 사용(정렬/그룹 로우모델 도입 금지).
 *
 * `DeptPendingRow`는 사원 1인당 1행이며, `attendanceInfo`가 승인 대기 근태 **단건 객체**(summary
 * 블록 없음)라는 점이 `DeptAttendanceRow`(배열, T3.4-a 대상)와의 핵심 차이다. [수정] 버튼(T4.3)·
 * [승인] 버튼(T4.4)은 둘 다 `attendanceInfo.isApproved===false`일 때만 노출한다(승인대기 목록
 * 자체가 이미 미승인 건만 반환하지만, 서버 상태와 어긋날 가능성을 방어적으로 남겨 둔다).
 *
 * [승인] 버튼(F308)은 `useApproveAttendanceMutation`(T4.4)을 다이얼로그/폼 없는 단발 액션이라
 * 상위 `DeptAttendancePage`로 상태를 올리지 않고(board 도메인 `CommentItem.tsx`가 삭제 mutation을
 * 컴포넌트 안에서 직접 호출하는 것과 같은 "상태 없는 단발 액션은 그 자리에서 처리" 원칙은 같지만,
 * `CommentItem`은 항목별 컴포넌트 1개당 mutation 인스턴스 1개인 반면 여기는 표 컴포넌트 1개가
 * 전 행이 공유하는 mutation 인스턴스 1개를 갖는다는 점이 다르다) 이 표 컴포넌트 최상단에서 직접
 * 호출한다. 단일 mutation 인스턴스를 표 전체가 공유하므로 `mutation.isPending`이 true인
 * 동안은(어느 행이든 승인 요청이 진행 중이면) 모든 [승인] 버튼을 함께 비활성화해 중복 클릭을
 * 막는다(MyAttendancePage의 `checkInMutation.isPending` 단일 버튼 가드와 동일 컨벤션 — 행별 개별
 * 로딩 상태 추적은 도입하지 않는다).
 */
const columnHelper = createColumnHelper<DeptPendingRow>()

interface DeptAttendancePendingTableProps {
  data: DeptPendingRow[]
  /** [수정] 버튼 클릭 시 대상 근태를 상위(DeptAttendancePage)에 전달한다. */
  onEdit: (target: AttendanceEditTarget) => void
}

/** "HH:mm:ss" 원문에서 표시용 "HH:mm"만 자른다. null(시간 없음 상태)이면 "-"로 표기. */
function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '-'
}

/** 부서 승인 대기 근태 1페이지(content)만 렌더하는 표. */
export function DeptAttendancePendingTable({ data, onEdit }: DeptAttendancePendingTableProps) {
  const approveMutation = useApproveAttendanceMutation()

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
      columnHelper.accessor((row) => row.attendanceInfo.attendanceDate, {
        id: 'attendanceDate',
        header: '일자',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD'),
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
        header: '액션',
        cell: (info) => {
          const row = info.row.original
          if (row.attendanceInfo.isApproved) {
            return null
          }
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
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
                승인
              </Button>
            </div>
          )
        },
      }),
    ],
    [onEdit, approveMutation],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">승인 대기 중인 근태가 없습니다.</p>
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
