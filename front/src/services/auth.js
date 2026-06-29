/**
 * AUTH API (rules/api-endpoint.md > AUTH API)
 */
import {http} from './http/client';
import {clearTokens, setAccessToken} from './http/token';

/** LOGIN — POST /api/auth/login (공개) */
export async function login(credentials) {
  const data = await http.post('/api/auth/login', credentials);
  // 로그인 응답의 access token을 저장소에 보관한다.
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

/** LOGOUT — POST /api/auth/logout (EMPLOYEE) */
export async function logout() {
  try {
    await http.post('/api/auth/logout');
  } finally {
    clearTokens();
  }
}

/** REISSUE_TOKEN — POST /api/auth/reissue (Refresh Token) */
export function reissue() {
  return http.post('/api/auth/reissue');
}
