import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BoardSummary } from '../model/board'
import { BoardListTable } from './BoardListTable'

function boardFixture(overrides: Partial<BoardSummary> = {}): BoardSummary {
  return {
    boardId: 1,
    boardTitle: '공지사항입니다',
    authorName: '홍길동',
    publishedAt: '2026-07-01T09:30:00',
    viewCount: 12,
    likeCount: 3,
    commentCount: 5,
    isFileAttached: false,
    ...overrides,
  }
}

describe('BoardListTable (F301)', () => {
  it('데이터가 있으면 행을 렌더한다(제목/작성자/발행시각 포맷/지표/첨부 아이콘)', () => {
    render(
      <BoardListTable
        data={[
          boardFixture(),
          boardFixture({ boardId: 2, boardTitle: '첨부 있는 글', isFileAttached: true }),
        ]}
        onRowClick={vi.fn()}
      />,
    )

    expect(screen.getByText('공지사항입니다')).toBeInTheDocument()
    expect(screen.getAllByText('홍길동')).toHaveLength(2)
    expect(screen.getAllByText('2026-07-01 09:30')).toHaveLength(2)
    expect(screen.getAllByText('12')).toHaveLength(2)
    expect(screen.getAllByText('3')).toHaveLength(2)
    expect(screen.getAllByText('5')).toHaveLength(2)

    expect(screen.getByLabelText('첨부파일 있음')).toBeInTheDocument()
  })

  it('data가 빈 배열이면 "게시글이 없습니다."만 렌더하고 표는 렌더하지 않는다', () => {
    render(<BoardListTable data={[]} onRowClick={vi.fn()} />)

    expect(screen.getByText('게시글이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('행 클릭 시 onRowClick을 해당 boardId로 호출한다', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<BoardListTable data={[boardFixture({ boardId: 42 })]} onRowClick={onRowClick} />)

    await user.click(screen.getByRole('button', { name: /공지사항입니다/ }))

    expect(onRowClick).toHaveBeenCalledWith(42)
  })

  it('행에서 Enter 키를 누르면 onRowClick을 호출한다(키보드 접근성)', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<BoardListTable data={[boardFixture({ boardId: 7 })]} onRowClick={onRowClick} />)

    const row = screen.getByRole('button', { name: /공지사항입니다/ })
    row.focus()
    await user.keyboard('{Enter}')

    expect(onRowClick).toHaveBeenCalledWith(7)
  })
})
