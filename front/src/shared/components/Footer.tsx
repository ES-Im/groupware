import { useCompanyInfoQuery } from '@/features/company/api/useCompanyInfoQuery'

const FALLBACK_COMPANY_NAME = '하루온 그룹(HARUON Group)'

export function Footer() {
  const { data } = useCompanyInfoQuery()
  const companyName = data?.companyName ?? FALLBACK_COMPANY_NAME

  return (
    <footer className="shrink-0 border-t border-border bg-background px-4 py-4 text-center text-sm text-muted-foreground">
      <p>{companyName}</p>
      <p>
        &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </footer>
  )
}
