import { apiClient } from '@/shared/api/client'
import type { MailBox, MessagesResponse } from '../model/messageTypes'

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface MessageListQueryParams {
  keyword?: string
  isRead?: boolean
  page?: number
  size?: number
}

export async function getMessages(
  box: MailBox,
  params?: MessageListQueryParams,
): Promise<Page<MessagesResponse>> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (box === 'received' && params?.isRead != null) {
    query.isRead = params.isRead
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<MessagesResponse>>(`/api/messages/${box}`, {
    params: query,
  })
  return data
}
