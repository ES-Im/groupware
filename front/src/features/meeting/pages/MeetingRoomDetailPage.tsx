import { ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Card } from '@/shared/ui/card'
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import { MeetingRoomReservationCalendarBlock } from '../components/MeetingRoomReservationCalendarBlock'

export function MeetingRoomDetailPage() {
  const { meetingRoomId: meetingRoomIdParam } = useParams<{ meetingRoomId: string }>()
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
    <div className="flex w-full flex-col gap-5 p-4 sm:p-6 lg:h-full lg:p-8">
      {backLink}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 상세</h1>

      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <Card className="flex min-w-0 flex-col gap-0 py-0 lg:min-h-0">
          <div className="lg:min-h-0 lg:basis-0 lg:grow-[6] lg:overflow-hidden">
            <MeetingRoomInfoPanel meetingRoomId={meetingRoomId} unwrapped />
          </div>
          <div className="border-t lg:min-h-0 lg:basis-0 lg:grow-[4] lg:overflow-hidden">
            <MeetingRoomImageGallery meetingRoomId={meetingRoomId} unwrapped variant="slider" />
          </div>
        </Card>

        <MeetingRoomReservationCalendarBlock meetingRoomId={meetingRoomId} />
      </div>
    </div>
  )
}
