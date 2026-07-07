import { z } from 'zod'

/**
 * 상위 부서 변경 폼 클라이언트 사전검증 스키마(`DEPT_UPDATE_PARENT`, ROADMAP T9.3).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_UPDATE_PARENT/query-parameters.adoc 실측 —
 * `parentDeptId`(상위 부서로 지정할 부서 식별 번호, **optional** — 미전달 시 서버가 최상위 부서로
 * 이동 처리). 네이티브 `<select>`는 항상 문자열 값을 내보내므로, 빈 문자열(`''`)을 "최상위로 이동"
 * 옵션의 전용 값으로 사용한다 — appointDepartmentLeaderSchema와 달리 이 필드는 빈 값 자체가
 * 유효한 선택지이므로 `min(1)` 같은 필수 검증을 걸지 않는다. select의 옵션이 후보 목록 + "최상위로
 * 이동" 둘 중 하나로만 구성되므로 그 외 값이 들어올 수 없어 정규식 검증도 필요 없다.
 * 실제 number 변환/optional 매핑은 제출 핸들러(다이얼로그 컴포넌트)에서 수행한다.
 */
export const updateDepartmentParentSchema = z.object({
  parentDeptId: z.string(),
})

export type UpdateDepartmentParentFormValues = z.infer<typeof updateDepartmentParentSchema>
