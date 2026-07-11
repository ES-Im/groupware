import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEmpFilePreviewUrl } from '@/shared/lib/useEmpFilePreview'
import { SignatureCard } from './SignatureCard'
import type { ActiveFile } from '../model/me'

/**
 * SignatureCard(MyInfoPage 전용, adapt-ui 리디자인) 검증.
 * useEmpFilePreviewUrl(EMP_FILE_PREVIEW blob 조회, useEmpFilePreview.test.tsx에서 이미 실동작
 * 검증됨)은 목킹해 SignatureCard 자체의 분기(빈 상태/미리보기)만 격리 검증한다.
 */
vi.mock('@/shared/lib/useEmpFilePreview', () => ({
  useEmpFilePreviewUrl: vi.fn(),
}))

function makeActiveFile(fileId: number, type: ActiveFile['type'], isActive = true): ActiveFile {
  return {
    file: { fileId, originalName: 'sig.png', extension: 'png', fileSize: 100 },
    type,
    isActive,
  }
}

function renderCard(activeFiles: ActiveFile[], empId: number | undefined = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <SignatureCard empId={empId} activeFiles={activeFiles} />
    </QueryClientProvider>,
  )
}

describe('SignatureCard - 활성 서명 없음', () => {
  it('활성 SIGNATURE가 없으면 빈 상태([이미지가 없습니다])와 업로드 버튼을 보여준다', () => {
    vi.mocked(useEmpFilePreviewUrl).mockReturnValue({
      objectUrl: undefined,
      isLoading: false,
      isError: false,
    })

    renderCard([])

    expect(screen.getByText('[이미지가 없습니다]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 첨부' })).toBeInTheDocument()
    expect(useEmpFilePreviewUrl).toHaveBeenCalledWith(1, undefined)
  })
})

describe('SignatureCard - 활성 서명 있음', () => {
  it('활성 SIGNATURE가 있으면 미리보기 이미지를 렌더하고 업로드 버튼도 함께 노출한다', () => {
    vi.mocked(useEmpFilePreviewUrl).mockReturnValue({
      objectUrl: 'blob:mock-signature',
      isLoading: false,
      isError: false,
    })

    renderCard([makeActiveFile(5, 'SIGNATURE')])

    const img = screen.getByRole('img', { name: '내 전자서명' })
    expect(img).toHaveAttribute('src', 'blob:mock-signature')
    expect(screen.queryByText('[이미지가 없습니다]')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 첨부' })).toBeInTheDocument()
    expect(useEmpFilePreviewUrl).toHaveBeenCalledWith(1, 5)
  })

  it('조회는 성공했지만 isError=true면 빈 상태로 폴백한다', () => {
    vi.mocked(useEmpFilePreviewUrl).mockReturnValue({
      objectUrl: 'blob:stale',
      isLoading: false,
      isError: true,
    })

    renderCard([makeActiveFile(5, 'SIGNATURE')])

    expect(screen.getByText('[이미지가 없습니다]')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '내 전자서명' })).not.toBeInTheDocument()
  })
})
