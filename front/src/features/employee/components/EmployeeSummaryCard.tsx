import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Building2, Contact, IdCard, Mail, Phone } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getRoleLabel } from '@/features/home/lib/roleLabels'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeSummaryCardProps {
  data: EmployeeInfoResponse
  /** 사원 식별 번호(numeric). BlobAvatar의 EMP_FILE_PREVIEW 조회에 사용한다. */
  empId?: number
  /** 조회 주체가 본인인지 여부. false(타 사원 상세)면 아이디(loginId)와 역할 배지를 숨긴다. */
  viewerIsSelf?: boolean
  /**
   * "정보/비밀번호 수정" 버튼 클릭 핸들러(MyInfoPage 전용, adapt-ui 리디자인 신규).
   * UpdateMeDialog 한 폼이 내선번호·비밀번호를 함께 처리하므로(UpdateMeForm) 버튼도 하나로
   * 통합했다(사용자 확인, 애초의 "정보 수정"/"비밀번호" 2버튼안은 같은 다이얼로그를 여는
   * 중복 진입점이라 하나로 합쳤다). 전달하지 않으면(EmployeeDetailPage 등 타 사원 조회) 버튼을
   * 렌더하지 않는다.
   */
  onEditClick?: () => void
}

/** 아이콘+라벨+값 한 줄(계정 정보 섹션). */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

/** 대표/겸직 등 상태를 나타내는 알약 배지. tone으로 강조(primary)/보조(muted)를 구분. */
export function Pill({ tone = 'primary', children }: { tone?: 'primary' | 'muted'; children: ReactNode }) {
  return (
    <span
      className={
        tone === 'primary'
          ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
          : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {children}
    </span>
  )
}

/** 작은 섹션 heading. 아이콘 + muted 소제목. */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </h3>
  )
}

/**
 * 사원 정보 좌측 요약 카드(EmployeeInfoView에서 분리, adapt-ui 리디자인).
 * 아바타·이름·사번 + 전체 소속 부서 배지(대표/겸직 모두, 레퍼런스처럼 1개만이 아니라 다건 노출) +
 * 계정 정보(아이디는 viewerIsSelf에서만) + 현재 부서 목록.
 *
 * 활성 파일 표시는 이 카드의 책임이 아니다(adapt-ui 리디자인으로 MyInfoPage 전용 카드로 분리 —
 * EmployeeDetailPage(타 사원)는 원래도 활성 파일을 노출하지 않아 회귀 없음).
 */
export function EmployeeSummaryCard({
  data,
  empId,
  viewerIsSelf = true,
  onEditClick,
}: EmployeeSummaryCardProps) {
  const { empBasicInfo, currentDepts, activeFiles } = data
  const profilePictureFileId = getActiveProfilePicture(activeFiles)
  // 세션 roles(JWT 스냅샷)는 본인 소유 정보라 타 사원 상세(viewerIsSelf=false)에서는 조회 대상과
  // 무관하므로 렌더하지 않는다 — RETRIEVE_EMP_INFO 응답에도 역할 필드가 없다(추측 금지).
  const roles = useAuthStore((state) => state.roles)

  return (
    <Card className="h-fit">
      <CardContent className="space-y-5">
        {/* 아바타 + 이름 + 사번 + 소속 부서 배지(전체) + (본인이면) 역할 배지 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <BlobAvatar
            empId={empId}
            fileId={profilePictureFileId}
            fallbackText={empBasicInfo.name}
            className="size-24 text-3xl"
          />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight">{empBasicInfo.name}</h3>
            <p className="truncate text-sm text-muted-foreground">사번 {empBasicInfo.empNo}</p>
          </div>
          {(currentDepts.length > 0 || (viewerIsSelf && roles.length > 0)) && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {currentDepts.map((dept) => (
                <Pill key={dept.deptId} tone={dept.isPrimary ? 'primary' : 'muted'}>
                  {dept.deptName} · {dept.positionName}
                </Pill>
              ))}
              {viewerIsSelf &&
                roles.map((role) => (
                  <Pill key={role} tone="muted">
                    {getRoleLabel(role)}
                  </Pill>
                ))}
            </div>
          )}
          {viewerIsSelf && onEditClick && (
            <div className="pt-1">
              <Button type="button" size="sm" onClick={onEditClick}>
                정보/비밀번호 수정
              </Button>
            </div>
          )}
        </div>

        {/* 계정 정보 섹션 */}
        <div className="space-y-3 border-t pt-5">
          <SectionHeading icon={Contact}>계정 정보</SectionHeading>
          <div className="space-y-2.5">
            {/* 아이디: 본인 조회일 때만 노출(타 사원 프로필 미노출). */}
            {viewerIsSelf && <InfoRow icon={IdCard} label="아이디" value={empBasicInfo.loginId} />}
            <InfoRow
              icon={Mail}
              label="이메일"
              value={
                <a href={`mailto:${empBasicInfo.email}`} className="hover:underline">
                  {empBasicInfo.email}
                </a>
              }
            />
            <InfoRow icon={Phone} label="직통번호" value={empBasicInfo.extensionNo || '-'} />
          </div>
        </div>

        {/* 현재 부서 섹션 */}
        <div className="space-y-3 border-t pt-5">
          <SectionHeading icon={Building2}>현재 부서</SectionHeading>
          {currentDepts.length === 0 ? (
            <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {currentDepts.map((dept) => (
                <li key={dept.deptId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{dept.deptName}</p>
                    <p className="truncate text-xs text-muted-foreground">{dept.positionName}</p>
                  </div>
                  <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>{dept.isPrimary ? '대표' : '겸직'}</Pill>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
