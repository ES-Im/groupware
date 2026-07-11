import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Textarea } from '@/shared/ui/textarea'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { useAddScheduleParticipantsMutation } from '../api/useAddScheduleParticipantsMutation'
import { useCancelScheduleMutation } from '../api/useCancelScheduleMutation'
import { useRemoveScheduleParticipantsMutation } from '../api/useRemoveScheduleParticipantsMutation'
import { useScheduleDetailQuery } from '../api/useScheduleDetailQuery'
import { useUpdateManualScheduleMutation } from '../api/useUpdateManualScheduleMutation'
import type { ScheduleDetailResponse, ScheduleScope } from '../lib/scheduleTypes'
import {
  manualScheduleUpdateSchema,
  type ManualScheduleUpdateFormValues,
} from '../model/manualScheduleUpdateSchema'
import { scheduleKeys } from '../model/scheduleKeys'

interface ScheduleDetailDialogProps {
  /** 상세를 조회할 일정 식별자. undefined면 쿼리가 대기(enabled:false)한다. */
  scheduleId: number | undefined
  /** 다이얼로그 열림 상태(제어형, 오픈 트리거 배선은 T2.3 몫). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 일정 상세 다이얼로그(ROADMAP(SCHEDULE) T2.2, `SCHEDULE_DETAIL`, PRD F002/P2).
 *
 * 4개 scheduleType(MANUAL/MEETING/LEAVE/BUSINESS_TRIP) 전부 조회 전용으로 렌더한다.
 * 필드 표시 순서는 §참조 계약 매핑 나열 순서(타입·소유자 부서/이름·제목·내용·날짜·시각·종일/취소여부·
 * 참여자수·참여자목록)를 그대로 따른다. 취소된 일정은 mapScheduleToEvents.ts의 캘린더 표시(opacity-50)와
 * 결을 맞춰 흐림 처리한다.
 *
 * 액션 영역은 MANUAL + isEditable + 미취소일 때만 컨테이너를 노출한다. [수정](T4.3)·[참여자 추가]
 * (T5.2)·[참여자 제외](T5.3)·[일정 취소](T6.2)를 이 파일이 전부 채웠다. diff 충돌을 줄이기 위해
 * 각 기능을 하위 블록(주석 구분)으로 분리해둔다.
 *
 * scope(SINGLE/SERIES) 라디오는 수정·참여자추가·참여자제외·취소 4곳 모두 "이 날짜만"/"동일 일정
 * 전체"로 옵션 문구를 통일한다 — 같은 컨테이너 안에 동시에 여러 RadioGroup이 렌더될 수 있어(T5.2가
 * 실측: 수정 폼을 펼친 채 참여자 추가 섹션도 항상 노출) 옵션 텍스트만으로는 접근성 트리·테스트 쿼리에서
 * 그룹을 구분할 수 없다. `RadioGroup` 자체의 `aria-label`은 그룹 이름만 바꿀 뿐 개별
 * `RadioGroupItem`의 접근성 이름(연결된 `<Label htmlFor>` 텍스트)에는 영향이 없어 이 문제를
 * 해결하지 못한다(1차 시도 후 code-reviewer가 실측으로 확인) — 대신 각 옵션 `Label` 안에
 * `<span className="sr-only">{맥락}: </span>` 접두사를 넣어 **개별 radio의 접근성 이름 자체**를
 * 구분한다(시각적으로는 기존 "이 날짜만"/"동일 일정 전체" 그대로 보임). 후속 T5.3/T6.2도 새
 * RadioGroup을 추가할 때 이 sr-only 접두사 규칙을 따른다.
 */
export function ScheduleDetailDialog({ scheduleId, open, onOpenChange }: ScheduleDetailDialogProps) {
  const { data, isLoading, error } = useScheduleDetailQuery(scheduleId)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // ScheduleCalendarPage(T1.4)와 동일한 handleApiError+toast 패턴 — 조회 실패를 무음으로
  // 삼키지 않고 사용자에게 알린다(빈 다이얼로그만 뜨는 것을 방지).
  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  // 다이얼로그가 닫히면 수정 폼 모드도 초기화한다(다음에 다시 열었을 때 조회 모드부터 시작).
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setIsEditSubmitting(false)
    }
  }, [open])

  const canManage = !!data && data.isEditable && data.scheduleType === 'MANUAL' && !data.isCanceled

  // 인라인 ScheduleEditForm의 isSubmitting은 하위 컴포넌트 소유라 onSubmittingChange로 끌어올린다.
  // 편집 중 제출이 진행 중일 때 Esc/오버레이 클릭/닫기 버튼으로 다이얼로그가 닫히면(→open:false
  // 이펙트가 isEditing을 꺼 폼이 언마운트) 뒤늦게 도착하는 서버 검증 실패(setError('root'))가
  // 사라진 폼에 렌더될 곳이 없어 조용히 삼켜진다 — ScheduleCreateDialog·MeetingReservationUpdateDialog의
  // handleOpenChange(제출 중 닫기 차단) 선례와 동일하게 막는다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isEditing && isEditSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>일정 상세</DialogTitle>
          <DialogDescription className="sr-only">일정의 상세 정보를 표시합니다.</DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

        {data && (
          <div className={cn('flex flex-col gap-4', data.isCanceled && 'opacity-50')}>
            {/* 조회 영역: 타입·소유자(부제) → 제목(강조) → 내용 → 일시/참여자 메타 박스 순으로 위계를 준다.
                텍스트 노드 구조(회귀 테스트 셀렉터)는 그대로 유지하고 감싸는 요소·클래스만 조정한다. */}
            <header className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {data.scheduleType} · {data.ownerDeptName} {data.ownerEmpName}
              </p>
              <h3 className="text-lg font-semibold leading-snug">{data.title}</h3>
            </header>

            <p className="whitespace-pre-wrap text-sm text-muted-foreground empty:hidden">{data.content}</p>

            <dl className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">일시</dt>
                <dd className="text-right">
                  {data.scheduleDate} {data.startAt}~{data.endAt}
                  {data.isAllDay && ' · 종일'}
                  {data.isCanceled && ' · 취소됨'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">참여자</dt>
                <dd>참여자 {data.participantCount}명</dd>
              </div>
            </dl>

            <ul data-testid="schedule-detail-participants" className="flex flex-wrap gap-1.5 text-sm empty:hidden">
              {data.participants.map((participant) => (
                <li
                  key={participant.empId}
                  className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {participant.deptName} {participant.empName}
                </li>
              ))}
            </ul>

            {canManage && (
              <div data-testid="schedule-detail-actions" className="flex flex-col gap-3 border-t pt-4">
                {/* T4.3: 일정 수정 */}
                <section className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">일정 수정</p>
                  {isEditing ? (
                    <ScheduleEditForm
                      detail={data}
                      onCancel={() => setIsEditing(false)}
                      onSuccess={() => setIsEditing(false)}
                      onSubmittingChange={setIsEditSubmitting}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => setIsEditing(true)}
                    >
                      수정
                    </Button>
                  )}
                </section>

                {/* T5.2: 참여자 추가 */}
                <ScheduleParticipantAddSection detail={data} />

                {/* T5.3: 참여자 제외 */}
                <ScheduleParticipantRemoveSection detail={data} />

                {/* T6.2: 일정 취소 */}
                <ScheduleCancelSection detail={data} onCancelled={() => onOpenChange(false)} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ScheduleEditFormProps {
  /** 수정 대상 일정 상세(프리필 기준값). scheduleId는 detail.scheduleId를 그대로 쓴다. */
  detail: ScheduleDetailResponse
  onCancel: () => void
  onSuccess: () => void
  /** RHF isSubmitting을 부모(ScheduleDetailDialog)로 끌어올려 제출 중 다이얼로그 닫힘을 막는 데 쓴다. */
  onSubmittingChange: (isSubmitting: boolean) => void
}

/**
 * 수기 일정 수정 폼(ROADMAP(SCHEDULE) T4.3, `MANUAL_SCHEDULE_UPDATE`).
 *
 * request-fields.adoc 실측대로 title/content/startAt/endAt 전부 optional이지만, 조회 값으로
 * 프리필해 그대로 제출한다 — MeetingReservationUpdateDialog(buildUpdatePayload로 변경분만 diff)와
 * 달리 diff 페이로드를 만들지 않는다. scope=SERIES에서는 변경 없는 필드도 시리즈 전체에 그대로
 * 재적용되는 편이 "동일 일정 전체 반영"이라는 PRD 의도와 맞고, walking-skeleton 단계에서 diff
 * 로직을 미리 만드는 것은 과도한 최적화로 판단해 보류한다.
 *
 * scope(SINGLE 기본|SERIES)는 Open Q#1 권고대로 상시 노출한다. startAt/endAt은 `<input type="time"
 * step="1">`로 초 단위까지 받아 스키마의 `HH:mm:ss` 정규식과 그대로 맞춘다(CREATE의 datetime-local
 * 초 보정과 다른 이유 — T4.2 스키마 주석 참조).
 *
 * 성공(204) 시 scheduleKeys.detail/calendar를 이 컴포넌트가 직접 invalidate한다(mutation 훅은
 * 순수 mutation만 제공, useUpdateManualScheduleMutation 주석 참조).
 */
function ScheduleEditForm({ detail, onCancel, onSuccess, onSubmittingChange }: ScheduleEditFormProps) {
  const queryClient = useQueryClient()
  const mutation = useUpdateManualScheduleMutation()
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  const form = useZodForm(manualScheduleUpdateSchema, {
    defaultValues: {
      title: detail.title,
      content: detail.content,
      startAt: detail.startAt,
      endAt: detail.endAt,
    },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  // 부모가 제출 중 다이얼로그 닫힘을 막을 수 있도록 RHF isSubmitting을 그대로 전파한다.
  useEffect(() => {
    onSubmittingChange(isSubmitting)
  }, [isSubmitting, onSubmittingChange])

  async function handleSubmit(values: ManualScheduleUpdateFormValues) {
    await mutation.mutateAsync({ scheduleId: detail.scheduleId, payload: values, scope })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    toast.success('일정이 수정되었습니다')
    onSuccess()
  }

  return (
    <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-edit-title">제목</Label>
        <Input id="schedule-edit-title" aria-invalid={!!errors.title} {...register('title')} />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-edit-content">내용</Label>
        <Textarea id="schedule-edit-content" aria-invalid={!!errors.content} {...register('content')} />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-edit-start">시작 시각</Label>
          <Input
            id="schedule-edit-start"
            type="time"
            step="1"
            aria-invalid={!!errors.startAt}
            {...register('startAt')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-edit-end">종료 시각</Label>
          <Input
            id="schedule-edit-end"
            type="time"
            step="1"
            aria-invalid={!!errors.endAt}
            {...register('endAt')}
          />
        </div>
      </div>
      {(errors.startAt ?? errors.endAt) && (
        <p role="alert" className="text-sm text-destructive">
          {errors.startAt?.message ?? errors.endAt?.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>적용 범위</Label>
        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as ScheduleScope)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SINGLE" id="schedule-edit-scope-single" />
            <Label htmlFor="schedule-edit-scope-single" className="font-normal">
              <span className="sr-only">일정 수정 적용 범위: </span>이 날짜만
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SERIES" id="schedule-edit-scope-series" />
            <Label htmlFor="schedule-edit-scope-series" className="font-normal">
              <span className="sr-only">일정 수정 적용 범위: </span>동일 일정 전체
            </Label>
          </div>
        </RadioGroup>
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          저장
        </Button>
      </div>
    </form>
  )
}

interface ScheduleParticipantAddSectionProps {
  /** 참여자 추가 대상 일정 상세. participants+ownerId로 EmployeePicker의 중복 선택을 막는다. */
  detail: ScheduleDetailResponse
}

/**
 * 일정 참여자 추가 섹션(ROADMAP(SCHEDULE) T5.2, `SCHEDULE_PARTICIPANTS_ADD`).
 *
 * ScheduleEditForm(T4.3)과 달리 토글 없이 상시 노출한다 — 참여자 추가는 여러 명을 골라 한 번에
 * 반영하는 단발성 액션이라 별도 편집 모드 전환이 필요 없다(T5.1 pseudo 그대로).
 * 이미 참여 중인 사원(소유자 포함)은 EmployeePicker의 `disabledEmpIds`로 막아 중복 추가를
 * 사전에 차단한다 — 서버도 동일 제약(request-fields.adoc: participantIds 빈배열/null요소 불가)이지만,
 * "이미 참여 중"까지는 서버가 별도 코드로 구분해 내려주지 않아 클라이언트에서 먼저 막는 편이 UX상 낫다.
 *
 * 성공(201) 시 scheduleKeys.detail만 invalidate한다 — 참여자 변경은 캘린더 이벤트 표시(제목/시각)에
 * 영향을 주지 않아 scheduleKeys.calendar까지 건드릴 필요가 없다(ScheduleEditForm과의 차이).
 */
function ScheduleParticipantAddSection({ detail }: ScheduleParticipantAddSectionProps) {
  const queryClient = useQueryClient()
  const mutation = useAddScheduleParticipantsMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  const disabledEmpIds = [detail.ownerId, ...detail.participants.map((participant) => participant.empId)]

  function handleAdd() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, participantIds: selected.map((employee) => employee.empId), scope },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
          toast.success('참여자를 추가했습니다')
          setSelected([])
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">참여자 추가</p>
      <EmployeePicker selected={selected} onChange={setSelected} disabledEmpIds={disabledEmpIds} />

      <RadioGroup
        value={scope}
        onValueChange={(value) => setScope(value as ScheduleScope)}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SINGLE" id="schedule-participant-add-scope-single" />
          <Label htmlFor="schedule-participant-add-scope-single" className="font-normal">
            <span className="sr-only">참여자 추가 적용 범위: </span>이 날짜만
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SERIES" id="schedule-participant-add-scope-series" />
          <Label htmlFor="schedule-participant-add-scope-series" className="font-normal">
            <span className="sr-only">참여자 추가 적용 범위: </span>동일 일정 전체
          </Label>
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleAdd} disabled={selected.length === 0 || mutation.isPending}>
          참여자 추가
        </Button>
      </div>
    </div>
  )
}

interface ScheduleParticipantRemoveSectionProps {
  /** 참여자 제외 대상 일정 상세. participants 배열을 그대로 목록으로 렌더한다. */
  detail: ScheduleDetailResponse
}

/**
 * 일정 참여자 제외 섹션(ROADMAP(SCHEDULE) T5.3, `SCHEDULE_PARTICIPANTS_REMOVE`).
 *
 * T2.2가 이미 렌더한 상세의 `participants` 배열을 그대로 재사용해 체크박스로 선택한다 —
 * `EmployeePicker`(전사 부서/부서원 탐색용)와 데이터 소스가 달라 재사용하지 않는다(로드맵 Notes,
 * T5.1 pseudo 그대로). 소유자(`empId === ownerId`) 행은 체크박스를 disabled 처리해 선택 자체를
 * 막는다 — 서버가 최종 판정하는 제약("일정 소유자 제외 불가", `removeScheduleParticipants.ts`
 * request-fields.adoc 실측 주석 참조)과 동형으로, 소유자 여부는 상세 응답에서 명백히 구분되는
 * 값이라 클라이언트에서 선제 차단하는 편이 자연스럽다.
 *
 * ScheduleParticipantAddSection(T5.2)과 동일하게 토글 없이 상시 노출하고, scope 라디오 옵션
 * 접근성 이름 충돌을 피하기 위해 동일한 sr-only 접두사 규칙("참여자 제외 적용 범위: ")을 따른다.
 * 성공(204) 시 scheduleKeys.detail만 invalidate한다(참여자 변경은 캘린더 이벤트 표시에 영향 없음).
 */
function ScheduleParticipantRemoveSection({ detail }: ScheduleParticipantRemoveSectionProps) {
  const queryClient = useQueryClient()
  const mutation = useRemoveScheduleParticipantsMutation()
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([])
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  function toggle(empId: number) {
    if (empId === detail.ownerId) {
      return
    }
    setSelectedEmpIds((prev) => (prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]))
  }

  function handleRemove() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, participantIds: selectedEmpIds, scope },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
          toast.success('참여자를 제외했습니다')
          setSelectedEmpIds([])
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">참여자 제외</p>
      <ul className="flex flex-col gap-1.5">
        {detail.participants.map((participant) => {
          const isOwner = participant.empId === detail.ownerId
          const inputId = `schedule-participant-remove-${participant.empId}`
          return (
            <li key={participant.empId} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={inputId}
                checked={selectedEmpIds.includes(participant.empId)}
                disabled={isOwner}
                onCheckedChange={() => toggle(participant.empId)}
              />
              <Label htmlFor={inputId} className="font-normal">
                {participant.deptName} {participant.empName}
                {isOwner && ' (소유자)'}
              </Label>
            </li>
          )
        })}
      </ul>

      <RadioGroup
        value={scope}
        onValueChange={(value) => setScope(value as ScheduleScope)}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SINGLE" id="schedule-participant-remove-scope-single" />
          <Label htmlFor="schedule-participant-remove-scope-single" className="font-normal">
            <span className="sr-only">참여자 제외 적용 범위: </span>이 날짜만
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SERIES" id="schedule-participant-remove-scope-series" />
          <Label htmlFor="schedule-participant-remove-scope-series" className="font-normal">
            <span className="sr-only">참여자 제외 적용 범위: </span>동일 일정 전체
          </Label>
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleRemove}
          disabled={selectedEmpIds.length === 0 || mutation.isPending}
        >
          참여자 제외
        </Button>
      </div>
    </div>
  )
}

interface ScheduleCancelSectionProps {
  /** 취소 대상 일정 상세. participantCount로 취소 가능 여부(소유자 외 참가자 없음)를 판단한다. */
  detail: ScheduleDetailResponse
  /** 취소 성공 시 상세 다이얼로그 자체를 닫는다(부모 onOpenChange 위임). */
  onCancelled: () => void
}

/**
 * 일정 취소 액션(ROADMAP(SCHEDULE) T6.2, `SCHEDULE_CANCEL`).
 *
 * `CancelReservationAlertDialog`(meeting 도메인, `AlertDialog` 확인 패턴 선례)와 동형으로
 * `AlertDialogTrigger`가 취소 버튼, 확인 시에만 실제 mutate가 나간다. `isCanceled=true`일 때
 * 버튼을 미노출해야 한다는 Done 조건은 이 섹션이 마운트되는 조건(부모의 `canManage = ... &&
 * !data.isCanceled`)이 이미 보장하므로 이 컴포넌트 안에서 별도로 다시 검사하지 않는다.
 *
 * `participantCount > 1`(소유자 외 참가자 존재)이면 취소 버튼을 비활성화하고 안내 문구를 보여준다
 * — 클라이언트 힌트일 뿐 최종 판정은 서버가 한다(도메인 위반 시 handleApiError가 토스트로 알린다).
 *
 * `useCancelScheduleMutation`(T6.1)이 성공 시 이미 scheduleKeys.detail/calendar를 invalidate하므로
 * 이 컴포넌트는 성공 토스트와 다이얼로그 닫기만 담당한다(ScheduleEditForm처럼 여기서 다시
 * invalidateQueries를 호출하지 않는다 — 훅이 이미 처리).
 */
function ScheduleCancelSection({ detail, onCancelled }: ScheduleCancelSectionProps) {
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')
  const mutation = useCancelScheduleMutation()
  const blocked = detail.participantCount > 1

  function handleConfirm() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, scope },
      {
        onSuccess: () => {
          toast.success('일정을 취소했습니다')
          onCancelled()
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium">일정 취소</p>
      {blocked && (
        <p className="text-sm text-muted-foreground">참가자를 먼저 제외해야 취소할 수 있습니다.</p>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm" disabled={blocked}>
            일정 취소
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>취소한 일정은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>

          <RadioGroup
            value={scope}
            onValueChange={(value) => setScope(value as ScheduleScope)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SINGLE" id="schedule-cancel-scope-single" />
              <Label htmlFor="schedule-cancel-scope-single" className="font-normal">
                <span className="sr-only">일정 취소 적용 범위: </span>이 날짜만
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SERIES" id="schedule-cancel-scope-series" />
              <Label htmlFor="schedule-cancel-scope-series" className="font-normal">
                <span className="sr-only">일정 취소 적용 범위: </span>동일 일정 전체
              </Label>
            </div>
          </RadioGroup>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? '취소 처리 중...' : '취소 확정'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
