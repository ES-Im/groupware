import axios from 'axios'

export interface ApiError {
  code: string
  name: string
  httpStatus: number
  message: string
}

function isApiErrorShape(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).code === 'string' &&
    typeof (data as Record<string, unknown>).name === 'string' &&
    typeof (data as Record<string, unknown>).message === 'string'
  )
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response
    if (response) {
      const data: unknown = response.data
      if (isApiErrorShape(data)) {
        return {
          code: data.code,
          name: data.name,
          httpStatus: data.httpStatus ?? response.status,
          message: data.message,
        }
      }
      return {
        code: 'UNKNOWN',
        name: 'UNKNOWN',
        httpStatus: response.status,
        message: '요청 처리 중 오류가 발생했습니다',
      }
    }
    return {
      code: 'NETWORK_ERROR',
      name: 'NETWORK_ERROR',
      httpStatus: 0,
      message: '네트워크 연결을 확인해 주세요',
    }
  }
  return {
    code: 'UNKNOWN',
    name: 'UNKNOWN',
    httpStatus: 0,
    message: '알 수 없는 오류가 발생했습니다',
  }
}

export const isValidationError = (error: ApiError): boolean =>
  error.code === 'VALIDATION_ERROR' || /^COMMON_00[1-7]$/.test(error.code)

export const isAuthFailure = (error: ApiError): boolean => error.code === 'AUTH_001'

export const isTokenInvalid = (error: ApiError): boolean => error.code === 'ROLE_002'

export const isForbidden = (error: ApiError): boolean => error.httpStatus === 403

export const isNotFound = (error: ApiError): boolean => error.httpStatus === 404

export type ErrorViewKind = 'notFound' | 'forbidden' | 'server' | 'network'

export function resolveErrorView(error: ApiError): ErrorViewKind | null {
  if (error.code === 'NETWORK_ERROR') return 'network'
  if (isForbidden(error)) return 'forbidden'
  if (isNotFound(error)) return 'notFound'
  if (error.httpStatus >= 500) return 'server'
  return null
}

export interface HandleApiErrorContext {
  setError?: (name: 'root', error: { message: string }) => void
  toast?: { error: (message: string) => void }
  navigate?: (to: string) => void
}

export function handleApiError(error: unknown, ctx: HandleApiErrorContext = {}): ApiError {
  const apiError = normalizeApiError(error)

  if (isValidationError(apiError) || isAuthFailure(apiError)) {
    if (ctx.setError) {
      ctx.setError('root', { message: apiError.message })
    } else {
      ctx.toast?.error(apiError.message)
    }
  } else if (isTokenInvalid(apiError)) {
    ctx.navigate?.('/login')
  } else if (isForbidden(apiError)) {
    ctx.toast?.error(apiError.message)
  } else if (isNotFound(apiError)) {
    ctx.toast?.error(apiError.message)
  } else {
    ctx.toast?.error(apiError.message)
  }

  return apiError
}
