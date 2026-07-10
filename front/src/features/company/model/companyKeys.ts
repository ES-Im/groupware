/**
 * company 도메인 queryKey 팩토리(ROADMAP-COMPANY.md T1.1).
 * 단일 회사 체제 고정(§범위 경계) — 파라미터 없이 info() 하나만 갖는다.
 * invalidateQueries(companyKeys.all)로 등록/수정 3종 mutation 성공 시 하위 전체를 한 번에 갱신한다.
 */
export const companyKeys = {
  all: ['company'] as const,
  info: () => [...companyKeys.all, 'info'] as const,
}
