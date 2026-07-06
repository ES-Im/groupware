import type { ActiveFile } from '@/features/employee/model/me'

/**
 * 활성화된 프로필사진 파일 식별 헬퍼(ROADMAP T5.1 / §B-4).
 * activeFiles 중 type==='PROFILE_PICTURE' && isActive===true인 항목의 file.fileId만 선택한다.
 * type은 `(string & {})`로 열려있는 유니온(FileType, features/employee/model/me.ts)이므로
 * 미지 값이 섞여도 단순 비교(===)라 크래시 없이 안전하게 걸러진다(찾지 못하면 undefined).
 */
export function getActiveProfilePicture(activeFiles: ActiveFile[]): number | undefined {
  return activeFiles.find((f) => f.type === 'PROFILE_PICTURE' && f.isActive)?.file.fileId
}
