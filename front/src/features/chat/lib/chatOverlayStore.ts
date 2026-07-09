import { create } from 'zustand'

interface ChatOverlayState {
  isOpen: boolean
  selectedRoomId: number | null
}

interface ChatOverlayActions {
  /** 헤더 채팅 아이콘 클릭 시 사용(재클릭하면 닫히는 UX). */
  toggle: () => void
  /** 오버레이만 닫는다 — selectedRoomId는 그대로 유지해 다시 열면 마지막 보던 방을 이어서 보여준다. */
  close: () => void
  /** 방 선택(생성 다이얼로그 성공 시에도 호출) — 오버레이가 닫혀 있었다면 함께 연다. */
  selectRoom: (roomId: number) => void
  /** 상세 → 목록 전환. isOpen은 건드리지 않는다. */
  backToList: () => void
}

/**
 * 채팅 오버레이 UI 상태(팝업 → 인앱 오버레이 전환). LayoutShell 안에서만 소비되므로 새로고침
 * 시 초기화되는 게 요구사항이라 영속화하지 않는다(authStore와 동일하게 인메모리 전용).
 */
export const useChatOverlayStore = create<ChatOverlayState & ChatOverlayActions>((set) => ({
  isOpen: false,
  selectedRoomId: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  selectRoom: (roomId) => set({ selectedRoomId: roomId, isOpen: true }),
  backToList: () => set({ selectedRoomId: null }),
}))
