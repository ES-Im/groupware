import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCheckInMutation } from '@/features/attendance/api/useCheckInMutation'
import { useCheckOutMutation } from '@/features/attendance/api/useCheckOutMutation'
import { useMyAttendanceMonthlyQuery } from '@/features/attendance/api/useMyAttendanceMonthlyQuery'
import { deriveTodayAttendanceButtonState } from '@/features/attendance/lib/deriveTodayAttendanceButtonState'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
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
  /**
   * true면 기록이 있어도 버튼을 영구히 숨기지 않는다 — 평소엔 기록을 보여주다 그 영역에
   * 마우스를 올리면(hover) 버튼으로 전환해 재기록할 수 있게 한다(퇴근 전용, 사용자 확인 완료).
   */
  allowReRecordOnHover?: boolean
}

/**
 * 출근/퇴근 슬롯(사용자 확인, 2026-07-12) — 기록이 없으면 버튼만 노출하고, 클릭해 기록이
 * 생기면 그 자리가 "기록 표시"로 바뀐다. 퇴근 슬롯만 `allowReRecordOnHover`로 기록 표시 위에
 * 마우스를 올렸을 때 버튼을 다시 드러내 재클릭(재기록)할 수 있게 한다 — 출근은 재클릭 UI를
 * 제공하지 않는다(요구사항이 퇴근에만 한정).
 */
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

/**
 * 환영 배너 + 출퇴근 카드(레퍼런스 dashboard/index.tsx의 Welcome Back 섹션 이식, F301/F302).
 *
 * 로그인 사용자명/소속/역할 뱃지는 GET /api/employees/me(useMeQuery)·authStore.roles로 채운다.
 * 출근 버튼의 활성 여부는 MyAttendancePage와 동일하게 "당월 전용 쿼리 +
 * deriveTodayAttendanceButtonState" 조합으로 파생한다(당일 단건 조회 API가 없어 월별 목록
 * 재사용이 전제 — MyAttendancePage.tsx 상단 JSDoc의 근거를 그대로 따른다). 레퍼런스는 체크인
 * 시각을 로컬 state로만 표시했지만, 우리는 실제 서버 기록(AttendanceItem.startAt/endAt)을
 * 표시해 새로고침해도 값이 유지된다.
 *
 * 퇴근은 deriveTodayAttendanceButtonState의 canCheckOut으로 막지 않는다(사용자 확인,
 * 2026-07-12) — 한 번 기록한 뒤에도 다시 기록할 수 있어야 하며, mutation.isPending(중복 클릭 중
 * 요청 방지)만 막는다. 재클릭 시 서버가 최종 판정한다(중복 퇴근 거부는 서버 책임). UI 자체도
 * AttendanceSlot(allowReRecordOnHover)로 hover 시에만 버튼을 다시 드러내는 방식으로 이 정책을
 * 반영한다.
 */
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

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-muted/50 to-card">
      <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-4 ring-primary/5">
            {me?.empBasicInfo.name.slice(0, 1) ?? ''}
          </div>
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
