import { useCompanyInfoQuery } from '@/features/company/api/useCompanyInfoQuery'

const FALLBACK_COMPANY_NAME = '하루온 그룹(HARUON Group)'

/**
 * 공통 셸 푸터(순수 시각 요소 + 회사 정보 조회). 본문(content) 컬럼 폭 안에서만 표시되며 사이드바
 * 영역을 침범하지 않는다(상위 LayoutShell에서 오른쪽 컬럼 하단에 배치). 그 안에서 구성요소는
 * 가운데 정렬한다.
 *
 * 대표/위치/연락처/홈페이지 등 상세 회사 정보는 좌측 고정 패널(ProfileRailPanel) 하단으로 옮겼고,
 * 이 푸터는 회사명·저작권 한 줄씩만 남긴다(2026-07-13 사용자 결정). `useCompanyInfoQuery`는
 * ProfileRailPanel·CompanyInfoPage와 동일 queryKey를 공유하므로 중복 조회 없이 캐시를 재사용한다.
 *
 * 로딩 중이거나 미등록(data===null) 또는 조회 실패 시에는 정적 문구로 그레이스풀 폴백한다 —
 * 푸터는 장식적 요소라 에러 토스트를 띄우지 않는다(조용한 폴백).
 */
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
