import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getAccessToken, setAccessToken } from './tokenStore'

/**
 * 단일 axios 인스턴스 + 인터셉터 (ROADMAP T0.1 / §A-1).
 *
 * 전역 계약(CLAUDE.md §7):
 * - Base URL: http://localhost:8080 (context path 없음, 모든 API는 /api/...).
 * - withCredentials: true 필수 — refreshToken(httpOnly 쿠키) 송수신 및 CORS allowCredentials 대응.
 *   빠뜨리면 재발급 쿠키가 오가지 않아 인증이 깨진다.
 *
 * 재발급(reissue) 정책(error-response.md / shrimp-rules.md §4):
 * - 재발급 트리거는 오직 `401 && error.code === 'ROLE_002'`(토큰 무효)로만 한정한다.
 * - AUTH_001(로그인 실패)·ROLE_003(권한 부족)은 재발급 대상이 아니다 → 그대로 reject.
 */

export const BASE_URL = 'http://localhost:8080'

/** 재발급 엔드포인트 경로(REISSUE_TOKEN 기능ID). 이 요청 자체는 재발급 재귀 대상에서 제외한다. */
const REISSUE_PATH = '/api/auth/reissue'

/** 재발급 트리거 에러코드(토큰 무효). 이 코드일 때만 reissue를 시도한다. */
const REISSUE_TRIGGER_CODE = 'ROLE_002'

/** 백엔드 정규화 에러 응답 구조(error-response.md). 에러일 때만 이 형태로 온다. */
interface ApiErrorBody {
  code: string
  name: string
  httpStatus: number
  message: string
}

/** 재발급 성공 응답(REISSUE_TOKEN response-body). */
interface ReissueResponse {
  accessToken: string
}

/**
 * 원요청 config에 부착하는 커스텀 플래그.
 * WHY: 재발급 후 재시도한 요청이 다시 401을 받았을 때 무한 재시도(재귀)를 막는다.
 */
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// 요청 인터셉터: 인메모리 accessToken이 있으면 Authorization 헤더를 부착한다.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/**
 * 진행 중인 단일 재발급 프라미스.
 * WHY: 동시에 여러 요청이 401을 받아도 reissue 호출은 단 1회만 발생해야 한다.
 * 첫 401이 재발급을 시작하면 이후 401들은 같은 프라미스를 await로 공유한다.
 */
let reissuePromise: Promise<string> | null = null

/**
 * refreshToken 쿠키로 새 accessToken을 재발급받는다(단일 in-flight 공유용).
 * export하는 이유: authStore.bootstrap()(T1.4, 부팅/새로고침 세션 복원)도 동일한 REISSUE_TOKEN
 * 호출을 수행해야 하는데, 이 in-flight 프라미스를 공유해야 401 인터셉터 경로와 부팅 경로가
 * 동시에 겹치더라도(이론상) reissue 네트워크 호출이 1회로만 나간다.
 */
export function requestReissue(): Promise<string> {
  reissuePromise ??= apiClient
    .post<ReissueResponse>(REISSUE_PATH)
    .then((res) => res.data.accessToken)
    .finally(() => {
      // 성공/실패와 무관하게 in-flight 상태를 해제해 다음 401 사이클에서 재시도 가능하게 한다.
      reissuePromise = null
    })
  return reissuePromise
}

// 응답 인터셉터: 401 && ROLE_002 && 미재시도 && 비-reissue 요청일 때만 재발급 → 원요청 재시도.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableRequestConfig | undefined
    const response = error.response

    const shouldReissue =
      response?.status === 401 &&
      response.data?.code === REISSUE_TRIGGER_CODE &&
      config != null &&
      !config._retried &&
      !config.url?.includes(REISSUE_PATH)

    if (!shouldReissue) {
      return Promise.reject(error)
    }

    // 원요청을 재시도 대상으로 마킹(재귀 방지) 후 단일 in-flight 재발급 프라미스를 공유한다.
    config._retried = true
    try {
      const newToken = await requestReissue()
      setAccessToken(newToken)
      config.headers.set('Authorization', `Bearer ${newToken}`)
      return apiClient(config)
    } catch (reissueError) {
      // 재발급 실패(대개 ROLE_002) → 세션 만료. 원 에러를 그대로 전파해 상위(세션 복원/가드)가 처리한다.
      return Promise.reject(reissueError)
    }
  },
)
