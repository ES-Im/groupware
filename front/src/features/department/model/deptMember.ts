export interface DeptMemberResponse {
  empId: number
  empNo: string
  empName: string
  extensionNo: string | null
  email: string
  position: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type DeptMembersPage = Page<DeptMemberResponse>

export interface DeptMemberSearchResult extends DeptMemberResponse {
  deptId: number
  deptName: string
}
