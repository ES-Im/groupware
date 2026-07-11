import { z } from 'zod'

/**
 * 교육 수정 폼 클라이언트 사전검증 스키마(`FRANCHISE_EDUCATION_UPDATE`, ROADMAP(FRANCHISE) T4.4, F1613).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_EDUCATION_UPDATE/request-fields.adoc(실측,
 * 추측 금지) — educationDate?(yyyy-MM-dd'T'HH:mm:ss)·place?(50자 이하)·title?(50자 이하)·
 * content?(공백 불가)·capacity?(양수) 전부 optional인 PATCH 부분수정(meetingRoomUpdateSchema 동형).
 * 계약에 문서화된 제약만 검증하고 그 외 판정(등록자 본인/비활성/신청자 0명)은 서버에 맡긴다.
 *
 * educationDate는 `<input type="datetime-local">` 값이 초 단위 없이(`yyyy-MM-ddTHH:mm`) 나올 수
 * 있으므로 폼 결선에서 setValueAs로 `:00`을 보정한 뒤 이 regex에 도달하게 한다(다이얼로그 참고).
 * capacity는 meetingRoomUpdateSchema JSDoc 지침대로 `valueAsNumber`가 아니라 setValueAs로 빈
 * 문자열을 undefined로 변환해야 한다 — 빈 입력(변경 안 함)이 NaN으로 검증 실패하는 것을 막는다.
 */
export const franchiseEducationUpdateSchema = z.object({
  educationDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      '교육 일시는 yyyy-MM-ddTHH:mm:ss 형식으로 입력해주세요',
    )
    .optional(),
  place: z.string().max(50, '교육 장소는 50자 이하로 입력해주세요').optional(),
  title: z.string().max(50, '교육 제목은 50자 이하로 입력해주세요').optional(),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, '교육 내용은 공백만으로 입력할 수 없습니다')
    .optional(),
  capacity: z.number('숫자를 입력해주세요').positive('정원은 양수여야 합니다').optional(),
})

export type FranchiseEducationUpdateFormValues = z.infer<typeof franchiseEducationUpdateSchema>
