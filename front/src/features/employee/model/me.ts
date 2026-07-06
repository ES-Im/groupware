/**
 * 본인 정보 조회(`RETRIEVE_ME_INFO`, GET /api/employees/me) 응답 타입.
 * 필드는 back/build/generated-snippets/RETRIEVE_ME_INFO/response-fields.adoc 실측 기준(추측 금지).
 */

/** 사원 기본정보. */
export interface EmpBasicInfo {
  empNo: string
  name: string
  loginId: string
  email: string
  extensionNo: string
}

/** 활성화된 프로필사진/전자서명 파일. 이번 스코프는 파일 UI를 만들지 않아 필드만 보존한다. */
export interface ActiveFile {
  file: {
    fileId: number
    originalName: string
    extension: string
    fileSize: number
  }
  type: string
  isActive: boolean
}

/** 현재 소속 정보. endAt은 현재 소속이면 null로 내려온다. */
export interface CurrentDept {
  deptId: number
  deptCode: string
  deptName: string
  positionName: string
  isPrimary: boolean
  startAt: string
  endAt: string | null
}

export interface MeResponse {
  empBasicInfo: EmpBasicInfo
  activeFiles: ActiveFile[]
  currentDepts: CurrentDept[]
}
