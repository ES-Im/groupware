/**
 * board 도메인 queryKey 팩토리(ROADMAP T10.2 / §참조 계약 매핑 / §기술 스택).
 * departmentKeys(@/features/department/model/queryKeys)와 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(boardKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * list(categoryId, params)는 T10.2(목록·카테고리 조회), detail/files는 T11.1(상세·첨부 조회),
 * editMode는 T13.1(편집 초기값 조회)에서 실제로 소비된다. comments/drafts는 빌더 시그니처만
 * 선언해두고, 이를 사용하는 조회 훅 구현은 후속 M14(댓글)~M15(임시저장) 태스크가 채운다
 * (재설계 없이 그대로 재사용될 형태로 미리 고정).
 *
 * list/detail/editMode/comments/files는 categoryId·boardId가 아직 확정되지 않은 상태(예: 카테고리
 * 목록 로딩 중, 라우트 파라미터 파싱 전)에서도 소비 훅이 enabled:false로 대기하며 queryKey를
 * 구성할 수 있도록 number | undefined를 받는다(departmentKeys.detail/members와 동일 이유).
 */
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
