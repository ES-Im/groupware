import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { MeetingReservationUpdatePayload } from '../api/updateMeetingReservationInfo'
import { useUpdateMeetingReservationMutation } from '../api/useUpdateMeetingReservationMutation'
import {
  MeetingRoomSearchAndSelect,
  type ConfirmedMeetingSearchParams,
} from './MeetingRoomSearchAndSelect'
import type { MeetingReservationDetail, MeetingRoomSummary } from '../model/meeting'
import {
  meetingReservationUpdateSchema,
  type MeetingReservationUpdateFormValues,
} from '../model/meetingReservationUpdateSchema'

interface MeetingReservationUpdateDialogProps {
  /** 다이얼로그 열림 상태(제어형, MeetingReservationDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 수정 대상 예약 상세(T4.1 조회 결과) — 프리필 및 변경 여부 diff 기준값으로 쓰인다. */
  detail: MeetingReservationDetail
}

/**
 * 변경된 필드만 담아 PATCH 페이로드를 구성한다(T4.2 payload 전 필드 optional 계약을 그대로 활용).
 * 값이 그대로여도 포함해서 보내는 것 자체는 서버가 허용하지만, 굳이 그럴 필요가 없어 diff한다.
 */
function buildUpdatePayload(
  values: MeetingReservationUpdateFormValues,
  detail: MeetingReservationDetail,
): MeetingReservationUpdatePayload {
  const payload: MeetingReservationUpdatePayload = {}
  if (values.title !== undefined && values.title !== detail.title) {
    payload.title = values.title
  }
  if (values.meetingDate !== undefined && values.meetingDate !== detail.meetingDate) {
    payload.meetingDate = values.meetingDate
  }
  if (values.startAt !== undefined && values.startAt !== detail.startAt) {
    payload.startAt = values.startAt
  }
  if (values.endAt !== undefined && values.endAt !== detail.endAt) {
    payload.endAt = values.endAt
  }
  if (values.meetingRoomId !== undefined && values.meetingRoomId !== detail.meetingRoomId) {
    payload.meetingRoomId = values.meetingRoomId
  }
  return payload
}

/**
 * 예약 정보 수정 다이얼로그(F804, `MEETING_RESERVATION_UPDATE`, ROADMAP(MEETING-ROOMS) T4.3-b).
 *
 * 회의일/시각/제목은 현재 값으로 프리필된 입력을 그대로 고쳐 제출한다. 회의실 변경은 EMPLOYEE가
 * 접근 가능한 유일한 회의실 소스인 T3.1 검색(`MeetingRoomSearchAndSelect`, T3.3-a)을 그대로
 * 재사용한다 — "회의실 변경" 토글로 검색 패널을 열고, 새 날짜/시각으로 재검색해 회의실을 선택하면
 * 그 확정 검색조건(date/startAt/endAt)이 meetingDate/startAt/endAt 필드에도 함께 동기화된다
 * (MeetingReservationCreatePage의 handleRoomSelected와 동일 패턴 — 회의실은 검색한 시간대에만
 * 유효하므로 시간 필드가 검색 조건과 어긋나지 않게 한다).
 *
 * 검색으로 새 회의실을 선택한 뒤 재검색하거나 "회의실 변경 취소"를 누르면, 그 선택 때 함께
 * 동기화됐던 날짜/시각도 원래 예약 값으로 되돌린다 — "원래 회의실 + 폐기된 검색의 시간대" 같은
 * 불일치 조합이 남지 않게 한다. 아직 검색에서 회의실을 선택한 적이 없다면(날짜/시각 입력이
 * 사용자가 직접 고친 값일 수 있음) 되돌리지 않는다.
 *
 * 재사용한 `MeetingRoomSearchAndSelect`의 "상세 보기" 버튼(전체 페이지 내비게이션)은 이 다이얼로그
 * 컨텍스트에서 편집 중인 입력을 통째로 폐기하므로 `showRoomDetailLink={false}`로 숨긴다.
 *
 * 성공(204) 시 useUpdateMeetingReservationMutation(T4.2)이 이미 meetingKeys.all을 invalidate하므로
 * 이 컴포넌트는 성공 토스트와 닫기만 담당한다. 서버 위반(기간·소유자 등)은
 * submitWithErrorMapping → handleApiError가 폼 루트 에러/토스트로 매핑한다.
 */
export function MeetingReservationUpdateDialog({ open, onOpenChange, detail }: MeetingReservationUpdateDialogProps) {
  const mutation = useUpdateMeetingReservationMutation()
  const [isChangingRoom, setIsChangingRoom] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomSummary | undefined>(undefined)

  const form = useZodForm(meetingReservationUpdateSchema, {
    defaultValues: { title: '', meetingDate: '', startAt: '', endAt: '', meetingRoomId: undefined },
  })
  const {
    register,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때(open이 false→true로 바뀌는 시점)에만 현재 예약 값으로 채우고, 회의실 변경 토글/선택
  // 상태도 초기화한다. detail을 deps에 넣지 않는 것이 의도적이다 — detail은 detailQuery.data(라이브
  // 서버상태)라, 넣으면 다이얼로그가 열린 채로 상세가 리페치될 때(성공 후 meetingKeys.all
  // invalidate·window-focus 리페치 등)마다 이 effect가 재실행되어 사용자의 편집 중 입력을 reset으로
  // 덮어쓰게 된다. open 전이 시점의 클로저에 담긴 detail만 스냅샷으로 써서 이를 피한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      reset({
        title: detail.title,
        meetingDate: detail.meetingDate,
        startAt: detail.startAt,
        endAt: detail.endAt,
        meetingRoomId: detail.meetingRoomId,
      })
      setIsChangingRoom(false)
      setSelectedRoom(undefined)
    } else {
      reset()
    }
  }, [open])

  function handleRoomSelected(room: MeetingRoomSummary | undefined, confirmed?: ConfirmedMeetingSearchParams) {
    setSelectedRoom(room)
    if (room && confirmed) {
      setValue('meetingRoomId', room.meetingRoomId, { shouldValidate: true })
      setValue('meetingDate', confirmed.date, { shouldValidate: true })
      setValue('startAt', confirmed.startAt, { shouldValidate: true })
      setValue('endAt', confirmed.endAt, { shouldValidate: true })
    } else {
      // 재검색으로 선택이 해제되면(onRoomSelected(undefined)) 회의실뿐 아니라 날짜/시각도
      // 원래 예약 값으로 되돌린다 — 그렇지 않으면 "원래 회의실 + 폐기된 검색의 시간대" 같은
      // 불일치 조합이 그대로 제출될 수 있다.
      setValue('meetingRoomId', detail.meetingRoomId, { shouldValidate: true })
      setValue('meetingDate', detail.meetingDate, { shouldValidate: true })
      setValue('startAt', detail.startAt, { shouldValidate: true })
      setValue('endAt', detail.endAt, { shouldValidate: true })
    }
  }

  function handleToggleRoomChange() {
    if (isChangingRoom) {
      // 검색으로 새 회의실을 선택한 상태에서 "회의실 변경 취소"를 누르면, 그 선택 때 함께
      // 동기화됐던 날짜/시각도 원래 예약 값으로 되돌린다(위 handleRoomSelected의 해제 분기와
      // 동일 이유). 아직 검색에서 아무 회의실도 선택하지 않았다면(selectedRoom === undefined)
      // 날짜/시각 입력은 사용자가 직접 고친 값일 수 있으므로 건드리지 않는다.
      if (selectedRoom) {
        setValue('meetingDate', detail.meetingDate, { shouldValidate: true })
        setValue('startAt', detail.startAt, { shouldValidate: true })
        setValue('endAt', detail.endAt, { shouldValidate: true })
      }
      setSelectedRoom(undefined)
      setValue('meetingRoomId', detail.meetingRoomId)
    }
    setIsChangingRoom((prev) => !prev)
  }

  async function handleSubmit(values: MeetingReservationUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ meetingId: detail.meetingId, payload })
    toast.success('예약 정보를 수정했습니다')
    onOpenChange(false)
  }

  // 제출 중에는 Esc·오버레이 클릭·닫기 버튼 전부 무시(UpdateAttendanceDialog와 동일 이유 —
  // 뒤늦게 도착하는 서버 위반 실패가 삼켜지지 않도록 한다).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>예약 정보 수정</DialogTitle>
          <DialogDescription>회의일·시각·제목을 고치거나 회의실을 변경합니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-update-title">회의 제목</Label>
            <Input id="meeting-update-title" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-date">회의일</Label>
              <Input id="meeting-update-date" type="date" aria-invalid={!!errors.meetingDate} {...register('meetingDate')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-start">시작 시각</Label>
              <Input id="meeting-update-start" type="time" aria-invalid={!!errors.startAt} {...register('startAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-end">종료 시각</Label>
              <Input id="meeting-update-end" type="time" aria-invalid={!!errors.endAt} {...register('endAt')} />
            </div>
          </div>
          {(errors.meetingDate ?? errors.startAt ?? errors.endAt) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.meetingDate?.message ?? errors.startAt?.message ?? errors.endAt?.message}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">
                회의실 <span className="text-muted-foreground">{detail.meetingRoomName}</span>
                {selectedRoom && (
                  <span className="text-foreground"> → {selectedRoom.name}(으)로 변경 예정</span>
                )}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleToggleRoomChange}>
                {isChangingRoom ? '회의실 변경 취소' : '회의실 변경'}
              </Button>
            </div>
            {isChangingRoom && (
              <MeetingRoomSearchAndSelect onRoomSelected={handleRoomSelected} showRoomDetailLink={false} />
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
