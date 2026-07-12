import { cn } from '@/shared/lib/utils'
import { formatOvertimeMinutes } from '../lib/formatOvertimeMinutes'
import type { DeptAttendanceRow } from '../model/deptAttendance'

/**
 * 부서 월별 근태 좌측 사원 목록(F305). 기존 DeptAttendanceMonthlyTable(표)을 대체하는 선택형
 * 리스트로, 컬럼 정보는 표와 동일하게 사번/이름/직급/요약(승인·대기·전체·초과근무)을 담되 클릭으로
 * 사원을 "선택"만 한다(네비게이션 아님 — 선택 상태는 상위 페이지의 로컬 state). 선택된 사원의 근태
 * 상세는 우측 캘린더(AttendanceCalendar)가 표시한다.
 *
 * 순수 프레젠테이셔널 컴포넌트: 데이터/선택 상태/선택 핸들러를 props로만 받는다.
 */
interface DeptAttendanceMemberListProps {
  data: DeptAttendanceRow[]
  /** 현재 선택된 사원의 empId(없으면 null). */
  selectedEmpId: number | null
  onSelect: (empId: number) => void
}

export function DeptAttendanceMemberList({
  data,
  selectedEmpId,
  onSelect,
}: DeptAttendanceMemberListProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">부서원 근태 기록이 없습니다.</p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((row) => {
        const emp = row.empInfo
        const isSelected = emp.empId === selectedEmpId
        return (
          <li key={emp.empId}>
            <button
              type="button"
              onClick={() => onSelect(emp.empId)}
              aria-pressed={isSelected}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{emp.empName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {emp.empNo} · {emp.positionName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  초과 {formatOvertimeMinutes(row.summary.overtimeMinutes)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>승인 {row.summary.approvedAttendanceCount}</span>
                <span>대기 {row.summary.pendingAttendanceCount}</span>
                <span>전체 {row.summary.totalAttendanceCount}</span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
