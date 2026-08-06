import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { updateMeSchema, type UpdateMeFormValues } from '../model/updateMeSchema'

interface UpdateMeFormProps {
  defaultExtensionNo: string
  onSubmit: (values: UpdateMeFormValues) => Promise<void>
}

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
