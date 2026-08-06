import { cn } from '@/shared/lib/utils'
import { useAttendanceQuickState } from '../lib/useAttendanceQuickState'

export function HeaderAttendanceQuickPanel() {
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
    <div className="px-1.5 py-1" role="table" aria-label="오늘 출퇴근">
      <div className="overflow-hidden rounded-lg border border-border" role="rowgroup">
        <div className="grid grid-cols-2 divide-x divide-border bg-muted/60" role="row">
          <span className="px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground" role="columnheader">
            출근
          </span>
          <span className="px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground" role="columnheader">
            퇴근
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border" role="row">
          <button
            type="button"
            role="cell"
            disabled={!canCheckIn || isCheckInPending}
            onClick={checkIn}
            aria-readonly={checkInTime !== null}
            className={cn(
              'px-3 py-2.5 text-center text-sm font-semibold tabular-nums transition-colors',
              checkInTime !== null
                ? 'cursor-default bg-muted/40 text-muted-foreground'
                : 'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {checkInTime ?? '출근'}
          </button>
          <button
            type="button"
            role="cell"
            disabled={!canCheckOut || isCheckOutPending}
            onClick={checkOut}
            className="group/checkout px-3 py-2.5 text-center text-sm font-semibold tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {checkOutTime !== null ? (
              <>
                <span className="group-hover/checkout:hidden">{checkOutTime}</span>
                <span className="hidden group-hover/checkout:inline">퇴근</span>
              </>
            ) : (
              '퇴근'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
