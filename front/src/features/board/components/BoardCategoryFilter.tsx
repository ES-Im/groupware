import { Folder } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { CategoryItem } from '@/features/category/model/category'

interface BoardCategoryFilterProps {
  /** 노출 카테고리 목록(F302 useCategoriesQuery 결과). 상위가 그대로 주입한다. */
  categories: CategoryItem[]
  /** 현재 선택된 카테고리 id(미선택이면 undefined). */
  selectedCategoryId: number | undefined
  /** 카테고리 선택 콜백. 선택된 카테고리 id를 그대로 넘긴다(내부 로직 없음 — 배선은 상위 담당). */
  onSelect: (categoryId: number) => void
  className?: string
}

/**
 * 게시판 카테고리 세로 nav 필터(레퍼런스 목업 좌측 "카테고리" 사이드바 목록을 우리 토큰 체계로 재해석).
 *
 * 기존 가로 pill을 순수 시각/인터랙션 패턴만 세로 nav 목록으로 바꾼 프레젠테이셔널 컴포넌트다 —
 * 바인딩되는 상태/로직(selectedCategoryId·onSelect·categories)은 상위(BoardListPage)가 그대로
 * 소유하고, 여기서는 마크업만 담당한다. 단일 선택 필터이므로 각 항목에 `aria-pressed`를 부여하고,
 * 목록은 `<nav aria-label>`+`<ul>` 시맨틱으로 스크린리더에 필터임을 알린다.
 *
 * 우리 BOARD_LIST 계약은 특정 categoryId 1건만 조회한다(전체/all 조회 경로가 계약상 없음) —
 * 레퍼런스의 "전체" 항목은 만들지 않고 실제 카테고리만 나열한다(근거 없는 발명 금지).
 * 커스텀 팔레트 없이 accent/muted/ring 등 시맨틱 토큰만 사용해 다크모드가 자동 대응된다.
 */
export function BoardCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
  className,
}: BoardCategoryFilterProps) {
  return (
    <nav aria-label="카테고리 필터" className={className}>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => {
          const isSelected = category.categoryId === selectedCategoryId
          return (
            <li key={category.categoryId}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(category.categoryId)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  // 선택 상태를 채움(bg-primary)으로 또렷이 구분한다 — 이 테마는 muted/accent/secondary가
                  // 전부 같은 옅은 회색이라 기존 bg-accent 선택은 hover와 사실상 구별되지 않았다(가시성
                  // 저하). 활성 표시는 페이지네이션 현재 페이지 버튼(bg-primary)과 동일 언어로 맞춘다.
                  isSelected
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Folder className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{category.categoryName}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
