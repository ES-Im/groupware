import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatEmployeeListPanel } from './ChatEmployeeListPanel'

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
        startAt: '2020-01-01T00:00:00',
        endAt: null,
      },
    ],
  }
}

function deptsFixture() {
  return {
    content: [
      {
        deptInfoResponse: {
          deptId: 10,
          deptCode: 'DEV',
          deptName: '개발팀',
          isActive: true,
          parentDeptId: null,
        },
        deptLeader: {
          empId: null,
          empNo: null,
          empName: null,
          extensionNo: null,
          email: null,
          position: null,
        },
      },
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 100,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false,
  }
}

function membersFixture() {
  return {
    content: [
      { empId: 1, empNo: 'E001', empName: '홍길동', extensionNo: null, email: 'a@haruon.com', position: '사원' },
      { empId: 2, empNo: 'E002', empName: '김철수', extensionNo: null, email: 'b@haruon.com', position: '팀장' },
      { empId: 3, empNo: 'E003', empName: '이영희', extensionNo: null, email: 'c@haruon.com', position: '사원' },
    ],
    totalElements: 3,
    totalPages: 1,
    number: 0,
    size: 50,
    numberOfElements: 3,
    first: true,
    last: true,
    empty: false,
  }
}

function mockBaseEndpoints() {
  server.use(
    http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture())),
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(deptsFixture())),
    http.get(`${BASE_URL}/api/departments/10/members`, () => HttpResponse.json(membersFixture())),
  )
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
    activeTab: 'employees',
    inviteTargetRoomId: null,
  })
})

describe('ChatEmployeeListPanel', () => {
  it('검색어가 없으면 본인 주 소속 부서 멤버를 기본 노출한다', async () => {
    mockBaseEndpoints()
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })

    await screen.findByText('김철수')
    expect(screen.getByText('개발팀 · 3명')).toBeInTheDocument()
  })

  it('본인(empId)은 항상 disabled 상태로 렌더된다', async () => {
    mockBaseEndpoints()
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })

    await screen.findByText('김철수')

    expect(screen.getByRole('button', { name: /홍길동/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /김철수/ })).not.toBeDisabled()
  })

  it('검색어를 입력하면 전사 이름 검색 결과가 사원 섹션에 부서·직급과 함께 노출된다', async () => {
    mockBaseEndpoints()
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })
    const user = userEvent.setup()

    await screen.findByText('김철수')

    await user.type(screen.getByLabelText('부서·사원 검색'), '김')

    await screen.findByText(/사원 \d+명/)
    expect(screen.getByText('개발팀 · 팀장')).toBeInTheDocument()
  })

  it('부서명으로 검색하면 부서 섹션이 나오고, 부서를 클릭하면 그 부서 멤버로 파고든다', async () => {
    mockBaseEndpoints()
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })
    const user = userEvent.setup()

    await screen.findByText('김철수')

    await user.type(screen.getByLabelText('부서·사원 검색'), '개발')

    await screen.findByText('부서 1건')

    await user.click(screen.getByRole('button', { name: /개발팀\s*DEV/ }))

    await screen.findByText('개발팀 · 3명')
    expect(screen.getByRole('button', { name: '검색 결과로' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /김철수/ })).toBeInTheDocument()
  })

  it('inviteTargetRoomId가 null(일반 브라우징)일 때 사원 클릭 시 방 생성 후 selectRoom이 호출된다', async () => {
    mockBaseEndpoints()
    let createBody: unknown = null
    server.use(
      http.post(`${BASE_URL}/api/chat/rooms`, async ({ request }) => {
        createBody = await request.json()
        return HttpResponse.json({ id: 99 }, { status: 201 })
      }),
    )
    useChatOverlayStore.setState({ inviteTargetRoomId: null })
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /김철수/ }))

    await waitFor(() => expect(useChatOverlayStore.getState().selectedRoomId).toBe(99))
    expect(createBody).toEqual({ memberIds: [2] })
    expect(useChatOverlayStore.getState().screen).toBe('room')
  })

  it('inviteTargetRoomId가 non-null(멤버 초대)일 때 사원 클릭 시 초대 API 호출 후 selectRoom(inviteTargetRoomId)이 호출된다', async () => {
    mockBaseEndpoints()
    let inviteBody: unknown = null
    server.use(
      http.get(`${BASE_URL}/api/chat/rooms/7`, () =>
        HttpResponse.json({
          roomId: 7,
          roomName: '업무방',
          isGroup: true,
          lastReadMessageId: null,
          members: [{ memberId: 3, deptName: '개발팀', memberName: '이영희', profileImageUrl: null }],
        }),
      ),
      http.patch(`${BASE_URL}/api/chat/rooms/7/invite`, async ({ request }) => {
        inviteBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    useChatOverlayStore.setState({ inviteTargetRoomId: 7 })
    render(<ChatEmployeeListPanel />, { wrapper: createWrapper() })
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByRole('button', { name: /이영희/ })).toBeDisabled())

    await user.click(screen.getByRole('button', { name: /김철수/ }))

    await waitFor(() => expect(useChatOverlayStore.getState().selectedRoomId).toBe(7))
    expect(inviteBody).toEqual({ memberIds: [2] })
    expect(useChatOverlayStore.getState().screen).toBe('room')
  })
})
