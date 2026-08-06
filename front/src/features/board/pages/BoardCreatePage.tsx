import { Link, useNavigate } from 'react-router'
import { SquarePen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { BoardCreateForm } from '../components/BoardCreateForm'

export function BoardCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
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
