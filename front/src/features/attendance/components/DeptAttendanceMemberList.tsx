import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { cn } from '@/shared/lib/utils'
import { formatOvertimeMinutes } from '../lib/formatOvertimeMinutes'
import type { DeptAttendanceRow } from '../model/deptAttendance'

interface DeptAttendanceMemberListProps {
  data: DeptAttendanceRow[]
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
              <div className="flex items-start gap-2.5">
                <BlobAvatar
                  empId={emp.empId}
                  fileId={undefined}
                  fallbackText={emp.empName}
                  className="mt-0.5 size-8"
                />
                <div className="min-w-0 flex-1">
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
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
