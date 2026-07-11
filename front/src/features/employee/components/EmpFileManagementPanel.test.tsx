import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpFileManagementPanel } from './EmpFileManagementPanel'

/**
 * EmpFileManagementPanel(EmployeeProfileTabs "파일관리" 탭, adapt-ui 리디자인) 검증.
 * MeetingRoomImageGallery(AlertDialog 삭제 확인)·MeetingRoomActiveToggleButton(활성화 토글)
 * 패턴을 사원 파일 도메인에 맞춰 복제한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeFileInfo(fileId: number, type: 'PROFILE_PICTURE' | 'SIGNATURE', isActive: boolean, name?: string) {
  return {
    file: { fileId, originalName: name ?? `file-${fileId}.png`, extension: 'png', fileSize: 100 },
    type,
    isActive,
  }
}

/** resolve를 밖으로 노출해 언제든 응답을 확정지을 수 있는 지연 프라미스 헬퍼(MyAttendancePage.test.tsx 패턴). */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderPanel(empId: number | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmpFileManagementPanel empId={empId} />
    </QueryClientProvider>,
  )
}

describe('EmpFileManagementPanel - 로딩/빈 상태', () => {
  it('조회 중에는 "불러오는 중..."이 노출된다', async () => {
    const filesDeferred = deferred<Response>()
    server.use(http.get(`${BASE_URL}/api/employees/me/files`, () => filesDeferred.promise))

    renderPanel(1)

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    filesDeferred.resolve(HttpResponse.json([]))
  })

  it('목록이 빈 배열이면 "등록된 파일이 없습니다."가 노출된다', async () => {
    server.use(http.get(`${BASE_URL}/api/employees/me/files`, () => HttpResponse.json([])))

    renderPanel(1)

    expect(await screen.findByText('등록된 파일이 없습니다.')).toBeInTheDocument()
  })
})

describe('EmpFileManagementPanel - 목록 렌더', () => {
  it('활성/비활성 배지를 보여주고, 비활성 파일에만 "활성화" 버튼이 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([
          makeFileInfo(1, 'SIGNATURE', true, 'active-sig.png'),
          makeFileInfo(2, 'PROFILE_PICTURE', false, 'inactive-pic.png'),
        ]),
      ),
    )

    renderPanel(1)

    expect(await screen.findByText('active-sig.png · 0.0 MB')).toBeInTheDocument()
    expect(screen.getByText('inactive-pic.png · 0.0 MB')).toBeInTheDocument()
    expect(screen.getByText('전자서명')).toBeInTheDocument()
    expect(screen.getByText('프로필 사진')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()

    // 비활성 파일(inactive-pic.png)에만 "활성화" 버튼이 노출된다(활성 파일에는 없음).
    expect(screen.getAllByRole('button', { name: '활성화' })).toHaveLength(1)
  })
})

describe('EmpFileManagementPanel - 활성화', () => {
  it('"활성화" 버튼 클릭 시 PATCH 활성화 요청이 나가고 성공 토스트가 뜬다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([makeFileInfo(2, 'PROFILE_PICTURE', false, 'inactive-pic.png')]),
      ),
      http.patch(`${BASE_URL}/api/employees/me/files/2/status`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderPanel(1)

    await user.click(await screen.findByRole('button', { name: '활성화' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('파일을 활성화했습니다'))
  })
})

describe('EmpFileManagementPanel - 삭제(AlertDialog 확인 게이트)', () => {
  it('트리거만 클릭하고 확정하지 않으면 삭제 요청이 나가지 않는다', async () => {
    let deleteCalled = false
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([makeFileInfo(3, 'SIGNATURE', true, 'sig.png')]),
      ),
      http.delete(`${BASE_URL}/api/employees/1/files/3`, () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderPanel(1)

    await user.click(await screen.findByRole('button', { name: 'sig.png 삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '취소' }))

    expect(deleteCalled).toBe(false)
  })

  it('확정 시 DELETE 요청이 나가고 성공 토스트가 뜬다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([makeFileInfo(3, 'SIGNATURE', true, 'sig.png')]),
      ),
      http.delete(`${BASE_URL}/api/employees/1/files/3`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderPanel(1)

    await user.click(await screen.findByRole('button', { name: 'sig.png 삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('파일을 삭제했습니다'))
  })
})

describe('EmpFileManagementPanel - empId 미확정', () => {
  it('empId가 undefined면 삭제 트리거 버튼이 비활성화된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([makeFileInfo(3, 'SIGNATURE', true, 'sig.png')]),
      ),
    )
    renderPanel(undefined)

    expect(await screen.findByRole('button', { name: 'sig.png 삭제' })).toBeDisabled()
  })
})
