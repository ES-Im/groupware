import { LogIn, LogOut } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAttendanceQuickState } from '../lib/useAttendanceQuickState'

/**
 * 좌측 고정 패널의 출퇴근 버튼(요청: "출 퇴근 버튼"). HeaderAttendanceQuickPanel과 같은
 * useAttendanceQuickState를 공유해 상태·mutation을 중복 구현하지 않는다.
 */
export function RailAttendanceTiles() {
  const {
    canCheckIn,
    canCheckOut,
    checkInTime,
    checkOutTime,
    checkIn,
    checkOut,
    isCheckInPending,
    isCheckOutPending,
  } = useAttendanceQuickState()

  return (
    <div className="grid grid-cols-2 gap-2" role="table" aria-label="오늘 출퇴근">
      <button
        type="button"
        role="cell"
        disabled={!canCheckIn || isCheckInPending}
        onClick={checkIn}
        aria-readonly={checkInTime !== null}
        className={cn(
          'flex flex-col items-center gap-1 rounded-lg border border-primary-foreground/20 px-2 py-2.5 text-primary-foreground transition-colors dark:border-card-foreground/20 dark:text-card-foreground',
          checkInTime !== null
            ? 'cursor-default bg-primary-foreground/5 dark:bg-card-foreground/5'
            : 'bg-primary-foreground/10 hover:bg-primary-foreground/20 disabled:pointer-events-none disabled:opacity-50 dark:bg-card-foreground/10 dark:hover:bg-card-foreground/20',
        )}
      >
        <span className="flex items-center gap-1 text-[11px] font-medium text-primary-foreground/70 dark:text-card-foreground/70">
          <LogIn className="size-3" aria-hidden="true" />
          출근 기록
        </span>
        <span className="text-sm font-semibold tabular-nums">{checkInTime ?? '--:--'}</span>
      </button>
      <button
        type="button"
        role="cell"
        disabled={!canCheckOut || isCheckOutPending}
        onClick={checkOut}
        className="flex flex-col items-center gap-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-2.5 text-primary-foreground transition-colors hover:bg-primary-foreground/20 disabled:pointer-events-none disabled:opacity-50 dark:border-card-foreground/20 dark:bg-card-foreground/10 dark:text-card-foreground dark:hover:bg-card-foreground/20"
      >
        <span className="flex items-center gap-1 text-[11px] font-medium text-primary-foreground/70 dark:text-card-foreground/70">
          <LogOut className="size-3" aria-hidden="true" />
          퇴근 기록
        </span>
        <span className="text-sm font-semibold tabular-nums">{checkOutTime ?? '--:--'}</span>
      </button>
    </div>
  )
}
