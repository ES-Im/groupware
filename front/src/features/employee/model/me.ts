/**
 * 사원 정보 조회 응답 타입(`RETRIEVE_ME_INFO`/`RETRIEVE_EMP_INFO` 공용).
 * 필드는 back/build/generated-snippets/RETRIEVE_ME_INFO/response-fields.adoc 실측 기준(추측 금지).
 * RETRIEVE_EMP_INFO(response-fields.adoc)의 필드가 완전히 동일함을 실측 대조로 확인했다(ROADMAP T2.2) —
 * EmployeeInfoResponse로 일반화해 me 조회(T1.3)와 타 사원 상세 조회(T2.2)가 타입을 공유한다.
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

export interface EmployeeInfoResponse {
  empBasicInfo: EmpBasicInfo
  activeFiles: ActiveFile[]
  currentDepts: CurrentDept[]
}

/**
 * 본인 정보 조회(RETRIEVE_ME_INFO) 응답 별칭.
 * 기존 소비처(getMe.ts, useMeQuery.ts, LayoutShell.tsx 등)의 import가 깨지지 않도록 유지한다.
 */
export type MeResponse = EmployeeInfoResponse
