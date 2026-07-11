import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MyInfoPage } from './MyInfoPage'

/**
 * MyInfoPage(F003 RETRIEVE_ME_INFO, adapt-ui 리디자인) 조합 스모크 테스트.
 *
 * 하위 컴포넌트(EmployeeSummaryCard/SignatureCard/EmployeeProfileTabs/PersonalRecordsWidget)의
 * 세부 분기는 각자의 .test.tsx가 이미 담당하므로, 이 페이지는 로딩/에러/성공 렌더와 페이지
 * 레벨 조합(현재 활성 파일 카드, 수정 버튼 링크)만 검증한다.
 *
 * activeFiles에 PROFILE_PICTURE/SIGNATURE를 모두 활성으로 두면 EmployeeSummaryCard의
 * BlobAvatar·SignatureCard가 각각 EMP_FILE_PREVIEW(GET /api/employees/{empId}/files/{fileId}/preview)를
 * 실제로 호출하므로(react-query가 아닌 useEffect 기반 훅), 두 fileId 모두 목을 등록해야
 * onUnhandledRequest:'error'에 걸리지 않는다.
 */
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
  it('사원 기본정보와 "수정" 버튼(→ /me/edit)이 렌더된다', async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(makeMeResponse())))
    mockAttendanceWidgetDefaults()

    renderPage()

    expect(await screen.findAllByText('홍길동')).not.toHaveLength(0)
    const editLink = screen.getByRole('link', { name: '수정' })
    expect(editLink).toHaveAttribute('href', '/me/edit')
  })

  it('"현재 활성 파일" 카드가 PROFILE_PICTURE·SIGNATURE 활성 파일 전체를 파일명·크기만으로 보여준다', async () => {
    const activeFiles = [
      { file: { fileId: 11, originalName: 'profile.png', extension: 'png', fileSize: 2 * 1024 * 1024 }, type: 'PROFILE_PICTURE', isActive: true },
      { file: { fileId: 12, originalName: 'sign.png', extension: 'png', fileSize: 1024 * 512 }, type: 'SIGNATURE', isActive: true },
    ]
    server.use(http.get(ME_URL, () => HttpResponse.json(makeMeResponse(activeFiles))))
    mockAttendanceWidgetDefaults()
    mockPreview(11)
    mockPreview(12)

    renderPage()

    const heading = await screen.findByText('현재 활성 파일')
    const card = heading.closest('div[data-slot="card"]') as HTMLElement
    expect(card).toBeTruthy()

    expect(within(card).getByText('프로필 사진')).toBeInTheDocument()
    expect(within(card).getByText('전자서명')).toBeInTheDocument()
    expect(within(card).getByText('profile.png · 2.0 MB')).toBeInTheDocument()
    expect(within(card).getByText('sign.png · 0.5 MB')).toBeInTheDocument()
    // 활성 파일 카드는 날짜 필드를 표시하지 않는다(activeFiles/filesInfos 응답에 날짜 필드가 없음).
    expect(within(card).queryByText(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument()
  })

  it('활성화된 파일이 없으면 "활성화된 파일이 없습니다."가 노출된다', async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(makeMeResponse([]))))
    mockAttendanceWidgetDefaults()

    renderPage()

    expect(await screen.findByText('활성화된 파일이 없습니다.')).toBeInTheDocument()
  })
})
