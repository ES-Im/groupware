import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import { toast } from 'sonner'
import type { ZodType } from 'zod'
import { handleApiError } from './apiError'

/**
 * RHF + zod 표준 폼 훅(ROADMAP T1.1).
 *
 * 모든 도메인 폼이 복제할 표준 패턴의 1단계: zodResolver로 클라이언트 사전검증을 강제한다.
 * useForm의 나머지 옵션(mode, defaultValues 등)은 소비처가 그대로 넘기면 된다.
 */
export function useZodForm<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues, TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
) {
  return useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
  })
}

/**
 * 표준 서버 에러 매핑 submit 래퍼(ROADMAP T1.1).
 *
 * 2단계: 클라 사전검증(zodResolver)을 통과한 뒤 onValid(실제 API 호출)가 던진 서버 에러를
 * T0.2c의 handleApiError로 그대로 위임한다 — 여기서 새로 에러 분기를 만들지 않는다.
 * 계약상 VALIDATION_ERROR/AUTH_001의 message는 "특정 필드 하나"만 알려주므로 필드별
 * 다중 매핑을 시도하지 않고 handleApiError 정책(root 우선, 없으면 토스트)을 그대로 따른다.
 */
export function submitWithErrorMapping<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'handleSubmit' | 'setError'>,
  onValid: SubmitHandler<TFieldValues>,
) {
  return form.handleSubmit(async (data, event) => {
    try {
      await onValid(data, event)
    } catch (error) {
      handleApiError(error, { setError: form.setError, toast })
    }
  })
}
