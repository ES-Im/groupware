import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

function isNonRetryableStatus(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === 401 || status === 403 || status === 404
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: (failureCount, error) => {
        if (isNonRetryableStatus(error)) return false
        return failureCount < 1
      },
    },
  },
})
