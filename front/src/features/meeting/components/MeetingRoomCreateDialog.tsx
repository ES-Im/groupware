import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useMeetingRoomCreateMutation } from '../api/useMeetingRoomCreateMutation'
import { useMeetingRoomFileUploadMutation } from '../api/useMeetingRoomFileUploadMutation'
import { MeetingRoomFileValidationError, validateMeetingRoomFileUpload } from '../lib/meetingRoomFileValidation'
import {
  meetingRoomCreateSchema,
  type MeetingRoomCreateFormValues,
} from '../model/meetingRoomCreateSchema'

interface MeetingRoomCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingRoomCreateDialog({ open, onOpenChange }: MeetingRoomCreateDialogProps) {
  const navigate = useNavigate()
  const mutation = useMeetingRoomCreateMutation()
  const uploadMutation = useMeetingRoomFileUploadMutation()
  const form = useZodForm(meetingRoomCreateSchema)

  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({ name: '', description: '', capacity: undefined })
    } else {
      reset()
    }
    setStagedFiles([])
  }, [open, reset])

  function handleStagedFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    try {
      for (const file of selected) {
        validateMeetingRoomFileUpload(file)
      }
    } catch (error) {
      if (error instanceof MeetingRoomFileValidationError) {
        toast.error(error.message)
        return
      }
      throw error
    }
    setStagedFiles((prev) => [...prev, ...selected])
  }

  function handleRemoveStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(values: MeetingRoomCreateFormValues) {
    const result = await mutation.mutateAsync(values)

    if (stagedFiles.length > 0) {
      try {
        await uploadMutation.mutateAsync({ meetingRoomId: result.id, files: stagedFiles })
      } catch {
        toast.error('회의실은 등록되었습니다. 안내 이미지는 상세 화면에서 다시 업로드해주세요')
        onOpenChange(false)
        navigate(`/meeting-rooms/management/${result.id}`)
        return
      }
    }

    toast.success('회의실을 등록했습니다')
    onOpenChange(false)
    navigate(`/meeting-rooms/management/${result.id}`)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회의실 등록</DialogTitle>
          <DialogDescription>새 회의실의 이름·설명·수용인원을 입력해 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-create-name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-room-create-name"
              placeholder="예: 3층 대회의실"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-create-description">
              설명 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="meeting-room-create-description"
              placeholder="회의실 설명을 입력해주세요"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-create-capacity">
              수용 인원 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-room-create-capacity"
              type="number"
              min={1}
              step={1}
              placeholder="예: 10"
              aria-invalid={!!errors.capacity}
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p role="alert" className="text-sm text-destructive">
                {errors.capacity.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>안내 이미지</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleStagedFileInputChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus />
              이미지 추가
            </Button>
            {stagedFiles.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {stagedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveStagedFile(index)}
                      aria-label={`${file.name} 제거`}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">선택된 이미지가 없습니다.</p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
