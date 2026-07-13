import { Folder } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

interface CategoryBadgeProps {
  /** 카테고리명. 상위(페이지)가 categoriesQuery/상세 응답에서 해석해 문자열로 주입한다. */
  name: string
  className?: string
}

/**
 * 카테고리를 표기하는 공용 프레젠테이셔널 배지(폴더 아이콘 + 이름).
 *
 * 목록의 카테고리 pill 필터(BoardCategoryFilter)와 동일한 폴더 아이콘 언어를 써서, 상세 페이지
 * (BoardDetailPage)의 카테고리 표기가 목록과 시각적으로 일관되도록 한다(사용자 지시: "카테고리
 * 표기 방식을 목록과 일관되게"). 목표 디자인 board-page.html의 인디고-weak 칩을 primary 틴트
 * (bg-primary/10 + text-primary)로 이식한다 — 커스텀 팔레트 없이 primary 토큰만 써 다크모드가
 * 자동 대응되고, 프로젝트 primary가 이미 인디고 계열이라 목표 톤과 그대로 맞는다. 데이터는
 * 전적으로 props(name)로만 받는 순수 뷰다.
 */
export function CategoryBadge({ name, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1 bg-primary/10 font-semibold text-primary', className)}
    >
      <Folder aria-hidden="true" />
      {name}
    </Badge>
  )
}
