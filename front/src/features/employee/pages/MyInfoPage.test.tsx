import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MyInfoPage } from './MyInfoPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const ME_URL = `${BASE_URL}/api/employees/me`
const ATTENDANCE_MONTHLY_URL = `${BASE_URL}/api/employees/attendances/me/monthly`
const ATTENDANCE_SUMMARY_URL = `${BASE_URL}/api/employees/attendances/me/monthly/summary`

function makeMeResponse(activeFiles: unknown[] = []) {
  return {
    empBasicInfo: {
      empId: 1,
      empNo: '202607001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'hong@haruon.com',
      extensionNo: '000-1234',
    },
    activeFiles,
    currentDepts: [
      { deptId: 1, deptCode: 'D1', deptName: '개발팀', positionName: '팀장', isPrimary: true, startAt: '2024-01-01', endAt: null },
    ],
  }
}

function mockAttendanceWidgetDefaults() {
  server.use(
    http.get(ATTENDANCE_MONTHLY_URL, () =>
      HttpResponse.json({
        content: [],
        totalElements: 0,
        totalPages: 1,
        number: 0,
        size: 5,
        first: true,
        last: true,
        numberOfElements: 0,
        empty: true,
      }),
    ),
    http.get(ATTENDANCE_SUMMARY_URL, () =>
      HttpResponse.json({
        totalAttendanceCount: 0,
        pendingAttendanceCount: 0,
        approvedAttendanceCount: 0,
        overtimeMinutes: 0,
      }),
    ),
  )
}

function mockPreview(fileId: number) {
  server.use(
    http.get(`${BASE_URL}/api/employees/1/files/${fileId}/preview`, () =>
      HttpResponse.arrayBuffer(new TextEncoder().encode('fake-bytes').buffer, {
        headers: { 'Content-Type': 'image/png' },
      }),
    ),
  )
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyInfoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MyInfoPage - 로딩 상태', () => {
  it('조회 중에는 "불러오는 중..."이 노출된다', async () => {
    let resolveMe: ((value: Response) => void) | undefined
    const gate = new Promise<Response>((resolve) => {
      resolveMe = resolve
    })
    server.use(http.get(ME_URL, () => gate))
    mockAttendanceWidgetDefaults()

    renderPage()

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    resolveMe?.(HttpResponse.json(makeMeResponse()))
  })
})

describe('MyInfoPage - 에러 상태', () => {
  it('조회 실패 시 에러 토스트와 "내 정보를 불러오지 못했습니다."가 노출된다', async () => {
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    expect(await screen.findByText('내 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('서버 오류가 발생했습니다'))
  })
})

describe('MyInfoPage - 성공 렌더', () => {
  it('사원 기본정보가 렌더되고 "정보/비밀번호 수정" 버튼 클릭 시 UpdateMeDialog(내 정보 수정)가 열린다', async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(makeMeResponse())))
    mockAttendanceWidgetDefaults()
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findAllByText('홍길동')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: '정보/비밀번호 수정' })).not.toBeInTheDocument()
    const editButton = screen.getByRole('button', { name: '정보/비밀번호 수정' })

    await user.click(editButton)

    expect(await screen.findByRole('heading', { name: '내 정보 수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('내선번호')).toHaveValue('000-1234')
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
  })

  it('UpdateMeDialog 제출 성공 시 성공 토스트가 뜨고 다이얼로그가 닫힌다', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(makeMeResponse())),
      http.patch(`${BASE_URL}/api/employees/me`, () => new HttpResponse(null, { status: 204 })),
    )
    mockAttendanceWidgetDefaults()
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: '정보/비밀번호 수정' }))
    expect(await screen.findByRole('heading', { name: '내 정보 수정' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('새 비밀번호'))
    await user.type(screen.getByLabelText('새 비밀번호'), 'newPass1!')
    await user.click(screen.getByRole('button', { name: '저장' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('내 정보를 수정했습니다'))
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: '내 정보 수정' })).not.toBeInTheDocument(),
    )
  })

  it('활성 파일이 있어도 "현재 활성 파일" 카드는 더 이상 렌더되지 않는다(2차 수정으로 제거)', async () => {
    const activeFiles = [
      { file: { fileId: 11, originalName: 'profile.png', extension: 'png', fileSize: 2 * 1024 * 1024 }, type: 'PROFILE_PICTURE', isActive: true },
      { file: { fileId: 12, originalName: 'sign.png', extension: 'png', fileSize: 1024 * 512 }, type: 'SIGNATURE', isActive: true },
    ]
    server.use(http.get(ME_URL, () => HttpResponse.json(makeMeResponse(activeFiles))))
    mockAttendanceWidgetDefaults()
    mockPreview(11)
    mockPreview(12)

    renderPage()

    expect(await screen.findAllByText('홍길동')).not.toHaveLength(0)
    expect(screen.queryByText('현재 활성 파일')).not.toBeInTheDocument()
    expect(screen.queryByText('활성화된 파일이 없습니다.')).not.toBeInTheDocument()
  })
})
