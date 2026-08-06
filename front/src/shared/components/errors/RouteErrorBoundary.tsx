import { isRouteErrorResponse, useRouteError } from 'react-router'
import { normalizeApiError, resolveErrorView } from '@/shared/lib/apiError'
import { NotFoundPage } from '@/shared/components/errors/NotFoundPage'
import { ForbiddenPage } from '@/shared/components/errors/ForbiddenPage'
import { ServerErrorPage } from '@/shared/components/errors/ServerErrorPage'
import { NetworkErrorPage } from '@/shared/components/errors/NetworkErrorPage'

export function RouteErrorBoundary() {
  const error = useRouteError()

  if (import.meta.env.DEV) {
    console.error(error)
  }

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFoundPage variant="page" />
    }
    if (error.status === 403) {
      return <ForbiddenPage variant="page" />
    }
    return <ServerErrorPage variant="page" />
  }

  const apiError = normalizeApiError(error)

  switch (resolveErrorView(apiError)) {
    case 'notFound':
      return <NotFoundPage variant="page" message={apiError.message} />
    case 'forbidden':
      return <ForbiddenPage variant="page" message={apiError.message} />
    case 'server':
      return <ServerErrorPage variant="page" message={apiError.message} />
    case 'network':
      return <NetworkErrorPage variant="page" message={apiError.message} />
    default:
      return <ServerErrorPage variant="page" />
  }
}
