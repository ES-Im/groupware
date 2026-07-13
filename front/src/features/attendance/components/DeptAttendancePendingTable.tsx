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
 * [승인] 버튼(F308)은 `useApproveAttendanceMutation`(T4.4)을 이 표 컴포넌트 최상단에서 직접 호출한다.
 * 단일 mutation 인스턴스를 표 전체가 공유하므로 `mutation.isPending`이 true인 동안은 모든 [승인]/
 * 일괄 승인 버튼을 함께 비활성화해 중복 클릭을 막는다(행별 로딩 상태 추적은 도입하지 않는다).
 *
 * 상태 필터(지각/조퇴·결근)는 서버 사이드다: `status`(DEPT_ATTENDANCE_MONTHLY와 동일한 단일값
 * AttendanceStatus)를 상위(DeptAttendancePage)가 `useDeptAttendancePendingQuery`에 그대로
 * 전달하고, 이 컴포넌트는 `status`/`onStatusChange`를 controlled prop으로만 받는다(로컬 필터
 * state 없음). 페이지네이션도 상위가 소유한 서버 page/size 그대로다(월별 탭과 동일 컨벤션) —
 * 이 표는 `data`(현재 서버 페이지 content)를 그대로 렌더할 뿐 별도로 슬라이싱/재필터링하지 않는다.
 * 백엔드가 아직 `status` 파라미터를 처리하지 않는 동안은 필터를 선택해도 서버가 조용히 무시해
 * 결과가 좁혀지지 않는다(getDeptAttendancePending 참고) — 백엔드 반영 후 별도 프론트 변경 없이
 * 바로 동작한다.
 *
 * "전체 선택"/일괄 승인은 현재 페이지(`data`)에 보이는 미승인 행 기준이다(표준 페이지-스코프
 * 선택 — 필터가 서버에서 좁혀지므로 필터링된 페이지 전체를 대상으로 동작한다). 일괄 승인 전용
 * 백엔드 엔드포인트가 없어, 선택된 각 행에 대해 기존 approveMutation.mutate를 반복 호출한다
 * (건별 성공 토스트가 N번 뜨는 것은 알려진 동작).
 */
const columnHelper = createColumnHelper<DeptPendingRow>()

/** 필터 셀렉트에 노출할 상태 부분집합. 원 요구사항대로 근태 위반성 2종(지각/조퇴, 결근)만 노출한다. */
const FILTERABLE_STATUSES = ['LATE_EARLY', 'ABSENT'] as const satisfies AttendanceStatus[]

interface DeptAttendancePendingTableProps {
  data: DeptPendingRow[]
  /** 미승인 총건수. 서버 Page.totalElements 그대로 — status가 설정되면 필터링된 건수를 반영한다. */
  totalElements: number
  /** [수정] 버튼 클릭 시 대상 근태를 상위(DeptAttendancePage)에 전달한다. */
  onEdit: (target: AttendanceEditTarget) => void
  status: AttendanceStatus | undefined
  onStatusChange: (status: AttendanceStatus | undefined) => void
}

/** "HH:mm:ss" 원문에서 표시용 "HH:mm"만 자른다. null(시간 없음 상태)이면 "-"로 표기. */
function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '-'
}

/** 부서 승인 대기 근태 1페이지(content)를 렌더하는 표. */
export function DeptAttendancePendingTable({
  data,
  totalElements,
  onEdit,
  status,
  onStatusChange,
}: DeptAttendancePendingTableProps) {
  const approveMutation = useApproveAttendanceMutation()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  // 현재 페이지에서 실제로 승인 가능한(미승인) 행의 attendanceId 목록.
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

  // 선택된 현재 페이지 행만 건별 승인 호출(전용 배치 API 없음).
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
      {/* 툴바: 미승인 총건수 + 상태 필터(서버 사이드, 단일값) + 선택 일괄 승인. data가 0건이어도
          필터를 해제할 수 있어야 하므로(현재 필터 결과가 0건인 것과 부서 전체가 0건인 것을
          구분할 신호가 없다) 항상 렌더한다 — data.length===0로 툴바 자체를 숨기지 않는다. */}
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

      {/* 선택 액션 바(목표 디자인 pendbar): 현재 페이지에서 선택된 미승인 건이 있을 때만 노출한다. */}
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
