import { useState } from 'react'

export function useMobileSidebarOpen() {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return { open, setOpen, toggle, close }
}
