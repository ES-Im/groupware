import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { companyKeys } from '@/features/company/model/companyKeys'
import { server } from '@/test/mocks/server'
import { Footer } from './Footer'

/**
 * Footer(회사 정보 상시 노출, PRD §MVP 이후 기능 "후속 범위" 실행분) 검증.
 *
 * - 조회 성공(등록됨): 회사명·대표자명·위치·연락처·이메일·홈페이지 링크를 렌더.
 * - 조회 실패/미등록(404→null): 정적 폴백 문구로 그레이스풀 다운그레이드(에러 토스트 없음).
 */

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

/**
 * Footer는 로딩 중(data===undefined)에도 미등록/에러와 동일한 폴백 문구를 렌더하므로, DOM만으로는
 * "아직 로딩 중"과 "이미 404/에러로 settle됨"을 구분할 수 없다(폴백=로딩이라는 설계 특성).
 * 그래서 컴포넌트 렌더 결과가 아니라 QueryClient의 쿼리 상태를 직접 기다려 실제 settle을 보장한다.
 */
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

    // "HARUON"만으로 기다리면 폴백 문구("하루온 그룹(HARUON Group)")에도 부분일치해 실제 데이터
    // 로딩을 기다리지 않고 통과해버린다 — 실데이터 분기에만 존재하는 링크(role=link)로 대기한다.
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

    // 폴백 문구는 로딩 중에도 동일하게 보이므로, DOM 대신 쿼리 상태로 404 응답이 실제로
    // 처리(getCompanyInfo의 isNotFound → null 정규화)됐음을 먼저 보장한 뒤 단언한다.
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

    // 500이 (404처럼) null로 조용히 삼켜지지 않고 실제로 error 상태에 도달하는지까지 확인한다
    // (getCompanyInfo는 404만 null로 정규화하고 그 외는 그대로 throw해야 한다).
    await waitForQuerySettled(queryClient)
    const state = queryClient.getQueryState(companyKeys.info())
    expect(state?.status).toBe('error')

    expect(screen.getByText(/하루온 그룹\(HARUON Group\)/)).toBeInTheDocument()
  })
})
