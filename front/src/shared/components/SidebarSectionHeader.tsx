import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/utils'

interface SidebarSectionHeaderProps {
  title: string
  /** 접힘(아이콘 전용) 레일에서는 라벨 없이 구분선만 노출한다. */
  collapsed: boolean
}

/**
 * 사이드바 섹션 제목 + 절취선(hr 느낌의 트레일링 구분선) 행(순수 시각 요소, 요청 그대로).
 * 펼침 상태의 "메뉴" 헤더(Sidebar.tsx)와 동일한 타이포 톤(text-xs font-semibold tracking-wider
 * text-muted-foreground uppercase)을 재사용해 위계를 통일한다.
 */
export function SidebarSectionHeader({ title, collapsed }: SidebarSectionHeaderProps) {
  if (collapsed) {
    return (
      <div className="my-2 px-3" aria-hidden="true">
        <Separator />
      </div>
    )
  }

  return (
    <div className={cn('mt-4 mb-1.5 flex items-center gap-2 px-4 first:mt-0')}>
      <span className="shrink-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </span>
      <Separator className="flex-1" />
    </div>
  )
}
