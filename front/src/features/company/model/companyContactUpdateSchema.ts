import { z } from 'zod'

/**
 * 회사 대표 연락처 수정 폼 클라이언트 사전검증 스키마(`COMPANY_UPDATE_CONTACT`,
 * ROADMAP-COMPANY.md T3.1-b, F1404).
 *
 * 필드 근거: back/build/generated-snippets/COMPANY_UPDATE_CONTACT/request-fields.adoc(실측,
 * 추측 금지) — presentedEmail(선택, 이메일 형식, 150자 이하)·presentedExternalNo(선택, 20자 이하).
 * editedAt(필수)은 폼 입력 필드가 아니라 제출 시점에 api 함수(updateCompanyContact)가 자동
 * 주입하므로 이 스키마에는 없다(ROADMAP §PRD 판단 #2).
 *
 * `<input>`이 미입력 시 빈 문자열(`''`)을 내보내므로, updateAttendanceSchema.optionalTimeField()와
 * 동일하게 이메일 형식 검증은 refine으로 처리해 ''(미입력)는 형식 검증을 건너뛰고 통과시킨다
 * (z.string().email()을 직접 쓰면 ''도 형식 위반으로 걸려버려 아래 "최소 1개 변경" 판정 이전에
 * 필드 자체 에러가 뜬다). 형식 검증 자체는 companyRegisterSchema.ts의 presentedEmail과 동일한
 * z.email() 판정을 재사용해, 등록/수정 두 폼에서 같은 필드가 서로 다른 기준으로 갈리지 않게 한다.
 *
 * presentedExternalNo는 공백만 입력해도 "값 있음"으로 오판해 서버 값을 공백으로 덮어쓰지 않도록,
 * companyRegisterSchema.ts와 동일하게 trim().length > 0 가드를 둔다(빈 문자열 자체는 계속 통과).
 *
 * 두 필드 모두 미입력(둘 다 '')이면 object-level refine으로 "최소 1개 변경" 도메인 규칙을
 * 폼 에러로 발생시킨다.
 */
const isEmailValid = (value: string) => z.email().safeParse(value).success

export const companyContactUpdateSchema = z
  .object({
    presentedEmail: z
      .string()
      .max(150, '이메일은 150자 이하로 입력해주세요')
      .refine((value) => value === '' || isEmailValid(value), '올바른 이메일 형식이 아닙니다')
      .optional(),
    presentedExternalNo: z
      .string()
      .max(20, '연락처는 20자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '연락처는 공백만으로 입력할 수 없습니다',
      )
      .optional(),
  })
  .refine((data) => !!data.presentedEmail || !!data.presentedExternalNo, {
    message: '변경할 항목을 최소 1개 입력해주세요',
    path: ['presentedEmail'],
  })

export type CompanyContactUpdateFormValues = z.infer<typeof companyContactUpdateSchema>
