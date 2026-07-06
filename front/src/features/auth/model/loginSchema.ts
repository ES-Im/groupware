import { z } from 'zod'

/**
 * 로그인 폼 클라이언트 사전검증 스키마(ROADMAP T1.1).
 *
 * 필드 근거: back/build/generated-snippets/LOGIN/request-fields.adoc
 * loginId/password 모두 필수(true)이며 제약조건 컬럼은 "-"(길이·형식 제약 없음) →
 * 존재하지 않는 제약을 추측해 만들지 않고 "필수 입력" 수준만 클라에서 선검증한다.
 * 그 외 서버 판정(아이디/비밀번호 불일치 = AUTH_001 등)은 submitWithErrorMapping이
 * handleApiError로 위임해 폼 루트 에러/토스트로 처리한다.
 */
export const loginSchema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
