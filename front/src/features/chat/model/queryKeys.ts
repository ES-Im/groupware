/**
 * chat 도메인 queryKey 팩토리(ROADMAP(CHAT) T1.1 / §참조 계약 매핑).
 * board/department 도메인의 boardKeys/departmentKeys와 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(chatKeys.all)로 하위 전체(목록·상세·메시지)를 한 번에 갱신할 수 있게 한다.
 *
 * rooms(params)는 T1.1(목록 조회, F901)에서 실제로 소비된다. detail/messages는 roomId가 아직
 * 확정되지 않은 상태(라우트 파라미터 파싱 전)에서도 소비 훅이 enabled:false로 대기하며
 * queryKey를 구성할 수 있도록 number | undefined를 받는다(departmentKeys.detail과 동일 이유).
 * detail은 이후 T2.1(상세 조회, F902), messages는 T2.2(메시지 커서 페이징, F903)가 실제로 소비한다
 * — 지금은 이후 슬라이스가 재설계 없이 그대로 확장할 수 있도록 빌더 시그니처만 미리 고정해둔다.
 */
export const chatKeys = {
  all: ['chat'] as const,
  rooms: (params?: { keyword?: string; isBookmark?: boolean }) =>
    [...chatKeys.all, 'rooms', params] as const,
  detail: (roomId: number | undefined) => [...chatKeys.all, 'room', roomId] as const,
  messages: (roomId: number | undefined, params?: { cursor?: number; size?: number }) =>
    [...chatKeys.all, 'room', roomId, 'messages', params] as const,
}
