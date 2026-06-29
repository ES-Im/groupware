## 윈도우 환경

- window11

## 언어 및 커뮤니케이션 규칙

- 이 저장소에서 작업할 때는 사용자와의 모든 대화 응답을 **한국어**로 작성한다.
- 커밋 메시지, `@DisplayName`, 테스트 실패 메시지, 도메인 예외 메시지, `docs/` 문서는 기존 코드베이스와 동일하게 한국어로 작성한다 (영문 식별자/코드 자체는 그대로 영문 유지).
- 코드 식별자(클래스명, 메서드명, 변수명)는 영문 네이밍 컨벤션을 따르되, 주석이 필요한 경우(비즈니스 규칙 등 WHY를 설명할 때)는 한국어로 작성해도 된다 — 기존 코드의 관례를 따른다.

## 저장소 구조

이 저장소는 서로 독립적인 두 프로젝트로 구성된 모노레포다:

- `back/` — Spring Boot 3.5 / Java 21 REST + WebSocket API (Gradle, Kotlin DSL)
- `front/` — UBold admin 템플릿 기반 React 19 SPA (Vite, Bootstrap 5)
- `compose.yaml` (루트) — MySQL, Redis, 외부 가맹점 API용 Mockoon mock 서버
- `docs/` — 한국어 설계 문서: `도메인모델.md`(엔티티별 도메인 모델/애그리거트/비즈니스 규칙)

## 기술 스택 (실제 코드 기준)

- **JavaScript(JSX) 기반** — 모든 소스는 `.jsx`/`.js`. TypeScript로 작성하지 않는다(`.tsx`/`.ts` 신규 생성 금지). `typescript` 의존성은 ESLint 도구용일 뿐 소스 컴파일 용도가 아니다.
- React 19 + React Router 7, Vite 7, Bootstrap 5 / react-bootstrap
- 폼: `react-hook-form` + `zod`(또는 `yup`), 알림: `sweetalert2`, 캘린더: `@fullcalendar`, 에디터: `react-quill-new`

## 워크플로우
- 코드 수정 후 `npm run lint`(ESLint) 통과 확인 — 이 프로젝트엔 `tsc` 기반 타입체크가 없다
- 빌드 검증이 필요하면 `npm run build`(Vite)
- 포맷은 `npm run format`(Prettier, `./src/**/*.{ts,tsx,js,jsx}` 대상)

## 프로젝트 개요
- 가맹점 프랜차이즈 본사 컨셉 HARUON이라는 가상의 회사의 groupware 시스템



#### 참고 자료
- 핵심 주체 : `Employee`(사원) 중심의 조직 모델
- 인증과 인가관련은 `/groupware/.claude/rules` 디렉토리 하위의 `security.md`을 참고한다.
- Route end-point는 `/groupware/.claude/rules` 디렉토리 하위의 `api-endpoint.md`를 참고한다
  용어사전은 `/groupware/.claude/rules` 디렉토리 하위의 `DomainGlossary.md`를 참고한다.
- 상태전이규칙 및 도메인 규칙은 `@groupware/docs/도메인모델.md`를 참고한다.
