import { z } from 'zod'

/**
 * 회사 정보 최초 등록 폼 클라이언트 사전검증 스키마(`COMPANY_REGISTER`, ROADMAP-COMPANY T2.1, F1402).
 *
 * 필드 근거: back/build/generated-snippets/COMPANY_REGISTER/request-fields.adoc(실측, 추측 금지) —
 * companyName(필수, 50자 이하)·location(필수, 200자 이하)·presentedEmail(필수, 이메일 형식, 150자
 * 이하)·presentedExternalNo(필수, 20자 이하)·ownerName(필수, 20자 이하)·homePageURL(필수,
 * http:// 또는 https://로 시작, 200자 이하). `editedAt`은 이 스키마에 포함하지 않는다(제출
 * 시각에 결정되는 값이라 폼 입력 필드가 아니다 — registerCompany가 호출 시점에 자동 주입한다).
 *
 * companyName/location/presentedExternalNo/ownerName/homePageURL의 "공백 불가"는 boardCreateSchema와
 * 동일하게 공백만으로 채운 값을 막는 제약이다(값 자체를 trim하지 않는다). presentedEmail은
 * z.email() 형식 검증 자체가 공백만으로 구성된 값을 이미 거부하므로 별도 trim refine을 두지 않는다.
 */
export const companyRegisterSchema = z.object({
  companyName: z
    .string()
    .min(1, '회사명을 입력해주세요')
    .max(50, '회사명은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회사명은 공백만으로 입력할 수 없습니다'),
  location: z
    .string()
    .min(1, '회사 위치를 입력해주세요')
    .max(200, '회사 위치는 200자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '회사 위치는 공백만으로 입력할 수 없습니다'),
  presentedEmail: z
    .email('올바른 이메일 형식이 아닙니다')
    .max(150, '대표 이메일은 150자 이하로 입력해주세요'),
  presentedExternalNo: z
    .string()
    .min(1, '대표 연락처를 입력해주세요')
    .max(20, '대표 연락처는 20자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표 연락처는 공백만으로 입력할 수 없습니다'),
  ownerName: z
    .string()
    .min(1, '대표자명을 입력해주세요')
    .max(20, '대표자명은 20자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '대표자명은 공백만으로 입력할 수 없습니다'),
  homePageURL: z
    .string()
    .min(1, '홈페이지 URL을 입력해주세요')
    .max(200, '홈페이지 URL은 200자 이하로 입력해주세요')
    .refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      'http:// 또는 https://로 시작해야 합니다',
    ),
})

export type CompanyRegisterFormValues = z.infer<typeof companyRegisterSchema>
