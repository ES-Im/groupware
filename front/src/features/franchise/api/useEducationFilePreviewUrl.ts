import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api/client'

export interface UseEducationFilePreviewUrlResult {
  objectUrl: string | undefined
  isLoading: boolean
  isError: boolean
}

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
