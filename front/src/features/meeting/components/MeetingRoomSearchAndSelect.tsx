import { useEffect, useState, type FormEvent } from 'react'
import { DoorOpen, Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAvailableMeetingRoomsQuery } from '../api/useAvailableMeetingRoomsQuery'
import { CapacityLabel, StatusPill } from './meetingUiKit'
import type { MeetingRoomSummary } from '../model/meeting'

interface ConfirmedSearchParams {
  date?: string
  startAt?: string
  endAt?: string
  capacity?: number
}

export interface ConfirmedMeetingSearchParams {
  date: string
  startAt: string
  endAt: string
}

interface MeetingRoomSearchAndSelectProps {
  onRoomSelected?: (room: MeetingRoomSummary | undefined, confirmedParams?: ConfirmedMeetingSearchParams) => void
  showRoomDetailLink?: boolean
}

export function MeetingRoomSearchAndSelect({
  onRoomSelected,
  showRoomDetailLink = true,
}: MeetingRoomSearchAndSelectProps) {
  const navigate = useNavigate()

  const [date, setDate] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [capacityInput, setCapacityInput] = useState('')
  const [confirmedParams, setConfirmedParams] = useState<ConfirmedSearchParams>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  const availableRoomsQuery = useAvailableMeetingRoomsQuery(
    {
      date: confirmedParams.date,
      startAt: confirmedParams.startAt,
      endAt: confirmedParams.endAt,
      capacity: confirmedParams.capacity,
      page,
      size,
    },
    { enabled: hasSearched },
  )

  useEffect(() => {
    if (!availableRoomsQuery.error) {
      return
    }
    toast.error(normalizeApiError(availableRoomsQuery.error).message)
  }, [availableRoomsQuery.error])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (startAt !== '' && endAt !== '' && endAt <= startAt) {
      toast.error('종료 시각은 시작 시각보다 이후여야 합니다')
      return
    }
    const trimmedCapacity = capacityInput.trim()
    setConfirmedParams({
      date: date || undefined,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
      capacity: trimmedCapacity === '' ? undefined : Number(trimmedCapacity),
    })
    setHasSearched(true)
    setSelectedRoomId(undefined)
    onRoomSelected?.(undefined)
    resetPage()
  }

  function handleSelectRoom(room: MeetingRoomSummary) {
    setSelectedRoomId(room.meetingRoomId)
    const { date, startAt: confirmedStartAt, endAt: confirmedEndAt } = confirmedParams
    if (date !== undefined && confirmedStartAt !== undefined && confirmedEndAt !== undefined) {
      onRoomSelected?.(room, { date, startAt: confirmedStartAt, endAt: confirmedEndAt })
    } else {
      onRoomSelected?.(room)
    }
  }

  const pageInfo: PageMeta = availableRoomsQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const summaryParts: string[] = []
  if (confirmedParams.date) {
    summaryParts.push(
      confirmedParams.startAt && confirmedParams.endAt
        ? `${confirmedParams.date} ${confirmedParams.startAt}~${confirmedParams.endAt}`
        : confirmedParams.date,
    )
  }
  if (confirmedParams.capacity != null) {
    summaryParts.push(`${confirmedParams.capacity}명 이상`)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="meeting-search-date">날짜</Label>
          <Input
            id="meeting-search-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting-search-start">시작 시각</Label>
          <Input
            id="meeting-search-start"
            type="time"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting-search-end">종료 시각</Label>
          <Input
            id="meeting-search-end"
            type="time"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting-search-capacity">최소 수용인원</Label>
          <Input
            id="meeting-search-capacity"
            type="number"
            min={0}
            value={capacityInput}
            onChange={(event) => setCapacityInput(event.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit">
            <Search />
            회의실 검색
          </Button>
        </div>
      </form>

      {!hasSearched ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          검색 조건을 입력하고 검색해 주세요.
        </p>
      ) : availableRoomsQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : availableRoomsQuery.error ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          회의실 목록을 불러오지 못했습니다.
        </p>
      ) : availableRoomsQuery.data && availableRoomsQuery.data.content.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          조건에 맞는 회의실이 없습니다.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {summaryParts.length > 0 ? `${summaryParts.join(' · ')} · ` : ''}예약 가능 회의실{' '}
            <b className="font-semibold text-primary">{pageInfo.totalElements}곳</b>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableRoomsQuery.data?.content.map((room) => {
              const selected = selectedRoomId === room.meetingRoomId
              return (
                <div
                  key={room.meetingRoomId}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-colors',
                    selected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DoorOpen className="size-4" />
                    </span>
                    <StatusPill tone="green">예약 가능</StatusPill>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectRoom(room)}
                    className="mt-4 block text-left text-[15px] font-bold text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    {room.name}
                  </button>
                  <div className="mt-1.5">
                    <CapacityLabel value={room.capacity} />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRoom(room)}
                      className={cn(
                        'flex-1 rounded-full py-2 text-sm font-semibold transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary hover:bg-primary/20',
                      )}
                    >
                      {selected ? '선택됨' : '선택'}
                    </button>
                    {showRoomDetailLink && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/meeting-rooms/${room.meetingRoomId}`)}
                      >
                        상세 보기
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <PaginationControls pageInfo={pageInfo} page={page} onPageChange={onPageChange} unit="개" />
        </>
      )}
    </div>
  )
}
