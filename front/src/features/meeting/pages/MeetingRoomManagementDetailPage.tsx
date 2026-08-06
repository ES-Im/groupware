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

const emphasizedActionClass = 'h-[2.6rem] gap-2 px-3.5 text-[0.9rem] [&_svg:not([class*=size-])]:size-[1.15rem]'

export function MeetingRoomManagementDetailPage() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const { meetingRoomId: meetingRoomIdParam } = useParams<{ meetingRoomId: string }>()
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
    <div className="flex w-full flex-col gap-5 p-4 sm:p-6 lg:h-full lg:p-8">
      {backLink}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의실 관리 상세</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <Card className="flex min-w-0 flex-col gap-0 py-0 lg:min-h-0">
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
