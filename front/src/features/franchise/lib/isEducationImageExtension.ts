const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

export function isEducationImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
