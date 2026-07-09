import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { SidebarMenuLink } from '@/shared/components/SidebarMenuLink'
import { SidebarMenuPlaceholder } from '@/shared/components/SidebarMenuPlaceholder'
import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'

/**
 * 하위 항목을 가진 그룹 노드(순수 시각 요소). 자체는 라우팅하지 않고 펼침/접힘 아코디언만 수행한다.
 * children을 각자의 minRole로 2차 필터하며, 보이는 children이 0개면 그룹 자체를 렌더하지 않는다.
 * open 상태는 비영속 로컬 상태다(영속 대상은 사이드바 collapsed뿐).
 *
 * collapsed(아이콘 전용) 상태에서 그룹 아이콘을 클릭하면 상위에 사이드바 펼침(onExpandSidebar)을
 * 요청하고 동시에 이 그룹을 열어(setOpen(true)) 하위 항목이 바로 보이게 한다.
 */
interface SidebarMenuGroupProps {
  item: SidebarMenuItem
  roles: string[]
  collapsed: boolean
  onExpandSidebar: () => void
  /** 메뉴 뱃지 count 맵(badgeKey → count, T7.3). 그대로 자식 SidebarMenuLink로 내려보낸다. */
  badgeCounts?: Record<string, number | undefined>
}

export function SidebarMenuGroup({
  item,
  roles,
  collapsed,
  onExpandSidebar,
  badgeCounts,
}: SidebarMenuGroupProps) {
  const [open, setOpen] = useState(false)

  // 그룹 내부 children 2차 필터: 각 항목의 minRole로 게이팅한다.
  const visibleChildren = (item.children ?? []).filter((child) =>
    hasRequiredRole(roles, child.minRole),
  )
  if (visibleChildren.length === 0) return null

  const Icon = item.icon

  // collapsed: 그룹은 아이콘 전용 버튼만 노출. 클릭 시 사이드바를 펼치고 이 그룹을 연다.
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          onExpandSidebar()
          setOpen(true)
        }}
        title={item.label}
        className="flex w-full items-center justify-center rounded-md px-0 py-2 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground dark:focus-visible:ring-card-foreground/40"
      >
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      </button>
    )
  }

  return (
    <div className="flex flex-col">
      {/* 그룹 헤더 버튼: 아이콘 + 라벨 + 회전하는 화살표. 클릭 시 아코디언 토글. */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-3 rounded-md px-4 py-2 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring focus-visible:outline-none"
      >
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{item.label}</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('ml-auto size-4 shrink-0 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
          {visibleChildren.map((child) =>
            child.implemented !== false ? (
              <SidebarMenuLink
                key={child.label}
                item={child}
                collapsed={false}
                badgeCounts={badgeCounts}
              />
            ) : (
              <SidebarMenuPlaceholder key={child.label} item={child} collapsed={false} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
