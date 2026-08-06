import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { FileListInfo } from '../model/messageTypes'
import { MessageAttachmentSection } from './MessageAttachmentSection'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function makeFile(overrides: Partial<FileListInfo> = {}): FileListInfo {
  return {
    fileId: 1,
    originalName: '보고서.pdf',
    extension: 'pdf',
    fileSize: 2 * 1024 * 1024,
    ...overrides,
  }
}

function renderSection(messageId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MessageAttachmentSection messageId={messageId} />
    </QueryClientProvider>,
  )
}

describe('MessageAttachmentSection (F1519) - 목록 렌더', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('첨부가 없으면 "첨부파일이 없습니다." 안내를 보여준다', async () => {
    server.use(http.get(`${BASE_URL}/api/messages/1/files`, () => HttpResponse.json([])))
    renderSection(1)

    expect(await screen.findByText('첨부파일이 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('첨부파일')).toBeInTheDocument()
  })

  it('첨부가 있으면 개수 접미사(N개)와 파일명·MB 단위 용량을 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/1/files`, () =>
        HttpResponse.json([makeFile({ fileId: 1, originalName: '보고서.pdf', fileSize: 2 * 1024 * 1024 })]),
      ),
    )
    renderSection(1)

    expect(await screen.findByText('첨부파일 1개')).toBeInTheDocument()
    expect(screen.getByText('보고서.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
  })

  it('조회 실패 시 인라인 에러 메시지를 보여준다(목록 복귀 UX 없음)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/1/files`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'SERVER_ERROR', httpStatus: 500, message: '첨부 목록을 불러오지 못했습니다' },
          { status: 500 },
        ),
      ),
    )
    renderSection(1)

    expect(await screen.findByText('첨부 목록을 불러오지 못했습니다')).toBeInTheDocument()
  })
})

describe('MessageAttachmentSection (F1522) - 이미지/비이미지 분기', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('비이미지 첨부(pdf)는 다운로드 버튼을 렌더하고 클릭 시 다운로드 엔드포인트를 호출한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/1/files`, () =>
        HttpResponse.json([makeFile({ fileId: 1, originalName: '보고서.pdf', extension: 'pdf' })]),
      ),
    )
    let downloadCalled = false
    server.use(
      http.get(`${BASE_URL}/api/messages/1/files/1/download`, () => {
        downloadCalled = true
        return HttpResponse.arrayBuffer(new ArrayBuffer(4), {
          headers: { 'Content-Type': 'application/pdf' },
        })
      }),
    )
    const user = userEvent.setup()
    renderSection(1)

    await user.click(await screen.findByRole('button', { name: '보고서.pdf 다운로드' }))

    await waitFor(() => expect(downloadCalled).toBe(true))
  })

  it('이미지 첨부(png)는 다운로드 버튼과 [미리보기] 버튼을 렌더하고, 미리보기 클릭 시 모달에 이미지를 보여준다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/messages/1/files`, () =>
        HttpResponse.json([makeFile({ fileId: 2, originalName: '사진.png', extension: 'png' })]),
      ),
      http.get(`${BASE_URL}/api/messages/1/files/2/preview`, () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(4), { headers: { 'Content-Type': 'image/png' } }),
      ),
    )
    const user = userEvent.setup()
    renderSection(1)

    await screen.findByText('사진.png')
    expect(screen.getByRole('button', { name: '사진.png 다운로드' })).toBeInTheDocument()
    expect(screen.queryByAltText('사진.png')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '미리보기' }))
    expect(await screen.findByAltText('사진.png')).toBeInTheDocument()
  })
})
