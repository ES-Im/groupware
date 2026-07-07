import { useCallback, useState } from 'react'

interface UsePageStateOptions {
  /** 초기 페이지(0-base). 기본값 0. */
  initialPage?: number
  /** 초기 페이지 크기. 기본값 10(백엔드 PAGE_SIZE 기본값과 동일, docs/backend-contract/page.md). */
  initialSize?: number
}

/**
 * Page 메타 기반 목록형 도메인의 공유 페이지 상태 훅(ROADMAP T10.1).
 *
 * page/size 로컬 상태 + 페이지 크기 변경 시 page를 0으로 리셋하는 규칙을 한 곳에서
 * 관리한다(검색어 등 다른 필터 변경 시 page=0 리셋은 도메인마다 트리거 조건이 달라
 * resetPage()를 호출부가 직접 부르게 한다 — 예: DepartmentDetailPage의 keyword 변경).
 *
 * 이 훅 자체는 어떤 axios/query 훅에도 의존하지 않는다 — 호출부가 { page, size }를
 * queryKey(xxxKeys.list(...)/members(...) 등)에 그대로 전달하는 기존 관례를 유지한다.
 *
 * onSizeChange/resetPage는 useCallback으로 참조를 안정화한다(BoardListPage 리뷰 지적, T10.3).
 * 안정화 전에는 이 훅을 호출할 때마다 새 클로저가 생성돼, 호출부가 이 함수들을 다른
 * useEffect의 의존성 배열에 넣으면(예: 검색어 디바운스) 무관한 리렌더마다 effect가
 * 재실행되는 문제가 있었다. setPage/setSizeState(useState 디스패처)는 항상 안정적이므로
 * deps를 빈 배열로 둬도 최신 값을 놓치지 않는다.
 */
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
