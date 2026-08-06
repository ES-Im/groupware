import { useEffect, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  Building2,
  IdCard,
  Mail,
  Network,
  Pencil,
  Phone,
  Power,
  PowerOff,
  Search,
  Settings2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { DeptMemberResponse, Page } from '../model/deptMember'
import { DeptAttendanceBoardWidget } from './DeptAttendanceBoardWidget'
import { DepartmentMembersTable } from './DepartmentMembersTable'

const SEARCH_DEBOUNCE_MS = 300

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

interface DepartmentDetailViewProps {
  deptInfo: DeptInfoResponse
  deptLeader: DeptLeader | null
  members: DeptMemberResponse[]
  membersErrorMessage?: string
  pageInfo: Page<unknown>
  canManageMembers?: boolean
  canViewAttendanceBoard?: boolean
  canManageDept?: boolean
  onToggleActive?: () => void
  isTogglingActive?: boolean
  onOpenRenameDialog?: () => void
  onOpenUpdateParentDialog?: () => void
  onOpenAppointLeaderDialog?: () => void
  onOpenEndLeaderDialog?: () => void
  keyword: string
  onKeywordChange: (value: string) => void
  page: number
  onPageChange: (page: number) => void
  size: number
  onSizeChange: (size: number) => void
  onRowClick: (empId: number) => void
  overlayLayout?: boolean
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

function Pill({ tone = 'primary', children }: { tone?: 'primary' | 'muted'; children: ReactNode }) {
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

export function DepartmentDetailView({
  deptInfo,
  deptLeader,
  members,
  membersErrorMessage,
  pageInfo,
  canManageMembers = false,
  canViewAttendanceBoard = false,
  canManageDept = false,
  onToggleActive,
  isTogglingActive = false,
  onOpenRenameDialog,
  onOpenUpdateParentDialog,
  onOpenAppointLeaderDialog,
  onOpenEndLeaderDialog,
  keyword,
  onKeywordChange,
  page,
  onPageChange,
  size,
  onSizeChange,
  onRowClick,
  overlayLayout = false,
}: DepartmentDetailViewProps) {
  const [searchInput, setSearchInput] = useState(keyword)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => onKeywordChange(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, onKeywordChange])

  const memberListSection = (
    <section
      className={cn(
        'min-w-0 space-y-3',
        overlayLayout &&
          '@min-[720px]:flex @min-[720px]:min-h-0 @min-[720px]:flex-1 @min-[720px]:flex-col @min-[720px]:space-y-0',
      )}
    >
      <Card
        className={cn(
          overlayLayout
            ? 'h-fit @min-[720px]:flex @min-[720px]:min-h-0 @min-[720px]:flex-1 @min-[720px]:flex-col'
            : 'h-fit',
        )}
      >
        <CardHeader className={cn('border-b', overlayLayout && '@min-[720px]:shrink-0')}>
          <CardTitle>부서 멤버 목록</CardTitle>
          {!overlayLayout && (
            <CardDescription>부서 현황을 확인하고 필요한 멤버를 상세 화면에서 관리합니다.</CardDescription>
          )}
        </CardHeader>
        <CardContent
          className={cn(
            'space-y-4',
            overlayLayout && '@min-[720px]:min-h-0 @min-[720px]:flex-1 @min-[720px]:overflow-y-auto',
          )}
        >
          {!overlayLayout && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="member-search" className="sr-only">
                  부서 멤버 검색
                </label>
                <Input
                  id="member-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="사원명, 사번, 이메일 검색..."
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Pill>총 {pageInfo.totalElements}명</Pill>
                <label htmlFor="member-page-size" className="sr-only">
                  페이지 크기
                </label>
                <select
                  id="member-page-size"
                  value={size}
                  onChange={(event) => onSizeChange(Number(event.target.value))}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}개씩
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {membersErrorMessage ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{membersErrorMessage}</p>
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {keyword ? '검색 결과가 없습니다.' : '부서 멤버가 없습니다.'}
            </p>
          ) : (
            <DepartmentMembersTable
              data={members}
              onRowClick={onRowClick}
              canManage={canManageMembers}
              compact={overlayLayout}
            />
          )}

          {!overlayLayout && (
            <PaginationControls
              className="border-t pt-4"
              pageInfo={pageInfo}
              page={page}
              onPageChange={onPageChange}
              unit="명"
            />
          )}
        </CardContent>
      </Card>

      {canViewAttendanceBoard && <DeptAttendanceBoardWidget deptId={deptInfo.deptId} />}
    </section>
  )

  if (overlayLayout) {
    return (
      <div className="flex flex-col gap-4 @min-[720px]:min-h-0 @min-[720px]:flex-1">
        <Card className="@container/dept h-fit shrink-0">
          <CardContent className="flex flex-col gap-5 @min-[560px]/dept:flex-row @min-[560px]/dept:items-stretch">
            <div className="flex items-center gap-3 @min-[560px]/dept:w-48 @min-[560px]/dept:shrink-0 @min-[560px]/dept:flex-col @min-[560px]/dept:items-center @min-[560px]/dept:justify-center @min-[560px]/dept:gap-3 @min-[560px]/dept:border-r @min-[560px]/dept:pr-5 @min-[560px]/dept:text-center">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground @min-[560px]/dept:size-16">
                <Building2 className="size-6 @min-[560px]/dept:size-7" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight @min-[560px]/dept:text-lg">
                  {deptInfo.deptName}
                </h3>
                <p className="truncate text-xs text-muted-foreground @min-[560px]/dept:text-sm">
                  부서코드 {deptInfo.deptCode}
                </p>
                <div className="mt-1.5">
                  <Pill tone={deptInfo.isActive ? 'primary' : 'muted'}>
                    {deptInfo.isActive ? '활성' : '비활성'}
                  </Pill>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <SectionHeading icon={Building2}>부서 기본 정보</SectionHeading>
              <div className="space-y-2.5">
                <InfoRow icon={IdCard} label="부서 코드" value={deptInfo.deptCode} />
                <InfoRow icon={Building2} label="부서명" value={deptInfo.deptName} />
                <InfoRow
                  icon={Network}
                  label="상위 부서"
                  value={
                    deptInfo.parentDeptId === null
                      ? '최상위 부서'
                      : `상위 부서 ID: ${deptInfo.parentDeptId}`
                  }
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3 @min-[560px]/dept:border-l @min-[560px]/dept:pl-5">
              <SectionHeading icon={Users}>부서장</SectionHeading>
              {deptLeader === null ? (
                <p className="text-sm text-muted-foreground">부서장이 지정되지 않았습니다.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BlobAvatar
                      empId={deptLeader.empId}
                      fileId={undefined}
                      fallbackText={deptLeader.empName}
                      className="size-11 text-lg"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{deptLeader.empName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {deptLeader.empNo} · {deptLeader.position}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <InfoRow icon={Phone} label="직통번호" value={deptLeader.extensionNo || '-'} />
                    <InfoRow
                      icon={Mail}
                      label="이메일"
                      value={
                        <a href={`mailto:${deptLeader.email}`} className="hover:underline">
                          {deptLeader.email}
                        </a>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {memberListSection}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">{deptInfo.deptName}</h2>
              <p className="truncate text-sm text-muted-foreground">부서코드 {deptInfo.deptCode}</p>
            </div>
            <Pill tone={deptInfo.isActive ? 'primary' : 'muted'}>
              {deptInfo.isActive ? '활성' : '비활성'}
            </Pill>
          </div>

          <div className="space-y-3 border-t pt-5">
            <SectionHeading icon={Building2}>부서 기본 정보</SectionHeading>
            <div className="space-y-2.5">
              <InfoRow icon={IdCard} label="부서 코드" value={deptInfo.deptCode} />
              <InfoRow icon={Building2} label="부서명" value={deptInfo.deptName} />
              <InfoRow
                icon={Network}
                label="상위 부서"
                value={
                  deptInfo.parentDeptId === null
                    ? '최상위 부서'
                    : `상위 부서 ID: ${deptInfo.parentDeptId}`
                }
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-5">
            <SectionHeading icon={Users}>부서장</SectionHeading>
            {deptLeader === null ? (
              <p className="text-sm text-muted-foreground">부서장이 지정되지 않았습니다.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BlobAvatar
                    empId={deptLeader.empId}
                    fileId={undefined}
                    fallbackText={deptLeader.empName}
                    className="size-11 text-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deptLeader.empName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deptLeader.empNo} · {deptLeader.position}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <InfoRow icon={Phone} label="직통번호" value={deptLeader.extensionNo || '-'} />
                  <InfoRow
                    icon={Mail}
                    label="이메일"
                    value={
                      <a href={`mailto:${deptLeader.email}`} className="hover:underline">
                        {deptLeader.email}
                      </a>
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {canManageDept && (
            <div className="space-y-3 border-t pt-5">
              <SectionHeading icon={Settings2}>부서 관리</SectionHeading>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onOpenRenameDialog}
                >
                  <Pencil />
                  부서명 변경
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={onOpenUpdateParentDialog}
                >
                  <Network />
                  상위 부서 변경
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                  onClick={onOpenAppointLeaderDialog}
                >
                  <UserPlus />
                  부서장 지정
                </Button>
                {deptLeader !== null && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onOpenEndLeaderDialog}
                  >
                    <UserMinus />
                    부서장 종료
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full justify-start"
                  disabled={isTogglingActive}
                  onClick={onToggleActive}
                >
                  {deptInfo.isActive ? <PowerOff /> : <Power />}
                  {deptInfo.isActive ? '비활성화 전환' : '활성화 전환'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {memberListSection}
    </div>
  )
}
