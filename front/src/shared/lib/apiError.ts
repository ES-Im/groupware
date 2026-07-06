import axios from 'axios'

/**
 * 백엔드 정규화 에러 응답 구조(error-response.md).
 * 계약에 없는 fieldErrors/errors 배열은 포함하지 않는다.
 */
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

/**
 * unknown 에러를 항상 ApiError 형태로 안전하게 정규화한다.
 * axios 에러(계약 구조)/네트워크 에러(response 없음)/비정형 500 바디/비-axios 값을 모두 처리한다.
 */
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

/**
 * 표에 있는 대표 코드만 판정한다(새 코드 추측 금지, error-response.md 참조).
 * ROLE_002(토큰 무효)는 정상 흐름에서 T0.1 인터셉터가 재발급으로 소진되므로,
 * 여기까지 도달하면 재발급 실패=미인증 이동 신호다. 판별자는 분류만 담당한다.
 */
export const isValidationError = (error: ApiError): boolean =>
  error.code === 'VALIDATION_ERROR' || /^COMMON_00[1-7]$/.test(error.code)

export const isAuthFailure = (error: ApiError): boolean => error.code === 'AUTH_001'

export const isTokenInvalid = (error: ApiError): boolean => error.code === 'ROLE_002'

export const isForbidden = (error: ApiError): boolean => error.code === 'ROLE_003'

export const isNotFound = (error: ApiError): boolean => error.httpStatus === 404

export interface HandleApiErrorContext {
  setError?: (name: 'root', error: { message: string }) => void
  toast?: { error: (message: string) => void }
  navigate?: (to: string) => void
}

/**
 * handleApiError를 표준 진입점으로 삼아 setError/토스트/이동 분기를 헬퍼가 결정한다(호출부는 분기하지 않는다).
 * VALIDATION_ERROR·AUTH_001은 message가 표시용 문구이므로 setError('root') 우선, 없으면 토스트로 폴백한다.
 * ROLE_002가 여기까지 도달했다는 것은 T0.1 인터셉터의 재발급이 실패했다는 신호이므로 로그인 이동으로 처리한다.
 * ROLE_003(권한 부족)은 이번 스코프에 전용 UX가 없어 토스트로만 처리한다(ROADMAP §Open Questions #6).
 */
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
