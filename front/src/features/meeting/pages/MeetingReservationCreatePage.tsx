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
import { MeetingRoomImageGallery } from '../components/MeetingRoomImageGallery'
import { MeetingRoomInfoPanel } from '../components/MeetingRoomInfoPanel'
import {
  MeetingRoomSearchAndSelect,
  type ConfirmedMeetingSearchParams,
} from '../components/MeetingRoomSearchAndSelect'
import type { MeetingRoomSummary } from '../model/meeting'
import {
  meetingReservationCreateSchema,
  type MeetingReservationCreateFormValues,
} from '../model/meetingReservationCreateSchema'

export function MeetingReservationCreatePage() {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const mutation = useCreateMeetingReservationMutation()

  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomSummary | undefined>(undefined)
  const [participantSelection, setParticipantSelection] = useState<EmployeePickerEmployee[]>([])
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
    setValue('meetingDate', confirmed?.date ?? '')
    setValue('startAt', confirmed?.startAt ?? '')
    setValue('endAt', confirmed?.endAt ?? '')
    if (room) {
      clearErrors('root')
    }
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">회의 예약</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          날짜·시간·인원으로 예약 가능한 회의실을 찾아 예약하세요
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>회의실 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingRoomSearchAndSelect onRoomSelected={handleRoomSelected} />
        </CardContent>
      </Card>

      {selectedRoom ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <MeetingRoomInfoPanel meetingRoomId={selectedRoom.meetingRoomId} />
            <MeetingRoomImageGallery meetingRoomId={selectedRoom.meetingRoomId} />
          </div>

          <Card className="h-fit">
            <CardHeader className="border-b">
              <CardTitle>예약 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
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

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">
                    신청 일시 <span className="text-destructive">*</span>
                  </span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="meeting-reservation-date" className="text-xs text-muted-foreground">
                        신청 날짜
                      </Label>
                      <Input
                        id="meeting-reservation-date"
                        type="date"
                        aria-invalid={!!errors.meetingDate}
                        {...register('meetingDate')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="meeting-reservation-start" className="text-xs text-muted-foreground">
                        예약 시작 시각
                      </Label>
                      <Input
                        id="meeting-reservation-start"
                        type="time"
                        aria-invalid={!!errors.startAt}
                        {...register('startAt')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="meeting-reservation-end" className="text-xs text-muted-foreground">
                        예약 종료 시각
                      </Label>
                      <Input
                        id="meeting-reservation-end"
                        type="time"
                        aria-invalid={!!errors.endAt}
                        {...register('endAt')}
                      />
                    </div>
                  </div>
                  {(errors.meetingDate ?? errors.startAt ?? errors.endAt) && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.meetingDate?.message ?? errors.startAt?.message ?? errors.endAt?.message}
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

                <div className="flex justify-end gap-2 border-t pt-5">
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">회의실을 선택하면 예약 정보를 입력할 수 있습니다.</p>
      )}
    </div>
  )
}
