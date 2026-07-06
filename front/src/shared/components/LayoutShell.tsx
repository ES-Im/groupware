import { useMutation } from '@tanstack/react-query'
import { Bell, Home, MessageSquare, UserRound, Users, type LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { logout } from '@/features/auth/api/logout'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useFilesInfosQuery } from '@/features/employee/api/useFilesInfosQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { queryClient } from '@/shared/api/queryClient'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { sidebarMenuItems } from '@/shared/components/sidebarMenuItems'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/**
 * 사이드바 메뉴 아이콘 매핑(순수 시각 요소). sidebarMenuItems 배열의 `icon?` 필드는 아직 채워지지
 * 않았고 배열 변경은 이번 스코프 밖이라, 라우트 경로 기준으로 lucide 아이콘을 프레젠테이셔널하게만
 * 매핑한다(신규 데이터/로직 아님). 매핑에 없는 경로는 아이콘 없이 라벨만 렌더한다.
 */
const sidebarIconByPath: Record<string, LucideIcon> = {
  '/': Home,
  '/department-members': Users,
  '/me': UserRound,
}

/**
 * 공통 레이아웃 셸(ROADMAP T0.7 / §B). Sidebar/Header/Footer 3영역, shadcn 기본 토큰만 사용한다
 * (커스텀 팔레트 없음, ROADMAP §Open Questions #3). 헤더의 로그인 사용자 표시·로그아웃은
 * M1(T1.6)에서 실데이터로 연결했다. 사이드바는 선언적 배열(sidebarMenuItems, ROADMAP T4.1 / S2
 * 복제 표준)을 hasRequiredRole로 게이팅해 렌더링한다(신규 메뉴는 배열 추가만으로 자동 노출 제어).
 * 헤더는 ROADMAP T4.2 / PRD §B-1 순서(로고 → 스페이서 → 알림 → 채팅 → 아바타 슬롯 → 사용자명 →
 * 로그아웃)로 배치한다. 알림·채팅은 신규 API 연결 없는 무동작 슬롯이다(각 //todo 참고). 아바타는
 * T5.3에서 BlobAvatar(T5.1)로 연결했으나 본인 case의 numeric empId 소스 공백으로 현재는 이니셜
 * 폴백에 머문다(각 //todo 참고).
 */
export function LayoutShell() {
  const navigate = useNavigate()
  const { data: me } = useMeQuery()
  const clearAuth = useAuthStore((state) => state.clear)
  const roles = useAuthStore((state) => state.roles)
  const logoutMutation = useMutation({ mutationFn: logout })

  /**
   * 헤더 프로필 아바타(F101, ROADMAP T5.3): useMeQuery()가 이미 보유한 RETRIEVE_ME_INFO의
   * activeFiles를 우선 재사용해 추가 API 호출 없이 활성 PROFILE_PICTURE fileId를 식별한다
   * (T5.1 getActiveProfilePicture 재사용). me.activeFiles가 비어있거나 미보유인 예외 상황에서만
   * RETRIEVE_FILES_INFOS로 대체 조회한다(useFilesInfosQuery, isActive===true 필터는
   * getActiveProfilePicture가 동일하게 적용).
   */
  const meActiveFiles = me?.activeFiles
  const needsFilesInfosFallback = !!me && (meActiveFiles == null || meActiveFiles.length === 0)
  const { data: filesInfos } = useFilesInfosQuery(needsFilesInfosFallback)
  const profilePictureFileId =
    getActiveProfilePicture(meActiveFiles ?? []) ?? getActiveProfilePicture(filesInfos ?? [])

  /**
   * 로그아웃(F012): LOGOUT 호출로 서버가 refreshToken 쿠키를 만료시키면, 성공 여부와 무관하게
   * 인메모리 상태(clear)·쿼리 캐시(queryClient.clear, 다음 로그인 사용자에게 이전 사용자의 me
   * 캐시가 노출되지 않도록)를 정리하고 로그인 페이지로 보낸다. 네트워크 실패로 서버 쪽 쿠키
   * 만료가 안 됐더라도 클라이언트를 미인증 상태로 되돌리는 것이 그룹웨어 UX상 안전하다.
   */
  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // 로그아웃은 실패해도 클라이언트 상태를 강제 정리하므로 에러를 노출하지 않는다.
    } finally {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-64">
        {/* 사이드바 섹션 라벨(시각 위계용): 항목이 3개뿐이라 그룹핑은 하지 않고 단일 헤딩만 둔다. */}
        <p className="px-5 pt-5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          메뉴
        </p>
        <nav className="flex flex-col gap-0.5 px-3 pb-3 text-sm">
          {sidebarMenuItems
            .filter((item) => hasRequiredRole(roles, item.minRole))
            .map((item) => {
              const Icon = sidebarIconByPath[item.to]
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  // 루트('/')는 하위 경로와 겹치지 않도록 정확 매칭(end)으로 활성 판정한다.
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-md px-4 py-2 transition-colors',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* 활성 항목 좌측 컬러 바(스크린샷의 활성 강조 방식). */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between bg-primary px-4 text-primary-foreground">
          {/* 회사 로고(S1): 저장소에 로고 이미지 asset이 없어 텍스트 로고로 대체한다. 클릭 시 홈(`/`) 이동. */}
          <Link to="/" className="text-base font-semibold tracking-tight text-primary-foreground">
            HARUON
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 알림 벨(S3): 알림 기능ID가 api-endpoint.md에 아직 없어 무동작 슬롯만 배치한다. */}
            {/* todo: 알림 계약(기능ID) 확정 시 배지·드롭다운 연결 */}
            <button
              type="button"
              aria-label="알림"
              className="inline-flex size-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none"
            >
              <Bell className="size-4" aria-hidden="true" />
            </button>
            {/* 채팅 버튼(S4): 채팅 도메인 PRD가 아직 확정되지 않아 무동작 슬롯만 배치한다. */}
            {/* todo: 채팅 도메인 PRD 확정 시 연결 */}
            <button
              type="button"
              aria-label="채팅"
              className="inline-flex size-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
            </button>
            {me && (
              // 아바타+사용자명을 하나의 클러스터로 묶어 우측 정렬(스크린샷 우상단 사용자 영역 구도).
              <div className="ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1">
                {/*
                  프로필 아바타(F101, ROADMAP T5.3): T5.1의 BlobAvatar 공유 프리미티브를 연결한다.
                  본인 case는 RETRIEVE_ME_INFO/RETRIEVE_FILES_INFOS 응답 어디에도 numeric empId가
                  없다(empBasicInfo.empNo는 문자열, §리스크7 실측 확정). EMP_FILE_PREVIEW는 경로에
                  numeric {empId}를 요구하므로 현재는 이미지 로딩이 불가능해 이니셜 폴백에 머문다.
                */}
                {/* todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me 응답에 empId 추가) 필요 */}
                <BlobAvatar
                  empId={undefined}
                  fileId={profilePictureFileId}
                  fallbackText={me.empBasicInfo.name}
                  className="bg-primary-foreground/15 text-primary-foreground"
                />
                {/* 내 정보 조회 페이지(ROADMAP T2.3)는 MyInfoPage로 연결됐다. */}
                {/* `/me`는 router.tsx에 실라우트로 배선되어 있어 이동 시 정상 렌더된다. */}
                <Link
                  to="/me"
                  className="hidden text-sm font-medium text-primary-foreground underline-offset-4 hover:underline sm:inline"
                >
                  {me.empBasicInfo.name}
                </Link>
              </div>
            )}
            {/* 로그아웃(F012): 다크 헤더 위에서 대비를 유지하도록 outline variant를 헤더 톤으로 오버라이드. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              로그아웃
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-muted/30">
          <Outlet />
        </main>
        <footer className="shrink-0 border-t border-border bg-background px-4 py-4 text-center text-sm text-muted-foreground">
          {/*
            정적 회사 정보(ROADMAP T4.3 / PRD §B-3·S5): 회사 정보 조회 기능ID·필드 계약이
            api-endpoint.md 인덱스에 없어 동적 연결이 불가하므로 정적 하드코딩 텍스트를 유지한다
            (API 호출 신규 추가 없음).
          */}
          <p>&copy; {new Date().getFullYear()} 하루온 그룹(HARUON Group). All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
