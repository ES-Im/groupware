export interface OrgChartTreeNode {
  deptId: number
  deptCode: string
  deptName: string
  isActive: boolean
  deptLeaderName: string | null
  memberCount: number | undefined
  children: OrgChartTreeNode[]
}
