import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMessages } from './getMessages'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getMessages', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, numberOfElements: 0, first: true, last: true, empty: true },
    })
  })

  it('box를 경로 세그먼트로 사용한다', async () => {
    await getMessages('sent')

    const [url] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/messages/sent')
  })

  it('params가 없으면 빈 쿼리 객체를 전달한다', async () => {
    await getMessages('received')

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('keyword가 있으면 쿼리에 포함하고, 없으면(빈 문자열) 제외한다', async () => {
    await getMessages('received', { keyword: '점심' })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).toMatchObject({ keyword: '점심' })

    vi.mocked(apiClient.get).mockClear()
    await getMessages('received', { keyword: '' })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).not.toHaveProperty('keyword')
  })

  it('page/size는 값이 있을 때만 쿼리에 포함된다', async () => {
    await getMessages('sent', { page: 2, size: 20 })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).toMatchObject({ page: 2, size: 20 })

    vi.mocked(apiClient.get).mockClear()
    await getMessages('sent', {})
    const params = vi.mocked(apiClient.get).mock.calls[0][1]?.params
    expect(params).not.toHaveProperty('page')
    expect(params).not.toHaveProperty('size')
  })

  it('box==="received"이고 isRead가 지정되면 쿼리에 포함한다', async () => {
    await getMessages('received', { isRead: true })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).toMatchObject({ isRead: true })

    vi.mocked(apiClient.get).mockClear()
    await getMessages('received', { isRead: false })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).toMatchObject({ isRead: false })
  })

  it('box!=="received"이면 isRead를 지정해도 쿼리에서 제외한다(서버가 받은함만 지원)', async () => {
    await getMessages('sent', { isRead: true })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).not.toHaveProperty('isRead')

    vi.mocked(apiClient.get).mockClear()
    await getMessages('drafts', { isRead: true })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).not.toHaveProperty('isRead')

    vi.mocked(apiClient.get).mockClear()
    await getMessages('trash', { isRead: true })
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).not.toHaveProperty('isRead')
  })

  it('응답 Page<MessagesResponse>를 그대로 반환한다', async () => {
    const page = {
      content: [{ messageId: 1 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: page })

    const result = await getMessages('received')

    expect(result).toEqual(page)
  })
})
