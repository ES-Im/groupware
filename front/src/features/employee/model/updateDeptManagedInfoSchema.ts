import { z } from 'zod'

/**
 * DEPT_MANAGER/ADMIN의 특정 사원 정보 수정 폼 클라이언트 사전검증 스키마(`DEPT_MANAGER_UPDATE_EMP_INFO`).
 *
 * 필드 근거: back/.../EmpUpdateRequestByDeptManager.java 실측(추측 금지) — request-fields.adoc은
 * 두 필드 다 "필수여부: true"로 문서화돼 있으나, 실제 compact constructor는 둘 다 `@Nullable`이고
 * "적어도 1개 필드는 non-null"만 요구하는 partial-update 계약이다(updateHrManagedInfoSchema와
 * 동일한 adoc 문서화 버그, 실사용 검증 중 발견). HR용 스키마와 달리 이름/비밀번호/입사일자는
 * 다루지 않는다 — 부서매니저 권한 범위가 내선번호·권한(EMPLOYEE/DEPT_MANAGER+본인이 가진
 * Layer-2 권한)으로 한정돼 있다.
 *
 * extensionNo는 빈 문자열이면 "변경 안 함"으로 간주해 포맷 검증을 건너뛴다 — 제출 시(다이얼로그)
 * 빈 문자열은 undefined로 변환해 요청 바디에서 제외한다(기존 내선번호가 비어있는 사원의 권한만
 * 바꾸려 할 때 내선번호 입력을 강제하지 않기 위함).
 */
export const updateDeptManagedInfoSchema = z.object({
  extensionNo: z
    .string()
    .refine(
      (value) => value === '' || /^\d{3}-\d{4}$/.test(value),
      '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요',
    ),
  systemRoleCode: z.array(z.string()).min(1, '권한을 최소 1개 선택해주세요'),
})

export type UpdateDeptManagedInfoFormValues = z.infer<typeof updateDeptManagedInfoSchema>
