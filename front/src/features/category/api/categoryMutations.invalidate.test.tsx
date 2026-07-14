import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { CategoryItem } from '../model/category'
import { useCategoryActivateMutation } from './useCategoryActivateMutation'
import { useCategoryDeactivateMutation } from './useCategoryDeactivateMutation'
import { useCategoryManagementQuery } from './useCategoryManagementQuery'
import { useCategoryRegisterMutation } from './useCategoryRegisterMutation'
import { useCategoryUpdateNameMutation } from './useCategoryUpdateNameMutation'

/**
 * 카테고리 관리 mutation 4종(CATEGORY_REGISTER/UPDATE_NAME/ACTIVATE/DEACTIVATE, ADMIN 전용) 성공
 * 후 invalidate 동작을 검증한다. boardFileMutations.invalidate.test.tsx와 동일 관행: mock을
 * 가로채지 않고 "성공 후 관리 목록 쿼리가 실제로 재조회되어 최신 값을 반영하는지"를 블랙박스로
 * 확인한다. 팀리드 브리프대로 4종 모두 categoryKeys.all 전체를 invalidate하므로, 관리 목록
 * (CATEGORY_MANAGEMENT)이 갱신되는지만 확인하면 충분하다(노출 목록 CATEGORY_LIST도 같은 접두어
 * 아래라 동일 메커니즘 — 개별 검증은 생략).
 */

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe('카테고리 관리 mutation invalidate (ADMIN 전용)', () => {
  it('등록(CATEGORY_REGISTER) 성공 시 관리 목록이 재조회되어 새 카테고리가 반영된다', async () => {
    let categories: CategoryItem[] = []
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf(categories))),
      http.post(`${BASE_URL}/api/categories`, () => {
        categories = [...categories, { categoryId: 1, categoryName: '공지사항', isVisible: true }]
        return new HttpResponse(null, { status: 201 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({ list: useCategoryManagementQuery(), mutation: useCategoryRegisterMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content).toEqual([]))

    result.current.mutation.mutate('공지사항')

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content).toHaveLength(1))
  })

  it('이름변경(CATEGORY_UPDATE_NAME) 성공 시 관리 목록이 재조회되어 바뀐 이름이 반영된다', async () => {
    let categories: CategoryItem[] = [{ categoryId: 1, categoryName: '공지사항', isVisible: true }]
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf(categories))),
      http.patch(`${BASE_URL}/api/categories/1/name`, () => {
        categories = [{ categoryId: 1, categoryName: '변경된 이름', isVisible: true }]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({ list: useCategoryManagementQuery(), mutation: useCategoryUpdateNameMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content[0].categoryName).toBe('공지사항'))

    result.current.mutation.mutate({ categoryId: 1, categoryName: '변경된 이름' })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content[0].categoryName).toBe('변경된 이름'))
  })

  it('숨김(CATEGORY_DEACTIVATE) 성공 시 관리 목록이 재조회되어 isVisible이 반영된다', async () => {
    let categories: CategoryItem[] = [{ categoryId: 1, categoryName: '공지사항', isVisible: true }]
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf(categories))),
      http.patch(`${BASE_URL}/api/categories/1/visibility/deactivation`, () => {
        categories = [{ categoryId: 1, categoryName: '공지사항', isVisible: false }]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({ list: useCategoryManagementQuery(), mutation: useCategoryDeactivateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content[0].isVisible).toBe(true))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content[0].isVisible).toBe(false))
  })

  it('노출(CATEGORY_ACTIVATE) 성공 시 관리 목록이 재조회되어 isVisible이 반영된다', async () => {
    let categories: CategoryItem[] = [{ categoryId: 1, categoryName: '공지사항', isVisible: false }]
    server.use(
      http.get(`${BASE_URL}/api/categories/management`, () => HttpResponse.json(pageOf(categories))),
      http.patch(`${BASE_URL}/api/categories/1/visibility/activation`, () => {
        categories = [{ categoryId: 1, categoryName: '공지사항', isVisible: true }]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const Wrapper = createWrapper()

    const { result } = renderHook(
      () => ({ list: useCategoryManagementQuery(), mutation: useCategoryActivateMutation() }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.list.data?.content[0].isVisible).toBe(false))

    result.current.mutation.mutate(1)

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.data?.content[0].isVisible).toBe(true))
  })
})
