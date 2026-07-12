import type { ComponentType, ReactNode } from 'react'
import {
  Building2,
  CircleUser,
  Crown,
  FolderPlus,
  Hash,
  Info,
  Network,
  Power,
  SquarePen,
  Users,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { DeptMemberResponse } from '../model/deptMember'
import { AppointDepartmentLeaderForm } from './AppointDepartmentLeaderForm'
import { EndDepartmentLeaderForm } from './EndDepartmentLeaderForm'
import { RenameDepartmentForm } from './RenameDepartmentForm'
import { UpdateDepartmentParentForm } from './UpdateDepartmentParentForm'

interface OrgChartDepartmentPanelProps {
  deptInfo: DeptInfoResponse
  deptLeader: DeptLeader | null
  memberCount: number
  /** 상위 부서 이름. 최상위 부서면 null. */
  parentDeptName: string | null
  /** 이 부서를 상위로 두는 하위 부서 목록(트리에서 파생). */
  subDepartments: DeptInfoResponse[]
  /** ADMIN 전용 관리 섹션 노출 여부. false면 hero+기본 정보까지만 렌더한다(기존 게이팅 컨벤션과 동일). */
  canManageDept: boolean
  /** 부서장 지정 후보 목록(현재 로드된 부서 멤버). */
  members: DeptMemberResponse[]
  onToggleActive: () => void
  isTogglingActive: boolean
}

/** 기본 정보 그리드 한 칸(아이콘 칩 + 라벨 + 값). 값이 길면 truncate로 넘침을 막는다. */
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

/** 카드 내부 섹션 소제목(아이콘 칩 + 라벨). 각 섹션을 border-t로 구획하고 상단에 배치한다. */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      {children}
    </h3>
  )
}

/**
 * 조직도 우측 상세를 담는 단일 병합 카드("부서 관리").
 *
 * 구성: (1) hero(부서명 + 활성/비활성 배지 + 코드 배지) → (2) canManageDept일 때는 2단 컬럼으로
 * 배치한다. 좌측 컬럼은 "기본 정보"(부서 코드/상위 부서/부서장/현재 인원 그리드 + 하위 부서 배지)와
 * "상위 부서 변경"을, 우측 컬럼은 "부서명 변경 / 부서장 관리 / 활성 상태"를 세로로 나열한다. ADMIN이
 * 아니면 좌측의 기본 정보만 단일 컬럼으로 렌더한다. 부서 등록은 좌측 트리 헤더의 "신규 부서" 버튼이
 * 전담하므로 이 카드에서는 다루지 않는다.
 */
export function OrgChartDepartmentPanel({
  deptInfo,
  deptLeader,
  memberCount,
  parentDeptName,
  subDepartments,
  canManageDept,
  members,
  onToggleActive,
  isTogglingActive,
}: OrgChartDepartmentPanelProps) {
  // 기본 정보(현재 부서 정보) 섹션. ADMIN 여부와 무관하게 항상 노출되며, 2단 레이아웃에서는 좌측
  // 컬럼 최상단에 위치한다. 부서장 이름·현재 인원은 여기 그리드 한 곳에만 표시한다.
  const basicInfoSection = (
    <section className="space-y-4">
      <SectionHeading icon={Info}>기본 정보</SectionHeading>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem icon={Hash} label="부서 코드" value={deptInfo.deptCode} />
        <InfoItem icon={Building2} label="상위 부서" value={parentDeptName ?? '최상위 부서'} />
        <InfoItem icon={Crown} label="부서장" value={deptLeader?.empName ?? '미지정'} />
        <InfoItem icon={Users} label="현재 인원" value={`${memberCount}명`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Network className="size-4" aria-hidden />
          <span>하위 부서 {subDepartments.length}개</span>
        </div>
        {subDepartments.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {subDepartments.map((sub) => (
              <li key={sub.deptId}>
                <Badge variant={sub.isActive ? 'outline' : 'secondary'} className="gap-1">
                  {sub.deptName}
                  {!sub.isActive && <span className="text-muted-foreground">(비활성)</span>}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">하위 부서가 없습니다.</p>
        )}
      </div>
    </section>
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>부서 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* hero: 부서명 + 활성/비활성 배지 + 코드 배지 */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-semibold tracking-tight">{deptInfo.deptName}</h2>
          <Badge variant={deptInfo.isActive ? 'default' : 'secondary'}>
            {deptInfo.isActive ? '활성' : '비활성'}
          </Badge>
          <Badge variant="outline">{deptInfo.deptCode}</Badge>
        </div>

        {canManageDept ? (
          // 관리 가능(ADMIN): 좌(정보 + 상위 부서 변경) / 우(부서명 변경 · 부서장 관리 · 활성 상태) 2단.
          // 모바일에서는 1단으로 자연스럽게 스택되며, 우측 컬럼은 border-t로, 데스크톱에서는 border-l로 구획한다.
          <div className="grid grid-cols-1 gap-x-8 border-t pt-5 lg:grid-cols-2">
            <div className="space-y-5">
              {basicInfoSection}

              <section className="space-y-4 border-t pt-5">
                <SectionHeading icon={FolderPlus}>상위 부서 변경</SectionHeading>
                <UpdateDepartmentParentForm deptId={deptInfo.deptId} currentParentDeptId={deptInfo.parentDeptId} />
              </section>
            </div>

            <div className="mt-5 space-y-5 border-t pt-5 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <section className="space-y-4">
                <SectionHeading icon={SquarePen}>부서명 변경</SectionHeading>
                <RenameDepartmentForm deptId={deptInfo.deptId} currentName={deptInfo.deptName} />
              </section>

              {/* 부서장 관리: 헤딩+제출 버튼 한 줄은 각 폼(Appoint/End)이 소유하므로 여기서 별도 SectionHeading을 렌더하지 않는다. */}
              <section className="space-y-4 border-t pt-5">
                {deptLeader === null ? (
                  <AppointDepartmentLeaderForm deptId={deptInfo.deptId} members={members} />
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                      <CircleUser className="size-9 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {deptLeader.empName}
                          <span className="ml-1.5 font-normal text-muted-foreground">{deptLeader.position}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {deptLeader.empNo} · {deptLeader.email}
                        </p>
                      </div>
                    </div>
                    <EndDepartmentLeaderForm deptId={deptInfo.deptId} currentLeaderName={deptLeader.empName} />
                  </div>
                )}
              </section>

              <section className="space-y-4 border-t pt-5">
                <SectionHeading icon={Power}>활성 상태</SectionHeading>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    <span className="text-sm text-muted-foreground">현재 상태</span>
                    <Badge variant={deptInfo.isActive ? 'default' : 'secondary'}>
                      {deptInfo.isActive ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deptInfo.isActive
                      ? '비활성화하면 조직도에서 운영 대상에서 제외됩니다.'
                      : '활성화하면 즉시 운영 가능한 조직으로 전환됩니다.'}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant={deptInfo.isActive ? 'destructive' : 'default'}
                      disabled={isTogglingActive}
                      onClick={onToggleActive}
                    >
                      <Power aria-hidden />
                      {deptInfo.isActive ? '비활성화 전환' : '활성화 전환'}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          // 관리 불가(비ADMIN): 기본 정보만 단일 컬럼으로 노출한다.
          <div className="border-t pt-5">{basicInfoSection}</div>
        )}
      </CardContent>
    </Card>
  )
}
