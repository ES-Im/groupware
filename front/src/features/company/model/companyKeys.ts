export const companyKeys = {
  all: ['company'] as const,
  info: () => [...companyKeys.all, 'info'] as const,
}
