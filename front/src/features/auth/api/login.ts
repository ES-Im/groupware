import { apiClient } from '@/shared/api/client'
import type { LoginFormValues } from '../model/loginSchema'

/**
 * 로그인(`LOGIN`, api-endpoint.md 기능ID `LOGIN` → `POST /api/auth/login`).
 *
 * 필드 근거: back/build/generated-snippets/LOGIN/request-fields.adoc·response-fields.adoc.
 * 응답은 accessToken 하나만 포함한다(사용자 정보·roles는 내려오지 않음 — 필요 시
 * `GET /api/employees/me`(useMeQuery, T1.3)로 별도 조회하며, 이는 T1.4/T1.6에서 배선한다).
 * refreshToken은 `Set-Cookie`(HttpOnly)로만 내려오므로 프론트가 응답 바디로 다루지 않는다.
 */
export interface LoginResponse {
  accessToken: string
}

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', values)
  return data
}
