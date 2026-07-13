import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Pill } from './EmployeeSummaryCard'
import type { CurrentDept } from '../model/me'

interface DeptHistoryCardProps {
  currentDepts: CurrentDept[]
}

/**
 * "소속 · 발령" 카드(MyInfoPage 전용, adapt-ui 리디자인 신규).
 *
 * 기존 EmployeeProfileTabs의 "부서이력" 탭 내용을 분리해 좌측 세로 타임라인으로 보여준다
 * (EmployeeProfileTabs는 showDeptTab=false로 이 탭을 숨긴다 — EmployeeDetailPage는 그대로 유지).
 *
 * RETRIEVE_ME_INFO.currentDepts는 "현재 소속만" 내려주고 endAt은 항상 null이다(response-fields.adoc
 * 실측: "종료일, 현재 소속만 출력"). 과거에 종료된 발령 이력을 조회하는 계약이 없으므로, 레퍼런스
 * 목업의 "신규 입사" 같은 과거 이력 항목은 지어내지 않고 현재 겸직/주소속만 startAt 내림차순으로
 * 나열한다.
 */
export function DeptHistoryCard({ currentDepts }: DeptHistoryCardProps) {
  const sorted = [...currentDepts].sort((a, b) => (a.startAt < b.startAt ? 1 : -1))

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle>소속 · 발령</CardTitle>
        <CardDescription>현재 소속된 부서와 발령일을 시간순으로 보여줍니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
        ) : (
          <ol>
            {sorted.map((dept, index) => (
              <li key={dept.deptId} className="relative flex gap-3 pb-5 last:pb-0">
                {index !== sorted.length - 1 && (
                  <span aria-hidden className="absolute top-3 left-[6.5px] h-full w-px bg-border" />
                )}
                <span
                  aria-hidden
                  className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 ${
                    dept.isPrimary ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    {dept.startAt} ~ {dept.endAt ?? '현재'}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <h5 className="truncate text-sm font-semibold text-foreground">{dept.deptName}</h5>
                    <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>
                      {dept.isPrimary ? '주 소속' : '겸직'}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dept.deptCode} · {dept.positionName}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
