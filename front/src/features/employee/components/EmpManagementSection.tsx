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
  deptId: number | undefined
  canManageAsHr: boolean
  canManageAsDeptManager: boolean
}

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
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" />
            사원 관리
          </CardTitle>
          {record && (
            <Button type="button" size="default" onClick={() => setDialogOpen(true)}>
              정보 수정
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : !record ? (
          <p className="py-4 text-center text-sm text-muted-foreground">관리 정보를 불러오지 못했습니다.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
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
