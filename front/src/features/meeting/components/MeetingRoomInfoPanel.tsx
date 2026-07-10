import { useEffect } from 'react'
import { toast } from 'sonner'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeetingRoomDetailQuery } from '../api/useMeetingRoomDetailQuery'

interface MeetingRoomInfoPanelProps {
  meetingRoomId: number
}

/**
 * 회의실 정보 공유 컴포넌트(ROADMAP(MEETING-ROOMS) T2.4-a, F807).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 로딩/에러/not-found 상태를 자체 보유하므로 상위 페이지의 상태에 결합되지 않는다.
 * not-found/에러 분기는 board `BoardDetailView`의 컨벤션을 그대로 따른다.
 */
export function MeetingRoomInfoPanel({ meetingRoomId }: MeetingRoomInfoPanelProps) {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>회의실 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const apiError = normalizeApiError(error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>회의실 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isNotFound(apiError) ? '회의실을 찾을 수 없습니다.' : '회의실 정보를 불러오지 못했습니다.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드.
  if (!data) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{data.name}</CardTitle>
          <Badge variant={data.isAvailable ? 'secondary' : 'outline'}>
            {data.isAvailable ? '사용 가능' : '비활성'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="whitespace-pre-wrap text-muted-foreground">{data.description}</p>
        <p>수용 인원 {data.capacity}명</p>
      </CardContent>
    </Card>
  )
}
