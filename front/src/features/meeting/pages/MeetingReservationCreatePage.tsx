import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { EmployeeSelectField } from '@/features/approval/components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useCreateMeetingReservationMutation } from '../api/useCreateMeetingReservationMutation'
import {
  MeetingRoomSearchAndSelect,
  type ConfirmedMeetingSearchParams,
} from '../components/MeetingRoomSearchAndSelect'
import type { MeetingRoomSummary } from '../model/meeting'
import {
  meetingReservationCreateSchema,
  type MeetingReservationCreateFormValues,
} from '../model/meetingReservationCreateSchema'

/**
 * P2 회의 예약 생성 페이지(F802+F803, ROADMAP(MEETING-ROOMS) T3.3-b, 리프).
 *
 * T3.3-a(`MeetingRoomSearchAndSelect`)가 검색·카드선택·상세보기 내비게이션을 자체 관리하고,
 * 카드 선택 시 회의실 + 확정 검색조건(date/startAt/endAt)을 이 페이지로 넘긴다. 이 값을
 * meetingReservationCreateSchema의 meetingDate/startAt/endAt 필드에 setValue로 동기화해,
 * "회의 시작은 현재 이후"·"종료>시작" 교차검증을 폼 제출 시 그대로 재사용한다(수동 재구현 없음).
 *
 * meetingRoomId·reserverId는 스키마 밖의 값이다(T3.2 설계 경계) — meetingRoomId는 선택된 회의실
 * 카드에서, reserverId는 useMeQuery empId에서 각각 얻어 제출 시점에 payload로 합류시킨다.
 * reserverId가 로딩 전/부재(undefined)면 PRD·ROADMAP 확정대로 fail-closed 처리해 제출 버튼을
 * 비활성화한다. 참여자 수가 선택 회의실 capacity를 넘는 경우는 서버가 강제하지 않으므로(Open Q#6)
 * 인라인 경고만 표시하고 제출을 막지 않는다.
 *
 * 라우팅은 M8에서 배선되므로 이 페이지는 직접 URL(`/meetings/new`)로만 검증한다.
 */
export function MeetingReservationCreatePage() {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const mutation = useCreateMeetingReservationMutation()

  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomSummary | undefined>(undefined)
  const [participantSelection, setParticipantSelection] = useState<EmployeePickerEmployee[]>([])
  // 참여자 필드를 한 번도 건드리지 않은 상태(마운트 시 빈 배열)에서는 동기화 effect가 검증까지
  // 트리거하지 않게 한다 — 그렇지 않으면 사용자가 손대기도 전에 "참여자 필수" 에러가 노출된다.
  const [participantsTouched, setParticipantsTouched] = useState(false)

  const form = useZodForm(meetingReservationCreateSchema, {
    defaultValues: { title: '', meetingDate: '', startAt: '', endAt: '', participantIds: [] },
  })
  const {
    register,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  function handleRoomSelected(room: MeetingRoomSummary | undefined, confirmed?: ConfirmedMeetingSearchParams) {
    setSelectedRoom(room)
    setValue('meetingDate', confirmed?.date ?? '', { shouldValidate: true })
    setValue('startAt', confirmed?.startAt ?? '', { shouldValidate: true })
    setValue('endAt', confirmed?.endAt ?? '', { shouldValidate: true })
    if (room) {
      clearErrors('root')
    }
  }

  // 참여자 선택(EmployeePicker 로컬 상태, 결재선/공람과 동일 경계)을 zod participantIds 필드에
  // 동기화한다 — "빈 배열 불가" 검증을 스키마가 그대로 담당하게 하기 위함이다. 아직 한 번도
  // 상호작용하지 않은 초기 빈 배열 동기화는 검증을 트리거하지 않는다(participantsTouched 가드).
  useEffect(() => {
    setValue(
      'participantIds',
      participantSelection.map((emp) => emp.empId),
      { shouldValidate: participantsTouched },
    )
  }, [participantSelection, participantsTouched, setValue])

  function handleParticipantsChange(next: EmployeePickerEmployee[]) {
    setParticipantsTouched(true)
    setParticipantSelection(next)
  }

  const reserverId = meQuery.data?.empBasicInfo.empId
  const isOverCapacity = selectedRoom !== undefined && participantSelection.length > selectedRoom.capacity
  const canSubmit = selectedRoom !== undefined && reserverId !== undefined

  async function onValid(values: MeetingReservationCreateFormValues) {
    if (!selectedRoom) {
      setError('root', { message: '회의실을 먼저 선택해주세요' })
      return
    }
    if (reserverId === undefined) {
      setError('root', { message: '본인 정보를 확인할 수 없어 예약할 수 없습니다' })
      return
    }

    await mutation.mutateAsync({
      meetingRoomId: selectedRoom.meetingRoomId,
      reserverId,
      title: values.title,
      meetingDate: values.meetingDate,
      startAt: values.startAt,
      endAt: values.endAt,
      participantIds: values.participantIds,
    })
    toast.success('회의를 예약했습니다')
    navigate('/meetings')
  }

  const handleSubmit = submitWithErrorMapping(form, onValid)

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold tracking-tight">회의 예약</h1>

      <Card>
        <CardHeader>
          <CardTitle>회의실 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingRoomSearchAndSelect onRoomSelected={handleRoomSelected} />
        </CardContent>
      </Card>

      {selectedRoom ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedRoom.name} 예약</CardTitle>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {form.getValues('meetingDate')} {form.getValues('startAt')}~{form.getValues('endAt')} · 수용 인원{' '}
                {selectedRoom.capacity}명
              </p>

              {(errors.meetingDate ?? errors.startAt ?? errors.endAt) && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.meetingDate?.message ?? errors.startAt?.message ?? errors.endAt?.message}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meeting-reservation-title">
                  회의 제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-reservation-title"
                  placeholder="회의 제목을 입력해주세요"
                  aria-invalid={!!errors.title}
                  {...register('title')}
                />
                {errors.title && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <EmployeeSelectField
                  label="참여자"
                  description="회의에 참여할 사원을 선택합니다(예약자 본인은 자동 포함되지 않습니다)."
                  emptyText="선택된 참여자가 없습니다."
                  selected={participantSelection}
                  onChange={handleParticipantsChange}
                />
                {errors.participantIds && (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">
                    {errors.participantIds.message}
                  </p>
                )}
                {isOverCapacity && (
                  <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-500">
                    참여자 수({participantSelection.length}명)가 회의실 수용 인원({selectedRoom.capacity}명)을
                    초과했습니다.
                  </p>
                )}
              </div>

              {errors.root && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/meetings')}>
                  취소
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  예약
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">회의실을 선택하면 제목·참여자를 입력할 수 있습니다.</p>
      )}
    </div>
  )
}
