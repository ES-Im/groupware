import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 포맷 인자 파싱은 customParseFormat 플러그인이 있어야 동작한다(FranchiseSalesPage.tsx와 동일 이유) —
// 없으면 dayjs(value,'YYYY-MM-DD',true)의 포맷·strict 인자가 무시되고 느슨한 네이티브 Date 파싱으로
// 폴백해 '2024/01/01'·'2024-02-30'(존재하지 않는 날짜) 같은 값도 유효 판정된다.
dayjs.extend(customParseFormat)

/**
 * HR/ADMIN의 특정 사원 정보 수정 폼 클라이언트 사전검증 스키마(`HR_UPDATE_EMP_INFO`).
 *
 * 필드 근거: back/.../application/employee/account/service/command/dto/EmpUpdateRequestByHR.java
 * 실측(추측 금지) — request-fields.adoc은 5개 필드 전부 "필수여부: true"로 문서화돼 있으나, 실제
 * compact constructor는 전 필드 `@Nullable`이고 "적어도 1개 필드는 non-null"만 요구하는 진짜
 * partial-update(PATCH) 계약이다(서비스 계층 `Emp.changeInfoByHR`도 각 필드를 null이 아닐 때만
 * 적용). adoc의 "필수" 표기는 REST Docs 예제가 항상 전 필드를 채워 생성된 데 따른 문서화 버그로
 * 판단된다(실사용 검증 중 발견 — 비밀번호를 매번 새로 입력해야만 저장이 되는 UX 결함으로 드러남).
 * - empName: 20자 이하(항상 현재 값으로 프리필되어 있어 그대로 재전송해도 무해 — optional로 두지 않음).
 * - password: 8자 이상+영문+숫자+특수문자 — **단, 빈 문자열이면 "비밀번호 변경 안 함"으로 간주해
 *   포맷 검증을 건너뛴다.** 제출 시(다이얼로그) 빈 문자열은 undefined로 변환해 요청 바디에서 아예
 *   제외한다(JSON.stringify가 undefined 키를 생략 — 서버가 null로 인식해 미변경 처리).
 * - extensionNo: NNN-NNNN — 마찬가지로 빈 문자열이면 검증을 건너뛰고 제출 시 undefined로 생략한다
 *   (기존 내선번호가 비어있는 사원의 권한만 바꾸려 할 때 내선번호 입력을 강제하지 않기 위함).
 * - systemRoleCode: 비어있지 않은 배열(최소 1개 권한 필요, "HR은 ADMIN 부여 불가"는 서버 최종
 *   검증에 위임하고 클라에서는 후보 목록 자체를 제한하는 방식으로 대응한다 — HrManagedInfoDialog 참고).
 * - hireAt: yyyy-MM-dd, dayjs 유효성 검사(항상 현재 값으로 프리필되어 있어 optional로 두지 않음).
 */
export const updateHrManagedInfoSchema = z.object({
  empName: z.string().min(1, '이름을 입력해주세요').max(20, '이름은 20자 이하로 입력해주세요'),
  password: z
    .string()
    .refine((value) => value === '' || value.length >= 8, '비밀번호는 8자 이상이어야 합니다')
    .refine((value) => value === '' || /[A-Za-z]/.test(value), '비밀번호는 영문을 포함해야 합니다')
    .refine((value) => value === '' || /[0-9]/.test(value), '비밀번호는 숫자를 포함해야 합니다')
    .refine((value) => value === '' || /[^A-Za-z0-9]/.test(value), '비밀번호는 특수문자를 포함해야 합니다'),
  extensionNo: z
    .string()
    .refine(
      (value) => value === '' || /^\d{3}-\d{4}$/.test(value),
      '내선번호는 000-0000 형식(3자리 숫자-4자리 숫자)으로 입력해주세요',
    ),
  systemRoleCode: z.array(z.string()).min(1, '권한을 최소 1개 선택해주세요'),
  hireAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '입사일자를 올바르게 입력해주세요'),
})

export type UpdateHrManagedInfoFormValues = z.infer<typeof updateHrManagedInfoSchema>
