import { Link, useParams } from 'react-router'
import { BoardDetailView } from '../components/BoardDetailView'

/**
 * 게시글 상세 컨테이너 페이지(F303/F304/F310/F311/F306, ROADMAP T11.3/T11.4).
 *
 * 게시판 목록(T10.3)의 행 클릭으로 진입하는 임의 boardId 상세 화면이다. 이 페이지는 **라우팅 전용
 * 관심사**(route param 파싱/검증, 목록 복귀 링크)만 담당하고, 실제 조회/렌더(로딩·에러 분기, 본문·
 * 첨부·댓글)는 `BoardDetailView`에 위임한다 — 인라인 목록↔상세 전환(BoardListPage)과 동일한 뷰를
 * 공유하기 위한 페이지/View 분리(DepartmentDetailPage + DepartmentDetailView 선례와 동일 패턴).
 */
export function BoardDetailPage() {
  const { boardId: boardIdParam } = useParams()
  // route param은 신뢰 불가 입력이다(DepartmentDetailPage와 동일 가드): 순수 10진 양의 정수
  // 형식만 허용해 지수/16진수/음수 표기가 다른 게시글로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = boardIdParam !== undefined && /^[1-9][0-9]*$/.test(boardIdParam)
  const boardId = isDecimalPositiveInteger ? Number(boardIdParam) : undefined

  const backLink = (
    <Link
      to="/boards"
      className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
    >
      ← 게시판
    </Link>
  )

  // 라우트 파라미터 자체가 유효하지 않으면(없음/숫자 아님) 조회를 시도하지 않고 즉시 not-found로 분기한다.
  if (boardId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
        <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
      </div>
    )
  }

  // onBack 미전달: 전용 상세 페이지는 상단 backLink로만 복귀한다(인라인 "← 목록" 버튼은 렌더하지 않음).
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {backLink}
      <BoardDetailView boardId={boardId} />
    </div>
  )
}
