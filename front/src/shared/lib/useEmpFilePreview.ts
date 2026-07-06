import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api/client'

/**
 * EMP_FILE_PREVIEW 조회 상태(ROADMAP T5.1 / §B-4).
 * 호출부(BlobAvatar 등)가 로딩·에러·성공을 구분해 폴백 UI를 판단할 수 있도록 노출한다.
 */
export interface UseEmpFilePreviewUrlResult {
  /** blob 기반 objectURL. 조회 전/실패 시 undefined. */
  objectUrl: string | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * 인증 필요 이미지 blob 조회 표준 훅(ROADMAP T5.1 / §B-4 — 이후 모든 인증 이미지가 복제할 표준).
 *
 * EMP_FILE_PREVIEW(GET /api/employees/{empId}/files/{fileId}/preview, api-endpoint.md 실측:
 * Path, 200 Binary/File, Authorization Bearer 필수)는 `<img src>`로 직접 로드할 수 없다(브라우저가
 * img 요청에 Authorization 헤더를 실을 수 없음). 대신 기존 apiClient(T0.1, withCredentials +
 * Authorization 인터셉터 배선됨)로 responseType:'blob' 조회 후 URL.createObjectURL로 우회한다.
 *
 * empId/fileId 중 하나라도 미확정(undefined)이면 요청을 보내지 않고 즉시 폴백 상태를 반환한다.
 * objectURL은 요청이 새로 나갈 때(의존성 변경) 그리고 언마운트 시 URL.revokeObjectURL로 반드시
 * 해제한다 — 그렇지 않으면 브라우저 메모리에 blob이 계속 남는다(이 훅의 핵심 관심사).
 */
export function useEmpFilePreviewUrl(
  empId: number | undefined,
  fileId: number | undefined,
): UseEmpFilePreviewUrlResult {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // empId/fileId 미확정: 조회하지 않고 폴백 상태로 초기화(호출부가 이니셜 폴백을 렌더하도록).
    if (empId == null || fileId == null) {
      setObjectUrl(undefined)
      setIsLoading(false)
      setIsError(false)
      return
    }

    let cancelled = false
    let createdUrl: string | undefined

    // WHY: empId/fileId가 valid→valid로 전환되는 순간, 클린업이 이전 objectUrl을 revoke하므로
    // state에 남아있던 이전 URL은 즉시 무효가 된다. 여기서 objectUrl을 undefined로 리셋하지
    // 않으면 새 blob이 도착하기 전까지 <img src>가 '이미 revoke된' URL을 가리켜 깨진 이미지가
    // 잠깐 노출된다(같은 컴포넌트 인스턴스로 아바타가 전환되는 T5.2/T5.3에서 실제 발생). 즉시
    // 리셋해 로딩 구간 동안 BlobAvatar가 이니셜 폴백을 보여주도록 한다.
    setObjectUrl(undefined)
    setIsLoading(true)
    setIsError(false)

    apiClient
      .get(`/api/employees/${empId}/files/${fileId}/preview`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        createdUrl = URL.createObjectURL(res.data as Blob)
        setObjectUrl(createdUrl)
      })
      .catch(() => {
        if (cancelled) return
        setIsError(true)
        setObjectUrl(undefined)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    // WHY: 의존성 변경(다른 empId/fileId로 전환) 및 언마운트 모두에서 이 클린업이 실행된다.
    // cancelled 플래그로 이전 요청의 응답이 늦게 도착해도 state를 덮어쓰지 않게 막고,
    // createdUrl이 생성된 경우에만 revoke해 메모리 누수를 막는다.
    return () => {
      cancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [empId, fileId])

  return { objectUrl, isLoading, isError }
}
