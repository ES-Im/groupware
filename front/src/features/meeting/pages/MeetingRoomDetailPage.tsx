import { Link, useParams } from 'react-router'
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import { MeetingRoomReservationCalendarBlock } from '../components/MeetingRoomReservationCalendarBlock'

/**
 * P4 회의실 상세(열람) 페이지(F807+F808+F809, ROADMAP(MEETING-ROOMS) T2.4-b).
 *
 * T2.4-a(정보+이미지 공유 컴포넌트)와 예약 캘린더 블록(T2.3 소비)을 조립하는 얇은 컨테이너다.
 * 각 블록이 자체 `meetingRoomId` 기반 조회·로딩·에러·404를 독립 처리하므로(BoardDetailPage +
 * BoardDetailView와 동형 분리) 회의실 자체의 404는 여기서 중복 처리하지 않는다 — 이 페이지는
 * 라우트 파라미터 자체의 유효성(존재/순수 10진 양의 정수 형식)만 가드한다.
 * 라우팅은 아직 미배선(M8)이므로 직접 URL(`/meeting-rooms/:meetingRoomId`)로만 검증한다.
 */
export function MeetingRoomDetailPage() {
  const { meetingRoomId: meetingRoomIdParam } = useParams<{ meetingRoomId: string }>()
  // route param은 신뢰 불가 입력이다(BoardDetailPage/DepartmentDetailPage와 동일 가드): 순수
  // 10진 양의 정수 형식만 허용해 지수/16진수/음수 표기가 다른 회의실로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = meetingRoomIdParam !== undefined && /^[1-9][0-9]*$/.test(meetingRoomIdParam)
  const meetingRoomId = isDecimalPositiveInteger ? Number(meetingRoomIdParam) : undefined

  const backLink = (
    <Link to="/meetings/new" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
      ← 회의실 검색
    </Link>
  )

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 조회를 시도하지 않고 즉시 not-found로 분기한다.
  if (meetingRoomId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">회의실 상세</h1>
        <p className="text-sm text-muted-foreground">회의실을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {backLink}
      <h1 className="text-xl font-semibold tracking-tight">회의실 상세</h1>
      <MeetingRoomInfoPanel meetingRoomId={meetingRoomId} />
      <MeetingRoomImageGallery meetingRoomId={meetingRoomId} />
      <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />
    </div>
  )
}
