import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useEmpForManagementQuery } from '../api/useEmpForManagementQuery'
import { empStatusLabels, systemRoleLabels } from '../model/empManagement'
import { DeptManagedInfoDialog } from './DeptManagedInfoDialog'
import { HrManagedInfoDialog } from './HrManagedInfoDialog'

interface EmpManagementSectionProps {
  empId: number
  /**
   * 대상 사원의 소속 부서(EMPS_FOR_MANAGEMENT 필터 + DEPT_MANAGER_UPDATE_EMP_INFO의 "같은 부서"
   * 서버 판정용). EmployeeDetailPage가 이미 조회한 EmployeeInfoResponse.currentDepts에서
   * getPrimaryDeptId로 도출해 주입한다(신규 재조회 아님).
   */
  deptId: number | undefined
  /** HR 또는 ADMIN 여부(ADMIN은 RoleHierarchy상 HR을 포함해 항상 이쪽 폼을 본다). */
  canManageAsHr: boolean
  /** DEPT_MANAGER(같은 부서) 여부. canManageAsHr가 true면 이 값과 무관하게 HR 폼이 우선한다. */
  canManageAsDeptManager: boolean
}

/**
 * 사원 상세(EmployeeDetailPage)의 관리 섹션(adapt-ui 신규).
 *
 * EMPS_FOR_MANAGEMENT 단건 조회(useEmpForManagementQuery)로 status/입사일/시스템 권한을
 * 읽기 전용으로 표시하고, "정보 수정" 버튼으로 역할에 맞는 다이얼로그(HrManagedInfoDialog
 * 또는 DeptManagedInfoDialog)를 연다. 어느 다이얼로그를 여는지는 이 섹션이 canManageAsHr을
 * canManageAsDeptManager보다 우선해 결정한다(ADMIN이 HR 쪽으로 흡수되는 것과 동일 우선순위) —
 * 두 값 자체의 계산(hasRequiredRole 판정)은 EmployeeDetailPage(react-router-developer 담당)의
 * 몫이다.
 *
 * canManageAsHr/canManageAsDeptManager가 모두 false인 상태로 렌더되는 것은 상정하지 않는다
 * (EmployeeDetailPage가 canManage일 때만 이 섹션 자체를 렌더하기로 확정) — 그래도 방어적으로
 * useEmpForManagementQuery의 enabled를 두 값의 OR로 게이팅해 잘못 렌더돼도 불필요한 403 요청을
 * 만들지 않는다.
 */
export function EmpManagementSection({
  empId,
  deptId,
  canManageAsHr,
  canManageAsDeptManager,
}: EmpManagementSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const enabled = canManageAsHr || canManageAsDeptManager
  const query = useEmpForManagementQuery(deptId, empId, enabled)
  const record = query.data

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-1.5">
          <ShieldCheck className="size-4" />
          사원 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : !record ? (
          <p className="py-4 text-center text-sm text-muted-foreground">관리 정보를 불러오지 못했습니다.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">근무 상태</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {empStatusLabels[record.status]}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">입사일자</p>
                <p className="mt-1 text-sm font-medium text-foreground">{record.hireAt}</p>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">시스템 권한</p>
              <div className="flex flex-wrap gap-1.5">
                {record.systemRoleCodeName.map((code) => (
                  <Badge key={code} variant="secondary">
                    {systemRoleLabels[code]}
                  </Badge>
                ))}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              정보 수정
            </Button>

            {canManageAsHr ? (
              <HrManagedInfoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                empId={empId}
                record={record}
              />
            ) : (
              <DeptManagedInfoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                empId={empId}
                record={record}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
