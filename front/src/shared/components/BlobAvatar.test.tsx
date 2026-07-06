import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { BlobAvatar } from './BlobAvatar'

/**
 * BlobAvatar(ROADMAP T5.1) 렌더 검증: blob 조회 성공 시 <img>, empId/fileId 미확정 또는
 * 조회 실패 시 이니셜 폴백을 렌더하는지 확인한다.
 */

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BlobAvatar', () => {
  it('empId+fileId 조회 성공 시 objectURL을 src로 갖는 img를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/1/files/10/preview`, () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('img').buffer, {
          headers: { 'Content-Type': 'image/png' },
        }),
      ),
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:avatar-url')

    render(<BlobAvatar empId={1} fileId={10} fallbackText="홍길동" />)

    const img = await screen.findByRole('img', { name: '홍길동' })
    expect(img).toHaveAttribute('src', 'blob:avatar-url')
  })

  it('empId가 없으면 이니셜 폴백(첫 글자)을 렌더한다', () => {
    render(<BlobAvatar fileId={10} fallbackText="홍길동" />)

    expect(screen.getByText('홍')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('조회 실패 시 이니셜 폴백을 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/1/files/999/preview`, () =>
        HttpResponse.json(
          { code: 'RESOURCE_001', name: 'NOT_FOUND', httpStatus: 404, message: '파일을 찾을 수 없습니다' },
          { status: 404 },
        ),
      ),
    )

    render(<BlobAvatar empId={1} fileId={999} fallbackText="김철수" />)

    await waitFor(() => expect(screen.getByText('김')).toBeInTheDocument())
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
