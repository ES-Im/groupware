export interface JwtPayload {
  sub: string
  roles: string[]
  type: string
  iat: number
  exp: number
}

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
