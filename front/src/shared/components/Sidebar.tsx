import { SidebarMenuGroup } from '@/shared/components/SidebarMenuGroup'
import { SidebarMenuLink } from '@/shared/components/SidebarMenuLink'
import { SidebarMenuPlaceholder } from '@/shared/components/SidebarMenuPlaceholder'
import { sidebarMenuItems } from '@/shared/components/sidebarMenuItems'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

/**
 * 공통 셸의 사이드바 컨테이너(순수 시각 요소). collapsed에 따라 폭을 전환하며(아이콘 전용 ↔ 아이콘+라벨)
 * transition으로 부드럽게 애니메이션한다. 최상위 노드를 role로 1차 필터한 뒤 children 유무로
 * 그룹(SidebarMenuGroup) vs 리프(SidebarMenuLink/SidebarMenuPlaceholder)를 분기 렌더한다.
 *
 * 참고 스크린샷(toggle-on/toggle-off) 기준: 펼침 상태는 밝은 sidebar 톤을 유지하고, 접힘 상태는
 * 헤더와 같은 어두운 크롬 톤으로 전환해 헤더의 다크 스트립과 시각적으로 이어지게 한다(라이트=bg-primary,
 * 다크=bg-card. 다크모드에서 bg-primary는 near-white로 반전돼 크롬이 과하게 밝아지므로, 실제 존재하는
 * 다크 표면 토큰인 card(oklch 0.205)로 스왑해 헤더와 동일한 어두운 톤을 유지한다).
 *
 * 뷰포트별 렌더 분기:
 * - 데스크톱(!isMobile): 아래 `<aside>`를 flex 레이아웃 안에 인라인으로 렌더(기존 동작 그대로).
 * - 모바일(isMobile): 같은 메뉴 트리를 shadcn Sheet(좌측 오버레이 드로어)로 감싸 렌더한다. 모바일에는
 *   "아이콘 전용 레일" 개념이 없으므로 항상 펼침(라벨 노출) 상태로 보여준다(collapsed는 데스크톱 전용).
 *
 * 메뉴 뱃지(ROADMAP(DRAFT) T7.3, F711): LayoutShell이 주입한 badgeCounts 맵을 그대로
 * SidebarMenuGroup/SidebarMenuLink에 내려보내기만 한다(이 컴포넌트는 어떤 도메인 훅도 호출하지 않는다).
 */
interface SidebarProps {
  collapsed: boolean
  roles: string[]
  onExpandSidebar: () => void
  /**
   * 모바일 뷰포트 여부(useIsMobile). 아직 시각적으로 사용하지 않는다 — 다음 단계(ux-ui-stylist)에서
   * 모바일일 때 이 컴포넌트를 shadcn Sheet(오버레이 드로어)로 감싸는 등 렌더 분기에 사용한다.
   */
  isMobile: boolean
  /** 모바일 드로어 열림 여부(useMobileSidebarOpen). Sheet의 open prop과 연결될 값. */
  mobileOpen: boolean
  /** 모바일 드로어 닫기 핸들러. Sheet의 onOpenChange(false) 시 호출될 콜백. */
  onCloseMobileSidebar: () => void
  /**
   * 메뉴 뱃지 count 맵(badgeKey → count, ROADMAP(DRAFT) T7.3, F711). LayoutShell이 도메인 훅으로
   * 조회한 값을 주입한다 — 이 컴포넌트는 순수 presentational이라 어떤 feature 훅도 직접 호출하지 않는다.
   */
  badgeCounts?: Record<string, number | undefined>
}

export function Sidebar({
  collapsed,
  roles,
  onExpandSidebar,
  isMobile,
  mobileOpen,
  onCloseMobileSidebar,
  badgeCounts,
}: SidebarProps) {
  /**
   * 메뉴 트리 렌더(데스크톱·모바일 공용). collapsedView(아이콘 전용 여부)만 파라미터로 받아
   * 동일한 게이팅/분기 로직을 재사용한다 — 모바일 드로어는 항상 collapsedView=false로 호출한다.
   */
  const renderMenuNav = (collapsedView: boolean) => (
    <nav
      className={cn(
        'flex flex-col gap-0.5 pb-3 text-sm',
        collapsedView ? 'px-2 pt-3' : 'px-3',
      )}
    >
      {sidebarMenuItems
        // 최상위 노드 1차 필터: 노드의 minRole로 게이팅한다(기존과 동일 규칙).
        .filter((item) => hasRequiredRole(roles, item.minRole))
        .map((item) => {
          if (item.children) {
            return (
              <SidebarMenuGroup
                key={item.label}
                item={item}
                roles={roles}
                collapsed={collapsedView}
                onExpandSidebar={onExpandSidebar}
                badgeCounts={badgeCounts}
              />
            )
          }
          return item.implemented !== false ? (
            <SidebarMenuLink
              key={item.label}
              item={item}
              collapsed={collapsedView}
              badgeCounts={badgeCounts}
            />
          ) : (
            <SidebarMenuPlaceholder key={item.label} item={item} collapsed={collapsedView} />
          )
        })}
    </nav>
  )

  // 모바일: 좌측 오버레이 드로어(Sheet). Sheet 기본 표면(bg-popover)을 사이드바 펼침 톤(bg-sidebar)으로
  // 덮어써 데스크톱 펼침 상태와 색을 일치시킨다. 항상 펼침(라벨 노출) 상태로 렌더한다.
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(next) => !next && onCloseMobileSidebar()}>
        <SheetContent
          side="left"
          // 폭은 Sheet 기본 반응형(data-[side=left]:w-3/4 sm:max-w-sm)을 그대로 쓴다 — 모바일에서
          // 뷰포트의 3/4를 차지하고 배경 일부가 dim으로 남는 표준 드로어 비율. gap-0으로 헤더/네비 간
          // 기본 간격(gap-4)을 제거해 기존 사이드바 리듬에 맞춘다.
          className="gap-0 border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
          {/* SheetTitle은 Radix Dialog의 a11y 요구(제목 노출)를 충족하는 동시에 드로어 헤더를 겸한다. */}
          <SheetHeader className="px-7 pt-5 pb-2">
            <SheetTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              메뉴
            </SheetTitle>
          </SheetHeader>
          {renderMenuNav(false)}
        </SheetContent>
      </Sheet>
    )
  }

  // 데스크톱: 기존 인라인 aside(회귀 없음). collapsed 접힘 레일은 헤더와 같은 어두운 크롬 톤을 쓴다.
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r transition-[width,background-color,border-color] duration-200 ease-in-out',
        collapsed
          ? 'border-primary-foreground/10 bg-primary text-primary-foreground w-16 dark:border-card-foreground/10 dark:bg-card dark:text-card-foreground'
          : 'border-sidebar-border bg-sidebar text-sidebar-foreground w-56 lg:w-64',
      )}
    >
      {/* "메뉴" 섹션 라벨(시각 위계용)은 펼침 상태에서만 노출한다. */}
      {!collapsed && (
        <p className="px-7 pt-5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          메뉴
        </p>
      )}
      {/* LayoutShell이 셸 높이를 뷰포트에 고정(h-svh)하면서 aside 높이도 함께 유한해졌다 — 그룹을
          여러 개 펼쳐 메뉴 전체 길이가 남은 높이를 넘으면 이 내부 스크롤이 없으면 하단 메뉴가
          overflow-hidden에 잘려 완전히 접근 불가능해진다. min-h-0로 flex 자식이 부모 높이를
          넘지 않게 하고 그 안에서만 세로 스크롤한다(overflow-hidden은 가로 width 전환 애니메이션
          클리핑용으로 그대로 두고, 세로는 이 래퍼가 담당). */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{renderMenuNav(collapsed)}</div>
    </aside>
  )
}
