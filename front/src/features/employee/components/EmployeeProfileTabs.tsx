import type { ComponentType, ReactNode, SVGProps } from 'react'
import { AtSign, Hash, IdCard, Phone, User, Users } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { EmpFileManagementPanel } from './EmpFileManagementPanel'
import { Pill } from './EmployeeSummaryCard'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeProfileTabsProps {
  data: EmployeeInfoResponse
  /** 사원 식별 번호. 파일관리 탭(viewerIsSelf 전용)의 업로드/삭제 경로에 필요하다. */
  empId?: number
  /** 사원 프로필 카드 우측 상단 액션 슬롯(예: MyInfoPage의 "수정" 버튼). 없으면 렌더하지 않는다. */
  actions?: ReactNode
  /** 조회 주체가 본인인지 여부. false(타 사원 상세)면 아이디·파일관리 탭을 숨긴다. */
  viewerIsSelf?: boolean
  /**
   * "부서이력" 탭 노출 여부(기본 true, adapt-ui 리디자인 신규).
   * MyInfoPage는 소속·발령 정보를 별도 카드(DeptHistoryCard)로 분리하면서 false로 넘겨 이 탭을
   * 숨긴다. EmployeeDetailPage(타 사원 상세)는 생략해 기존 3탭 구조를 그대로 유지한다 —
   * 이 컴포넌트가 두 페이지에서 공유되므로 기본값을 바꾸면 안 된다.
   */
  showDeptTab?: boolean
}

/** 아이콘+라벨+값 필드 카드(기본정보 탭). 값이 길면 truncate로 넘침을 막는다. */
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

/**
 * 사원 프로필 우측 탭 카드(EmployeeInfoView에서 분리, adapt-ui 리디자인).
 * 기본정보 탭 + showDeptTab이면 부서이력 탭 + viewerIsSelf면 파일관리 탭(EmpFileManagementPanel,
 * 업로드·활성화·삭제)을 더한다. MyInfoPage는 소속·발령을 DeptHistoryCard로 분리했으므로
 * showDeptTab=false로 넘겨 이 탭을 숨긴다.
 *
 * "직위"는 별도 필드가 아니라 대표부서(currentDepts.isPrimary)의 positionName에서 파생한다(신규
 * API 아님, 기존 currentDepts 재배치). "상태 메모"는 RETRIEVE_ME_INFO 응답에 없는 필드라 렌더하지 않는다
 * (레퍼런스 목업 요소, 계약 근거 없음 — 사용자 확인 완료).
 */
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

          {/* 기본정보 탭: 아이콘 필드 카드 2열 그리드. */}
          <TabsContent value="basic" className="pt-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <FieldCard icon={Hash} label="사번" value={empBasicInfo.empNo} />
              <FieldCard icon={User} label="이름" value={empBasicInfo.name} />
              {/* 아이디: 본인 조회일 때만 노출. */}
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

          {/* 부서이력 탭: 부서별 카드(대표/겸직 배지 · 부서코드·직위 · 발령기간). showDeptTab=false면 렌더하지 않는다. */}
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

          {/* 파일관리 탭: 본인 조회 전용. 업로드·활성화·삭제까지 지원하는 EmpFileManagementPanel에 위임. */}
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
