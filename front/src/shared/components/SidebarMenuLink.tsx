import { NavLink } from 'react-router'
import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

/**
 * 구현된 리프 메뉴 항목(실 라우트 보유)을 NavLink로 렌더한다(순수 시각 요소).
 * 활성 항목은 좌측 컬러 바로 강조한다(스크린샷의 활성 강조 방식). collapsed일 때는 라벨을 숨기고
 * 아이콘만 노출하며 title 툴팁으로 라벨을 보조한다.
 * collapsed(어두운 레일: 라이트=bg-primary, 다크=bg-card)일 때는 sidebar 토큰 대신 밝은 전경 계열
 * (라이트=primary-foreground, 다크=card-foreground)로 색을 스왑해 어두운 배경 위에서도 또렷이
 * 보이게 한다(토글-off 참고 스크린샷).
 *
 * 메뉴 뱃지(ROADMAP(DRAFT) T7.3, F711): item.badgeKey가 있고 badgeCounts[item.badgeKey]가 0 초과일
 * 때만 라벨 옆에 shadcn Badge를 렌더한다(0·undefined·NaN은 미표시). collapsed(아이콘 전용)에서는
 * 라벨 자체가 숨어 뱃지를 붙일 자리가 없으므로 렌더하지 않는다(아이콘 옆 점 표시 등은 도입하지 않음).
 */
interface SidebarMenuLinkProps {
  item: SidebarMenuItem
  collapsed: boolean
  /** 메뉴 뱃지 count 맵(badgeKey → count, T7.3). Sidebar → SidebarMenuGroup을 거쳐 전달된다. */
  badgeCounts?: Record<string, number | undefined>
}

export function SidebarMenuLink({ item, collapsed, badgeCounts }: SidebarMenuLinkProps) {
  // 구현된 리프는 항상 to를 보유하지만, 타입 안전을 위해 방어적으로 가드한다.
  if (!item.to) return null

  const Icon = item.icon
  const to = item.to
  const badgeCount = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined
  const showBadge = !collapsed && typeof badgeCount === 'number' && badgeCount > 0

  return (
    <NavLink
      to={to}
      // 루트('/')는 하위 경로와 겹치지 않도록 정확 매칭(end)으로 활성 판정한다.
      end={to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          // focus-visible 링은 헤더 버튼과 동일 패턴으로 통일한다(키보드 포커스 가시성 a11y).
          // ring-inset: 아이템 좌측 강조 바/경계와 겹쳐도 잘리지 않게 안쪽으로 그린다.
          'relative flex items-center gap-3 rounded-md px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none',
          collapsed && 'justify-center px-0',
          collapsed
            ? cn(
                // 접힘 레일(라이트=bg-primary, 다크=bg-card) 위에서는 밝은 계열로 스왑한다.
                // 라이트는 primary-foreground, 다크는 card-foreground(둘 다 밝은색)로 대비를 유지한다.
                'focus-visible:ring-primary-foreground/40 dark:focus-visible:ring-card-foreground/40',
                isActive
                  ? 'bg-primary-foreground/15 font-medium text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground',
              )
            : cn(
                'focus-visible:ring-sidebar-ring',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              ),
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* 활성 항목 좌측 컬러 바(스크린샷의 활성 강조 방식). 접힘 레일(어두운 크롬)에서는
              bg-sidebar-primary가 배경과 거의 같은 톤이라 보이지 않으므로 밝은 색으로 스왑한다
              (라이트=primary-foreground, 다크=card-foreground). */}
          <span
            aria-hidden="true"
            className={cn(
              // 활성 강조 바: 스캔 가시성을 위해 두께 w-0.5→w-1, 높이 h-5→h-6로 키운다(중립 토큰
              // 특성상 배경 대비가 약해 좌측 바가 주 강조 신호이므로 또렷하게 유지한다).
              'absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-full transition-opacity',
              collapsed ? 'bg-primary-foreground dark:bg-card-foreground' : 'bg-sidebar-primary',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
          {!collapsed && <span className="truncate">{item.label}</span>}
          {showBadge && (
            <Badge variant="secondary" className="ml-auto shrink-0 tabular-nums">
              {badgeCount}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )
}
