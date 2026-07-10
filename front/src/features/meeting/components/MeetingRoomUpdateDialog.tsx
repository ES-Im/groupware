import { useEffect } from 'react'
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
import { Textarea } from '@/shared/ui/textarea'
import type { UpdateMeetingRoomPayload } from '../api/updateMeetingRoom'
import { useMeetingRoomUpdateMutation } from '../api/useMeetingRoomUpdateMutation'
import type { MeetingRoomDetail } from '../model/meeting'
import { meetingRoomUpdateSchema, type MeetingRoomUpdateFormValues } from '../model/meetingRoomUpdateSchema'

interface MeetingRoomUpdateDialogProps {
  /** 다이얼로그 열림 상태(제어형, MeetingRoomManagementDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingRoomId: number
  /** 프리필 기준값(현재 회의실 상세, T2.1 useMeetingRoomDetailQuery 재사용). */
  detail: MeetingRoomDetail
}

/**
 * 변경된 필드만 담아 PATCH 페이로드를 구성한다(MeetingReservationUpdateDialog의
 * buildUpdatePayload와 동일 패턴 — 값이 그대로여도 포함해서 보내는 것 자체는 서버가 허용하지만
 * 굳이 그럴 필요가 없어 diff한다). 아무 필드도 바뀌지 않으면 빈 payload가 되고, 그대로 제출되어
 * 서버의 "변경값 없음" 거부가 submitWithErrorMapping을 통해 토스트로 노출된다.
 */
function buildUpdatePayload(
  values: MeetingRoomUpdateFormValues,
  detail: MeetingRoomDetail,
): UpdateMeetingRoomPayload {
  const payload: UpdateMeetingRoomPayload = {}
  if (values.name !== undefined && values.name !== detail.name) {
    payload.name = values.name
  }
  if (values.description !== undefined && values.description !== detail.description) {
    payload.description = values.description
  }
  if (values.capacity !== undefined && values.capacity !== detail.capacity) {
    payload.capacity = values.capacity
  }
  return payload
}

/**
 * 회의실 정보 수정 다이얼로그(F813, `MEETING_ROOM_UPDATE`, ROADMAP(MEETING-ROOMS) T7.2-b).
 *
 * 이름/설명/수용인원 전부 부분 수정(optional) — 열릴 때 현재 상세값으로 프리필해 사용자가 바꾸고
 * 싶은 필드만 고치게 하고, 제출 시 buildUpdatePayload로 변경된 필드만 골라 보낸다.
 * capacity는 meetingRoomUpdateSchema JSDoc 지침대로 `register(..., { valueAsNumber: true })`가
 * 아니라 `setValueAs`로 빈 문자열을 undefined로 변환한다 — valueAsNumber는 빈 입력을 NaN으로
 * 방출해 "변경 안 함" 의도가 zod 검증에서 막힌다.
 *
 * 성공(204) 시 useMeetingRoomUpdateMutation(T7.1)이 이미 상세/파일목록/관리목록을 invalidate하므로
 * 이 컴포넌트는 성공 토스트 + 다이얼로그 닫기만 담당한다. 서버 위반(이름 중복, 변경값 없음 등)은
 * submitWithErrorMapping → handleApiError가 폼 루트 에러/토스트로 매핑한다.
 */
export function MeetingRoomUpdateDialog({ open, onOpenChange, meetingRoomId, detail }: MeetingRoomUpdateDialogProps) {
  const mutation = useMeetingRoomUpdateMutation()
  const form = useZodForm(meetingRoomUpdateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 현재 상세값으로 프리필하고, 닫힐 때는 다음 오픈에 이전 입력값/에러가 남지 않도록
  // 리셋한다(MeetingRoomCreateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
  useEffect(() => {
    if (open) {
      reset({ name: detail.name, description: detail.description, capacity: detail.capacity })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  async function handleSubmit(values: MeetingRoomUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ meetingRoomId, payload })
    toast.success('회의실 정보를 수정했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (MeetingRoomCreateDialog와 동일 이유 — 그 사이 닫히면 폼이 reset()되어 뒤늦게 도착하는
  // 수정 실패가 삼켜진다).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회의실 정보 수정</DialogTitle>
          <DialogDescription>바꾸고 싶은 항목만 고쳐 저장합니다. 변경한 값이 없으면 저장할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-name">이름</Label>
            <Input
              id="meeting-room-update-name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-description">설명</Label>
            <Textarea
              id="meeting-room-update-description"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-capacity">수용 인원</Label>
            <Input
              id="meeting-room-update-capacity"
              type="number"
              min={1}
              step={1}
              aria-invalid={!!errors.capacity}
              {...register('capacity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            {errors.capacity && (
              <p role="alert" className="text-sm text-destructive">
                {errors.capacity.message}
              </p>
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
