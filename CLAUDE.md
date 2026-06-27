# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

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

`back/`은 자체 중첩 `.git` 디렉터리를 갖고 있지만 루트 저장소에는 일반 파일로 커밋되어 있다(서브모듈/gitlink가 아님) — 별도 저장소로 취급하지 말 것.

## 명령어

### 백엔드 (`back/`)

```
./gradlew build               # 전체 빌드 (테스트 + asciidoctor 문서 + bootJar)
./gradlew test                # 전체 테스트 실행
./gradlew test --tests "com.haruon.groupware.application.chat.provided.ChatSenderTest"
./gradlew test --tests "*ChatSenderTest.send_success"
./gradlew bootRun             # 앱 실행 (profile: dev, application.yml 기준)
```

- Java 툴체인은 Gradle을 통해 21로 고정되어 있다.
- `env.yml`(gitignore 대상, `back/src/main/resources/env.yml`에 위치)이 `application*.yml`에서 참조하는 모든 시크릿/설정(DB 계정, JWT secret, Redis, 파일 저장 루트, Mockoon URL, 근무시간/연차 기본값 같은 회사 전역 상수)을 제공한다. 새로 클론한 환경에서는 앱 실행 전에 이 파일을 로컬에 직접 만들어야 한다.
- Spring Boot의 Docker Compose 통합 기능이 `spring.docker.compose` 설정을 통해 `bootRun`/테스트 실행 시 `compose.yaml`(MySQL/Redis/Mockoon)을 자동으로 띄운다 — `docker compose up`을 수동으로 실행할 필요 없음.
- `./gradlew test`는 항상 `asciidoctor`/`bootJar`보다 먼저 실행된다 — Spring REST Docs 스니펫이 docs 테스트(`adapter.docs.webapi.**`)로부터 `build/generated-snippets`에 생성되고, 이후 `build/docs/asciidoc/index.html`에 엮여서 jar 안의 `static/docs`로 패키징된다.
- errorprone + NullAway는 `main` 컴파일에만 적용되며(이름에 "test"가 포함된 태스크는 비활성화), 위반 시 **빌드를 실패시킨다**. NullAway는 `application`과 `domain` 패키지에만 적용되고(`onlyNullMarked.set(false)` + 명시적 `annotatedPackages`), `adapter`에는 적용되지 않는다.

### 프론트엔드 (`front/`)

```
npm run dev        # vite 개발 서버 (localhost:5173)
npm run build      # 프로덕션 빌드
npm run lint        # eslint
npm run format      # src/**/*.{ts,tsx,js,jsx} 대상 prettier --write
```

## 백엔드 아키텍처

헥사고날(포트-어댑터) 아키텍처를 바운디드 컨텍스트(`chat`, `schedule`, `draft`, `employee`, `franchise`, `meeting`, `message`, `board`, `dept`, `company` 등) 단위로 구성한다. 각 컨텍스트마다 `domain/<context>`, `application/<context>`, `adapter/.../<context>` 아래에 동일한 3계층 구조가 반복된다:

```
domain/<context>/              JPA 엔티티, 순수 비즈니스 규칙, package-private mutator
application/<context>/
  provided/forCommand/         "구동(driving)" 포트 — adapter가 호출해 들어오는 커맨드 유즈케이스 인터페이스
  provided/forRetriever/       조회 유즈케이스용 "구동" 포트
  required/                    "피구동(driven)" 포트 — application이 밖으로 호출하는 repository/gateway 인터페이스
  service/command/             provided/forCommand 구현체 (@Service, @Transactional)
  service/query/               provided/forRetriever 구현체
  service/support/             해당 컨텍스트 서비스들의 공용 헬퍼 (예: ChatUtils)
  event/                       도메인/애플리케이션 이벤트 (ApplicationEventPublisher로 발행)
adapter/webapi/<context>/      REST 컨트롤러 — 오직 `provided` 인터페이스에만 의존, 서비스 직접 의존 금지
adapter/persistence/<context>/ `required` 조회 포트를 구현하는 QueryDSL/JPQL 읽기 모델 repository
adapter/websocket/             STOMP 컨트롤러 (채팅은 WebSocket + Redis pub/sub로 메시지 전파)
```

핵심 컨벤션(공식 네이밍 규칙은 `docs/todo.md` 참고):

- **모든 곳에서 command/query 분리**: `XxxRepository`(required 포트, 쓰기 + command 서비스가 쓰는 단순 조회) vs `XxxQueryRepository`(required 포트, 읽기 전용, `adapter.persistence`의 QueryDSL/JPQL로 구현). Provided 측: `XxxSender`/`XxxManagement`(커맨드 유즈케이스 인터페이스) vs `XxxRetriever`(조회 유즈케이스 인터페이스). 서비스 구현체: `XxxService`(커맨드) vs `XxxQueryService`(조회).
- **`application` 패키지는 애그리거트 루트 기준**으로, **`adapter` 패키지는 유즈케이스 기준**으로 구성한다 — 이는 의도적으로 서로 다른 분류 기준이다(`docs/todo.md` 기준).
- 도메인 엔티티는 `AbstractEntity`(id, createdAt, updatedAt)를 상속하고, `@NoArgsConstructor(access = PROTECTED)`를 사용하며, public setter 없이 static factory 메서드 / 의도가 드러나는 행위 메서드만 노출한다. 불변식은 Bean Validation이 아니라 엔티티 안에서 `requireNonNull`과 `IllegalArgumentException`/`IllegalStateException`을 직접 던져서 강제한다.
- 일부 읽기 모델은 QueryDSL 프로젝션 대신 Hibernate `@Subselect`로 SQL 뷰에 직접 매핑한다(`adapter/persistence/message/readmodel` 참고) — 쿼리 형태가 자연스럽게 뷰에 가까울 때 사용.
- 예외 계층(`docs/todo.md` 기준):
  - 컨트롤러 단계의 요청 검증 실패 → 검증 프레임워크가 처리.
  - Application 계층 → `application/exception/<context>/` 아래의 커스텀 `ApplicationException` 하위 클래스, `ApplicationErrorCode`로 식별. 조회 실패는 `<Entity>NotFoundException` 컨벤션을 따른다.
  - Domain 계층 → 별도 커스텀 계층 없이 순수 Java 예외(`requireNonNull`, `IllegalStateException` 등) 사용.
  - Adapter 계층 → adapter 고유 실패(파일 변환/저장 등)는 `AdapterException` + `AdapterErrorCode` 사용. `GlobalExceptionHandler`(`@RestControllerAdvice`)가 모든 예외를 `ErrorResponse`로 매핑.
- 인가는 2-layer 구조다(`docs/권한규칙.md` 참고): **시스템 권한**(`EMPLOYEE`, `DEPT_MANAGER`, `ADMIN`)이 넓은 단위 접근을 통제하고, **부서별/업무 권한**(`HR`, `FRANCHISE`, `FACILITY`, `IT`)이 도메인별 API를 통제한다. 굵은 단위 검사는 `SecurityConfig`의 `authorizeHttpRequests`에서 처리한다(role hierarchy: `ADMIN`은 `DEPT_MANAGER`/`HR`/`EMPLOYEE`를 포함, 각 업무 권한은 `EMPLOYEE`를 포함). 세밀한 스코프 검사(같은 부서 여부, 리소스 소유권, 출퇴근처럼 "본인이어야 함", 이미 승인/퇴직 같은 애그리거트 상태)는 `SecurityConfig`가 아니라 application service 내부에서 수행한다.
- 인증은 JWT 기반(`jjwt`)이며, access token은 `Authorization: Bearer`로 전달되고 `JwtAuthFilter`가 `UsernamePasswordAuthenticationFilter` 이전에 검증한다. WebSocket/STOMP 채팅은 `CONNECT` 프레임에서 동일한 JWT를 `StompJwtInterceptor`로 검증한다.
- 채팅 발송/알림 흐름: REST/STOMP 커맨드 → `ChatService`가 `ChatMessage` 저장 → `ChatMessageCreatedEvent` 발행 → 리스너가 Redis pub/sub을 통해 STOMP 구독자에게 메시지를 전파(STOMP+Redis 연동 관련 최근 커밋 참고).
- 외부 가맹점 데이터는 실제 서드파티 API가 아니라 Mockoon을 통해 연동된다(`adapter/mockoon`, `mockoon/franchise-api.json`, `compose.yaml`의 `mock-server` 서비스) — `app.franchise.base-url`이 이 mock 서버를 가리킨다. 이 소스로부터 동기화되는 레코드는 `externalId`/`external_id`를 가지며 항상 insert가 아니라 upsert("replace") 방식으로 반영된다.

## 백엔드 테스트 컨벤션

- 통합 테스트는 `@TestIntegrationConfig` 메타 어노테이션을 사용한다(`@SpringBootTest` + `@ActiveProfiles("test")` + `@TestConstructor(AutowireMode.ALL)`를 통한 생성자 주입). 테스트 클래스는 보통 Java `record`로 작성하며, 생성자 파라미터가 테스트 대상 빈/리포지토리가 된다 — `ChatSenderTest` 참고.
- REST Docs 테스트는 `RestDocsSupport`를 상속한다. 이 클래스는 `provided` 인터페이스를 mock으로 채운 `standaloneSetup` MockMvc를 구성하고(전체 Spring 컨텍스트 없음), `GlobalExceptionHandler`를 연결하며, 테스트에서 `RequestPostProcessor` 기반 인증에 쓸 `employeeAuthentication()`/`hrAuthentication()`/`deptManagerAuthentication()`/`franchiseAuthentication()` 헬퍼를 제공한다. 문서화된 각 엔드포인트는 이름이 지정된 스니펫(예: `document("CHAT_ROOM_LIST", ...)`)을 만들고, 이는 asciidoctor 빌드에서 사용된다.
- 테스트의 `@DisplayName`과 assertion 메시지는 도메인 문서와 동일하게 한국어로 작성한다.
- 통합 테스트용 픽스처는 `application/dbFixture` 아래에 둔다(예: `EmpFixture.saveApprovedEmp`).

## 프론트엔드 아키텍처

UBold React admin 템플릿을 기반으로 한다. 템플릿의 데모 뷰 대부분은 `node_modules`/스캐폴딩에는 존재하지만 `src/routes/index.jsx`에서는 주석 처리되어 있다 — 실제로 연결된 라우트만 "실사용"으로 간주할 것(현재는 dashboard, auth sign-in/callback/logout, calendar 앱).

- `src/api/http.js` — 인터셉터가 달린 단일 Axios 인스턴스. 모든 요청에 Redux 상태의 `accessToken`을 `Authorization: Bearer`로 첨부한다. 401/403 발생 시(재발급 호출 자체는 제외) 동시 발생한 실패 요청들을 큐에 쌓고, 재발급 엔드포인트를 한 번만 호출한 뒤 큐를 재실행하며, 재발급 실패 시 인증 상태를 초기화하고 `/auth/sign-in`으로 리다이렉트한다.
- `src/store/` — Redux Toolkit 사용. 현재는 `authSlice`(access token)와 `userSlice`(로그인 사용자/로그아웃)만 존재한다.
- 경로 별칭 `@/`는 `src/`를 가리킨다(예: `@/layouts/MainLayout` 형태로 전체에서 사용).
- 라우트는 `authRoutes`, `dashboardRoutes`, `otherPagesRoutes`, `errorRoutes`, `landingRoute` 배열로 분리되어 있다가 `src/routes/index.jsx`에서 `routes`로 합쳐진다. dashboard/auth 외 대부분의 라우트는 템플릿을 실제 제품 범위로 줄이는 과정에서 아직 주석 처리되어 있다.

## `docs/` 작업 시 참고사항

`docs/도메인모델.md`는 애그리거트 경계, 엔티티 필드, 비즈니스 규칙의 기준 문서다 — 엔티티에 필드/행위를 추가하기 전에 반드시 확인해서 문서화된 불변식과 새 코드가 일치하도록 하고, 규칙이 바뀌면 문서도 함께 갱신한다. "provided/required"와 예외 계층 관련 항목은 확정된 컨벤션으로 취급한다.
