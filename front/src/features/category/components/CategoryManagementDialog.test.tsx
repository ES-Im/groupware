import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { CategoryItem } from '../model/category'
import { CategoryManagementDialog } from './CategoryManagementDialog'

/**
 * CategoryManagementDialog(+CategoryManagementPanel/Row, ADMIN 전용) 검증.
 * FranchiseEducationCreateDialog.test.tsx 관행을 따른다 — zod 사전검증·성공 시 요청 바디·
 * 토스트, 그리고 이 도메인 고유 관심사(목록 렌더·이름수정 인라인 전환·노출/숨김 토글)를 더한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function pageOf(content: CategoryItem[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
  }
}

function renderDialog() {
  const onOpenChange = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <CategoryManagementDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('CategoryManagementDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('관리 목록이 로드되면 카테고리명과 노출/숨김 배지가 표시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () =>
        HttpResponse.json(
          pageOf([
            { categoryId: 1, categoryName: '공지사항', isVisible: true },
            { categoryId: 2, categoryName: '비공개 게시판', isVisible: false },
          ]),
        ),
      ),
    )
    renderDialog()

    const visibleRow = (await screen.findByText('공지사항')).closest('li')
    const hiddenRow = screen.getByText('비공개 게시판').closest('li')
    expect(visibleRow).not.toBeNull()
    expect(hiddenRow).not.toBeNull()
    expect(within(visibleRow!).getByText('노출')).toBeInTheDocument()
    expect(within(hiddenRow!).getByText('숨김')).toBeInTheDocument()
  })

  it('빈 값으로 등록 제출 시 zod 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    const postSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf([]))),
      http.post(`${BASE_URL}/api/categories`, () => {
        postSpy()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('조회 조건에 해당하는 카테고리가 없습니다.')

    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('카테고리명을 입력해주세요')).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('30자를 초과해 등록하면 zod 사전검증 메시지가 표시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf([]))),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('조회 조건에 해당하는 카테고리가 없습니다.')

    // Input maxLength=30이 실제 타이핑을 30자로 막으므로, HTML 제약을 우회하는 fireEvent.change로
    // .value를 직접 31자로 세팅해 zod max(30) 검증 자체가 이 경계를 잡아내는지 확인한다
    // (CommentForm.test.tsx 301자 경계 테스트와 동일한 이유).
    fireEvent.change(screen.getByPlaceholderText('새 카테고리명'), {
      target: { value: '가'.repeat(31) },
    })
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('카테고리명은 30자 이하로 입력해주세요')).toBeInTheDocument()
  })

  it('등록 성공 시 categoryName body로 POST하고 성공 토스트를 띄운다', async () => {
    let requestBody: unknown
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf([]))),
      http.post(`${BASE_URL}/api/categories`, async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('조회 조건에 해당하는 카테고리가 없습니다.')

    await user.type(screen.getByPlaceholderText('새 카테고리명'), '공지사항')
    await user.click(screen.getByRole('button', { name: '추가' }))

    await waitFor(() => expect(requestBody).toEqual({ categoryName: '공지사항' }))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('카테고리를 등록했습니다'))
  })

  it('이름수정 클릭 시 인라인 폼으로 전환되고, 저장하면 PATCH 요청 후 목록 표기로 돌아간다', async () => {
    let requestBody: unknown
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () =>
        HttpResponse.json(pageOf([{ categoryId: 1, categoryName: '공지사항', isVisible: true }])),
      ),
      http.patch(`${BASE_URL}/api/categories/1/name`, async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('공지사항')

    await user.click(screen.getByRole('button', { name: '이름수정' }))
    const renameInput = screen.getByPlaceholderText('카테고리명을 입력해주세요')
    await user.clear(renameInput)
    await user.type(renameInput, '변경된 이름')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(requestBody).toEqual({ categoryName: '변경된 이름' }))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('카테고리명을 변경했습니다'))
  })

  it('이름수정 중 취소를 누르면 원래 값을 바꾸지 않고 목록 표기로 돌아간다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () =>
        HttpResponse.json(pageOf([{ categoryId: 1, categoryName: '공지사항', isVisible: true }])),
      ),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('공지사항')

    await user.click(screen.getByRole('button', { name: '이름수정' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.getByText('공지사항')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('카테고리명을 입력해주세요')).not.toBeInTheDocument()
  })

  it('노출 카테고리의 "숨기기"는 AlertDialog 확인 후 deactivation을 PATCH한다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () =>
        HttpResponse.json(pageOf([{ categoryId: 1, categoryName: '공지사항', isVisible: true }])),
      ),
      http.patch(`${BASE_URL}/api/categories/1/visibility/deactivation`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('공지사항')

    await user.click(screen.getByRole('button', { name: '숨기기' }))
    const alertDialog = await screen.findByRole('alertdialog')
    expect(within(alertDialog).getByText('카테고리를 숨기시겠습니까?')).toBeInTheDocument()
    await user.click(within(alertDialog).getByRole('button', { name: '숨기기' }))

    await waitFor(() => expect(patchSpy).toHaveBeenCalledTimes(1))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('카테고리를 숨겼습니다'))
  })

  it('숨김 카테고리의 "노출하기"는 확인 없이 즉시 activation을 PATCH한다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () =>
        HttpResponse.json(pageOf([{ categoryId: 1, categoryName: '비공개 게시판', isVisible: false }])),
      ),
      http.patch(`${BASE_URL}/api/categories/1/visibility/activation`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('비공개 게시판')

    await user.click(screen.getByRole('button', { name: '노출하기' }))

    await waitFor(() => expect(patchSpy).toHaveBeenCalledTimes(1))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('카테고리를 노출했습니다'))
  })

  it('노출여부 필터를 바꾸면 isVisible 쿼리 파라미터가 반영된 요청을 보낸다', async () => {
    const searches: string[] = []
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, ({ request }) => {
        searches.push(new URL(request.url).search)
        return HttpResponse.json(pageOf([]))
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await screen.findByText('조회 조건에 해당하는 카테고리가 없습니다.')

    await user.selectOptions(screen.getByLabelText('노출여부 필터'), '숨김')

    await waitFor(() => expect(searches.some((search) => search.includes('isVisible=false'))).toBe(true))
  })
})
