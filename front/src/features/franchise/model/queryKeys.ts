export const franchiseKeys = {
  all: ['franchise'] as const,
  list: (params?: {
    keyword?: string
    status?: string
    managerId?: number
    page?: number
    size?: number
  }) => [...franchiseKeys.all, 'list', params] as const,
  detail: (franchiseId: number) => [...franchiseKeys.all, 'detail', franchiseId] as const,
  assignableManagers: () => [...franchiseKeys.all, 'assignableManagers'] as const,
  monthlySales: (franchiseId: number, yearMonth: string) =>
    [...franchiseKeys.all, 'monthlySales', franchiseId, yearMonth] as const,
  education: {
    calendar: (start?: string, end?: string) =>
      [...franchiseKeys.all, 'education', 'calendar', start, end] as const,
    detail: (educationId: number) =>
      [...franchiseKeys.all, 'education', 'detail', educationId] as const,
    applicants: (educationId: number, params?: { page?: number; size?: number }) =>
      [...franchiseKeys.all, 'education', 'applicants', educationId, params] as const,
  },
  inquiry: {
    list: (params?: {
      isAnswered?: boolean
      assignedManagerId?: number
      keyword?: string
      from?: string
      to?: string
      page?: number
      size?: number
    }) => [...franchiseKeys.all, 'inquiry', 'list', params] as const,
    detail: (inquiryId: number) => [...franchiseKeys.all, 'inquiry', 'detail', inquiryId] as const,
    answer: (inquiryId: number) => [...franchiseKeys.all, 'inquiry', 'answer', inquiryId] as const,
  },
  sales: {
    yearly: (franchiseId: number, year: number) =>
      [...franchiseKeys.all, 'sales', 'yearly', franchiseId, year] as const,
    daily: (franchiseId: number, date: string) =>
      [...franchiseKeys.all, 'sales', 'daily', franchiseId, date] as const,
  },
}
