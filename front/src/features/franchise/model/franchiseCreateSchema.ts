import { z } from 'zod'

/**
 * 가맹점 등록 다이얼로그 폼 클라이언트 사전검증 스키마(`FRANCHISE_CREATE`, ROADMAP(FRANCHISE) T2.2, F1603).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_CREATE/request-fields.adoc(실측, 추측 금지) —
 * businessNumber(필수, 12자 사업자번호 형식)·franchiseName(필수, 50자 이하)·address(필수, 200자 이하)·
 * ownerName(필수, 50자 이하)·contactNumber(필수, 연락처 형식)·contactEmail(필수, 이메일 형식)·
 * managerEmpId(선택).
 *
 * businessNumber의 "12자 사업자번호 형식"은 표준 표기 `000-00-00000`(하이픈 포함 12자)로 해석해
 * regex로 검증한다. contactNumber의 "연락처 형식"은 스니펫/도메인모델에 세부 형식이 없지만
 * 백엔드 런타임 실측(비휴대폰 번호 전송 시 DTO 생성 거부 — 500 "연락처는 010-000(0)-0000
 * 형식입니다")으로 휴대폰 형식만 허용됨이 확인되어 동일 규칙을 regex로 사전검증한다(서버 500은
 * code 기반 필드 매핑이 불가한 HttpMessageNotReadableException이라 클라 선차단이 UX상 필수).
 * 문자열의 "공백 불가"는 meetingRoomCreateSchema와 동일하게 refine(trim 후 길이 검사)으로
 * 처리하고 원본 값은 trim 없이 서버에 그대로 전달한다.
 *
 * managerEmpId는 폼 Input이 아니라 EmployeePicker 로컬 선택 상태에서 제출 시 합성되는 필드라
 * register 대상이 아니다(FranchiseCreateDialog 참고).
 */
export const franchiseCreateSchema = z.object({
  businessNumber: z
    .string()
    .min(1, '사업자번호를 입력해주세요')
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자번호는 000-00-00000 형식(12자)으로 입력해주세요'),
  franchiseName: z
    .string()
    .min(1, '가맹점명을 입력해주세요')
    .max(50, '가맹점명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '가맹점명은 공백만으로 입력할 수 없습니다'),
  address: z
    .string()
    .min(1, '주소를 입력해주세요')
    .max(200, '주소는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '주소는 공백만으로 입력할 수 없습니다'),
  ownerName: z
    .string()
    .min(1, '대표자명을 입력해주세요')
    .max(50, '대표자명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다'),
  contactNumber: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^010-\d{3,4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요'),
  contactEmail: z.email('올바른 이메일 형식이 아닙니다'),
  managerEmpId: z.number().optional(),
})

export type FranchiseCreateFormValues = z.infer<typeof franchiseCreateSchema>
