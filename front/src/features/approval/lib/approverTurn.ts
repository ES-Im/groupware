import type { DraftApprover } from '../model/draftDetail'

/**
 * 결재자 액션(승인 F705·반려 F706) 버튼 노출 판정 순수 파생 로직(ROADMAP(DRAFT) T3.1, Open Q#4).
 *
 * 판정 기준(PRD §참조 계약 매핑 · 도메인모델 §6 "승인 가능자 = 미처리 결재자 중 최소 order = 현재 차례").
 * 여기서 '결재자'는 role 무관 approvers[] 전체다 — APPROVER(결재 승인자)·COOPERATOR(협조 승인자) 모두
 * order를 갖고 승인/반려 워크플로우에 참여하므로 role 필터를 넣지 않는다(넣으면 협조자 차례를 건너뛴다):
 *  1) 본인(myEmpId)이 결재선 approvers[]에 존재하고,
 *  2) 본인이 아직 미처리(approvedAt·rejectedAt 둘 다 null)이며,
 *  3) 미처리 결재자 중 최소 order가 본인 order와 같다(= 본인보다 낮은 order가 전부 처리됨).
 *
 * 케이스별 결과:
 *  - myEmpId 미확정(useMeQuery 미로딩/empId 부재 과도기): false → 버튼 미노출(안전 처리).
 *  - 결재선 밖(본인 approver 없음): false.
 *  - 본인 이미 처리(승인/반려 완료): false.
 *  - 본인보다 낮은 order 중 미처리가 남음(내 차례 전): false.
 *  - 위 3조건 모두 충족: true → 승인/반려 버튼 노출.
 *
 * 이 판정은 **UI 노출 힌트일 뿐 최종 인가는 서버**가 한다(Open Q#4) — 차례 아님·이미 처리·결재선
 * 밖은 승인/반려 API가 도메인 에러로 최종 판정하며, 그 실패는 apiError 매핑이 처리한다. 반려로
 * REJECTED 전이된 문서는 미처리 approver가 남아 있어도 목록/상세에서 더 이상 결재대기로 진입하지
 * 않으므로 이 순수함수는 approvers 필드만으로 도출한다(상태값에 의존하지 않음).
 *
 * order 동률(같은 order에 미처리자 복수)은 백엔드 결재선 정책상 이례적이나, 발생 시 규칙 그대로
 * 해당 order의 미처리자 모두 "현재 차례"로 판정된다(최종 판정은 서버).
 */
export function isMyApprovalTurn(
  approvers: DraftApprover[],
  myEmpId: number | undefined,
): boolean {
  if (myEmpId === undefined) {
    return false
  }

  const me = approvers.find((approver) => approver.empId === myEmpId)
  if (!me || isProcessed(me)) {
    return false
  }

  // 도메인모델 §6 — 미처리 결재자(APPROVER·COOPERATOR 모두 '승인자', role 무관) 중 최소 order가
  // 현재 차례. 협조자(COOPERATOR)도 order를 갖고 승인/반려 워크플로우(approvedAt/rejectedAt)에
  // 참여하므로 role 필터를 넣지 않는다 — 필터를 넣으면 협조자 차례를 건너뛰어 오히려 틀린다.
  const pendingOrders = approvers.filter((approver) => !isProcessed(approver)).map((a) => a.order)
  // me가 미처리이므로 pendingOrders는 최소 1개(자기 자신)를 포함 → Math.min 안전.
  return me.order === Math.min(...pendingOrders)
}

/** 결재자 1인의 처리 완료 여부(승인 또는 반려 일시가 채워지면 처리됨). */
function isProcessed(approver: DraftApprover): boolean {
  return approver.approvedAt !== null || approver.rejectedAt !== null
}
