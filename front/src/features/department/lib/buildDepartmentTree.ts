import type { DepartmentSummary } from '../api/getDepartments'
import type { OrgChartTreeNode } from '../model/orgChartTree'

/**
 * flat한 부서 목록(DEPTS 응답, parentDeptId 포함)을 조직도 트리로 변환하는 순수 함수.
 *
 * parentDeptId가 null이거나, 목록 안에 존재하지 않는 부모를 가리키면(예: 페이지 크기 제한으로
 * 상위 부서가 응답에서 빠진 경우) 루트로 취급한다 — 순환 참조·고아 노드를 화면에서 누락시키지
 * 않기 위한 방어적 규칙이다.
 *
 * memberCounts는 useDepartmentMemberCountsQuery(별도 병렬 조회)의 결과를 주입받는다. 아직 도착하지
 * 않은 부서는 memberCount가 undefined로 남는다.
 */
export function buildDepartmentTree(
  departments: DepartmentSummary[],
  memberCounts?: Record<number, number>,
): OrgChartTreeNode[] {
  const idSet = new Set(departments.map((dept) => dept.deptInfoResponse.deptId))
  const nodeMap = new Map<number, OrgChartTreeNode>()

  for (const dept of departments) {
    const { deptId, deptCode, deptName, isActive } = dept.deptInfoResponse
    nodeMap.set(deptId, {
      deptId,
      deptCode,
      deptName,
      isActive,
      deptLeaderName: dept.deptLeader?.empName ?? null,
      memberCount: memberCounts?.[deptId],
      children: [],
    })
  }

  const roots: OrgChartTreeNode[] = []
  for (const dept of departments) {
    const { deptId, parentDeptId } = dept.deptInfoResponse
    const node = nodeMap.get(deptId)
    if (!node) {
      continue
    }
    if (parentDeptId !== null && idSet.has(parentDeptId)) {
      nodeMap.get(parentDeptId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
