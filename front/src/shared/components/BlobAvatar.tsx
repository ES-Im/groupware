import { useEmpFilePreviewUrl } from '@/shared/lib/useEmpFilePreview'
import { cn } from '@/shared/lib/utils'

interface BlobAvatarProps {
  /** 사원 식별 번호. 미확정(undefined)이면 이니셜 폴백을 렌더한다(§리스크7 numeric empId 미보유 케이스). */
  empId?: number
  /** 활성 PROFILE_PICTURE 파일 식별 번호. shared/lib/activeFiles.ts의 getActiveProfilePicture로 도출한다. */
  fileId?: number
  /** 이니셜 폴백에 쓸 표시 이름(첫 글자만 사용). */
  fallbackText: string
  className?: string
}

/**
 * 인증 필요 이미지 blob-avatar 공유 프리미티브(ROADMAP T5.1 / §B-4).
 * empId+fileId가 모두 있으면 useEmpFilePreviewUrl로 조회한 objectURL을 <img>에 바인딩하고,
 * 없거나(empId/fileId 미확정) 조회 실패 시 fallbackText 첫 글자로 이니셜 아바타를 렌더한다.
 * 이후 EMP 뷰 프로필사진(T5.2)·헤더 아바타(T5.3)가 이 컴포넌트를 그대로 소비한다.
 */
export function BlobAvatar({ empId, fileId, fallbackText, className }: BlobAvatarProps) {
  const { objectUrl, isError } = useEmpFilePreviewUrl(empId, fileId)

  if (objectUrl && !isError) {
    return (
      <img
        src={objectUrl}
        alt={fallbackText}
        className={cn('size-8 shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {fallbackText.slice(0, 1)}
    </span>
  )
}
