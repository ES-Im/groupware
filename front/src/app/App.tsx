import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { useBootstrapAuth } from '@/features/auth/hooks/useBootstrapAuth'
import { router } from './router'

export function App() {
  useBootstrapAuth()

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </>
  )
}
