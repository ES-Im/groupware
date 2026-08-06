import { apiClient } from '@/shared/api/client'

export async function downloadDraftFile(
  draftId: number,
  fileId: number,
  fileName: string,
): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/api/drafts/${draftId}/files/${fileId}/download`, {
    responseType: 'blob',
  })

  const objectUrl = URL.createObjectURL(data)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
