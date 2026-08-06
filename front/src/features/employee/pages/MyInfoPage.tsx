import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { useMeQuery } from '../api/useMeQuery'
import { DeptHistoryCard } from '../components/DeptHistoryCard'
import { EmployeeProfileTabs } from '../components/EmployeeProfileTabs'
import { EmployeeSummaryCard } from '../components/EmployeeSummaryCard'
import { PersonalRecordsWidget } from '../components/PersonalRecordsWidget'
import { SignatureCard } from '../components/SignatureCard'
import { UpdateMeDialog } from '../components/UpdateMeDialog'

export function MyInfoPage() {
  const query = useMeQuery()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!query.error) {
      return
    }
    toast.error(normalizeApiError(query.error).message)
  }, [query.error])

  if (query.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">내 정보</h1>
        <p className="text-sm text-muted-foreground">내 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const { empBasicInfo, activeFiles, currentDepts } = query.data
  const empId = empBasicInfo.empId

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">내 정보</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          내 계정과 소속 정보를 확인합니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <EmployeeSummaryCard
            data={query.data}
            empId={empId}
            viewerIsSelf
            onEditClick={() => setEditDialogOpen(true)}
          />
          <SignatureCard empId={empId} activeFiles={activeFiles} />
        </div>

        <div className="space-y-6">
          <EmployeeProfileTabs data={query.data} empId={empId} viewerIsSelf showDeptTab={false} />
          <DeptHistoryCard currentDepts={currentDepts} />
          <PersonalRecordsWidget />
        </div>
      </div>

      <UpdateMeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        defaultExtensionNo={empBasicInfo.extensionNo ?? ''}
      />
    </div>
  )
}
