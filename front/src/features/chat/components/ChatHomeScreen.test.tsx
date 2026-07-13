import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatHomeScreen } from './ChatHomeScreen'

/**
 * ChatHomeScreen(홈 화면: 프로필 + 사원목록/채팅창목록 탭) 검증.
 *
 * - 프로필 영역이 useMeQuery 데이터(이름·대표 소속·직위)로 렌더된다.
 * - 탭 클릭 시 chatOverlayStore.setActiveTab이 호출되어 activeTab이 바뀐다(Tabs value가
 *   스토어 소유이므로 실제 탭 전환은 스토어 상태 변화로 검증한다).
 * - 활성 탭에 따라 ChatEmployeeListPanel/ChatRoomListPanel 중 하나만 마운트된다(Radix Tabs
 *   기본 동작 — forceMount 미사용).
 */

function meFixture() {
  return {
    empBasicInfo: {
      empId: 1,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [
      {
        deptId: 10,
        deptCode: 'DEV',
        deptName: '개발팀',
        positionName: '사원',
        isPrimary: true,
        startAt: '2024-01-01',
        endAt: null,
      },
    ],
  }
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

afterEach(() => {
  useChatOverlayStore.setState({
    isOpen: false,
    selectedRoomId: null,
    screen: 'home',
    activeTab: 'rooms',
    inviteTargetRoomId: null,
  })
})

describe('ChatHomeScreen', () => {
  it('프로필 정보(이름·대표 소속·직위)가 useMeQuery 데이터로 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
      http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json([])),
    )
    render(<ChatHomeScreen />, { wrapper: createWrapper() })

    expect(await screen.findByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('개발팀 · 사원')).toBeInTheDocument()
  })

  it('기본 활성 탭은 채팅창목록이라 ChatRoomListPanel이 마운트된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
      http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json([])),
    )
    render(<ChatHomeScreen />, { wrapper: createWrapper() })

    expect(await screen.findByPlaceholderText('채팅방 검색')).toBeInTheDocument()
    expect(screen.queryByLabelText('사원 이름 검색')).not.toBeInTheDocument()
  })

  it('사원목록 탭 클릭 시 setActiveTab이 호출되어 activeTab이 employees로 바뀌고 ChatEmployeeListPanel이 마운트된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
      http.get(`${BASE_URL}/api/chat/rooms`, () => HttpResponse.json([])),
      // 통합 검색창 마운트 시 본인 주 소속 부서(개발팀=10) 멤버를 기본 조회한다.
      http.get(`${BASE_URL}/api/departments/10/members`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 50,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        }),
      ),
    )
    render(<ChatHomeScreen />, { wrapper: createWrapper() })
    await screen.findByPlaceholderText('채팅방 검색')

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: '사원목록' }))

    expect(useChatOverlayStore.getState().activeTab).toBe('employees')
    expect(await screen.findByLabelText('사원 이름 검색')).toBeInTheDocument()
  })
})
