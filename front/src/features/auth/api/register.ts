import { apiClient } from '@/shared/api/client'
import type { RegisterFormValues } from '../model/registerSchema'

/**
 * 회원가입(`REGISTER`, api-endpoint.md 기능ID `REGISTER` → `POST /api/employees`).
 *
 * F004(EMP create)와 F013(auth 회원가입)은 동일 기능ID `REGISTER`이므로 단일 함수로만 구현한다.
 * 필드 근거: back/build/generated-snippets/REGISTER/request-fields.adoc.
 * 성공 시 `204 No Content`(응답 본문 없음) — 계정은 PENDING 상태로 생성되며 인사과 승인 전에는
 * 로그인할 수 없다(도메인모델.md §Emp_Status, 서버 `findByLoginIdAndStatus(loginId, ACTIVE)`).
 */
export async function register(values: RegisterFormValues): Promise<void> {
  await apiClient.post('/api/employees', values)
}
