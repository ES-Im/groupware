import type { ActiveFile, FileType } from '@/features/employee/model/me'

export function getActiveProfilePicture(activeFiles: ActiveFile[]): number | undefined {
  return activeFiles.find((f) => f.type === 'PROFILE_PICTURE' && f.isActive)?.file.fileId
}

export function getActiveSignature(activeFiles: ActiveFile[]): number | undefined {
  return activeFiles.find((f) => f.type === 'SIGNATURE' && f.isActive)?.file.fileId
}

export function getFileTypeLabel(type: FileType): string {
  if (type === 'PROFILE_PICTURE') return '프로필 사진'
  if (type === 'SIGNATURE') return '전자서명'
  return type
}
