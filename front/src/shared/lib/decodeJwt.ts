/**
 * accessToken(JWT)의 payload를 디코드한다(서명 검증 없음).
 *
 * WHY: 백엔드가 이미 서명·검증한 토큰을 그대로 신뢰한다. JWT `roles` claim은 로그인 시점
 * 스냅샷이며 프론트에서는 UI 게이팅 힌트로만 쓰고 최종 인가 판단은 서버 401/403이 한다
 * (docs/backend-contract/security.md "JWT roles는 로그인 시점 스냅샷이다").
 */
export interface JwtPayload {
  sub: string
  roles: string[]
  type: string
  iat: number
  exp: number
}

/** JWT의 두 번째 세그먼트(payload)를 base64url → JSON으로 디코드해 반환한다. */
export function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1]
  if (!payload) {
    throw new Error('유효하지 않은 JWT 형식입니다.')
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const json = atob(padded)
  return JSON.parse(json) as JwtPayload
}
