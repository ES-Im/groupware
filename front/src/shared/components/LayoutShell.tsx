import { Outlet } from 'react-router'

/**
 * 공통 레이아웃 셸(ROADMAP T0.7 / §B). Sidebar/Header/Footer 3영역, shadcn 기본 토큰만 사용한다
 * (커스텀 팔레트 없음, ROADMAP §Open Questions #3). 사이드바 항목의 실데이터 연결은 M1(T1.6)에서 진행하고,
 * 이번 태스크는 보호 라우트가 셸을 관통해 렌더되는 배관까지만 완성한다.
 */
export function LayoutShell() {
  return (
    <div className="flex min-h-svh">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
          <span className="font-semibold text-foreground">HARUON</span>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="shrink-0 border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          {/* 회사명/카피라이트 placeholder(ROADMAP §Open Questions #3, 디자인 확정 전) */}
          © HARUON
        </footer>
      </div>
    </div>
  )
}
