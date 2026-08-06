export const categoryKeys = {
  all: ['category'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  management: (params?: {
    keyword?: string
    isVisible?: boolean
    page?: number
    size?: number
  }) => [...categoryKeys.all, 'management', params] as const,
}
