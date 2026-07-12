import { useEffect } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, Download, Eye, Heart, MessageCircle, Paperclip, Pencil, Send } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { downloadBoardFile } from '../api/downloadBoardFile'
import { useBoardDetailQuery } from '../api/useBoardDetailQuery'
import { useBoardFilePreviewUrl } from '../api/useBoardFilePreviewUrl'
import { useBoardFilesQuery } from '../api/useBoardFilesQuery'
import { useBoardPublishMutation } from '../api/useBoardPublishMutation'
import { isImageExtension } from '../lib/isImageExtension'
import type { BoardFileInfo } from '../model/board'
import { CategoryBadge } from './CategoryBadge'
import { CommentSection } from './CommentSection'

/** 좋아요/조회/댓글 수를 표시하는 읽기 전용 알약. 아이콘 + 숫자만 — 좋아요는 §열린항목1에 따라 토글 불가(읽기 표시만). */
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
   * "← 목록" 버튼 클릭 콜백. 제공되면 상세 카드 헤더(및 로딩/에러 분기 상단)에 목록 복귀 버튼을
   * 렌더한다 — 인라인 목록↔상세 전환 컨텍스트(BoardListPage)에서만 주입한다. 미제공(전용 상세
   * 페이지 진입)이면 버튼을 렌더하지 않고, 상위 페이지의 상단 backLink로만 복귀한다.
   */
  onBack?: () => void
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
 * **좋아요는 `likeCount` 읽기 표시만 한다(§열린항목1)** — `api-endpoint.md`에 좋아요 토글
 * 엔드포인트가 없어 토글 버튼/mutation을 만들지 않는다(근거 없는 발명 금지).
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
 * 댓글 영역(F313~F317, ROADMAP T14.2)은 하단에 `CommentSection`으로 분리 마운트한다 — 이
 * 뷰 자체는 게시글 본문/첨부만 다루고 댓글 목록·등록·대댓글·수정·삭제는 전부
 * `CommentSection`/`CommentItem`/`CommentForm`이 캡슐화한다.
 */
export function BoardDetailView({ boardId, onBack }: BoardDetailViewProps) {
  const roles = useAuthStore((state) => state.roles)
  const canEdit = hasRequiredRole(roles, 'ADMIN')

  const detailQuery = useBoardDetailQuery(boardId)
  const filesQuery = useBoardFilesQuery(boardId)
  const publishMutation = useBoardPublishMutation()

  // 카테고리 표기를 목록(pill 필터·CategoryBadge)과 일관되게 맞추기 위해, 상세 응답의 categoryId를
  // 이름으로 해석한다(F302 useCategoriesQuery 재사용 — 신규 API/로직 발명 없음). 이름을 아직 못
  // 구했으면(로딩/실패) 배지를 생략한다(본문 렌더에는 영향 없음).
  const categoriesQuery = useCategoriesQuery()

  // "← 목록" 버튼: 인라인 전환(BoardListPage)에서만 onBack이 주입돼 렌더된다. 로딩/에러 분기 상단과
  // 성공 카드 헤더 액션 영역에서 동일한 버튼을 재사용한다(전용 페이지에서는 onBack 미주입 → null).
  const backButton = onBack ? (
    <Button type="button" variant="outline" size="sm" onClick={onBack}>
      <ChevronLeft />
      목록
    </Button>
  ) : null

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
    return (
      <>
        {backButton && <div className="mb-4">{backButton}</div>}
        <p className="text-sm text-muted-foreground">게시글을 불러오는 중...</p>
      </>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <>
          {backButton && <div className="mb-4">{backButton}</div>}
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
          {backButton && <div className="mb-4">{backButton}</div>}
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
          <p className="text-sm text-muted-foreground">이 게시글을 조회할 권한이 없습니다.</p>
        </>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <>
        {backButton && <div className="mb-4">{backButton}</div>}
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

  // 카드 헤더(제목/작성자/액션/통계)는 인라인·전용 페이지 공통이며, 인라인 모드에서는 스크롤 밖
  // 상단에 고정된다(아래 onBack 분기).
  const cardHeader = (
    <CardHeader className="border-b">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {/* 카테고리 표기(목록 pill 필터와 동일한 폴더 아이콘 언어의 CategoryBadge) — 이름을
              해석했을 때만 노출한다. */}
          {categoryName && <CategoryBadge name={categoryName} className="mb-2" />}
          <CardTitle className="text-xl font-semibold">{board.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {board.authorName} · 발행 {dayjs(board.publishedAt).format('YYYY-MM-DD HH:mm')}
            {showModifiedAt && ` · 수정 ${dayjs(board.modifiedAt).format('YYYY-MM-DD HH:mm')}`}
          </p>
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

      <div className="mt-3 flex items-center gap-4">
        <StatPill icon={Eye} label="조회수" value={board.viewCount} />
        <StatPill icon={Heart} label="좋아요 수" value={board.likeCount} />
        <StatPill icon={MessageCircle} label="댓글 수" value={board.commentCount} />
      </div>
    </CardHeader>
  )

  // 본문+첨부(제목/작성자 등 메타는 위 cardHeader가 담당).
  const cardBody = (
    <CardContent className="space-y-6">
      {/* longtext 본문. 작성 폼(BoardCreatePage)이 Textarea로 받은 순수 텍스트이므로
          dangerouslySetInnerHTML 없이 whitespace-pre-wrap으로만 줄바꿈을 보존한다.
          긴 본문 가독성을 위해 leading-relaxed로 행간을 넓히고, 짧은 글도 본문 영역이
          허전하지 않도록 최소 높이를 준다. */}
      <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {board.content}
      </p>

      {/* 첨부 목록(F304): 이미지 확장자는 인라인 미리보기(F311), 그 외는 다운로드(F310). */}
      {filesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
      ) : files.length > 0 ? (
        <div className="space-y-3 border-t pt-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Paperclip className="size-4" />
            첨부파일 {files.length}개
          </h3>
          <div className="flex flex-wrap gap-3">
            {files.map((file) =>
              isImageExtension(file.extension) ? (
                <BoardImagePreview key={file.fileId} boardId={boardId} file={file} />
              ) : (
                <Button
                  key={file.fileId}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                >
                  <Download />
                  {file.originalName}
                </Button>
              ),
            )}
          </div>
        </div>
      ) : null}
    </CardContent>
  )

  // 인라인 전환(BoardListPage): 상세 본문+첨부+댓글을 하나의 Card 안에 담아 "한 뭉텅이"로 보이게 한다
  // (사용자 요청 — 카드 경계가 아니라 CommentSection의 구분선만으로 나눈다). 카드 프레임은 남는
  // 높이에 고정되고(lg), 헤더는 스크롤 밖 상단에, 본문+첨부+댓글만 내부 스크롤된다(B-2). "← 목록"
  // 버튼은 카드 바깥 최상단에 고정한다. 전용 상세 페이지(onBack 미주입)는 상세 Card와 댓글 Card를
  // 분리된 기존 문서 흐름 그대로 유지한다(기존 동작 무변경).
  if (onBack) {
    return (
      <div className="flex flex-col lg:min-h-0 lg:flex-1">
        <div className="mb-4 shrink-0">{backButton}</div>
        {/* min-h-0 대신 구체적인 최소 높이(BoardListPage 목록 카드와 동일 값) — "게시글 작성" 카드가
            펼쳐진 채로 상세 진입하면 이 카드도 같은 이유로 0에 가깝게 눌릴 수 있어 최소 높이를 둔다. */}
        <Card className="lg:min-h-[22rem] lg:flex-1">
          {cardHeader}
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {cardBody}
            <CommentSection boardId={boardId} variant="embedded" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Card>
        {cardHeader}
        {cardBody}
      </Card>
      {/* 댓글 영역(F313~F317, ROADMAP T14.2) — 전용 상세 페이지는 별도 Card로 분리해 마운트한다. */}
      <CommentSection boardId={boardId} />
    </>
  )
}
