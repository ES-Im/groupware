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
      reissuePromise = null
    })
  return reissuePromise
}

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

    config._retried = true
    try {
      const newToken = await requestReissue()
      setAccessToken(newToken)
      config.headers.set('Authorization', `Bearer ${newToken}`)
      return apiClient(config)
    } catch (reissueError) {
      return Promise.reject(reissueError)
    }
  },
)
