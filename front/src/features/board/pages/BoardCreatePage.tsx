import { Link, useNavigate } from 'react-router'
import { SquarePen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { BoardCreateForm } from '../components/BoardCreateForm'

/**
 * 게시글 작성 페이지(F305/F308, ROADMAP T12.2, docs/prd/4.board-slice-prd.md §게시글 작성 페이지).
 *
 * 폼 본문(카테고리·제목·본문·임시저장/발행·임시저장글 토글)은 BoardCreateForm으로 분리해 목록 페이지의
 * 인라인 작성 카드(BoardListPage)와 재사용한다. 이 전용 페이지는 back-link·제목 등 페이지 chrome과
 * 헤더 문구만 담당하며, 등록 성공 후에는 게시판 목록(/boards)으로 이동한다(registerBoard가 boardId를
 * 반환하지 않아 상세로 이동하지 않는 T12.2 확정 동작 — onSuccess 콜백으로 위임).
 */
export function BoardCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      {/* 상세 페이지(BoardDetailPage)와 동일한 back-link 컨벤션으로 목록 복귀 동선을 맞춘다. */}
      <Link
        to="/boards"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← 게시판
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">게시글 작성</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            새 게시글
          </CardTitle>
          <CardDescription>카테고리·제목·본문을 작성해 임시저장하거나 발행합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <BoardCreateForm onSuccess={() => navigate('/boards')} />
        </CardContent>
      </Card>
    </div>
  )
}
