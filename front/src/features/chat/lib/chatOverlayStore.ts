import { create } from 'zustand'

interface ChatOverlayState {
  isOpen: boolean
  selectedRoomId: number | null
  screen: 'home' | 'room'
  activeTab: 'employees' | 'rooms'
  inviteTargetRoomId: number | null
}

interface ChatOverlayActions {
  toggle: () => void
  close: () => void
  selectRoom: (roomId: number) => void
  backToList: () => void
  setActiveTab: (tab: 'employees' | 'rooms') => void
  startInviteFlow: (roomId: number) => void
}

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
