const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

export function isImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
