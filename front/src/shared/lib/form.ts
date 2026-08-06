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

export function useZodForm<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues, TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
) {
  return useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
  })
}

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
