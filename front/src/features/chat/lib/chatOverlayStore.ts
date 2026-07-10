import { create } from 'zustand'

interface ChatOverlayState {
  isOpen: boolean
  selectedRoomId: number | null
  /** 오버레이 내부 화면 전환('홈'=사원목록/채팅창목록 탭, '방'=채팅방 상세). */
  screen: 'home' | 'room'
  /** 홈 화면의 활성 탭. */
  activeTab: 'employees' | 'rooms'
  /**
   * 방 설정 메뉴의 '멤버 초대' 진입점에서 세팅되는 초대 대상 방 id. non-null이면 홈 화면의
   * 사원목록 탭이 "일반 브라우징(새 1:1 방 생성)" 대신 "이 방에 초대" 모드로 동작한다.
   */
  inviteTargetRoomId: number | null
}

interface ChatOverlayActions {
  /** 헤더 채팅 아이콘 클릭 시 사용(재클릭하면 닫히는 UX). */
  toggle: () => void
  /** 오버레이만 닫는다 — selectedRoomId는 그대로 유지해 다시 열면 마지막 보던 방을 이어서 보여준다. */
  close: () => void
  /** 방 선택(생성 다이얼로그 성공 시에도 호출) — 오버레이가 닫혀 있었다면 함께 열고 상세 화면으로 전환한다. */
  selectRoom: (roomId: number) => void
  /**
   * 상세 → 홈 화면 전환. isOpen은 건드리지 않는다. selectedRoomId도 그대로 유지한다 — 오버레이를
   * 닫았다 다시 열면 마지막 보던 방으로 복귀하는 기존 동작을 이 전환이 깨면 안 된다.
   */
  backToList: () => void
  /** 홈 화면 탭 직접 전환. 탭을 바꾸면 항상 초대 모드를 해제한다. */
  setActiveTab: (tab: 'employees' | 'rooms') => void
  /** 방 설정 메뉴의 '멤버 초대' 진입점. 홈 화면 사원목록 탭을 초대 모드로 연다. */
  startInviteFlow: (roomId: number) => void
}

/**
 * 채팅 오버레이 UI 상태(팝업 → 인앱 오버레이 전환). LayoutShell 안에서만 소비되므로 새로고침
 * 시 초기화되는 게 요구사항이라 영속화하지 않는다(authStore와 동일하게 인메모리 전용).
 */
export const useChatOverlayStore = create<ChatOverlayState & ChatOverlayActions>((set) => ({
  isOpen: false,
  selectedRoomId: null,
  screen: 'home',
  activeTab: 'rooms',
  inviteTargetRoomId: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  selectRoom: (roomId) =>
    set({ selectedRoomId: roomId, isOpen: true, screen: 'room', inviteTargetRoomId: null }),
  backToList: () => set({ screen: 'home' }),
  setActiveTab: (tab) => set({ activeTab: tab, inviteTargetRoomId: null }),
  startInviteFlow: (roomId) =>
    set({ screen: 'home', activeTab: 'employees', inviteTargetRoomId: roomId, isOpen: true }),
}))
