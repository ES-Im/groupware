import type { ComponentType, ReactNode, SVGProps } from 'react'
import { AtSign, Hash, IdCard, Phone, User, Users } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { EmpFileManagementPanel } from './EmpFileManagementPanel'
import { Pill } from './EmployeeSummaryCard'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeProfileTabsProps {
  data: EmployeeInfoResponse
  empId?: number
  actions?: ReactNode
  viewerIsSelf?: boolean
  showDeptTab?: boolean
}

function FieldCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  )
}

export function EmployeeProfileTabs({
  data,
  empId,
  actions,
  viewerIsSelf = true,
  showDeptTab = true,
}: EmployeeProfileTabsProps) {
  const { empBasicInfo, currentDepts } = data
  const primaryDept = currentDepts.find((dept) => dept.isPrimary)
  const descriptionParts = [
    '기본정보',
    ...(showDeptTab ? ['부서 이력'] : []),
    ...(viewerIsSelf ? ['파일 관리'] : []),
  ]

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle>사원 프로필</CardTitle>
        <CardDescription>{descriptionParts.join(', ')}를 탭으로 나누어 관리합니다.</CardDescription>
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">기본정보</TabsTrigger>
            {showDeptTab && <TabsTrigger value="dept">부서이력</TabsTrigger>}
            {viewerIsSelf && <TabsTrigger value="files">파일관리</TabsTrigger>}
          </TabsList>

          <TabsContent value="basic" className="pt-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <FieldCard icon={Hash} label="사번" value={empBasicInfo.empNo} />
              <FieldCard icon={User} label="이름" value={empBasicInfo.name} />
              {viewerIsSelf && <FieldCard icon={IdCard} label="아이디" value={empBasicInfo.loginId} />}
              <FieldCard icon={Users} label="직위" value={primaryDept?.positionName ?? '-'} />
              <FieldCard
                icon={AtSign}
                label="이메일"
                value={
                  <a href={`mailto:${empBasicInfo.email}`} className="hover:underline">
                    {empBasicInfo.email}
                  </a>
                }
              />
              <FieldCard icon={Phone} label="직통번호" value={empBasicInfo.extensionNo || '-'} />
            </dl>
          </TabsContent>

          {showDeptTab && (
            <TabsContent value="dept" className="pt-4">
              {currentDepts.length === 0 ? (
                <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {currentDepts.map((dept) => (
                    <li
                      key={dept.deptId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="truncate text-sm font-semibold text-foreground">{dept.deptName}</h5>
                          <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>
                            {dept.isPrimary ? '주 소속' : '겸직'}
                          </Pill>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {dept.deptCode} · {dept.positionName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <p>{dept.startAt} 시작</p>
                        <p>{dept.endAt ?? '현재 재직 중'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          )}

          {viewerIsSelf && (
            <TabsContent value="files" className="pt-4">
              <EmpFileManagementPanel empId={empId} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
