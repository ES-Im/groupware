import type { DocumentBoxQueryParams } from './approval'
import type { DeptBusinessTripHistoryParams, MyBusinessTripHistoryParams } from './businessTripHistory'

/**
 * approval(전자결재 공통) 도메인 queryKey 팩토리(ROADMAP(DRAFT) T1.2 / §참조 계약 매핑).
 * board/attendance 도메인(boardKeys/attendanceKeys)과 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(approvalKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * submitted(F712)/unsubmitted(F713)/pending(F710)/accessible(F714) 4종 문서함 목록 축은
 * T1.5의 조회 훅이 소비한다. 상세(draftDetail) 축은 M2 T2.2가 추가했다(단건 조회, F701). 이후
 * 슬라이스가 요약(M7 summary/count) 축을 재설계 없이 확장 추가할 수 있도록 형태를 고정한다.
 *
 * 4종 목록 파라미터(keyword/page/size)는 DocumentBoxQueryParams(model/approval.ts)를 공유한다 —
 * 값이 바뀔 때마다 키가 달라져 재요청되며, 문서함 4종이 동일 파라미터 계약을 갖는다.
 *
 * draftDetail(draftId)은 draftId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 전)에서도 소비 훅이
 * enabled:false로 대기하며 키를 구성할 수 있도록 number | undefined를 받는다(boardKeys.detail 동형).
 * M3~M6의 액션 mutation은 성공 후 invalidateQueries(approvalKeys.draftDetail(draftId))로 상세를
 * 재조회하고, 문서함 목록도 함께 무효화할 때는 approvalKeys.all로 하위 전체를 갱신한다.
 */
export const approvalKeys = {
  all: ['approval'] as const,
  submitted: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'submitted', params] as const,
  unsubmitted: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'unsubmitted', params] as const,
  pending: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'pending', params] as const,
  accessible: (params?: DocumentBoxQueryParams) =>
    [...approvalKeys.all, 'accessible', params] as const,
  draftDetail: (draftId: number | undefined) =>
    [...approvalKeys.all, 'draftDetail', draftId] as const,
  // 문서함 홈 요약 축(M7 T7.1). 파라미터 없는 단건 조회라 all 하위에 고정 세그먼트만 append한다.
  // summary(F715 문서함 요약 4 counts)·pendingCount(F711 결재대기 건수 bare number)는 서로 다른
  // 엔드포인트지만 pendingApprovalDraftCount 축을 공유한다 — M3 결재 액션 성공 후 approvalKeys.all
  // invalidate로 둘 다 함께 갱신된다.
  summary: () => [...approvalKeys.all, 'summary'] as const,
  pendingCount: () => [...approvalKeys.all, 'pendingCount'] as const,
  // 부서 출장 이력 축(M5 T5.1, F734). deptId가 아직 확정되지 않은 상태(usePrimaryDeptId strict)에서도
  // 소비 훅이 enabled:false로 대기하며 키를 구성할 수 있도록 number | undefined를 받는다(draftDetail 동형).
  deptBusinessTripHistory: (deptId: number | undefined, params?: DeptBusinessTripHistoryParams) =>
    [...approvalKeys.all, 'deptBusinessTripHistory', deptId, params] as const,
  // 내 출장 이력 축(M4 T4.1, F733). 배열 응답(페이징 없음)이라 deptBusinessTripHistory와 달리 deptId
  // 파라미터가 없다 — approvalStatus/yearMonth 필터만 키에 반영한다.
  myBusinessTripHistory: (params?: MyBusinessTripHistoryParams) =>
    [...approvalKeys.all, 'myBusinessTripHistory', params] as const,
}
