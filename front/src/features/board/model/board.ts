export interface BoardSummary {
  boardId: number
  boardTitle: string
  authorName: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  isFileAttached: boolean
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type BoardListPage = Page<BoardSummary>

export interface BoardDetailResponse {
  boardId: number
  categoryId: number
  empId: number
  authorName: string
  title: string
  content: string
  publishedAt: string
  modifiedAt: string | null
  likeCount: number
  viewCount: number
  commentCount: number
  isDraft: boolean
  isLiked: boolean
}

export interface BoardFileInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

export interface BoardDraftSummary {
  boardId: number
  title: string
  updatedAt: string
}

export interface BoardEditModeResponse {
  boardId: number
  categoryId: number
  title: string
  content: string
}

export interface BoardUpdateRequest {
  categoryId?: number
  title?: string
  content?: string
  modifiedAt: string
}

export interface BoardComment {
  parentCommentId: number | null
  commentId: number
  writerEmpId: number | null
  writerEmpName: string | null
  content: string | null
  registerAt: string | null
  isEdited: boolean | null
  isDeleted: boolean
}

export type BoardCommentPage = Page<BoardComment>

export interface CommentPayload {
  content: string
}
