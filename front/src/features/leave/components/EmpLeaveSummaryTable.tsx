import { Button } from '@/shared/ui/button'
import type { AdjustGrantDaysTarget, EmpLeaveSummaryRow } from '../model/leave'

interface EmpLeaveSummaryTableProps {
  data: EmpLeaveSummaryRow[]
  /** [특별 조정]/[포상 조정] 버튼 클릭 시 대상을 상위(AdminLeavePage)에 전달한다. */
  onAdjust: (target: AdjustGrantDaysTarget) => void
}

/**
 * 전사 사원 휴가 요약 표(F747, ROADMAP(LEAVE) M5 T5.3). MyLeavePage(M3 T3.2)의 신청 이력
 * 표와 동일하게 plain 시맨틱 `<table>`(react-table 미도입)로 렌더한다 — 컬럼 정렬/그룹 없이
 * 정적 필드 나열이라 DeptAttendanceMonthlyTable 수준의 컬럼 헬퍼가 필요 없다.
 *
 * 각 행은 연차(부여/사용)·특별(부여/사용 + [조정])·포상(부여/사용 + [조정]) 3개 열 그룹으로
 * 구성된다. [조정] 버튼은 그 행의 empId + 종류(SPECIAL/COMPENSATORY)를 담아 onAdjust를 호출한다
 * (별도 사원 검색 없이 응답 행의 empId를 그대로 사용, PRD §계약 실측 메모).
 */
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
              사번
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              이름
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              부서
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              직급
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              연차(부여/사용)
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              특별(부여/사용)
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
              포상(부여/사용)
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.empId} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                {row.empNo}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-foreground">
                {row.empName}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                {row.deptName}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground">
                {row.positionName}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                {row.leaveSummary.annualBaseGrantDays} / {row.leaveSummary.annualUsedDays}
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                <div className="flex items-center gap-2">
                  <span>
                    {row.leaveSummary.specialGrantDays} / {row.leaveSummary.specialUsedDays}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAdjust({ empId: row.empId, empName: row.empName, leaveKind: 'SPECIAL' })}
                  >
                    조정
                  </Button>
                </div>
              </td>
              <td className="px-3 py-3 text-left align-middle whitespace-nowrap text-muted-foreground tabular-nums">
                <div className="flex items-center gap-2">
                  <span>
                    {row.leaveSummary.compensatoryGrantDays} / {row.leaveSummary.compensatoryUsedDays}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAdjust({ empId: row.empId, empName: row.empName, leaveKind: 'COMPENSATORY' })
                    }
                  >
                    조정
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
