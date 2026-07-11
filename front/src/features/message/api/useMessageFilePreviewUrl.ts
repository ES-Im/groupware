import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api/client'

/**
 * MESSAGE_FILE_PREVIEW 조회 상태(ROADMAP(MESSAGE) T3.2).
 * 호출부(T3.3 상세 뷰·T5.4 편집 모드 첨부 관리)가 로딩·에러·성공을 구분해 폴백 UI를
 * 판단할 수 있도록 노출한다. approval `useDraftFilePreviewUrl`의 UseDraftFilePreviewUrlResult와 동형이다.
 */
export interface UseMessageFilePreviewUrlResult {
  /** blob 기반 objectURL. 조회 전/실패 시 undefined. */
  objectUrl: string | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * 쪽지 첨부 인라인 미리보기 objectURL 조회 훅(ROADMAP(MESSAGE) T3.2, F1522).
 *
 * MESSAGE_FILE_PREVIEW(GET /api/messages/{messageId}/files/{fileId}/preview, path-parameters.adoc
 * 실측: messageId/fileId, 200 Binary)는 Authorization 헤더가 필요해 `<img src>`로 직접 로드할 수
 * 없다. board `useBoardFilePreviewUrl`이 확립하고 approval `useDraftFilePreviewUrl`이 복제한
 * objectURL 생명주기 표준(apiClient blob 조회 → URL.createObjectURL, cancelled 가드,
 * 언마운트/의존성 변경 시 revokeObjectURL)을 그대로 복제하되 경로만 message 첨부 엔드포인트로
 * 바꾼 병렬 훅이다(도메인마다 독립 정의하는 컨벤션 연장 — 기존 소비처의 회귀 위험을 없앤다).
 *
 * messageId/fileId 중 하나라도 미확정(undefined)이면 요청을 보내지 않고 즉시 폴백 상태를 반환한다.
 */
export function useMessageFilePreviewUrl(
  messageId: number | undefined,
  fileId: number | undefined,
): UseMessageFilePreviewUrlResult {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // messageId/fileId 미확정: 조회하지 않고 폴백 상태로 초기화.
    if (messageId == null || fileId == null) {
      setObjectUrl(undefined)
      setIsLoading(false)
      setIsError(false)
      return
    }

    let cancelled = false
    let createdUrl: string | undefined

    // WHY: messageId/fileId가 valid→valid로 전환되는 순간, 클린업이 이전 objectUrl을 revoke하므로
    // state에 남아있던 이전 URL은 즉시 무효가 된다. 여기서 objectUrl을 undefined로 리셋하지 않으면
    // 새 blob이 도착하기 전까지 <img src>가 '이미 revoke된' URL을 가리켜 깨진 이미지가 잠깐 노출된다
    // (useBoardFilePreviewUrl과 동일 이유).
    setObjectUrl(undefined)
    setIsLoading(true)
    setIsError(false)

    apiClient
      .get(`/api/messages/${messageId}/files/${fileId}/preview`, { responseType: 'blob' })
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

    // WHY: 의존성 변경(다른 messageId/fileId로 전환) 및 언마운트 모두에서 이 클린업이 실행된다.
    // cancelled 플래그로 이전 요청의 응답이 늦게 도착해도 state를 덮어쓰지 않게 막고, createdUrl이
    // 생성된 경우에만 revoke해 메모리 누수를 막는다.
    return () => {
      cancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [messageId, fileId])

  return { objectUrl, isLoading, isError }
}
