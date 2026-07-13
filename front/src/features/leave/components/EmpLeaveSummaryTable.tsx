import { Button } from '@/shared/ui/button'
import type { AdjustGrantDaysTarget, EmpLeaveSummaryRow } from '../model/leave'

interface EmpLeaveSummaryTableProps {
  data: EmpLeaveSummaryRow[]
  /** [특별 조정]/[포상 조정] 버튼 클릭 시 대상을 상위(AdminLeavePage)에 전달한다. */
  onAdjust: (target: AdjustGrantDaysTarget) => void
}

/** 부여/사용/잔여 일수 표기(반차로 소수가 나올 수 있어 정수는 그대로, 소수는 1자리로 표기). */
function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** 이름 앞 2글자를 아바타 이니셜로 쓴다(프로필 이미지가 없는 요약 표 전용, 목표 디자인 who 셀 대응). */
function initialsOf(name: string): string {
  return name.trim().slice(0, 2) || '—'
}

/** 휴가 종류 1칸(부여·사용 보조 + 잔여 강조). adjust가 주어지면 우측에 [조정] 버튼을 붙인다(특별/포상). */
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

/**
 * 전사 사원 휴가 요약 표(F747, ROADMAP(LEAVE) M5 T5.3). MyLeavePage(M3 T3.2)의 신청 이력
 * 표와 동일하게 plain 시맨틱 `<table>`(react-table 미도입)로 렌더한다 — 컬럼 정렬/그룹 없이
 * 정적 필드 나열이라 DeptAttendanceMonthlyTable 수준의 컬럼 헬퍼가 필요 없다.
 *
 * 목표 디자인(A안 톤)에 맞춰 사원 열은 아바타 이니셜 + 이름 + 사번을 한 셀에 묶고, 연차/특별/포상
 * 열은 부여·사용(보조) 위에 잔여(강조)를 얹은 lv-cell 스타일로 표기한다. [조정] 버튼은 그 행의
 * empId + 종류(SPECIAL/COMPENSATORY)를 담아 onAdjust를 호출한다(별도 사원 검색 없이 응답 행의
 * empId를 그대로 사용, PRD §계약 실측 메모).
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
