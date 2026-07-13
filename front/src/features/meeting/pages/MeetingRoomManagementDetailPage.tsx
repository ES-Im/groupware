import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, SquarePen } from 'lucide-react'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useMeetingRoomDetailQuery } from '../api/useMeetingRoomDetailQuery'
import { MeetingRoomActiveToggleButton } from '../components/MeetingRoomActiveToggleButton'
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomImageUploadButton } from '../components/MeetingRoomImageUploadButton'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import { MeetingRoomReservationCalendarBlock } from '../components/MeetingRoomReservationCalendarBlock'
import { MeetingRoomUpdateDialog } from '../components/MeetingRoomUpdateDialog'

/**
 * P7 회의실 관리 상세 페이지(F813/F815/F816/F814, ROADMAP(MEETING-ROOMS) T7.2-a~c 완성).
 *
 * M2 T2.4-b 공유 read 블록(정보·이미지·예약 캘린더)을 그대로 재사용하고, M6 T6.2가 독립 export한
 * 활성/비활성 토글 버튼(`MeetingRoomActiveToggleButton`)을 배선한다. 토글 버튼은 `isAvailable`
 * 값이 필요해 이 페이지에서도 `useMeetingRoomDetailQuery`를 호출하지만, `MeetingRoomInfoPanel`과
 * 동일 queryKey라 React Query 캐시가 공유되어 중복 요청은 발생하지 않는다.
 *
 * 이미지 업로드(F815)는 `MeetingRoomImageUploadButton`(T7.1 mutation 소비, 페이지 전용)으로,
 * 삭제(F816)는 `MeetingRoomImageGallery`에 `showDeleteAction`을 켜서 위임한다 — 그 컴포넌트는
 * P4(T2.4-b, 일반 열람)와 공유 소비되므로 삭제 버튼이 기본 비노출(opt-in)이어야 P4에 새지 않는다.
 *
 * 회의실 자체의 404는 T2.4-b(MeetingRoomDetailPage)처럼 각 블록에 맡기지 않고 이 페이지가 직접
 * 감지해 전체를 not-found UX로 대체한다 — 관리자 화면에서 존재하지 않는 회의실에 토글/업로드 등
 * 관리 액션을 노출하지 않기 위함이다.
 */
export function MeetingRoomManagementDetailPage() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const { meetingRoomId: meetingRoomIdParam } = useParams<{ meetingRoomId: string }>()
  // route param은 신뢰 불가 입력이다(MeetingRoomDetailPage와 동일 가드): 순수 10진 양의 정수
  // 형식만 허용해 지수/16진수/음수 표기가 다른 회의실로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = meetingRoomIdParam !== undefined && /^[1-9][0-9]*$/.test(meetingRoomIdParam)
  const meetingRoomId = isDecimalPositiveInteger ? Number(meetingRoomIdParam) : undefined

  const { data, error } = useMeetingRoomDetailQuery(meetingRoomId)

  const backLink = (
    <Link
      to="/meeting-rooms/management"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      회의실 목록
    </Link>
  )

  if (meetingRoomId === undefined || (error && isNotFound(normalizeApiError(error)))) {
    return (
      <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 관리 상세</h1>
        <p className="text-sm text-muted-foreground">회의실을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
      {backLink}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 관리 상세</h1>
        <div className="flex flex-wrap items-center gap-2">
          {data ? (
            <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(true)}>
              <SquarePen />
              정보 수정
            </Button>
          ) : null}
          {data ? <MeetingRoomActiveToggleButton meetingRoomId={meetingRoomId} isAvailable={data.isAvailable} /> : null}
          {data ? <MeetingRoomImageUploadButton meetingRoomId={meetingRoomId} /> : null}
        </div>
      </div>

      <MeetingRoomInfoPanel meetingRoomId={meetingRoomId} />
      <MeetingRoomImageGallery meetingRoomId={meetingRoomId} showDeleteAction />
      <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />

      {data ? (
        <MeetingRoomUpdateDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          meetingRoomId={meetingRoomId}
          detail={data}
        />
      ) : null}
    </div>
  )
}
