import { Folder, Tags } from 'lucide-react'
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
 * 게시판 카테고리 pill/chip 필터(레퍼런스 목업의 카테고리 버튼 그룹을 우리 토큰 체계로 재해석).
 *
 * 기존 `<select>`를 순수 시각/인터랙션 패턴만 바꿔 pill 버튼 그룹으로 대체한 프레젠테이셔널
 * 컴포넌트다 — 바인딩되는 상태/로직(selectedCategoryId·onSelect·categories)은 상위(BoardListPage)가
 * 그대로 소유하고, 여기서는 마크업만 담당한다. 단일 선택 필터이므로 각 버튼에 `aria-pressed`를
 * 부여하고, 그룹은 `role="group"`+aria-label로 스크린리더에 필터임을 알린다.
 *
 * 우리 BOARD_LIST 계약은 특정 categoryId 1건만 조회한다(전체/all 조회 경로가 계약상 없음) —
 * 레퍼런스의 "전체" pill은 만들지 않고 실제 카테고리만 나열한다(근거 없는 발명 금지).
 * 커스텀 팔레트 없이 muted/secondary/border 등 시맨틱 토큰만 사용해 다크모드가 자동 대응된다.
 */
export function BoardCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
  className,
}: BoardCategoryFilterProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tags className="size-3.5" aria-hidden="true" />
        카테고리
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="카테고리 필터">
        {categories.map((category) => {
          const isSelected = category.categoryId === selectedCategoryId
          return (
            <button
              key={category.categoryId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(category.categoryId)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                isSelected
                  ? 'border-transparent bg-secondary text-secondary-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Folder
                className={cn('size-3.5', isSelected ? 'text-foreground' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              {category.categoryName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
