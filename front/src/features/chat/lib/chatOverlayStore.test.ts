import { afterEach, describe, expect, it } from 'vitest'
import { useChatOverlayStore } from './chatOverlayStore'

/**
 * chatOverlayStore(팝업 창 → 인앱 오버레이 전환, 홈/상세 2-스크린 확장) 액션별 상태 전이 검증.
 *
 * - toggle: 헤더 아이콘 클릭 시 isOpen만 뒤집는다(selectedRoomId는 건드리지 않는다).
 * - close: 오버레이만 닫는다 — selectedRoomId는 유지해 다시 열면 마지막 보던 방을 이어서 보여준다.
 * - selectRoom: 방 선택과 동시에 오버레이가 닫혀 있었다면 함께 열고 screen을 'room'으로 전환한다.
 * - backToList: 상세 → 홈 화면 전환(screen만 'home'으로). selectedRoomId는 더 이상 null로
 *   되돌리지 않는다 — 오버레이를 닫았다 다시 열면 마지막 보던 방으로 복귀하는 동작을 위해서다.
 */

const INITIAL_STATE = {
  isOpen: false,
  selectedRoomId: null,
  screen: 'home' as const,
  activeTab: 'rooms' as const,
  inviteTargetRoomId: null,
}

afterEach(() => {
  useChatOverlayStore.setState(INITIAL_STATE)
})

describe('chatOverlayStore', () => {
  it('toggle: isOpen을 뒤집고 selectedRoomId는 건드리지 않는다', () => {
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: 5 })

    useChatOverlayStore.getState().toggle()
    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: true, selectedRoomId: 5 })

    useChatOverlayStore.getState().toggle()
    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: false, selectedRoomId: 5 })
  })

  it('close: isOpen만 false로 만들고 selectedRoomId는 그대로 유지한다', () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 7 })

    useChatOverlayStore.getState().close()

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: false, selectedRoomId: 7 })
  })

  it('selectRoom: selectedRoomId를 설정하고 오버레이가 닫혀 있었다면 함께 열고 screen을 room으로 전환한다', () => {
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: null })

    useChatOverlayStore.getState().selectRoom(42)

    expect(useChatOverlayStore.getState()).toEqual({
      isOpen: true,
      selectedRoomId: 42,
      screen: 'room',
      activeTab: 'rooms',
      inviteTargetRoomId: null,
      toggle: expect.any(Function),
      close: expect.any(Function),
      selectRoom: expect.any(Function),
      backToList: expect.any(Function),
      setActiveTab: expect.any(Function),
      startInviteFlow: expect.any(Function),
    })
  })

  it('selectRoom: 이미 열려 있어도 selectedRoomId를 새 값으로 교체한다', () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 1 })

    useChatOverlayStore.getState().selectRoom(2)

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: true, selectedRoomId: 2, screen: 'room' })
  })

  it('backToList: screen만 home으로 되돌리고 selectedRoomId·isOpen은 건드리지 않는다', () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 9, screen: 'room' })

    useChatOverlayStore.getState().backToList()

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: true, selectedRoomId: 9, screen: 'home' })
  })

  it('backToList: 오버레이가 닫힌 상태에서 호출돼도 isOpen을 false로 유지한다', () => {
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: 9, screen: 'room' })

    useChatOverlayStore.getState().backToList()

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: false, selectedRoomId: 9, screen: 'home' })
  })

  it('setActiveTab: 탭을 전환하고 초대 모드(inviteTargetRoomId)를 해제한다', () => {
    useChatOverlayStore.setState({ activeTab: 'rooms', inviteTargetRoomId: 3 })

    useChatOverlayStore.getState().setActiveTab('employees')

    expect(useChatOverlayStore.getState()).toMatchObject({ activeTab: 'employees', inviteTargetRoomId: null })
  })

  it('startInviteFlow: 홈 화면 사원목록 탭을 초대 모드로 연다', () => {
    useChatOverlayStore.setState({ isOpen: false, screen: 'room', activeTab: 'rooms' })

    useChatOverlayStore.getState().startInviteFlow(7)

    expect(useChatOverlayStore.getState()).toMatchObject({
      isOpen: true,
      screen: 'home',
      activeTab: 'employees',
      inviteTargetRoomId: 7,
    })
  })
})
