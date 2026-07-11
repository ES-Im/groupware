import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api/client'

/**
 * EDUCATION_FILE_PREVIEW 조회 상태(board `UseBoardFilePreviewUrlResult` 동형).
 * 호출부(교육 상세의 인라인 이미지 첨부 렌더)가 로딩·에러·성공을 구분해 폴백 UI를 판단할 수
 * 있도록 노출한다.
 */
export interface UseEducationFilePreviewUrlResult {
  /** blob 기반 objectURL. 조회 전/실패 시 undefined. */
  objectUrl: string | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * 교육 첨부 인라인 미리보기 objectURL 조회 훅(`EDUCATION_FILE_PREVIEW`,
 * `GET /api/educations/{educationId}/files/{fileId}/preview`, EMPLOYEE(인증만)).
 * ⚠️ 경로 prefix가 `/api/educations`다(uploadEducationFile.ts와 동일 주의).
 *
 * Authorization 헤더가 필요해 `<img src>`로 직접 로드할 수 없다 — board `useBoardFilePreviewUrl`이
 * 확립한 objectURL 생명주기 표준(apiClient blob 조회 → URL.createObjectURL, cancelled 가드,
 * 언마운트/의존성 변경 시 revokeObjectURL)을 그대로 복제하되 경로만 교육 첨부 엔드포인트로 바꾼
 * 병렬 훅이다(도메인마다 독립 정의하는 컨벤션 연장).
 *
 * educationId/fileId 중 하나라도 미확정(undefined)이면 요청을 보내지 않고 즉시 폴백 상태를 반환한다.
 */
export function useEducationFilePreviewUrl(
  educationId: number | undefined,
  fileId: number | undefined,
): UseEducationFilePreviewUrlResult {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (educationId == null || fileId == null) {
      setObjectUrl(undefined)
      setIsLoading(false)
      setIsError(false)
      return
    }

    let cancelled = false
    let createdUrl: string | undefined

    setObjectUrl(undefined)
    setIsLoading(true)
    setIsError(false)

    apiClient
      .get(`/api/educations/${educationId}/files/${fileId}/preview`, { responseType: 'blob' })
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

    return () => {
      cancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [educationId, fileId])

  return { objectUrl, isLoading, isError }
}
