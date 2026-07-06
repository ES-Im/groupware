import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { useMeQuery } from '../api/useMeQuery'
import { useUpdateMeMutation } from '../api/useUpdateMeMutation'
import { UpdateMeForm } from '../components/UpdateMeForm'
import type { UpdateMeFormValues } from '../model/updateMeSchema'

/**
 * 내 정보 수정 페이지(F005, UPDATE_SELF_INFO, ROADMAP T3.1).
 *
 * 프레젠테이션 컴포넌트인 UpdateMeForm(T1.1 패턴 재사용)에 실제 수정 mutation을 연결하는
 * 컨테이너. useUpdateMeMutation(T3.1 신설)이 저장 성공(204) 시 onSuccess에서
 * employeeKeys.me()를 invalidate해 useMeQuery(T1.3) 캐시를 재검증한다 — 이 페이지는
 * 성공 후 사용자에게 결과를 알리고 /me로 되돌려 재조회된 최신 데이터를 보여주기만 한다.
 * 검증 실패(VALIDATION_ERROR/COMMON_00x 등)는 에러를 그대로 throw해 UpdateMeForm 내부의
 * submitWithErrorMapping이 handleApiError(T0.2c)로 위임하도록 둔다(폼 루트 에러 또는 토스트).
 *
 * extensionNo 프리필: useMeQuery(T1.3, 동일 캐시)로 현재 값을 읽어 UpdateMeForm의
 * defaultExtensionNo로 주입한다. RHF는 마운트 이후 defaultValues 변경을 반영하지 않으므로,
 * 로딩 중에는 폼을 아예 렌더하지 않고(MyInfoPage와 동일한 로딩/에러 컨벤션) 데이터가
 * 확정된 뒤에만 UpdateMeForm을 마운트해 최초 렌더부터 유효한 값이 채워지도록 한다.
 */
export function UpdateMePage() {
  const navigate = useNavigate()
  const meQuery = useMeQuery()
  const updateMeMutation = useUpdateMeMutation()

  useEffect(() => {
    if (!meQuery.error) {
      return
    }
    toast.error(normalizeApiError(meQuery.error).message)
  }, [meQuery.error])

  async function handleSubmit(values: UpdateMeFormValues) {
    await updateMeMutation.mutateAsync(values)
    toast.success('내 정보를 수정했습니다')
    navigate('/me')
  }

  if (meQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">불러오는 중...</p>
  }

  if (meQuery.error || !meQuery.data) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-lg font-semibold">내 정보 수정</h1>
        <p className="text-sm text-muted-foreground">
          내 정보를 불러오지 못해 수정할 수 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">내 정보 수정</h1>
      <div className="max-w-sm">
        <UpdateMeForm
          defaultExtensionNo={meQuery.data.empBasicInfo.extensionNo ?? ''}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
