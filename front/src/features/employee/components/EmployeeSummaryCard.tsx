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
  empId?: number
  viewerIsSelf?: boolean
  onEditClick?: () => void
  variant?: 'default' | 'horizontal'
}

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

export function EmployeeSummaryCard({
  data,
  empId,
  viewerIsSelf = true,
  onEditClick,
  variant = 'default',
}: EmployeeSummaryCardProps) {
  const { empBasicInfo, currentDepts, activeFiles } = data
  const profilePictureFileId = getActiveProfilePicture(activeFiles)
  const roles = useAuthStore((state) => state.roles)

  const accountRows = (
    <div className="space-y-2.5">
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
  )

  const deptListContent =
    currentDepts.length === 0 ? (
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
    )

  if (variant === 'horizontal') {
    return (
      <Card className="@container/emp h-fit">
        <CardContent className="flex flex-col gap-5 @min-[560px]/emp:flex-row @min-[560px]/emp:items-stretch">
          <div className="flex items-center gap-3 @min-[560px]/emp:w-48 @min-[560px]/emp:shrink-0 @min-[560px]/emp:flex-col @min-[560px]/emp:items-center @min-[560px]/emp:gap-3 @min-[560px]/emp:border-r @min-[560px]/emp:pr-5 @min-[560px]/emp:text-center">
            <BlobAvatar
              empId={empId}
              fileId={profilePictureFileId}
              fallbackText={empBasicInfo.name}
              className="size-14 text-xl @min-[560px]/emp:size-20 @min-[560px]/emp:text-3xl"
            />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-tight @min-[560px]/emp:text-lg">
                {empBasicInfo.name}
              </h3>
              <p className="truncate text-xs text-muted-foreground @min-[560px]/emp:text-sm">
                사번 {empBasicInfo.empNo}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <SectionHeading icon={Contact}>계정 정보</SectionHeading>
            {accountRows}
          </div>

          <div className="min-w-0 flex-1 space-y-3 @min-[560px]/emp:border-l @min-[560px]/emp:pl-5">
            <SectionHeading icon={Building2}>현재 부서</SectionHeading>
            {deptListContent}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardContent className="space-y-5">
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

        <div className="space-y-3 border-t pt-5">
          <SectionHeading icon={Contact}>계정 정보</SectionHeading>
          {accountRows}
        </div>

        <div className="space-y-3 border-t pt-5">
          <SectionHeading icon={Building2}>현재 부서</SectionHeading>
          {deptListContent}
        </div>
      </CardContent>
    </Card>
  )
}
