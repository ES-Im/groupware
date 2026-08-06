import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api/client'

export interface UseEmpFilePreviewUrlResult {
  objectUrl: string | undefined
  isLoading: boolean
  isError: boolean
}

export function useEmpFilePreviewUrl(
  empId: number | undefined,
  fileId: number | undefined,
): UseEmpFilePreviewUrlResult {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (empId == null || fileId == null) {
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

    return () => {
      cancelled = true
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [empId, fileId])

  return { objectUrl, isLoading, isError }
}
