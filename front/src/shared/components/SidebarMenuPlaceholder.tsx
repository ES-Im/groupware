import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { cn } from '@/shared/lib/utils'

/**
 * 아직 프론트에 미구현인 도메인 항목을 클릭 불가 "준비중" 비활성 상태로 렌더한다(순수 시각 요소).
 * NavLink/to를 절대 사용하지 않아 고아 링크(존재하지 않는 라우트로의 이동)를 원천 차단한다.
 * collapsed일 때는 아이콘만 회색조로 노출하고 title="준비중" 툴팁으로 상태를 보조한다.
 * collapsed(다크 레일)에서는 sidebar 토큰 대신 primary-foreground 계열(저채도)로 스왑한다.
 */
interface SidebarMenuPlaceholderProps {
  item: SidebarMenuItem
  collapsed: boolean
}

export function SidebarMenuPlaceholder({ item, collapsed }: SidebarMenuPlaceholderProps) {
  const Icon = item.icon

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={collapsed ? '준비중' : undefined}
      className={cn(
        'flex w-full cursor-not-allowed items-center gap-3 rounded-md px-4 py-2 text-left',
        collapsed ? 'text-primary-foreground/40' : 'text-sidebar-foreground/40',
        collapsed && 'justify-center px-0',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {/* '준비중' 배지(작은 pill). 펼침 상태에서만 노출한다. */}
          <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            준비중
          </span>
        </>
      )}
    </button>
  )
}
