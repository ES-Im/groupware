/**
 * 공통 HTTP 클라이언트 (fetch 기반)
 *
 * - 모든 도메인 services 모듈은 이 클라이언트를 통해 API를 호출한다.
 * - 인증: access token을 `Authorization: Bearer <token>`으로 주입한다 (security.md).
 * - 토큰 만료(401) 시 `/api/auth/reissue`로 재발급을 1회 시도한 뒤 원요청을 재실행한다.
 * - 엔드포인트/메서드/권한의 단일 출처는 rules/api-endpoint.md 다.
 */
import {clearTokens, getAccessToken, setAccessToken} from './token';

// Vite 환경변수. 미설정 시 동일 오리진 기준 상대경로(/api/...)로 호출한다.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const REISSUE_PATH = '/api/auth/reissue';

class HttpError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

// 동시 다발 401 발생 시 재발급 요청이 중복되지 않도록 진행 중인 Promise를 공유한다.
let reissuePromise = null;

async function reissueAccessToken() {
  if (!reissuePromise) {
    reissuePromise = fetch(`${BASE_URL}${REISSUE_PATH}`, {
      method: 'POST',
      credentials: 'include', // Refresh Token은 쿠키 기반으로 전달된다고 가정
    })
      .then(async (res) => {
        if (!res.ok) throw new HttpError(res.status, '토큰 재발급에 실패했습니다.');
        const data = await res.json();
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        reissuePromise = null;
      });
  }
  return reissuePromise;
}

function buildHeaders(headers, isFormData) {
  const result = new Headers(headers ?? {});
  // FormData(multipart)는 브라우저가 boundary 포함 Content-Type을 직접 설정하도록 둔다.
  if (!isFormData && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token && !result.has('Authorization')) {
    result.set('Authorization', `Bearer ${token}`);
  }
  return result;
}

async function parseResponse(res) {
  if (res.status === 204) return null;
  const contentType = res.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) return res.json();
  if (contentType.startsWith('text/')) return res.text();
  return res.blob(); // 파일 미리보기/다운로드 등 binary 응답
}

/**
 * 내부 요청 실행기. 401 발생 시 재발급 후 1회 재시도한다.
 */
async function request(path, { method = 'GET', body, headers, signal, _retried } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(headers, isFormData),
    body: isFormData ? body : body != null ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'include',
  });

  if (res.status === 401 && !_retried && path !== REISSUE_PATH) {
    try {
      await reissueAccessToken();
      return request(path, { method, body, headers, signal, _retried: true });
    } catch {
      clearTokens();
      throw new HttpError(401, '인증이 만료되었습니다. 다시 로그인해 주세요.');
    }
  }

  if (!res.ok) {
    const errorBody = await parseResponse(res).catch(() => null);
    const message = errorBody?.message ?? `요청에 실패했습니다. (status: ${res.status})`;
    throw new HttpError(res.status, message, errorBody);
  }

  return parseResponse(res);
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export { HttpError };
