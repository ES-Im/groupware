## 1. 프로젝트 개요

- 가맹점 프랜차이즈 본사 컨셉 **HARUON**이라는 가상 회사의 groupware 시스템.
- 백엔드는 완성 상태이며, 프론트는 백엔드 REST/STOMP 계약에 맞춰 구성한다.

## 2. 윈도우 환경

- Windows 11
- 개발 포트: 백엔드 `localhost:8080`(IntelliJ), 프론트 `localhost:5173`(Cursor/Claude). CORS 정책상 프론트는 `5173` 고정.

## 3. 언어 및 커뮤니케이션 규칙

- 이 저장소에서 작업할 때는 사용자와의 모든 대화 응답을 **한국어**로 작성한다.
- 커밋 메시지, 코드 주석(비즈니스 규칙 등 WHY 설명), 도메인 예외/에러 메시지, `docs/` 문서는 한국어로 작성한다.
- 코드 식별자(클래스명·함수명·변수명)는 영문 네이밍 컨벤션을 따른다.

## 4. 코딩 스타일

- 들여쓰기 2칸.
- 네이밍: `camelCase`, 컴포넌트는 `PascalCase`.

---

## 5. 저장소 구조 : 서로 독립적인 두 프로젝트로 구성된 모노레포

- `back/` — Spring Boot 3.5 / Java 21 REST + WebSocket API (Gradle, Kotlin DSL)
- `front/` — React 19 + Vite + TypeScript SPA (Tailwind + shadcn/ui). 백엔드 REST/STOMP 계약에 맞춰 신규 구성.

---



## 6. FRONT 기술 스택

- 스택은 고정이다. 
- 새 라이브러리 도입이 필요하다면, 임의로 추가하지 말고 먼저 논의한다.


| 계층       | 선택                                                       |
| -------- | -------------------------------------------------------- |
| 런타임/빌드   | React 19 + Vite                                          |
| 언어       | TypeScript                                               |
| 라우팅      | React Router 7                                           |
| UI/스타일   | Tailwind CSS + shadcn/ui                                 |
| HTTP     | axios                                                    |
| 서버 상태    | @tanstack/react-query                                    |
| 클라이언트 상태 | zustand                                                  |
| 폼 + 검증   | react-hook-form + zod (+ @hookform/resolvers)            |
| 실시간(채팅)  | @stomp/stompjs (STOMP over native WebSocket, SockJS 미사용) |
| 날짜       | dayjs                                                    |
| 표/그리드    | @tanstack/react-table                                    |
| 캘린더      | @fullcalendar/react                                      |
| 차트       | Recharts                                                 |
| 에디터      | Tiptap                                                   |
| 알림/토스트   | sonner (+ shadcn AlertDialog)                            |


---



## 7. (IMPORTANT) 백엔드 계약



### 서버·환경 계약

- **Base URL**: `http://localhost:8080` (`server.port: 8080`)
- **Context path 없음**: 모든 API는 `/api/...`로 시작한다. 별도 servlet context-path 설정 없음.
- **CORS**: 프론트 오리진 `http://localhost:5173`만 허용된다.
  - 허용 메서드: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `allowCredentials: true` → **axios는** `withCredentials: true`**(fetch는** `credentials: 'include'`**) 전역 필수.** 빠뜨리면 refreshToken 쿠키가 전송/수신되지 않아 인증이 깨진다.
  - 노출 헤더: `Authorization`, `Set-Cookie`



### BACK-END 계약 문서

> 백엔드 전역 계약(인증·에러·권한계층·날짜·페이징·CORS·파일·STOMP)의 원천은  디렉터리에 정리했다. 매 작업 시 관련 스펙이 필요하면 항상 원천을 확인한다. 


| 목적             | 참조 문서                                      |
| -------------- | ------------------------------------------ |
| 에러 규칙          | `@docs/backend-contract/error-response.md` |
| 엔드포인트 기능ID 인덱스 | `@docs/backend-contract/api-endpoint.md`   |
| 권한 규칙          | `@docs/backend-contract/security.md`       |
| 파일 업로드         | `@docs/backend-contract/file-upload.md`    |
| STOMP          | `@docs/backend-contract/chat-stomp.md`     |
| PAGE           | `@docs/backend-contract/page.md`           |
| Glossary       | `@docs/backend-contract/DomainGlossary.md` |


- 위 디렉토리는 backend-contract 요약정보가 기재되어있으며, 세부 스펙이 필요할 때만 항상 아래의 원천을 확인한다.


| 목적                         | 참조 문서                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 엔드포인트 필드 상세(REST Docs 산출물) | `@../back/build/generated-snippets/<기능ID>/`스니펫 원본(요청/응답 JSON·필드표): 예: `LOGIN/response-body.adoc`, `BOARD_LIST/response-fields.adoc` |
| 도메인 규칙(파일 정책·비즈니스 규칙)      | `@../docs/도메인모델.md`                                                                                                                  |


- **필드/요청·응답 스펙을 추측하지 않는다.** 기능ID로 인덱스를 확인하고, 필드는 스니펫을 읽는다.
  - 기능ID는 `@docs/backend-contract/api-endpoint.md`의 `ID`컬럼과 일치한다.
- **제공된 원천 외의 정보를 추측하지 않는다.** 모호하거나 자연스럽지 않은 부분이 있다면 사용자와 논의하고 결정한다.

---



## 8. 자주 사용하는 명령어

```
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 모든 검사 통합 실행 (권장)

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```



## **9. 작업 완료 체크리스트**

```
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```



## **10. 테스트 계정**

- ADMIN  
- id : test1234 / pw : test!1234
- DEPT-MANAGER  
- id : test2345 / pw : test!2345
- EMPLOYEE  
- id : test3456 / pw : test!3456

