import { useEffect, type ReactNode } from 'react'
import { DoorOpen, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingRoomDetailQuery } from '../api/useMeetingRoomDetailQuery'
import { StatusPill } from './meetingUiKit'

interface MeetingRoomInfoPanelProps {
  meetingRoomId: number
  /**
   * 카드 래퍼 없이 내용만 렌더한다(기본 false). P7(관리 상세)이 정보·안내 이미지를 하나의 Card로
   * 병합하기 위해(사용자 요청) 이 패널을 그 카드 안의 한 섹션으로 끼워 넣을 때 켠다 — 켜면 자체
   * `<Card>` 대신 세로 flex 컨테이너로 렌더되어 부모가 준 높이를 채우고, description이 남는 세로
   * 공간을 flex로 확장한다. 미지정(P4 열람)은 종전대로 독립 Card 그대로다.
   */
  unwrapped?: boolean
  /**
   * 기본정보 섹션 하단 우측에 렌더할 액션(기본 없음). P7이 "정보 수정"·활성 토글 버튼을 여기에
   * 배치하기 위해 주입한다(사용자 요청). `unwrapped`와 함께 쓰며, 미지정(P4)은 비노출이다.
   */
  footerAction?: ReactNode
}

/**
 * 회의실 정보 공유 컴포넌트(ROADMAP(MEETING-ROOMS) T2.4-a, F807).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 로딩/에러/not-found 상태를 자체 보유하므로 상위 페이지의 상태에 결합되지 않는다.
 * not-found/에러 분기는 board `BoardDetailView`의 컨벤션을 그대로 따른다.
 *
 * `unwrapped`(P7 병합 카드용)이면 자체 Card 없이 내부 패딩만 가진 세로 flex 섹션으로 렌더한다.
 */
export function MeetingRoomInfoPanel({ meetingRoomId, unwrapped = false, footerAction }: MeetingRoomInfoPanelProps) {
  const { data, error, isLoading } = useMeetingRoomDetailQuery(meetingRoomId)

  // not-found는 카드 본문에서 전용 문구로 안내하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!error) {
      return
    }
    const apiError = normalizeApiError(error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [error])

  // 로딩/에러/not-found 상태 메시지. unwrapped면 이중 카드를 피해 내부 패딩만 가진 섹션으로 감싼다.
  function renderState(message: string) {
    if (unwrapped) {
      return <div className="px-(--card-spacing) py-(--card-spacing) text-sm text-muted-foreground">{message}</div>
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>회의실 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return renderState('불러오는 중...')
  }

  if (error) {
    const apiError = normalizeApiError(error)
    return renderState(isNotFound(apiError) ? '회의실을 찾을 수 없습니다.' : '회의실 정보를 불러오지 못했습니다.')
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드.
  if (!data) {
    return null
  }

  const infoBody = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DoorOpen className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">회의실</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">{data.name}</h2>
          </div>
        </div>
        <StatusPill tone={data.isAvailable ? 'green' : 'slate'}>
          {data.isAvailable ? '사용 가능' : '비활성'}
        </StatusPill>
      </div>
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Users className="size-4 text-muted-foreground" />
        수용 인원 {data.capacity}명
      </p>
      {/* unwrapped(P7)에서는 description이 남는 세로 공간을 채워 안내 이미지 구분선까지 늘어난다
          (사용자 요청) — 넘치면 이 문단 안에서만 스크롤한다. P4는 종전대로 콘텐츠 높이만 차지한다. */}
      <p
        className={cn(
          'border-t pt-5 text-base leading-7 whitespace-pre-wrap text-foreground',
          unwrapped && 'min-h-0 flex-1 overflow-y-auto',
        )}
      >
        {data.description}
      </p>
      {/* 기본정보 하단 우측 액션(P7: 정보 수정·활성 토글). unwrapped와 함께만 쓰인다. */}
      {footerAction ? <div className="flex flex-wrap items-center justify-end gap-2">{footerAction}</div> : null}
    </>
  )

  if (unwrapped) {
    return <div className="flex h-full flex-col gap-5 px-(--card-spacing) py-(--card-spacing)">{infoBody}</div>
  }

  return (
    <Card>
      <CardContent className="space-y-5">{infoBody}</CardContent>
    </Card>
  )
}
