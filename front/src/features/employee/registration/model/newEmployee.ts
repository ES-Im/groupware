export interface NewEmpRecord {
  empId: number
  empNo: string
  name: string
  loginId: string
  email: string
  extensionNo: string
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

export type NewEmployeesPage = Page<NewEmpRecord>
