import type { RequestHandler } from 'msw'

/**
 * 공용(기본) MSW 핸들러 모음.
 *
 * 정책(test-author-runner / Mock-First):
 * - 도메인별 목은 여기 배열에 등록하거나, 개별 테스트에서 `server.use(...)`로 오버라이드한다.
 * - 목 데이터의 형태는 백엔드 계약(@docs/backend-contract)의 DTO를 그대로 따른다.
 * - 계약과 목이 충돌하면 목이 틀린 것으로 보고, 소스가 아니라 목/테스트를 고친다.
 *
 * 시작 시점에는 전역 기본 핸들러를 비워 둔다.
 * 각 테스트는 자기 시나리오에 필요한 핸들러만 명시적으로 등록해
 * "요청이 어디로 가는지"를 테스트 안에서 드러낸다(암묵적 전역 목 최소화).
 */
export const handlers: RequestHandler[] = []
