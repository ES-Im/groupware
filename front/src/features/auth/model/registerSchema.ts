import { z } from 'zod'

/**
 * 회원가입 폼 클라이언트 사전검증 스키마(ROADMAP T1.5).
 *
 * 필드 근거: back/build/generated-snippets/REGISTER/request-fields.adoc(실측, 추측 금지).
 * - empNo: "9자리[입사연월+3자리번호 조합]" → 숫자 9자리
 * - name: "20자 이하"
 * - loginId: "8자-20자 이하 영어, 숫자" → 영문/숫자만 허용, 8~20자
 * - password: "8자이상, 영문+숫자+특수문자 조합" → 8자 이상 + 영문/숫자/특수문자 각 1자 이상
 *   (도메인모델.md §Emp 규칙1과도 일치: "영문+숫자+특수문자 포함 8자 이상")
 *
 * 서버 판정(중복 empNo/loginId 등)은 submitWithErrorMapping이 handleApiError로 위임해
 * 폼 루트 에러/토스트로 처리하므로 여기서는 클라 사전검증 수준만 다룬다.
 */
export const registerSchema = z.object({
  empNo: z.string().regex(/^\d{9}$/, '사원번호는 숫자 9자리(입사연월 6자리 + 일련번호 3자리)로 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요').max(20, '이름은 20자 이하로 입력해주세요'),
  loginId: z
    .string()
    .regex(/^[A-Za-z0-9]{8,20}$/, '아이디는 영문/숫자로 8자~20자 이내로 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호는 영문을 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '비밀번호는 특수문자를 포함해야 합니다'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
