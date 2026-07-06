/**
 * 인메모리 accessToken 저장소.
 *
 * WHY: accessToken은 XSS 노출 위험 때문에 localStorage/sessionStorage 등에 영속하지 않고
 * 오직 메모리(모듈 스코프 변수)에만 보관한다(ROADMAP §A-4, T0.4 방침). refreshToken은
 * 백엔드가 httpOnly 쿠키로 관리하므로 프론트는 접근하지 않는다.
 *
 * axios 인터셉터(client.ts)는 authStore(zustand, T0.4)에 직접 의존하면 순환 의존이 생기므로,
 * 토큰의 단일 진실 공급원을 이 프레임워크 비의존 모듈에 두고 authStore가 이를 동기화한다.
 */

let inMemoryAccessToken: string | null = null

/** 현재 인메모리 accessToken을 반환한다(없으면 null). */
export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

/** 인메모리 accessToken을 설정한다. null을 넘기면 제거한다. */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

/** 인메모리 accessToken을 제거한다(로그아웃·세션 만료 시). */
export function clearAccessToken(): void {
  inMemoryAccessToken = null
}
