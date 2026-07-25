import axios, {AxiosError, type AxiosInstance, type InternalAxiosRequestConfig,} from 'axios'
import {getAccessToken, setAccessToken} from './tokenStore'

export const BASE_URL = `${import.meta.env.VITE_BASE_URL}`

const REISSUE_PATH = '/api/auth/reissue'

const REISSUE_TRIGGER_CODE = 'ROLE_002'

interface ApiErrorBody {
  code: string
  name: string
  httpStatus: number
  message: string
}

interface ReissueResponse {
  accessToken: string
}

async function extractErrorCode(data: unknown): Promise<string | undefined> {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as Partial<ApiErrorBody>
      return parsed.code
    } catch {
      return undefined
    }
  }
  if (data && typeof data === 'object') {
    return (data as Partial<ApiErrorBody>).code
  }
  return undefined
}


interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})


let reissuePromise: Promise<string> | null = null


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
    const errorCode = response ? await extractErrorCode(response.data) : undefined

    const shouldReissue =
      response?.status === 401 &&
      errorCode === REISSUE_TRIGGER_CODE &&
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
