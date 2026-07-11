import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { updateMeSchema, type UpdateMeFormValues } from '../model/updateMeSchema'

interface UpdateMeFormProps {
  /**
   * extensionNo 초기값(useMeQuery 현재 데이터, UpdateMeDialog가 주입).
   * 계약상 extensionNo도 required(전체 교체)라 빈 값 그대로 두면 비밀번호만 바꾸려는
   * 사용자도 클라 검증에 막힌다 — 조회된 현재 값으로 미리 채워 재입력 부담을 없앤다.
   * (newRawPassword는 민감정보라 프리필하지 않는다. 아래 주석 참고.)
   */
  defaultExtensionNo: string
  /**
   * 클라 사전검증을 통과한 값으로 실제 내 정보 수정 요청을 수행한다.
   * 성공 이후 동작(재조회 invalidate·다이얼로그 닫기)은 이 폼의 책임이 아니다(UpdateMeDialog가 조합).
   * 서버가 던진 에러는 그대로 reject하면 submitWithErrorMapping이 handleApiError로
   * 위임해 폼 루트 에러/토스트로 매핑한다.
   */
  onSubmit: (values: UpdateMeFormValues) => Promise<void>
}

/**
 * RHF + zod 표준 폼 패턴 재사용(ROADMAP T1.1 → T3.1, RegisterForm.tsx와 동형 구조).
 * 1) zodResolver로 extensionNo/newRawPassword를 클라에서 선검증(updateMeSchema).
 * 2) 제출 시 서버가 던진 에러(VALIDATION_ERROR/COMMON_00x 등)는 submitWithErrorMapping →
 *    handleApiError가 폼 루트(root) 에러 또는 토스트로 매핑한다(계약상 message는 필드 하나만
 *    알려주므로 필드별 다중 매핑은 하지 않는다).
 * defaultExtensionNo는 useForm 최초 마운트 시점의 defaultValues로만 쓰인다 — RHF는 마운트 후
 * defaultValues 변경을 자동 반영하지 않으므로, MyInfoPage가 useMeQuery 로딩 완료 후에만
 * UpdateMeDialog(및 이 컴포넌트)를 마운트해 항상 유효한 값이 최초 렌더부터 채워지도록 보장한다.
 * newRawPassword는 defaultValues에 빈 문자열만 두고 조회 데이터로 채우지 않는다 — 서버가
 * 현재 비밀번호를 내려주지 않고(민감정보), 매 제출은 신규 비밀번호 전체 교체이기 때문이다.
 */
export function UpdateMeForm({ defaultExtensionNo, onSubmit }: UpdateMeFormProps) {
  const form = useZodForm(updateMeSchema, {
    defaultValues: { extensionNo: defaultExtensionNo, newRawPassword: '' },
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="extensionNo">내선번호</Label>
        <Input
          id="extensionNo"
          placeholder="000-0000"
          aria-invalid={!!errors.extensionNo}
          {...register('extensionNo')}
        />
        {errors.extensionNo && (
          <p role="alert" className="text-sm text-destructive">
            {errors.extensionNo.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newRawPassword">새 비밀번호</Label>
        <Input
          id="newRawPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newRawPassword}
          {...register('newRawPassword')}
        />
        {errors.newRawPassword && (
          <p role="alert" className="text-sm text-destructive">
            {errors.newRawPassword.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
        저장
      </Button>
    </form>
  )
}
