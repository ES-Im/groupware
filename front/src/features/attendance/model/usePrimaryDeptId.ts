import { useMeQuery } from '@/features/employee/api/useMeQuery'

/**
 * 본인의 주(primary) 소속 부서 deptId를 도출하는 순수 파생 훅(ROADMAP2 T3.2).
 * 신규 API 호출 없이 기존 `useMeQuery()`(재구축 금지, 소비만) 캐시 데이터에서
 * `currentDepts[]` 중 `isPrimary === true`인 항목의 deptId만 뽑아낸다.
 *
 * `useMeQuery`가 로딩 중이거나 `currentDepts`가 비어있거나 primary 소속이 없으면
 * `undefined`를 반환한다. 이는 의도된 게이팅 계약이며, T3.3의 부서 근태 조회 훅은
 * `enabled: deptId !== undefined`로 이 값을 그대로 소비해 deptId 확정 전까지 대기한다.
 *
 * **주의(department 도메인과 폴백 정책이 다름 — 이름이 비슷해 혼동 주의)**:
 * `features/department/lib/getPrimaryDeptId.ts`는 조회 편의를 위해 isPrimary가
 * 없으면 `currentDepts[0]`으로 폴백하지만, 이 훅은 **폴백 없이 엄격(strict)하게**
 * isPrimary 부서만 인정한다. 근태 도메인은 `DEPT_MANAGER`가 어느 부서를 조회·승인할지
 * 결정하는 축이라, isPrimary 부재 시 임의로 다른 부서를 골라 잘못된 부서 데이터를
 * 조회/승인하는 사고를 막기 위함이다(PRD Open Q#2 전제, 사용자 확정 결정).
 * department의 기존 헬퍼는 이번 태스크 범위 밖이라 변경하지 않는다.
 *
 * 가정(PRD Open Q#2 — 미해결): 매니저가 복수 부서를 겸직 관리하는 경우 isPrimary
 * 단일 부서만으로는 부족해 부서 선택 UI가 필요할 수 있다. 이번 태스크는 PRD가 명시한
 * isPrimary 단일 축 가정만 구현하며, 복수 부서 관리 시나리오는 범위 밖이다.
 */
export function usePrimaryDeptId(): number | undefined {
  const { data } = useMeQuery()
  const primaryDept = data?.currentDepts.find((dept) => dept.isPrimary)
  return primaryDept?.deptId
}
