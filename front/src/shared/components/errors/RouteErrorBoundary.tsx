import { isRouteErrorResponse, useRouteError } from 'react-router'
import { normalizeApiError, resolveErrorView } from '@/shared/lib/apiError'
import { NotFoundPage } from '@/shared/components/errors/NotFoundPage'
import { ForbiddenPage } from '@/shared/components/errors/ForbiddenPage'
import { ServerErrorPage } from '@/shared/components/errors/ServerErrorPage'
import { NetworkErrorPage } from '@/shared/components/errors/NetworkErrorPage'

/**
 * 라우트 트리 최상단(router.tsx의 루트 라우트 errorElement)에 붙는 디스패처.
 * loader/action이 던진 에러와, 자식 라우트 렌더 중 발생한 예외(throw)가 버블링되어 여기서 잡힌다.
 *
 * 이 바운더리가 렌더된다는 것은 루트 라우트 자체가 교체된다는 뜻이라 LayoutShell(사이드바 셸)도
 * 함께 언마운트된다 — "500/크래시는 셸 밖" 정책과 맞물려, 아래 모든 분기에서 variant="page"를
 * 명시적으로 지정한다. NotFoundPage·ForbiddenPage는 기본값이 embedded(셸 안에서 카드만 렌더)라
 * 그대로 두면 셸이 없는데 카드만 둥둥 떠 레이아웃이 깨진다.
 *
 * 이 프로젝트는 라우터 loader를 쓰지 않고 서버 상태는 전부 react-query가 담당하므로(§CLAUDE.md),
 * 실제로 이 바운더리에 도달하는 경우는 대부분 렌더 중 크래시(axios 에러가 아닌 순수 JS 예외)다.
 * 다만 react-router 자체 라우트 매칭 실패 등은 ErrorResponse 형태로 올 수 있어 그 분기도 남겨둔다.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  // 프로덕션에서는 원본 에러를 콘솔에 남기지 않는다(개발 편의 목적).
  if (import.meta.env.DEV) {
    console.error(error)
  }

  // react-router가 던진 ErrorResponse(예: 라우트 자체의 응답형 에러)는 status로 직접 분기한다.
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFoundPage variant="page" />
    }
    if (error.status === 403) {
      return <ForbiddenPage variant="page" />
    }
    return <ServerErrorPage variant="page" />
  }

  // 그 외(axios 에러 포함 렌더 중 throw)는 apiError 정규화·판별 헬퍼로 분기를 위임한다.
  // normalizeApiError는 axios가 아닌 값도 안전하게 처리하므로 별도의 axios.isAxiosError 분기가
  // 필요 없다 — 진짜 axios 에러가 아니면 resolveErrorView가 null을 반환해 아래 500 폴백으로 간다.
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
      // 400 계열·401 등 전면 전환 대상이 아닌 코드이거나, axios 에러가 아닌 순수 렌더 크래시라
      // normalizeApiError가 UNKNOWN으로 폴백한 경우 — 둘 다 안전한 기본값인 500 화면으로 처리한다.
      return <ServerErrorPage variant="page" />
  }
}
