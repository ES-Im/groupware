import { cn } from '@/shared/lib/utils'
import { useAttendanceQuickState } from '../lib/useAttendanceQuickState'

/**
 * 헤더 프로필 드롭다운 안의 출퇴근 퀵패널(요청: "우측 사원이름 클릭시 table view 요소 추가").
 *
 * 상태·mutation은 좌측 고정 패널(RailAttendanceTiles)과 공유하는 useAttendanceQuickState에서
 * 가져온다(동일 queryKey로 캐시 공유, ROADMAP(공통레이아웃) 참고).
 *
 * 출근: 성공하면 즉시 read-only(재클릭 불가)로 잠긴다. 퇴근: 오늘 레코드가 있는 한 재클릭을
 * 막지 않는다 — hover 시 시각 표시가 "퇴근" 라벨로 되돌아가 재클릭 가능함을 알린다(요청 그대로).
 * 실제 중복 퇴근 허용 여부는 프론트가 판단하지 않고 useCheckOutMutation의 서버 응답(성공/실패
 * 토스트는 훅이 자체 처리)에 위임한다.
 */
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
        {/* 헤더 행: 출근/퇴근 컬럼 라벨(muted 톤의 표 머리글). */}
        <div className="grid grid-cols-2 divide-x divide-border bg-muted/60" role="row">
          <span className="px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground" role="columnheader">
            출근
          </span>
          <span className="px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground" role="columnheader">
            퇴근
          </span>
        </div>
        {/* 값 행: 각 셀이 곧 버튼. 출근은 기록 후 read-only(muted), 퇴근은 hover 시 재클릭 라벨로 전환. */}
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
