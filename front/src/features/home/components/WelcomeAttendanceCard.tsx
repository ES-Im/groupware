import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCheckInMutation } from '@/features/attendance/api/useCheckInMutation'
import { useCheckOutMutation } from '@/features/attendance/api/useCheckOutMutation'
import { useMyAttendanceMonthlyQuery } from '@/features/attendance/api/useMyAttendanceMonthlyQuery'
import { deriveTodayAttendanceButtonState } from '@/features/attendance/lib/deriveTodayAttendanceButtonState'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { getRoleLabel } from '../lib/roleLabels'

interface AttendanceSlotProps {
  icon: ReactNode
  actionLabel: string
  recordLabel: string
  time: string | null
  disabled?: boolean
  pending: boolean
  onClick: () => void
  variant: 'default' | 'secondary'
  allowReRecordOnHover?: boolean
}

function AttendanceSlot({
  icon,
  actionLabel,
  recordLabel,
  time,
  disabled = false,
  pending,
  onClick,
  variant,
  allowReRecordOnHover = false,
}: AttendanceSlotProps) {
  const hasRecord = time != null

  const actionButton = (className: string) => (
    <Button
      type="button"
      size="lg"
      variant={variant}
      className={className}
      disabled={disabled || pending}
      onClick={onClick}
    >
      {icon}
      {actionLabel}
    </Button>
  )

  if (!hasRecord) {
    return actionButton('h-14 w-full text-base [&_svg]:size-5')
  }

  const recordDisplay = (
    <div className="flex h-14 w-full items-center justify-center gap-2.5 rounded-lg border bg-card px-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {recordLabel}
        </p>
        <p className="text-base font-semibold tabular-nums">{dayjs(time, 'HH:mm:ss').format('HH:mm')}</p>
      </div>
    </div>
  )

  if (!allowReRecordOnHover) {
    return recordDisplay
  }

  return (
    <div className="group relative h-14 w-full">
      <div className="absolute inset-0 transition-opacity duration-150 group-hover:opacity-0">
        {recordDisplay}
      </div>
      {actionButton(
        'absolute inset-0 h-14 w-full text-base opacity-0 transition-opacity duration-150 group-hover:opacity-100 [&_svg]:size-5',
      )}
    </div>
  )
}

export function WelcomeAttendanceCard() {
  const roles = useAuthStore((state) => state.roles)
  const { data: me } = useMeQuery()

  const currentYearMonth = dayjs().format('YYYY-MM')
  const todayAttendanceQuery = useMyAttendanceMonthlyQuery({
    yearMonth: currentYearMonth,
    status: undefined,
    page: 0,
    size: 100,
  })
  const todayRecords = (todayAttendanceQuery.data?.content ?? []).filter(
    (item) => item.attendanceDate === dayjs().format('YYYY-MM-DD'),
  )
  const { canCheckIn } = todayAttendanceQuery.isSuccess
    ? deriveTodayAttendanceButtonState(todayAttendanceQuery.data?.content ?? [])
    : { canCheckIn: false }
  const checkInAt = todayRecords.find((item) => item.startAt)?.startAt ?? null
  const checkOutAt = todayRecords.find((item) => item.endAt)?.endAt ?? null

  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()

  const primaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]
  const profilePictureFileId = getActiveProfilePicture(me?.activeFiles ?? [])

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-muted/50 to-card">
      <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BlobAvatar
            empId={me?.empBasicInfo.empId}
            fileId={profilePictureFileId}
            fallbackText={me?.empBasicInfo.name ?? ''}
            className="size-16 bg-primary/10 text-2xl font-bold text-primary ring-4 ring-primary/5"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Welcome Back
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">
              {me?.empBasicInfo.name ?? '-'}님, 좋은 하루입니다.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              오늘도 진행 중인 업무를 한눈에 확인해보세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {primaryDept && (
                <Badge variant="secondary">
                  {primaryDept.deptName} · {primaryDept.positionName}
                </Badge>
              )}
              {me && <Badge variant="secondary">사번 {me.empBasicInfo.empNo}</Badge>}
              {roles.map((role) => (
                <Badge key={role} variant="outline">
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card/80 p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <AttendanceSlot
              icon={<LogIn />}
              actionLabel="출근"
              recordLabel="출근 기록"
              time={checkInAt}
              disabled={!canCheckIn}
              pending={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
              variant="default"
            />
            <AttendanceSlot
              icon={<LogOut />}
              actionLabel="퇴근"
              recordLabel="퇴근 기록"
              time={checkOutAt}
              pending={checkOutMutation.isPending}
              onClick={() => checkOutMutation.mutate()}
              variant="secondary"
              allowReRecordOnHover
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
