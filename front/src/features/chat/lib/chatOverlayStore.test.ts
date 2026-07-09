import { afterEach, describe, expect, it } from 'vitest'
import { useChatOverlayStore } from './chatOverlayStore'

/**
 * chatOverlayStore(팝업 창 → 인앱 오버레이 전환) 액션별 상태 전이 검증.
 *
 * - toggle: 헤더 아이콘 클릭 시 isOpen만 뒤집는다(selectedRoomId는 건드리지 않는다).
 * - close: 오버레이만 닫는다 — selectedRoomId는 유지해 다시 열면 마지막 보던 방을 이어서 보여준다.
 * - selectRoom: 방 선택과 동시에 오버레이가 닫혀 있었다면 함께 연다(isOpen을 true로).
 * - backToList: 상세 → 목록 전환. isOpen은 건드리지 않는다.
 */

const INITIAL_STATE = { isOpen: false, selectedRoomId: null }

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

  it('selectRoom: selectedRoomId를 설정하고 오버레이가 닫혀 있었다면 함께 연다', () => {
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: null })

    useChatOverlayStore.getState().selectRoom(42)

    expect(useChatOverlayStore.getState()).toEqual({
      isOpen: true,
      selectedRoomId: 42,
      toggle: expect.any(Function),
      close: expect.any(Function),
      selectRoom: expect.any(Function),
      backToList: expect.any(Function),
    })
  })

  it('selectRoom: 이미 열려 있어도 selectedRoomId를 새 값으로 교체한다', () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 1 })

    useChatOverlayStore.getState().selectRoom(2)

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: true, selectedRoomId: 2 })
  })

  it('backToList: selectedRoomId만 null로 되돌리고 isOpen은 건드리지 않는다', () => {
    useChatOverlayStore.setState({ isOpen: true, selectedRoomId: 9 })

    useChatOverlayStore.getState().backToList()

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: true, selectedRoomId: null })
  })

  it('backToList: 오버레이가 닫힌 상태에서 호출돼도 isOpen을 false로 유지한다', () => {
    useChatOverlayStore.setState({ isOpen: false, selectedRoomId: 9 })

    useChatOverlayStore.getState().backToList()

    expect(useChatOverlayStore.getState()).toMatchObject({ isOpen: false, selectedRoomId: null })
  })
})
