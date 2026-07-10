import { z } from 'zod'

/**
 * 회의실 정보 수정 폼 클라이언트 사전검증 스키마(`MEETING_ROOM_UPDATE`, ROADMAP(MEETING-ROOMS) T7.1, F813).
 *
 * 필드 근거: back/build/generated-snippets/MEETING_ROOM_UPDATE/request-fields.adoc(실측, 추측 금지) —
 * name(선택, 공백 불가, 50자 이하)·description(선택, 공백 불가)·capacity(선택, 양수) 전부 optional.
 * meetingRoomCreateSchema(T6.2)와 필드 제약은 동일하나 PATCH 부분수정이라 전 필드를 optional()로 감싼다.
 *
 * "변경값이 없으면 서버가 거부한다"(request-fields.adoc 실측)는 서버 판정이므로,
 * companyInfoUpdateSchema류의 object-level "최소 1개 필수" refine은 두지 않고 서버 에러 메시지에
 * 그대로 맡긴다(태스크 노트: 프론트는 안내만 하고 강제 검증하지 않는다).
 *
 * capacity는 create와 달리 optional이라 "빈 값 = 변경 안 함"이 유효한 입력이다. `<input
 * type="number">` + `register(..., { valueAsNumber: true })` 조합은 빈 값을 `NaN`으로 방출하는데,
 * `z.number()`는 NaN을 기본적으로 invalid_type으로 거부해 "변경 안 함" 의도가 검증 실패로 막힌다.
 * `z.preprocess`로 NaN→undefined 정규화도 고려했으나 zod v4.4.3에서는 `ZodPreprocess<U>`가 콜백
 * 파라미터 타입을 반환 타입에 전파하지 않아 Input이 `unknown`으로 넓혀지는 문제가 있다(실측 확인,
 * updateAttendanceSchema.ts의 optionalTimeField()가 동일 사유로 폐기한 것과 같은 함정) — useZodForm의
 * `ZodType<TFieldValues, TFieldValues>` 제약을 깨뜨린다. 그래서 이 스키마는 순수하게 `number | undefined`
 * 타입만 다루고, "빈 입력 → NaN"이 아니라 "빈 입력 → undefined"가 되도록 폼 결선 책임을 옮긴다:
 * **T7.2-b가 이 스키마로 폼을 만들 때는 `register('capacity', { valueAsNumber: true })`가 아니라
 * `register('capacity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })`를 써야 한다**
 * (RHF가 원본 문자열 값을 넘겨줄 때 빈 문자열을 곧바로 undefined로 변환 — NaN 자체가 발생하지 않는다).
 */
export const meetingRoomUpdateSchema = z.object({
  name: z
    .string()
    .max(50, '회의실 이름은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회의실 이름은 공백만으로 입력할 수 없습니다')
    .optional(),
  description: z
    .string()
    .refine((value) => value.trim().length > 0, '회의실 설명은 공백만으로 입력할 수 없습니다')
    .optional(),
  capacity: z.number('숫자를 입력해주세요').positive('수용 인원은 양수여야 합니다').optional(),
})

export type MeetingRoomUpdateFormValues = z.infer<typeof meetingRoomUpdateSchema>
