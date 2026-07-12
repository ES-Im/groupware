/**
 * 조직도 탐색기(OrgChartExplorer) 좌측 트리가 소비하는 노드 타입.
 * `buildDepartmentTree`(lib/buildDepartmentTree.ts)가 flat한 `DepartmentSummary[]`(DEPTS 응답)를
 * 이 트리 구조로 변환한다. memberCount는 별도 병렬 조회(useDepartmentMemberCountsQuery)로 채워지므로
 * 아직 도착하지 않은 동안은 undefined다.
 */
export interface OrgChartTreeNode {
  deptId: number
  deptCode: string
  deptName: string
  isActive: boolean
  /** 부서장 이름. 공석이면 null(정규화된 deptLeader와 동일 계약). */
  deptLeaderName: string | null
  /** 부서 멤버 수. useDepartmentMemberCountsQuery 응답이 아직 도착하지 않았으면 undefined. */
  memberCount: number | undefined
  children: OrgChartTreeNode[]
}
