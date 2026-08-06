export const boardKeys = {
  all: ['board'] as const,
  list: (
    categoryId: number | undefined,
    params?: { keyword?: string; page?: number; size?: number },
  ) => [...boardKeys.all, 'list', categoryId, params] as const,
  detail: (boardId: number | undefined) => [...boardKeys.all, 'detail', boardId] as const,
  editMode: (boardId: number | undefined) => [...boardKeys.all, 'editMode', boardId] as const,
  comments: (boardId: number | undefined, params?: { page?: number; size?: number }) =>
    [...boardKeys.all, 'comments', boardId, params] as const,
  files: (boardId: number | undefined) => [...boardKeys.all, 'files', boardId] as const,
  drafts: () => [...boardKeys.all, 'drafts'] as const,
}
