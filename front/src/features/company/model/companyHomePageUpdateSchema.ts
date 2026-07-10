import { z } from 'zod'

/**
 * 회사 홈페이지 URL 수정 폼 클라이언트 사전검증 스키마(`COMPANY_UPDATE_HOME_PAGE_URL`, ROADMAP-COMPANY.md T3.1-c).
 *
 * 필드 근거: back/build/generated-snippets/COMPANY_UPDATE_HOME_PAGE_URL/request-fields.adoc 실측 —
 * homePageURL 필수, http:// 또는 https://로 시작, 200자 이하. 기본정보/연락처 수정과 달리 필드가
 * 1개뿐이라 "1개 이상 변경" refine이 불필요하다(§ROADMAP T3.1-c 근거).
 *
 * editedAt은 스니펫상 필수 필드이지만 사용자 입력이 아니라 제출 시점 현재 시각이므로 이 폼
 * 스키마에는 포함하지 않는다(api 함수 updateCompanyHomePageURL이 자동 주입).
 */
export const companyHomePageUpdateSchema = z.object({
  homePageURL: z
    .string()
    .min(1, '홈페이지 URL을 입력해주세요')
    .max(200, '홈페이지 URL은 200자 이하로 입력해주세요')
    .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
      message: '홈페이지 URL은 http:// 또는 https://로 시작해야 합니다',
    }),
})

export type CompanyHomePageUpdateFormValues = z.infer<typeof companyHomePageUpdateSchema>
