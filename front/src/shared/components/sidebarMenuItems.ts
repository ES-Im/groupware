/**
 * 사이드바 메뉴 선언적 배열(S2 복제 표준, ROADMAP T4.1 / 2번째 PRD §B-2).
 * 항목을 배열에 추가하기만 하면 LayoutShell이 hasRequiredRole로 자동 게이팅한다
 * (신규 도메인 메뉴 확장 슬롯). minRole은 security.md 권한 계층의 역할 코드(ROLE_ 접두어 제외)다.
 * icon은 선택 필드이며 이번 스코프에서는 렌더링하지 않는다.
 */
export interface SidebarMenuItem {
  label: string
  to: string
  minRole: string
  icon?: string
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  { label: '홈', to: '/', minRole: 'EMPLOYEE' },
  { label: '부서 멤버 목록', to: '/department-members', minRole: 'EMPLOYEE' },
  { label: '내 정보', to: '/me', minRole: 'EMPLOYEE' },
]
