import { useCallback, useState } from 'react'

interface UsePageStateOptions {
  initialPage?: number
  initialSize?: number
}

export function usePageState(options?: UsePageStateOptions) {
  const [page, setPage] = useState(options?.initialPage ?? 0)
  const [size, setSizeState] = useState(options?.initialSize ?? 10)

  const onSizeChange = useCallback((nextSize: number) => {
    setSizeState(nextSize)
    setPage(0)
  }, [])

  const resetPage = useCallback(() => {
    setPage(0)
  }, [])

  return {
    page,
    size,
    onPageChange: setPage,
    onSizeChange,
    resetPage,
  }
}
