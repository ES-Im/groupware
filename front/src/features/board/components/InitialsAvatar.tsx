import { cn } from '@/shared/lib/utils'

interface InitialsAvatarProps {
  /** 표시 이름. 앞 두 글자를 이니셜로 쓴다(목표 디자인 board-page.html의 작성자 아바타 표기 방식). */
  name: string
  className?: string
}

/**
 * 이니셜 기반 rounded-square 아바타(목표 디자인 board-page.html의 작성자 아바타 언어 이식).
 *
 * 게시글 목록 작성자 셀(BoardListTable)과 상세 작성자 메타(BoardDetailView)에서 공유한다.
 * 이 두 곳의 데이터 소스(BoardSummary·BoardDetailResponse)에는 프로필 사진 fileId가 없어
 * 이미지를 조회할 근거가 없으므로(추측 금지) 이름 이니셜만 표기한다 — 프로필 이미지 조회가
 * 가능한 댓글 작성자(writerEmpId 보유)는 기존 BlobAvatar를 그대로 쓴다.
 *
 * 커스텀 팔레트 없이 primary 틴트(bg-primary/10 + text-primary)만 사용해 다크모드가 토큰으로
 * 자동 대응된다 — 프로젝트 primary 토큰이 이미 인디고 계열이라 목표 디자인의 인디고 accent와
 * 그대로 맞는다.
 */
export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  const initials = name.trim().slice(0, 2) || '?'
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary',
        className,
      )}
    >
      {initials}
    </span>
  )
}
