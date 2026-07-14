import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, SquarePen } from 'lucide-react'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useMeetingRoomDetailQuery } from '../api/useMeetingRoomDetailQuery'
import { MeetingRoomActiveToggleButton } from '../components/MeetingRoomActiveToggleButton'
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomImageUploadButton } from '../components/MeetingRoomImageUploadButton'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import { MeetingRoomReservationCalendarBlock } from '../components/MeetingRoomReservationCalendarBlock'
import { MeetingRoomUpdateDialog } from '../components/MeetingRoomUpdateDialog'

// 기본정보 하단 우측의 관리 버튼(정보 수정·활성 토글)을 가시성 좋게 강조하는 공통 크기 클래스
// (사용자 요청: 약 1.3배). Button 기본 크기(h-8/px-2.5/gap-1.5)와 토글의 sm 크기를 이 클래스로
// 동일하게 덮어써 두 버튼의 높이를 맞춘다. twMerge가 각 size 유틸을 정확히 대체한다.
const emphasizedActionClass = 'h-[2.6rem] gap-2 px-3.5 text-[0.9rem] [&_svg:not([class*=size-])]:size-[1.15rem]'

/**
 * P7 회의실 관리 상세 페이지(F813/F815/F816/F814, ROADMAP(MEETING-ROOMS) T7.2-a~c 완성).
 *
 * M2 T2.4-b 공유 read 블록(정보·이미지·예약 캘린더)을 그대로 재사용하고, M6 T6.2가 독립 export한
 * 활성/비활성 토글 버튼(`MeetingRoomActiveToggleButton`)을 배선한다. 토글 버튼은 `isAvailable`
 * 값이 필요해 이 페이지에서도 `useMeetingRoomDetailQuery`를 호출하지만, `MeetingRoomInfoPanel`과
 * 동일 queryKey라 React Query 캐시가 공유되어 중복 요청은 발생하지 않는다.
 *
 * 좌측 컬럼은 기본정보와 안내 이미지를 하나의 Card로 병합해(사용자 요청) 두 섹션이 사이 구분선을
 * 두고 6:4 높이 비율로 나뉜다. 이를 위해 두 공유 컴포넌트에 `unwrapped`(자체 Card 제거) opt-in을
 * 켜고, 관리 액션(정보 수정·활성 토글)은 페이지 헤더가 아니라 기본정보 섹션 하단 우측(InfoPanel의
 * `footerAction`)에 강조 크기로 배치한다.
 *
 * 이미지 업로드(F815)는 `MeetingRoomImageUploadButton`(T7.1 mutation 소비, 페이지 전용)으로,
 * 삭제(F816)는 `MeetingRoomImageGallery`에 `showDeleteAction`을 켜서 위임한다 — 그 컴포넌트는
 * P4(T2.4-b, 일반 열람)와 공유 소비되므로 삭제 버튼이 기본 비노출(opt-in)이어야 P4에 새지 않는다.
 * 미리보기 배치도 같은 이유로 opt-in이다: `variant="slider"`를 켜 좁은 좌측 하단(4fr) 트랙에서
 * 한 번에 1장씩 화살표·인디케이터로 넘기게 하고, P4는 미지정(기본 'grid')이라 종전 그리드 그대로다.
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
    // lg 이상에서 페이지를 main 스크롤 컨테이너 높이(헤더~푸터 사이)에 꽉 채워, 아래 2카드 그리드가
    // 메인 영역 전체 높이를 차지하고 각 카드 내부만 스크롤되게 한다(BoardListPage와 동일한 flex 패턴).
    <div className="flex w-full flex-col gap-5 p-4 sm:p-6 lg:h-full lg:p-8">
      {backLink}
      {/* 관리 액션(정보 수정·활성 토글)은 좌측 병합 카드의 기본정보 섹션 하단 우측으로 옮겼다(사용자
          요청). 페이지 헤더에는 제목만 남긴다. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 관리 상세</h1>
      </div>

      {/* 2카드 4:6 레이아웃(사용자 요청). 좌측(4fr): 기본정보 + 안내 이미지를 하나의 Card로 병합.
          우측(6fr): 기간별 예약 현황 단일 카드. lg 미만에서는 grid-cols-1로 세로 스택된다. lg 이상에서
          그리드가 min-h-0 flex-1로 메인 높이를 채우면, align-content stretch가 단일 행을 그 높이로
          늘려 좌·우 컬럼 높이가 균일해진다. 트랙은 4fr/6fr 대신 minmax(0,·)로 잡아 fr의 암묵 최소값
          (min-content)이 캘린더 등 넓은 콘텐츠에 밀려 가로 오버플로를 내지 않게 한다. */}
      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        {/* 좌측(4fr): 기본정보 + 안내 이미지를 하나의 Card로 병합(사용자 요청 1). Card 자체 패딩/갭을
            제거(py-0/gap-0)해 두 섹션이 맞닿고, 사이 구분선(아래 섹션 border-t)이 카드 폭을 가로지른다
            (요청 2). 두 섹션은 lg에서 6:4 높이 비율(basis-0 grow-[6]/grow-[4])로 나뉜다(요청 3). lg
            미만은 일반 블록 흐름이라 각 섹션이 콘텐츠 높이로 세로 스택된다. min-w-0으로 fr 트랙의 auto
            최소폭 오버플로를 막는다. */}
        <Card className="flex min-w-0 flex-col gap-0 py-0 lg:min-h-0">
          {/* 상단(6fr): 회의실 기본정보. 하단 우측에 정보 수정·활성 토글 버튼을 강조 크기(약 1.3배)로
              배치한다(요청 5). description은 이 섹션의 남는 높이를 채워 구분선까지 늘어난다(요청 6). */}
          <div className="lg:min-h-0 lg:basis-0 lg:grow-[6] lg:overflow-hidden">
            <MeetingRoomInfoPanel
              meetingRoomId={meetingRoomId}
              unwrapped
              footerAction={
                data ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={emphasizedActionClass}
                      onClick={() => setIsUpdateDialogOpen(true)}
                    >
                      <SquarePen />
                      정보 수정
                    </Button>
                    <MeetingRoomActiveToggleButton
                      meetingRoomId={meetingRoomId}
                      isAvailable={data.isAvailable}
                      buttonClassName={emphasizedActionClass}
                    />
                  </>
                ) : null
              }
            />
          </div>
          {/* 하단(4fr): 안내 이미지 슬라이드(폭이 좁아 그리드보다 슬라이드가 적합, variant="slider") +
              이미지 업로드 버튼(섹션 제목 우측에 주입). 위 섹션과 사이 구분선(border-t, 요청 2). 슬라이드
              이미지는 이 섹션 높이에 맞춰 세로를 채우고 센터에 놓인다(요청 4). */}
          <div className="border-t lg:min-h-0 lg:basis-0 lg:grow-[4] lg:overflow-hidden">
            <MeetingRoomImageGallery
              meetingRoomId={meetingRoomId}
              unwrapped
              showDeleteAction
              variant="slider"
              headerAction={data ? <MeetingRoomImageUploadButton meetingRoomId={meetingRoomId} /> : null}
            />
          </div>
        </Card>

        {/* 우측(6fr): 기간별 예약 현황. 자체 Card라 그리드 직계 셀로 두어 stretch로 행 전체 높이를
            채운다(좌측 컬럼과 균일). 가로 오버플로는 위 그리드 트랙의 minmax(0,·)가 막는다. */}
        <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />
      </div>

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
