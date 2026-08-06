import { Link, useParams } from 'react-router'
import { BoardDetailView } from '../components/BoardDetailView'

export function BoardDetailPage() {
  const { boardId: boardIdParam } = useParams()
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

  if (boardId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backLink}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
        <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {backLink}
      <BoardDetailView boardId={boardId} />
    </div>
  )
}
