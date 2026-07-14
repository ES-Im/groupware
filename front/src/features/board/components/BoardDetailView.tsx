import { useEffect } from 'react'
import { Link } from 'react-router'
import { Download, Eye, Heart, MessageCircle, Paperclip, Pencil, Send } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { downloadBoardFile } from '../api/downloadBoardFile'
import { useBoardDetailQuery } from '../api/useBoardDetailQuery'
import { useBoardFilePreviewUrl } from '../api/useBoardFilePreviewUrl'
import { useBoardFilesQuery } from '../api/useBoardFilesQuery'
import { useBoardLikeMutation } from '../api/useBoardLikeMutation'
import { useBoardPublishMutation } from '../api/useBoardPublishMutation'
import { isImageExtension } from '../lib/isImageExtension'
import type { BoardFileInfo } from '../model/board'
import { CategoryBadge } from './CategoryBadge'
import { CommentSection } from './CommentSection'

/** 바이트 크기를 사람이 읽는 단위 문자열로 변환한다(목표 디자인의 "248 KB" / "1.8 MB" 표기).
 * 1MB 이상은 MB(소수 1자리), 그 미만은 KB(반올림, 최소 1KB)로 보인다. */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * 비-이미지 첨부 1건을 표기하는 파일 카드(목표 디자인 board-page.html의 첨부 카드 이식).
 * 확장자 칩 + 파일명 + 용량 + 다운로드 아이콘 버튼. 클릭 시 상위가 넘긴 onDownload를 실행한다.
 */
function BoardFileCard({ file, onDownload }: { file: BoardFileInfo; onDownload: () => void }) {
  return (
    <div className="flex min-w-56 items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <span className="rounded-md bg-primary/10 px-1.5 py-1 text-[10px] font-bold text-primary uppercase">
        {file.extension || '파일'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.originalName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDownload}
        aria-label={`${file.originalName} 다운로드`}
      >
        <Download />
      </Button>
    </div>
  )
}

/** 조회/댓글 수를 표시하는 읽기 전용 알약(헤더용). 아이콘 + 숫자만 — 좋아요는 본문 하단
 * LikeToggleButton으로 분리했으므로 이 알약에서는 제외한다(중복 방지). */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
      {value.toLocaleString()}
    </span>
  )
}

/**
 * 좋아요 토글 버튼(프레젠테이셔널). 좋아요/취소 REST(POST/DELETE /api/boards/{boardId}/likes)에
 * 연결되지만, 실제 mutation·onClick 로직과 초기 isLiked 판별 배선은 상위(메인)가 담당한다 — 이
 * 컴포넌트는 상태(isLiked)·동작(onToggleLike)·제출중(isPending)을 props로만 받아 두 상태의 시각
 * 표현만 한다(로직 없음).
 *
 * - 활성(isLiked=true): default 버튼 variant(primary 톤: bg-primary/text-primary-foreground) +
 *   채워진 하트(fill-current).
 * - 비활성(isLiked=false): outline variant + 빈 하트(테두리만).
 * - isPending 동안 disabled 처리로 중복 제출을 막는다(shadcn Button이 disabled 흐림·클릭 차단·
 *   포커스링을 보장). aria-pressed로 토글 상태를 보조기기에 알린다.
 */
function LikeToggleButton({
  isLiked,
  likeCount,
  onToggleLike,
  isPending,
}: {
  isLiked: boolean
  likeCount: number
  onToggleLike: () => void
  isPending: boolean
}) {
  return (
    <Button
      type="button"
      size="lg"
      variant={isLiked ? 'default' : 'outline'}
      onClick={onToggleLike}
      disabled={isPending}
      aria-pressed={isLiked}
      aria-label={`좋아요 ${likeCount.toLocaleString()}개${isLiked ? ' (누름)' : ''}`}
      className="rounded-full px-5"
    >
      <Heart className={cn('size-4', isLiked && 'fill-current')} aria-hidden="true" />
      좋아요 {likeCount.toLocaleString()}
    </Button>
  )
}

/**
 * 이미지 첨부 인라인 미리보기(F311). objectURL 생명주기는 useBoardFilePreviewUrl(T11.2-b)에
 * 전부 위임하고, 이 컴포넌트는 로딩/실패/성공 3분기 렌더만 담당한다.
 */
function BoardImagePreview({
  boardId,
  file,
}: {
  boardId: number
  file: BoardFileInfo
}) {
  const { objectUrl, isLoading, isError } = useBoardFilePreviewUrl(boardId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  if (isError || !objectUrl) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        이미지를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={file.originalName}
      className="max-h-80 w-auto max-w-full rounded-lg border object-contain"
    />
  )
}

interface BoardDetailViewProps {
  /** 조회할 게시글 ID. route param 검증은 상위 페이지가 담당하므로 여기서는 항상 유효한 값만 받는다. */
  boardId: number
  /**
   * 인라인 목록↔상세 전환(BoardListPage) 컨텍스트 여부. true면 본문+댓글을 하나의 풀높이 카드로
   * 합쳐 그리드 셀을 채우고 본문이 길면 카드가 늘어난다. 미지정(전용 상세 페이지)이면 문서 흐름의
   * 단일 카드로 렌더한다. 목록 복귀("목록") 버튼은 상위(BoardListPage 좌측 컬럼)가 소유하므로 이
   * 뷰는 렌더하지 않는다.
   */
  inline?: boolean
}

/**
 * 게시글 상세 뷰(F303/F304/F310/F311/F306, ROADMAP T11.3/T11.4, docs/prd/4.board-slice-prd.md
 * §게시글 상세 페이지).
 *
 * 조회/렌더 로직을 캡슐화한 재사용 컴포넌트다. 전용 상세 페이지(BoardDetailPage, /boards/:boardId)와
 * 게시판 목록의 인라인 상세 전환(BoardListPage) 두 곳에서 공유한다 — route param 검증만 페이지가
 * 담당하고 나머지(조회 훅·로딩/에러 분기·본문/첨부/댓글 렌더)는 전부 이 뷰가 소유한다.
 *
 * useBoardDetailQuery/useBoardFilesQuery(T11.1)로 본문·메타·첨부를 렌더하고, extension으로 이미지
 * 여부를 판별해 이미지는 인라인 미리보기(T11.2-b)·그 외는 다운로드(T11.2-a)로 분기한다.
 *
 * **좋아요는 본문 하단 토글 버튼(`LikeToggleButton`)으로 표시한다** — 좋아요/취소 REST(POST/DELETE
 * `/api/boards/{boardId}/likes`)가 계약에 존재한다. 다만 이 뷰(시각/레이아웃 담당)는 상태·동작을
 * props로 주입받는 프레젠테이션 버튼만 두고, 실제 mutation·onClick·초기 `isLiked` 판별 배선은
 * 상위(메인)가 붙인다 — 현재는 기본 비활성·no-op 스텁으로 렌더한다(아래 `//todo` 참조).
 *
 * **작성자 게이팅 제약(신규 발견, §리스크7과 동형 공백)**: PRD는 "상세 응답 empId와 authStore
 * 본인 식별자 비교"로 "수정"/"발행" 버튼을 게이팅하라고 하지만, `RETRIEVE_ME_INFO` 응답
 * (features/employee/model/me.ts)에는 numeric empId가 없다(empBasicInfo.empNo는 문자열,
 * JWT `sub`도 loginId일 뿐 empId가 아님 — security.md 실측). 본인 소유 여부를 클라에서 검증할
 * 방법이 현재 없으므로, 이름 비교 등 추측 경로를 발명하지 않고(기존 §리스크7 관행과 동일)
 * ADMIN(`hasRequiredRole` 전개)만으로 게이팅한다. 결과적으로 **비-ADMIN 작성자 본인은 현재
 * 이 화면에서 "수정"/"발행" 버튼을 보지 못한다** — numeric 본인 식별자 소스가 확정되면(예:
 * `BOARD_DETAIL` 응답과 비교 가능한 값을 `RETRIEVE_ME_INFO`에 추가) 아래 `canEdit` 계산에
 * `detail.data.empId === myEmpId` 비교를 추가해야 한다.
 * //todo: 본인 작성 게시글 판별용 identifier 소스 확정 필요(§리스크7 연장) — 확정 전 ADMIN만 게이팅.
 *
 * **발행 버튼 도달 가능성(신규 발견)**: 백엔드 `BoardAndCommentQueryService.retrieveBoardDetail`은
 * `findBoardByIdAndIsDraftFalse`로 조회해 임시저장 글은 이 엔드포인트(`BOARD_DETAIL`)에서 항상
 * 404(`BoardNotFoundException`)로 처리된다(작성자 본인이어도 동일) — 즉 `detail.data.isDraft`가
 * `true`인 응답을 이 뷰가 실제로 받는 경우는 없다. 아래 발행 버튼 분기는 명세(T11.3/T11.4)
 * 그대로 구현해 두지만, 현재 백엔드 동작상 이 화면에서는 도달 불가능한 방어적 코드다 — 실제
 * 발행 진입점은 M15(내 임시저장함 목록)가 될 것으로 보인다.
 *
 * 댓글 영역(F313~F317, ROADMAP T14.2)은 본문과 **같은 카드 안에** `CommentSection`(embedded)으로
 * 이어 붙인다 — 이 뷰 자체는 게시글 본문/첨부만 다루고 댓글 목록·등록·대댓글·수정·삭제는 전부
 * `CommentSection`/`CommentItem`/`CommentForm`이 캡슐화한다.
 */
export function BoardDetailView({ boardId, inline }: BoardDetailViewProps) {
  const roles = useAuthStore((state) => state.roles)
  const canEdit = hasRequiredRole(roles, 'ADMIN')

  const detailQuery = useBoardDetailQuery(boardId)
  const filesQuery = useBoardFilesQuery(boardId)
  const publishMutation = useBoardPublishMutation()
  const likeMutation = useBoardLikeMutation(boardId)

  // 카테고리 표기를 목록(pill 필터·CategoryBadge)과 일관되게 맞추기 위해, 상세 응답의 categoryId를
  // 이름으로 해석한다(F302 useCategoriesQuery 재사용 — 신규 API/로직 발명 없음). 이름을 아직 못
  // 구했으면(로딩/실패) 배지를 생략한다(본문 렌더에는 영향 없음).
  const categoriesQuery = useCategoriesQuery()

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다
  // (EmployeeDetailPage/DepartmentDetailPage와 동일 컨벤션). forbidden 분기의 실제 도달
  // 가능성에 대해서는 아래 렌더 분기 주석 참조(BOARD_DETAIL은 현재 403을 반환하지 않음).
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  // 첨부 목록 조회 실패는 상세 본문까지 교체하지 않는다 — 첨부 섹션만 인라인 안내로 대체한다.
  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function handleDownload(file: BoardFileInfo) {
    downloadBoardFile(boardId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  function handlePublish() {
    publishMutation.mutate(boardId, {
      onSuccess: () => {
        toast.success('게시글을 발행했습니다')
      },
      // WHY: 소유권 위반 시 백엔드 실측은 403이 아닌 401(ROLE_002, PermissionDeniedException)을
      // 반환한다(publishBoard.ts 주석 참조) — handleApiError의 토큰무효 분기(로그인 리다이렉트)를
      // 타면 사용자가 조용히 로그아웃되는 것처럼 보일 수 있어, 여기서는 handleApiError를 거치지
      // 않고 항상 에러 메시지를 그대로 토스트로만 보여준다.
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">게시글을 불러오는 중...</p>
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
          <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        </>
      )
    }
    // 도달 가능성 실측(code-reviewer 지적 반영): 백엔드 `BoardAndCommentQueryService.
    // retrieveBoardDetail`은 `findBoardByIdAndIsDraftFalse` 조회 결과가 없으면 소유권 검사 없이
    // `BoardNotFoundException`(404)만 던진다(`api-endpoint.md`도 `BOARD_DETAIL`의 요구 권한을
    // `EMPLOYEE`로만 명시 — 작성자/ADMIN 제약 없음). 즉 이 GET 엔드포인트는 403을 반환할 경로가
    // 구조적으로 없어, 이 분기는(위 isDraft 발행 버튼 분기와 동일한 이유로) 현재 백엔드 동작상
    // 도달 불가능한 방어적 코드다. 다른 상세 페이지(EmployeeDetailPage 등)의 not-found/403 분기
    // 컨벤션을 그대로 복제해 두되, 백엔드가 향후 소유권 검사를 추가하는 경우를 대비한다.
    if (isForbidden(apiError)) {
      return (
        <>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
          <p className="text-sm text-muted-foreground">이 게시글을 조회할 권한이 없습니다.</p>
        </>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
        <p className="text-sm text-muted-foreground">게시글을 불러오지 못했습니다.</p>
      </>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!detailQuery.data) {
    return null
  }

  const board = detailQuery.data
  const files = filesQuery.data ?? []
  const showModifiedAt = board.modifiedAt && board.modifiedAt !== board.publishedAt
  const categoryName = categoriesQuery.data?.find(
    (category) => category.categoryId === board.categoryId,
  )?.categoryName

  // 카드 헤더(제목/액션)는 인라인·전용 페이지 공통이며, 인라인 모드에서는 스크롤 밖 상단에
  // 고정된다(아래 onBack 분기). 메일함 상세(MessageDetailView) 톤에 맞춰 헤더에는 제목과
  // 우측 액션만 좌우로 두고, 작성자/일시/통계는 본문(cardBody)의 메타 영역으로 내린다.
  const cardHeader = (
    <CardHeader className="border-b">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {/* 카테고리 표기(목록 pill 필터와 동일한 폴더 아이콘 언어의 CategoryBadge) — 이름을
              해석했을 때만 노출한다. */}
          {categoryName && <CategoryBadge name={categoryName} className="mb-2" />}
          {/* 메일함 상세 제목 톤(xl bold + break-all)에 맞춘다. */}
          <CardTitle className="text-xl font-bold tracking-tight break-all text-foreground">
            {board.title}
          </CardTitle>
        </div>

        {/* 우측 액션: (작성자·ADMIN) "수정" + (임시저장 글) "발행". 인라인 전환의 "← 목록"
            버튼은 스크롤 밖 상단 고정 바로 분리했다(아래 onBack 분기). canEdit 계산의 현재 제약은
            클래스 주석(§리스크7 연장) 참조 — 지금은 ADMIN만 통과한다. */}
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/boards/${boardId}/edit`}>
                <Pencil />
                수정
              </Link>
            </Button>
          )}
          {canEdit && board.isDraft && (
            <Button size="sm" disabled={publishMutation.isPending} onClick={handlePublish}>
              <Send />
              발행
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  )

  // 좋아요 토글: BOARD_DETAIL 응답의 isLiked를 초기 상태로 쓰고, 클릭 시 현재 상태의 반대
  // 동작(좋아요/취소)을 호출한다. 성공 시 훅이 캐시의 isLiked/likeCount만 직접 갱신한다 —
  // 상세를 refetch하면 서버가 viewCount를 올리는 부작용이 있어(useBoardLikeMutation 주석) 이를
  // 피한다. 400(이미 눌림/안 눌림, BOARD_006/007)은 동시성 등 예외 상황이라 메시지를 토스트로
  // 노출한다(정상 흐름에선 isLiked로 분기하므로 발생하지 않는다).
  const isLiked = board.isLiked
  const isLikePending = likeMutation.isPending
  const handleToggleLike = () => {
    likeMutation.mutate(board.isLiked, {
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  // 본문 카드 내용. 메일함 상세(MessageDetailView) 구조를 따른다: 상단 메타(라벨+칩) →
  // Separator → "내용" 섹션 → "첨부파일" 섹션 → (하단 고정)좋아요. 제목/액션은 위 cardHeader가
  // 담당한다. flex 컬럼으로 채워(인라인 모드에서 본문 영역 flex-[7]을 flex-1로 흡수) 좋아요를
  // mt-auto로 본문 영역 최하단(댓글 바로 위)에 고정한다(사용자 요청). 전용 페이지(높이 비제약)에서는
  // 흡수할 여백이 없어 좋아요가 첨부 바로 아래 자연스럽게 붙는다.
  const cardBody = (
    <CardContent className="flex flex-1 flex-col gap-4">
      {/* 메타(메일함 라벨+칩 톤): 작성자는 칩, 발행/수정 일시는 작은 회색 텍스트, 조회·댓글 통계는
          우측 정렬. BoardDetailResponse에는 작성자 부서 필드가 없어(계약 실측) 부서 표기는 생략한다. */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-muted-foreground">작성자</span>
          <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
            {board.authorName}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <p className="text-xs text-muted-foreground tabular-nums">
            발행 {dayjs(board.publishedAt).format('YYYY-MM-DD HH:mm')}
            {showModifiedAt && ` · 수정 ${dayjs(board.modifiedAt).format('YYYY-MM-DD HH:mm')}`}
          </p>
          <div className="flex items-center gap-4">
            <StatPill icon={Eye} label="조회수" value={board.viewCount} />
            <StatPill icon={MessageCircle} label="댓글 수" value={board.commentCount} />
          </div>
        </div>
      </div>

      <Separator />

      {/* 내용(메일함 "내용" 섹션 톤): 라벨 + longtext 본문. 작성 폼이 Textarea로 받은 순수
          텍스트이므로 dangerouslySetInnerHTML 없이 whitespace-pre-wrap으로만 줄바꿈을 보존한다.
          짧은 글도 본문 영역이 허전하지 않도록 최소 높이를 준다. */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">내용</h3>
        <p className="min-h-24 text-sm leading-7 whitespace-pre-wrap break-words text-foreground">
          {board.content}
        </p>
      </section>

      {/* 첨부(메일함 "첨부" 섹션 톤): 이미지 확장자는 인라인 미리보기(F311), 그 외는 다운로드(F310). */}
      {filesQuery.isLoading ? (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
        </>
      ) : files.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Paperclip className="size-4" />
              첨부파일 {files.length}개
            </h3>
            <div className="flex flex-wrap gap-3">
              {files.map((file) =>
                isImageExtension(file.extension) ? (
                  <BoardImagePreview key={file.fileId} boardId={boardId} file={file} />
                ) : (
                  <BoardFileCard
                    key={file.fileId}
                    file={file}
                    onDownload={() => handleDownload(file)}
                  />
                ),
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* 좋아요: 본문 영역 최하단(댓글 바로 위)에 고정한다(사용자 요청 — 이전엔 본문 바로 아래였다).
          mt-auto가 본문 영역(flex-[7])의 남는 높이를 위로 밀어 이 토글을 맨 아래로 내린다. 좋아요/취소
          REST(POST/DELETE /api/boards/{boardId}/likes)에 연결된 인터랙티브 토글이며 상태·동작은
          LikeToggleButton에 props로 주입한다. 상단 border-t로 본문과 구분한다. */}
      <div className="mt-auto flex justify-center border-t pt-4">
        <LikeToggleButton
          isLiked={isLiked}
          likeCount={board.likeCount}
          onToggleLike={handleToggleLike}
          isPending={isLikePending}
        />
      </div>
    </CardContent>
  )

  // 인라인 전환(BoardListPage): 상세 본문과 댓글을 **하나의 카드**에 합친다(사용자 요청 — 이전의
  // 본문 카드 + 댓글 카드 2분할을 폐지). 카드는 그리드 셀(=main 영역) 높이를 최소로 채우되
  // (lg:flex-1) min-height:auto를 유지해(min-h-0·overflow 미부여) 콘텐츠가 길면 카드가 늘어나고
  // main이 스크롤된다. 카드 안에서 본문 영역은 카드의 70%(lg:flex-[7]), 댓글 영역은 30%
  // (lg:flex-[3])를 기본 비율로 차지한다 — flex-basis 0 + grow 비율이라 콘텐츠가 짧으면 남는 높이가
  // 7:3으로 분배돼 본문이 정확히 70%를 채우고, 본문/댓글이 그 공간보다 길면 내부 스크롤 없이 각
  // 영역이 콘텐츠 높이로 늘어나며 카드가 함께 커진다("본문이 이 공간보다 길면 카드 길이를 늘린다").
  // 본문/댓글 구분선은 CommentSection embedded 헤더의 border-t가 담당하므로 별도 Separator는 두지
  // 않는다. "← 목록" 버튼은 카드 바깥 최상단에 둔다. 모바일(lg 미만)에서는 비율 제약 없이 자연스러운
  // 문서 흐름으로 쌓인다. 전용 상세 페이지(onBack 미주입)도 아래에서 동일하게 단일 카드로 합치되,
  // 풀스크린 높이/비율 제약은 걸지 않고 문서 흐름을 따른다.
  if (inline) {
    return (
      // lg에서 이 래퍼는 그리드 우측 셀의 그리드 아이템이다. 높이 퍼센트(min-h-full)는 auto 그리드
      // 행과 순환 참조해 카드가 과성장하므로 쓰지 않고, 높이 클래스를 두지 않아 그리드 기본 stretch가
      // 셀 높이를 채워주게 한다(짧은 글이면 카드가 화면을 꼭 채움). min-height:auto(min-h-0 미부여)를
      // 유지하므로 콘텐츠가 길면 셀·카드가 함께 늘어나 main이 스크롤된다. "목록" 버튼은 상위
      // (BoardListPage 좌측 컬럼)가 소유하므로 여기서는 렌더하지 않는다.
      <div className="flex flex-col">
        {/* lg:overflow-visible — Card 기본 overflow-hidden은 flex item의 자동 최소 크기를 0으로
            만들어(본문이 길면) 카드가 콘텐츠를 자르고 고정 높이에 갇힌다. overflow를 풀어야
            min-height:auto가 살아나 본문이 길 때 카드가 늘어나고 main이 스크롤된다. */}
        <Card className="flex flex-col lg:flex-1 lg:overflow-visible">
          {cardHeader}
          {/* 본문 영역: 카드의 70%(flex-[7]). 내부 스크롤을 두지 않아 본문이 이 공간보다 길면
              콘텐츠 높이로 늘어나고, 카드(min-height:auto)와 함께 커지며 main이 스크롤된다. */}
          <div className="flex flex-col lg:flex-[7]">{cardBody}</div>
          {/* 댓글 영역: 카드의 30%(flex-[3])로 고정하고, 댓글이 많으면 이 영역만 내부 스크롤한다
              (min-h-0 + overflow-y-auto). 이렇게 캡해야 댓글 수와 무관하게 본문 영역이 70%를 유지하고,
              "본문 길이"만 카드를 늘린다. embedded 헤더의 border-t가 본문과의 구분선을 겸한다. */}
          <div className="flex flex-col lg:min-h-0 lg:flex-[3] lg:overflow-y-auto">
            <CommentSection boardId={boardId} variant="embedded" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    // 전용 상세 페이지(F313~F317, ROADMAP T14.2): 상세 본문과 댓글을 하나의 카드로 합친다
    // (인라인과 동일 — 사용자 요청). 문서 흐름이라 높이 비율은 두지 않고, CommentSection은 embedded로
    // 같은 카드 안에 이어 붙인다(embedded 헤더 border-t가 본문과의 구분선).
    <Card>
      {cardHeader}
      {cardBody}
      <CommentSection boardId={boardId} variant="embedded" />
    </Card>
  )
}
