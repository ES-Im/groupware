import { Button } from '@/shared/ui/button'
import type { AdjustGrantDaysTarget, EmpLeaveSummaryRow } from '../model/leave'

interface EmpLeaveSummaryTableProps {
  data: EmpLeaveSummaryRow[]
  onAdjust: (target: AdjustGrantDaysTarget) => void
}

function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function initialsOf(name: string): string {
  return name.trim().slice(0, 2) || '—'
}

function LeaveCell({
  grant,
  used,
  adjust,
}: {
  grant: number
  used: number
  adjust?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="tabular-nums">
        <p className="text-xs text-muted-foreground">
          부여 {formatDays(grant)} · 사용 {formatDays(used)}
        </p>
        <p className="text-sm font-semibold text-foreground">잔여 {formatDays(grant - used)}</p>
      </div>
      {adjust && (
        <Button type="button" variant="outline" size="sm" onClick={adjust}>
          조정
        </Button>
      )}
    </div>
  )
}

export function EmpLeaveSummaryTable({ data, onAdjust }: EmpLeaveSummaryTableProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">조회 조건에 해당하는 사원이 없습니다.</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              사원
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              부서
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              직급
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              연차
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              특별휴가
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              포상휴가
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.empId} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
              <td className="px-3 py-3 align-middle whitespace-nowrap">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initialsOf(row.empName)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.empName}</p>
                    <p className="text-xs text-muted-foreground">{row.empNo}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                {row.deptName}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                {row.positionName}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap">
                <LeaveCell
                  grant={row.leaveSummary.annualBaseGrantDays}
                  used={row.leaveSummary.annualUsedDays}
                />
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap">
                <LeaveCell
                  grant={row.leaveSummary.specialGrantDays}
                  used={row.leaveSummary.specialUsedDays}
                  adjust={() => onAdjust({ empId: row.empId, empName: row.empName, leaveKind: 'SPECIAL' })}
                />
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap">
                <LeaveCell
                  grant={row.leaveSummary.compensatoryGrantDays}
                  used={row.leaveSummary.compensatoryUsedDays}
                  adjust={() =>
                    onAdjust({ empId: row.empId, empName: row.empName, leaveKind: 'COMPENSATORY' })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
