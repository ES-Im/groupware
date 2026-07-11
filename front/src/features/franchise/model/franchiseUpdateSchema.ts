import { z } from 'zod'

/**
 * 가맹점 기본정보 수정 폼 클라이언트 사전검증 스키마(`FRANCHISE_UPDATE`, ROADMAP(FRANCHISE) T2.4-a, F1604).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_UPDATE/request-fields.adoc(실측, 추측 금지) —
 * businessNumber·franchiseName(≤50)·address(≤200)·ownerName(≤50)·contactNumber·contactEmail(이메일)
 * 전부 optional인 PATCH 부분수정. 필드별 제약은 franchiseCreateSchema(T2.2)와 동일 기준을 재사용해
 * 등록/수정 두 폼에서 같은 필드가 서로 다른 기준으로 갈리지 않게 하고, 부분수정이라 전 필드를
 * optional()로 감싼다(meetingRoomUpdateSchema 동형).
 *
 * "최소 1개 변경값 필요"(도메인모델)는 서버 판정이므로, companyInfoUpdateSchema류의 object-level
 * "최소 1개 필수" refine은 두지 않고 서버 에러 메시지에 그대로 맡긴다 — 이 T2.4 체인 전체가
 * meeting 부분수정 선례(meetingRoomUpdateSchema·MeetingRoomUpdateDialog)를 동형 복제하는 방침이고,
 * 다이얼로그가 변경분만 diff해 보내므로 빈 payload 제출 → 서버 거부 → submitWithErrorMapping이
 * root 에러/토스트로 노출하는 흐름이 이미 성립한다(택일 근거 기록).
 */
export const franchiseUpdateSchema = z.object({
  businessNumber: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자번호는 000-00-00000 형식(12자)으로 입력해주세요')
    .optional(),
  franchiseName: z
    .string()
    .max(50, '가맹점명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '가맹점명은 공백만으로 입력할 수 없습니다')
    .optional(),
  address: z
    .string()
    .max(200, '주소는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '주소는 공백만으로 입력할 수 없습니다')
    .optional(),
  ownerName: z
    .string()
    .max(50, '대표자명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다')
    .optional(),
  // 연락처는 create와 동일하게 010 휴대폰 형식만 사전검증한다 — 위반 시 서버가 code 매핑 불가한
  // 500(HttpMessageNotReadableException)을 내려 클라 선차단이 UX상 필수(franchiseCreateSchema 실측 근거).
  contactNumber: z
    .string()
    .regex(/^010-\d{3,4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요')
    .optional(),
  contactEmail: z.email('올바른 이메일 형식이 아닙니다').optional(),
})

export type FranchiseUpdateFormValues = z.infer<typeof franchiseUpdateSchema>
