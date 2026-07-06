import { apiClient } from '@/shared/api/client'

/**
 * 로그아웃(`LOGOUT`, api-endpoint.md 기능ID `LOGOUT` → `POST /api/auth/logout`).
 *
 * 요청 바디 없음, 성공 응답은 `204 No Content`다(back/build/generated-snippets/LOGOUT/
 * http-request.adoc·http-response.adoc 실측). 서버가 응답과 함께 refreshToken 쿠키를
 * `Max-Age=0`으로 만료시키므로(response-cookies.adoc), 프론트는 쿠키를 직접 다루지 않고
 * 인메모리 상태 정리(useAuthStore.clear())만 호출부(T1.6 헤더)에서 이어서 처리하면 된다.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}
