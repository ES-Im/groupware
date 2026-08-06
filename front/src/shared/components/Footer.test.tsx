import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { companyKeys } from '@/features/company/model/companyKeys'
import { server } from '@/test/mocks/server'
import { Footer } from './Footer'

function companyFixture() {
  return {
    companyId: 1,
    companyName: 'HARUON',
    location: '서울특별시 강남구',
    presentedEmail: 'contact@haruon.com',
    presentedExternalNo: '02-1234-5678',
    ownerName: '김대표',
    homePageURL: 'https://haruon.com',
    editedAt: '2026-07-01T10:00:00',
  }
}

function renderFooter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <Footer />
    </QueryClientProvider>,
  )
  return { queryClient, ...view }
}

async function waitForQuerySettled(queryClient: QueryClient) {
  await waitFor(() => {
    const state = queryClient.getQueryState(companyKeys.info())
    expect(state?.fetchStatus).toBe('idle')
  })
}

describe('Footer', () => {
  it('회사 정보 조회 성공 시 회사명·대표자·위치·연락처·이메일·홈페이지 링크를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () => HttpResponse.json(companyFixture())),
    )

    renderFooter()

    const link = await screen.findByRole('link', { name: 'https://haruon.com' })
    expect(screen.getByText(/김대표/)).toBeInTheDocument()
    expect(screen.getByText(/서울특별시 강남구/)).toBeInTheDocument()
    expect(screen.getByText(/02-1234-5678/)).toBeInTheDocument()
    expect(screen.getByText(/contact@haruon.com/)).toBeInTheDocument()

    expect(link).toHaveAttribute('href', 'https://haruon.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('미등록(404) 시 정적 폴백 문구를 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'COMPANY_001', name: 'COMPANY_NOT_FOUND_EXCEPTION', httpStatus: 404, message: '조회된 회사 정보가 없습니다' },
          { status: 404 },
        ),
      ),
    )

    const { queryClient } = renderFooter()

    await waitForQuerySettled(queryClient)
    const state = queryClient.getQueryState(companyKeys.info())
    expect(state?.status).toBe('success')
    expect(state?.data).toBeNull()

    expect(screen.getByText(/하루온 그룹\(HARUON Group\)/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('조회 실패(500) 시에도 정적 폴백 문구로 조용히 내려간다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/companies`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_SERVER_ERROR', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    const { queryClient } = renderFooter()

    await waitForQuerySettled(queryClient)
    const state = queryClient.getQueryState(companyKeys.info())
    expect(state?.status).toBe('error')

    expect(screen.getByText(/하루온 그룹\(HARUON Group\)/)).toBeInTheDocument()
  })
})
