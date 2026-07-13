import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { CalendarDays, Info, Loader2, SquarePen, Users, Video } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingReservationDetailQuery } from '../api/useMeetingReservationDetailQuery'
import { CancelReservationAlertDialog } from './CancelReservationAlertDialog'
import { MeetingParticipantsReplaceDialog } from './MeetingParticipantsReplaceDialog'
import { MeetingReservationUpdateDialog } from './MeetingReservationUpdateDialog'
import { InitialAvatar, StatusPill } from './meetingUiKit'
import { canManageReservation } from '../lib/canManageReservation'

interface MeetingReservationDetailPanelProps {
  /** 선택된 예약 식별자. undefined면(아직 선택 안 함) 안내 플레이스홀더를 렌더한다. */
  meetingId: number | undefined
}

/**
 * 예약 상세 인라인 패널(F801/F804/F805/F806) — 기존 상세 "페이지"(MeetingReservationDetailPage, P3)를
 * 대체하는 재사용 컴포넌트. P1(내 예약 캘린더)·P5(예약 관리)가 이벤트/행 선택 시 이 패널을 목록
 * 아래에 인라인으로 렌더한다.
 *
 * 좌측 카드(회의 정보)에 [회의 정보 수정]·[예약 취소], 우측 카드(참가자)에 [참가자 교체]를 각각 카드
 * 우측 하단(CardFooter)에 배치한다. 세 액션 모두 canManageReservation(예약자 본인 + 미취소 + 회의일
 * 내일 이후)이 참일 때만 노출되므로, FACILITY가 P5에서 남의 예약을 조회할 때는 자연히 조회 전용이
 * 된다(별도 role 분기 불필요).
 *
 * 데이터 배관(useMeetingReservationDetailQuery/각 다이얼로그 mutation)은 기존 P3와 동일하다 — 이
 * 컴포넌트는 "페이지 → 인라인 패널" 재배치만 담당한다. 시각 구성(2카드 레이아웃·A안 톤)은
 * ux-ui-stylist가 다듬되, data-testid("reservation-detail-panel")와 버튼 접근성 이름은 회귀 방지를
 * 위해 보존한다.
 */
export function MeetingReservationDetailPanel({ meetingId }: MeetingReservationDetailPanelProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false)
  const detailQuery = useMeetingReservationDetailQuery(meetingId)
  const meQuery = useMeQuery()

  // not-found는 아래에서 전용 문구로 안내하므로 그 외 실패만 토스트로 알린다(P3와 동일 컨벤션).
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  if (meetingId === undefined) {
    return (
      <DetailStateBox dashed icon={<CalendarDays className="size-5" />}>
        위 목록에서 예약을 선택하면 상세가 표시됩니다.
      </DetailStateBox>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <DetailStateBox icon={<Loader2 className="size-5 animate-spin" />}>불러오는 중...</DetailStateBox>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    return (
      <DetailStateBox icon={<Info className="size-5" />}>
        {isNotFound(apiError) ? '예약을 찾을 수 없습니다.' : '예약 정보를 불러오지 못했습니다.'}
      </DetailStateBox>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const detail = detailQuery.data
  const canManage = canManageReservation(detail, meQuery.data?.empBasicInfo.empId)
  const timeRange = `${dayjs(`${detail.meetingDate}T${detail.startAt}`).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(
    `${detail.meetingDate}T${detail.endAt}`,
  ).format('HH:mm')}`

  return (
    <div data-testid="reservation-detail-panel">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 좌: 회의 정보 */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Video className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-muted-foreground">{detail.meetingRoomName}</p>
                  <CardTitle className="mt-0.5 text-base break-words">{detail.title}</CardTitle>
                </div>
              </div>
              <StatusPill tone={detail.isCanceled ? 'slate' : 'indigo'}>
                {detail.isCanceled ? '취소됨' : '예약중'}
              </StatusPill>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">예약자</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {detail.reserverDeptName} · {detail.reserverEmpName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">일시</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-foreground">{timeRange}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">회의실</dt>
                <dd className="mt-1 font-semibold text-foreground">{detail.meetingRoomName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">참여자</dt>
                <dd className="mt-1 font-semibold text-foreground">{detail.participantCount}명</dd>
              </div>
            </dl>
          </CardContent>
          {canManage && (
            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(true)}>
                <SquarePen />
                회의 정보 수정
              </Button>
              <CancelReservationAlertDialog meetingId={detail.meetingId} />
            </CardFooter>
          )}
        </Card>

        {/* 우: 참가자 */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>참가자 {detail.participantCount}명</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {detail.participants.length > 0 ? (
              <ul className="divide-y divide-border">
                {detail.participants.map((participant) => (
                  <li key={participant.empId} className="flex items-center gap-2.5 px-4 py-3.5">
                    <InitialAvatar name={participant.empName} size="md" />
                    <div className="min-w-0 leading-tight">
                      <p className="text-sm font-medium text-foreground">{participant.empName}</p>
                      <p className="text-xs text-muted-foreground">{participant.deptName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">참여자가 없습니다.</p>
            )}
          </CardContent>
          {canManage && (
            <CardFooter className="justify-end">
              <Button type="button" variant="outline" onClick={() => setIsParticipantsDialogOpen(true)}>
                <Users />
                참가자 교체
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <MeetingReservationUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        detail={detail}
      />
      <MeetingParticipantsReplaceDialog
        open={isParticipantsDialogOpen}
        onOpenChange={setIsParticipantsDialogOpen}
        meetingId={detail.meetingId}
        participants={detail.participants}
      />
    </div>
  )
}

/**
 * 데이터가 없는 상태(미선택·로딩·에러)를 A안 톤으로 통일해 렌더하는 안내 박스.
 * 아이콘 타일(정보 헤드 룩) + 문구로 카드 데이터 뷰와 결을 맞춘다. 회귀 테스트가 의존하는
 * data-testid("reservation-detail-panel")와 문구(children)는 호출부가 그대로 전달한다.
 */
function DetailStateBox({
  icon,
  children,
  dashed = false,
}: {
  icon: ReactNode
  children: ReactNode
  dashed?: boolean
}) {
  return (
    <div
      data-testid="reservation-detail-panel"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-14 text-center',
        dashed && 'border-dashed',
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
