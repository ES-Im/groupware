import { useEffect, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAvailableMeetingRoomsQuery } from '../api/useAvailableMeetingRoomsQuery'
import type { MeetingRoomSummary } from '../model/meeting'

interface ConfirmedSearchParams {
  date?: string
  startAt?: string
  endAt?: string
  capacity?: number
}

/**
 * 카드 선택 시점에 확정돼 있던 검색 조건 중 예약 생성(T3.3-b)이 그대로 재사용할 3개
 * (meetingDate/startAt/endAt과 1:1 대응). capacity는 payload 필드가 아니라(참여자 수 경고에만
 * 쓰임) 포함하지 않는다.
 */
export interface ConfirmedMeetingSearchParams {
  date: string
  startAt: string
  endAt: string
}

interface MeetingRoomSearchAndSelectProps {
  /**
   * 카드 선택 시 상위(T3.3-b)에 선택된 회의실 + 그 시점의 확정 검색 조건(date/startAt/endAt)을
   * 전달하는 콜백. 확정 검색 조건은 예약 생성 payload의 meetingDate/startAt/endAt으로 그대로
   * 이어진다. 새 검색으로 목록이 바뀌어 이전 선택이 더 이상 유효하지 않을 때는 `(undefined)`를
   * 전달해 상위가 선택 해제를 인지하게 한다(그렇지 않으면 새 검색 결과에 없는 stale 회의실이
   * 그대로 제출될 위험이 있다).
   */
  onRoomSelected?: (room: MeetingRoomSummary | undefined, confirmedParams?: ConfirmedMeetingSearchParams) => void
  /**
   * 회의실 카드의 "상세 보기" 버튼(회의실 상세 페이지로 전체 페이지 내비게이션) 노출 여부.
   * 기본값 true(원래 전체 페이지 사용처인 예약 생성 화면의 동작 유지). 다이얼로그 등 모달
   * 컨텍스트에 임베드될 때는 이 내비게이션이 다이얼로그를 통째로 언마운트해 편집 중인 입력을
   * 경고 없이 폐기하므로, 그런 사용처는 `false`로 숨긴다(예: MeetingReservationUpdateDialog).
   */
  showRoomDetailLink?: boolean
}

/**
 * 예약 가능 회의실 검색 폼 + 카드 목록 + 선택 상태 관리(ROADMAP(MEETING-ROOMS) T3.3-a, F802).
 *
 * 페이지(`MeetingReservationCreatePage`, T3.3-b가 조립) 전용 상태에 결합되지 않는 독립 조각이다.
 * 검색 조건은 폼 제출 시에만 확정해 T3.1 훅에 반영한다(입력 중 매 타이핑마다 조회하지 않음).
 * 카드 클릭 시 선택 상태(`selectedRoomId`)를 자체 보유해 하이라이트하고, 동시에
 * `onRoomSelected` 콜백으로 상위에 선택된 회의실 전체를 전달한다.
 */
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
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined)
  const { page, size, onPageChange, resetPage } = usePageState()

  const availableRoomsQuery = useAvailableMeetingRoomsQuery({
    date: confirmedParams.date,
    startAt: confirmedParams.startAt,
    endAt: confirmedParams.endAt,
    capacity: confirmedParams.capacity,
    page,
    size,
  })

  useEffect(() => {
    if (!availableRoomsQuery.error) {
      return
    }
    toast.error(normalizeApiError(availableRoomsQuery.error).message)
  }, [availableRoomsQuery.error])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // startAt/endAt은 HH:mm 문자열이라 사전순 비교가 시각 순서 비교와 동일하다.
    if (startAt !== '' && endAt !== '' && endAt <= startAt) {
      toast.error('종료 시각은 시작 시각보다 이후여야 합니다')
      return
    }
    // capacity는 빈 문자열이면 Number('')=0·지운 뒤 valueAsNumber가 NaN이 될 수 있어, 빈 값은
    // 반드시 undefined로 정규화한다(0 자체는 유효한 최소 수용인원 입력이라 falsy 취급하지 않는다).
    const trimmedCapacity = capacityInput.trim()
    setConfirmedParams({
      date: date || undefined,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
      capacity: trimmedCapacity === '' ? undefined : Number(trimmedCapacity),
    })
    // 새 검색으로 목록이 바뀌면 이전 선택은 더 이상 유효하지 않으므로, 내부 하이라이트뿐 아니라
    // 상위에도 선택 해제를 알려 stale 회의실이 제출되지 않게 한다.
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

  const hasSearched = confirmedParams.date !== undefined

  const pageInfo: PageMeta = availableRoomsQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
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
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting-search-start">시작 시각</Label>
          <Input
            id="meeting-search-start"
            type="time"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="meeting-search-end">종료 시각</Label>
          <Input
            id="meeting-search-end"
            type="time"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            required
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
            required
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableRoomsQuery.data?.content.map((room) => (
              <Card
                key={room.meetingRoomId}
                className={cn(selectedRoomId === room.meetingRoomId && 'ring-2 ring-primary')}
              >
                {/* 선택 트리거는 실제 <button>으로 둬 키보드 접근성을 브라우저 기본 동작에 맡긴다.
                    "상세 보기" 버튼은 이 button 밖의 형제 요소라 인터랙티브 요소 중첩이 없다. */}
                <button type="button" onClick={() => handleSelectRoom(room)} className="w-full text-left">
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                </button>
                <CardContent className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">수용 인원 {room.capacity}명</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls pageInfo={pageInfo} page={page} onPageChange={onPageChange} unit="개" />
        </>
      )}
    </div>
  )
}
