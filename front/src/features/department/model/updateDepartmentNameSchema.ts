import { z } from 'zod'

/**
 * 부서명 변경 폼 클라이언트 사전검증 스키마(`DEPT_UPDATE_NAME`, ROADMAP T9.2).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_UPDATE_NAME/query-parameters.adoc은 `newName`
 * 필수 여부만 명시하고 길이 제약은 문서화하지 않지만, `deptName`은 등록(`DEPT_REGISTER`)과 동일한
 * DB 컬럼(`docs/도메인모델.md` `dept_name varchar(20)`)을 갱신하는 값이라 registerDepartmentSchema와
 * 동일한 20자 제한을 그대로 적용한다(추측이 아니라 동일 컬럼 제약의 재사용).
 *
 * 서버 판정(VALIDATION_ERROR/COMMON_00x 등)은 submitWithErrorMapping이 handleApiError로 위임해
 * 폼 루트 에러/토스트로 처리하므로 여기서는 클라 사전검증 수준만 다룬다(T1.1/T8.1과 동일 컨벤션).
 */
export const updateDepartmentNameSchema = z.object({
  newName: z.string().min(1, '부서명을 입력해주세요').max(20, '부서명은 20자 이하로 입력해주세요'),
})

export type UpdateDepartmentNameFormValues = z.infer<typeof updateDepartmentNameSchema>
