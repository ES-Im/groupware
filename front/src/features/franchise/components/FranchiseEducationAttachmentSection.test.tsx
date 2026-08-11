import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { FranchiseEducationFileInfo } from '../model/franchise'
import { FranchiseEducationAttachmentSection } from './FranchiseEducationAttachmentSection'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

function imageFile(overrides: Partial<FranchiseEducationFileInfo> = {}): FranchiseEducationFileInfo {
  return { fileId: 1, originalName: 'photo.jpg', extension: 'jpg', fileSize: 1024, ...overrides }
}

function docFile(overrides: Partial<FranchiseEducationFileInfo> = {}): FranchiseEducationFileInfo {
  return { fileId: 2, originalName: 'guide.pdf', extension: 'pdf', fileSize: 2048, ...overrides }
}

function renderSection(
  files: FranchiseEducationFileInfo[] | null,
  educationId = 1,
  isOwner = true,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <FranchiseEducationAttachmentSection
        educationId={educationId}
        files={files}
        isOwner={isOwner}
      />
    </QueryClientProvider>,
  )
  return { ...utils, queryClient }
}

describe('FranchiseEducationAttachmentSection - 렌더 분기', () => {
  it('첨부파일이 없으면 안내 문구를 보여준다', () => {
    renderSection(null)

    expect(screen.getByText('첨부파일이 없습니다.')).toBeInTheDocument()
  })

  it('이미지 첨부는 인라인 미리보기, 비이미지 첨부는 다운로드 버튼으로 분기 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/educations/1/files/1/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('image-bytes').buffer, {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    renderSection([imageFile(), docFile()])

    expect(screen.getByText('첨부파일 2개')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'photo.jpg' })).toHaveAttribute(
        'src',
        'blob:mock-preview',
      ),
    )
    expect(screen.queryByRole('button', { name: 'photo.jpg 다운로드' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'guide.pdf 다운로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '파일 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'photo.jpg 삭제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'guide.pdf 삭제' })).toBeInTheDocument()
  })
})

describe('FranchiseEducationAttachmentSection - 등록자 권한', () => {
  it('등록자 본인이 아니면 파일 추가/삭제 버튼이 비활성화된다', () => {
    renderSection([docFile()], 1, false)

    expect(screen.getByRole('button', { name: '파일 추가' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'guide.pdf 삭제' })).toBeDisabled()
  })
})

describe('FranchiseEducationAttachmentSection - 업로드', () => {
  it('업로드 성공 시 성공 토스트가 뜬다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/educations/1/files`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    const { container } = renderSection([])

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'a.pdf', { type: 'application/pdf' })
    await user.upload(input, file)

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('첨부파일을 업로드했습니다'))
  })

  it('사전검증 위반(비허용 확장자) 시 네트워크 요청 없이 검증 에러 메시지를 그대로 토스트에 노출한다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/educations/1/files`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { container } = renderSection([])

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['bad'], 'virus.exe', { type: 'application/octet-stream' })
    await user.upload(input, file)

    const { toast } = await import('sonner')
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('허용되지 않는 확장자입니다: .exe'),
    )
    expect(patchSpy).not.toHaveBeenCalled()
  })
})

describe('FranchiseEducationAttachmentSection - 삭제', () => {
  it('삭제 성공 시 성공 토스트가 뜬다', async () => {
    server.use(
      http.delete(`${BASE_URL}/api/educations/1/files/2`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderSection([docFile()])

    await user.click(screen.getByRole('button', { name: 'guide.pdf 삭제' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('첨부파일을 삭제했습니다'))
  })
})
