import type { DepartmentSummary } from '../api/getDepartments'
import type { OrgChartTreeNode } from '../model/orgChartTree'

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
