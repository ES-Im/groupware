export function parseEmpFilePreviewFileId(profileImageUrl: string | null): number | undefined {
  if (!profileImageUrl) {
    return undefined
  }
  const match = /\/employees\/\d+\/files\/(\d+)\/preview/.exec(profileImageUrl)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}
