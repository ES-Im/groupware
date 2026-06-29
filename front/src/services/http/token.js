/**
 * Access Token 저장소
 *
 * - access token은 30분 유효시간을 가지며 메모리/스토리지로 관리한다 (security.md).
 * - Refresh Token은 서버가 httpOnly 쿠키로 관리한다고 가정하므로 여기서 다루지 않는다.
 * - 새로고침 후에도 토큰을 유지하기 위해 sessionStorage를 사용한다.
 *   (보안 정책에 따라 메모리 전용으로 바꾸려면 STORAGE_KEY 접근부만 교체하면 된다.)
 */
const STORAGE_KEY = 'haruon.accessToken';

export function getAccessToken() {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearTokens() {
  sessionStorage.removeItem(STORAGE_KEY);
}
