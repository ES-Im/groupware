import { useCompanyInfoQuery } from '@/features/company/api/useCompanyInfoQuery'

const FALLBACK_COMPANY_NAME = '하루온 그룹(HARUON Group)'

/**
 * 공통 셸 푸터(순수 시각 요소 + 회사 정보 조회). 본문(content) 컬럼 폭 안에서만 표시되며 사이드바
 * 영역을 침범하지 않는다(상위 LayoutShell에서 오른쪽 컬럼 하단에 배치). 그 안에서 구성요소는
 * 가운데 정렬한다.
 *
 * 회사 정보(COMPANY_INFO, `GET /api/companies`, permitAll)는 COMPANY 도메인 완료 시점에
 * `api-endpoint.md`에 계약이 보강되어 이제 동적으로 연결한다(PRD §MVP 이후 기능에서 "후속 범위"로
 * 미뤄둔 상시 노출 위젯). `useCompanyInfoQuery`는 LayoutShell에 이미 마운트된 CompanyInfoPage와
 * 동일 queryKey를 공유하므로 중복 조회 없이 캐시를 재사용한다.
 *
 * 로딩 중이거나 미등록(data===null) 또는 조회 실패 시에는 정적 문구로 그레이스풀 폴백한다 —
 * 푸터는 장식적 요소라 에러 토스트를 띄우지 않는다(조용한 폴백).
 */
export function Footer() {
  const { data } = useCompanyInfoQuery()

  if (!data) {
    return (
      <footer className="shrink-0 border-t border-border bg-background px-4 py-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {FALLBACK_COMPANY_NAME}. All rights reserved.
        </p>
      </footer>
    )
  }

  return (
    <footer className="shrink-0 border-t border-border bg-background px-4 py-4 text-center text-sm text-muted-foreground">
      <p>
        {data.companyName} · 대표 {data.ownerName} · {data.location}
      </p>
      <p>
        대표전화 {data.presentedExternalNo} · 이메일 {data.presentedEmail} ·{' '}
        <a
          href={data.homePageURL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {data.homePageURL}
        </a>
      </p>
      <p>
        &copy; {new Date().getFullYear()} {data.companyName}. All rights reserved.
      </p>
    </footer>
  )
}
