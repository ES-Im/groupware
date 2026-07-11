import type { MailBox } from './messageTypes'

/**
 * message(쪽지함) 도메인 queryKey 팩토리(ROADMAP(MESSAGE) T1.2 / §참조 계약 매핑).
 * approvalKeys(src/features/approval/model/queryKeys.ts)·boardKeys와 동형 구조 — all을
 * 배열 리터럴로 고정해 invalidateQueries(messageKeys.all)로 하위 전체를 한 번에 갱신할 수
 * 있게 한다.
 *
 * list(box, params) 축은 T2.1(4박스 목록 조회 훅)이 소비한다. detail/files는 messageId가
 * 아직 확정되지 않은 상태(라우트 파라미터 파싱 전)에서도 소비 훅이 enabled:false로 대기하며
 * 키를 구성할 수 있도록 number | undefined를 받는다(boardKeys.detail 동형) — detail은 T3.1
 * (상세 조회), files는 T3.2(첨부 목록 조회)가 소비한다. counts는 파라미터 없는 단건 조회라
 * all 하위에 고정 세그먼트만 append하며 T1.4(사이드바 배지)·T2.2(목록 탭 배지)가 공유 소비한다.
 */
export const messageKeys = {
  all: ['message'] as const,
  list: (
    box: MailBox,
    params?: { keyword?: string; isRead?: boolean; page?: number; size?: number },
  ) => [...messageKeys.all, 'list', box, params] as const,
  detail: (messageId: number | undefined) => [...messageKeys.all, 'detail', messageId] as const,
  files: (messageId: number | undefined) => [...messageKeys.all, 'files', messageId] as const,
  counts: () => [...messageKeys.all, 'counts'] as const,
}
