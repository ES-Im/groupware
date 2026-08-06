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
  unwrapped?: boolean
  footerAction?: ReactNode
}

export function MeetingRoomInfoPanel({ meetingRoomId, unwrapped = false, footerAction }: MeetingRoomInfoPanelProps) {
  const { data, error, isLoading } = useMeetingRoomDetailQuery(meetingRoomId)

  useEffect(() => {
    if (!error) {
      return
    }
    const apiError = normalizeApiError(error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [error])

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
      <p
        className={cn(
          'border-t pt-5 text-base leading-7 whitespace-pre-wrap text-foreground',
          unwrapped && 'min-h-0 flex-1 overflow-y-auto',
        )}
      >
        {data.description}
      </p>
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
