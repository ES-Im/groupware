import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Node(Vitest) 환경용 MSW 서버.
 *
 * jsdom + msw/node 조합으로 axios(apiClient)의 실제 네트워크 요청을 가로챈다.
 * lifecycle(listen/resetHandlers/close)은 src/test/setup.ts에서 전역 등록한다.
 *
 * 브라우저용 서비스워커(msw/browser)는 이 하네스에서 사용하지 않는다
 * → public/mockServiceWorker.js 및 msw postinstall은 불필요.
 */
export const server = setupServer(...handlers)
