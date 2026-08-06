export interface EmpBasicInfo {
  empId: number
  empNo: string
  name: string
  loginId: string
  email: string
  extensionNo: string | null
}

export type FileType = 'PROFILE_PICTURE' | 'SIGNATURE' | (string & {})

export interface ActiveFile {
  file: {
    fileId: number
    originalName: string
    extension: string
    fileSize: number
  }
  type: FileType
  isActive: boolean
}

export interface CurrentDept {
  deptId: number
  deptCode: string
  deptName: string
  positionName: string
  isPrimary: boolean
  startAt: string
  endAt: string | null
}

export interface EmployeeInfoResponse {
  empBasicInfo: EmpBasicInfo
  activeFiles: ActiveFile[]
  currentDepts: CurrentDept[]
}

export type MeResponse = EmployeeInfoResponse
