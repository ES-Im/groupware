import type { ActiveFile, FileType } from '@/features/employee/model/me'

/**
 * 활성화된 프로필사진 파일 식별 헬퍼(ROADMAP T5.1 / §B-4).
 * activeFiles 중 type==='PROFILE_PICTURE' && isActive===true인 항목의 file.fileId만 선택한다.
 * type은 `(string & {})`로 열려있는 유니온(FileType, features/employee/model/me.ts)이므로
 * 미지 값이 섞여도 단순 비교(===)라 크래시 없이 안전하게 걸러진다(찾지 못하면 undefined).
 */
export function getActiveProfilePicture(activeFiles: ActiveFile[]): number | undefined {
  return activeFiles.find((f) => f.type === 'PROFILE_PICTURE' && f.isActive)?.file.fileId
}

/**
 * 활성화된 전자서명 파일 식별 헬퍼(getActiveProfilePicture 동형).
 * activeFiles 중 type==='SIGNATURE' && isActive===true인 항목의 file.fileId만 선택한다.
 */
export function getActiveSignature(activeFiles: ActiveFile[]): number | undefined {
  return activeFiles.find((f) => f.type === 'SIGNATURE' && f.isActive)?.file.fileId
}

/**
 * FileType(PROFILE_PICTURE/SIGNATURE) → 한국어 표시명(MyInfoPage 활성 파일 카드·
 * EmpFileManagementPanel 파일관리 탭이 공유). 미지 값은 원문을 그대로 보여준다(발명 금지).
 */
export function getFileTypeLabel(type: FileType): string {
  if (type === 'PROFILE_PICTURE') return '프로필 사진'
  if (type === 'SIGNATURE') return '전자서명'
  return type
}
