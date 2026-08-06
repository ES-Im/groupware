export interface DeptInfoResponse {
  deptId: number
  deptCode: string
  deptName: string
  isActive: boolean
  parentDeptId: number | null
}

export interface DeptLeaderWire {
  empId: number | null
  empNo: string | null
  empName: string | null
  extensionNo: string | null
  email: string | null
  position: string | null
}

export interface DeptLeader {
  empId: number
  empNo: string
  empName: string
  extensionNo: string | null
  email: string
  position: string
}

export interface DepartmentDetailResponse {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeaderWire
}
