import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingReservationDetailQuery } from '../api/useMeetingReservationDetailQuery'
import { CancelReservationAlertDialog } from '../components/CancelReservationAlertDialog'
import { MeetingParticipantsReplaceDialog } from '../components/MeetingParticipantsReplaceDialog'
import { MeetingReservationUpdateDialog } from '../components/MeetingReservationUpdateDialog'
import { canManageReservation } from '../lib/canManageReservation'

/**
 * P3 회의 예약 상세 페이지(F801/F804/F805/F806, ROADMAP(MEETING-ROOMS) T4.3-a~c 최종 조립).
 *
 * T4.1(useMeetingReservationDetailQuery)로 상세를 조회해 회의실·예약자·일시·취소여부·참여자
 * 목록을 렌더하고, canManageReservation(예약자 본인 + 미취소 + 회의일 내일 이후)으로 액션 영역
 * 노출 여부만 판정한다. 게이팅을 통과하면 [예약 정보 수정](T4.3-b)·[참여자 교체]·[예약 취소]
 * (이상 T4.3-c) 3개 액션을 나란히 노출한다.
 *
 * FACILITY가 P5(회의 예약 관리) 경유로 조회 전용 진입 시에도 reserverId가 자신과 다르므로
 * canManageReservation이 자연히 false를 반환해 액션 영역을 숨긴다(별도 role 분기 불필요, PRD
 * §사용자 여정 권한 분기점). 소유자 불일치 403은 ROLE_003이 아니므로 각 다이얼로그가 code
 * 비의존으로 handleApiError 토스트 처리한다.
 *
 * 라우팅은 아직 미배선(M8)이므로 직접 URL(`/meetings/:meetingId`)로만 검증한다.
 */
export function MeetingReservationDetailPage() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false)
  const { meetingId: meetingIdParam } = useParams<{ meetingId: string }>()
  // route param은 신뢰 불가 입력이다(BoardDetailPage/MeetingRoomDetailPage와 동일 가드): 순수
  // 10진 양의 정수 형식만 허용해 지수/16진수/음수 표기가 다른 예약으로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = meetingIdParam !== undefined && /^[1-9][0-9]*$/.test(meetingIdParam)
  const meetingId = isDecimalPositiveInteger ? Number(meetingIdParam) : undefined

  const detailQuery = useMeetingReservationDetailQuery(meetingId)
  const meQuery = useMeQuery()

  // not-found는 아래에서 전용 문구로 안내하므로, 그 외 실패만 토스트로 알린다(MeetingRoomInfoPanel과 동일 컨벤션).
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  const backLink = (
    <Link to="/meetings" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
      ← 내 예약 캘린더
    </Link>
  )

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 조회를 시도하지 않고 즉시 not-found로 분기한다.
  if (meetingId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">회의 예약 상세</h1>
        <p className="text-sm text-muted-foreground">예약을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">회의 예약 상세</h1>
        <p className="text-sm text-muted-foreground">
          {isNotFound(apiError) ? '예약을 찾을 수 없습니다.' : '예약 정보를 불러오지 못했습니다.'}
        </p>
      </div>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드.
  if (!detailQuery.data) {
    return null
  }

  const detail = detailQuery.data
  const canManage = canManageReservation(detail, meQuery.data?.empBasicInfo.empId)
  const timeRange = `${dayjs(`${detail.meetingDate}T${detail.startAt}`).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(
    `${detail.meetingDate}T${detail.endAt}`,
  ).format('HH:mm')}`

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {backLink}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{detail.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{detail.meetingRoomName}</p>
            </div>
            <Badge variant={detail.isCanceled ? 'outline' : 'secondary'}>
              {detail.isCanceled ? '취소됨' : '예약중'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            예약자 {detail.reserverDeptName} · {detail.reserverEmpName}
          </p>
          <p>{timeRange}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>참여자 {detail.participantCount}명</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.participants.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {detail.participants.map((participant) => (
                <li key={participant.empId} className="text-muted-foreground">
                  {participant.deptName} · {participant.empName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">참여자가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(true)}>
            예약 정보 수정
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsParticipantsDialogOpen(true)}>
            참여자 교체
          </Button>
          <CancelReservationAlertDialog meetingId={detail.meetingId} />
        </div>
      )}

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
