import { ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Card } from '@/shared/ui/card'
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import { MeetingRoomReservationCalendarBlock } from '../components/MeetingRoomReservationCalendarBlock'

/**
 * P4 회의실 상세(열람) 페이지(F807+F808+F809, ROADMAP(MEETING-ROOMS) T2.4-b).
 *
 * P7 관리 상세(MeetingRoomManagementDetailPage)와 동일한 병합 카드 레이아웃을 쓴다(사용자 요청):
 * 좌측(4fr) 하나의 Card에 회의실 정보 + 안내 이미지를 6:4 높이 비율로 병합(사이 구분선)하고,
 * 우측(6fr)에 기간별 예약 현황을 둔다. 두 공유 컴포넌트에 `unwrapped`(자체 Card 제거)를 켜 하나의
 * 카드로 합치고, 안내 이미지는 `variant="slider"`로 좁은 좌측 하단 트랙을 채운다. 다만 이 화면은
 * 열람 전용이라 P7의 관리 액션(정보 수정·활성 토글·이미지 업로드/삭제)은 배선하지 않는다.
 *
 * 각 블록이 자체 `meetingRoomId` 기반 조회·로딩·에러·404를 독립 처리하므로(BoardDetailPage +
 * BoardDetailView와 동형 분리) 회의실 자체의 404는 여기서 중복 처리하지 않는다 — 이 페이지는
 * 라우트 파라미터 자체의 유효성(존재/순수 10진 양의 정수 형식)만 가드한다.
 */
export function MeetingRoomDetailPage() {
  const { meetingRoomId: meetingRoomIdParam } = useParams<{ meetingRoomId: string }>()
  // route param은 신뢰 불가 입력이다(BoardDetailPage/DepartmentDetailPage와 동일 가드): 순수
  // 10진 양의 정수 형식만 허용해 지수/16진수/음수 표기가 다른 회의실로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = meetingRoomIdParam !== undefined && /^[1-9][0-9]*$/.test(meetingRoomIdParam)
  const meetingRoomId = isDecimalPositiveInteger ? Number(meetingRoomIdParam) : undefined

  const backLink = (
    <Link
      to="/meetings/new"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      회의실 검색
    </Link>
  )

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 조회를 시도하지 않고 즉시 not-found로 분기한다.
  if (meetingRoomId === undefined) {
    return (
      <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 상세</h1>
        <p className="text-sm text-muted-foreground">회의실을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    // lg 이상에서 페이지를 main 스크롤 컨테이너 높이에 꽉 채워, 아래 2카드 그리드가 메인 영역 전체
    // 높이를 차지하고 각 카드 내부만 스크롤되게 한다(P7 관리 상세와 동일한 flex 패턴).
    <div className="flex w-full flex-col gap-5 p-4 sm:p-6 lg:h-full lg:p-8">
      {backLink}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 상세</h1>

      {/* 2카드 4:6 레이아웃(P7 관리 상세와 동일 형식, 사용자 요청). 좌측(4fr): 회의실 정보 + 안내
          이미지를 하나의 Card로 병합. Card 자체 패딩/갭을 제거(py-0/gap-0)해 두 섹션이 맞닿고, 사이
          구분선(아래 섹션 border-t)이 카드 폭을 가로지른다. 두 섹션은 lg에서 6:4 높이 비율
          (basis-0 grow-[6]/grow-[4])로 나뉜다. lg 미만은 일반 블록 흐름이라 세로 스택된다. */}
      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <Card className="flex min-w-0 flex-col gap-0 py-0 lg:min-h-0">
          {/* 상단(6fr): 회의실 기본정보. 열람 전용이라 하단 관리 버튼(footerAction)은 없다. */}
          <div className="lg:min-h-0 lg:basis-0 lg:grow-[6] lg:overflow-hidden">
            <MeetingRoomInfoPanel meetingRoomId={meetingRoomId} unwrapped />
          </div>
          {/* 하단(4fr): 안내 이미지 슬라이드. 열람 전용이라 업로드/삭제 액션은 없다(showDeleteAction·
              headerAction 미지정). 위 섹션과 사이 구분선(border-t). */}
          <div className="border-t lg:min-h-0 lg:basis-0 lg:grow-[4] lg:overflow-hidden">
            <MeetingRoomImageGallery meetingRoomId={meetingRoomId} unwrapped variant="slider" />
          </div>
        </Card>

        {/* 우측(6fr): 기간별 예약 현황. */}
        <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />
      </div>
    </div>
  )
}
