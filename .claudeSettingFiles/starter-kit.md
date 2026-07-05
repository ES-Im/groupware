<!--
  HARUON 그룹웨어 프론트엔드 Starter Kit 추천 스택 (백지 기준, 백엔드 계약 최적화).
  근거: back/ 백엔드 계약(ready.md) + REST Docs. UBold/Bootstrap 등 이전 템플릿 제약은 폐기됨.
  확정 결정: TypeScript / Tailwind + shadcn/ui / TanStack Query + Zustand + zod.
-->

# 프론트엔드 Starter Kit 추천 스택

> `front/`는 **백지에서 새로 시작**한다. 선택 기준은 오직 **백엔드 서버 계약**(`ready.md` 참조)에 얼마나 잘 맞는가다.
> 이전의 UBold/Bootstrap/"JS 전용" 제약은 모두 폐기되었다.

---

## 0. 확정 스택 한눈에

| 계층 | 선택 | 한 줄 이유 |
|---|---|---|
| 런타임/빌드 | **React 19 + Vite** | 표준 SPA. 빠른 HMR, 백엔드 CORS가 `localhost:5173`(Vite 기본)만 허용 |
| 언어 | **TypeScript** | REST Docs로 응답 타입 재현 → 계약 위반을 컴파일 타임에 차단 |
| 라우팅 | **React Router 7** | 2-Layer 권한 라우트 가드 |
| UI/스타일 | **Tailwind CSS + shadcn/ui** | 헤드리스·소유형 컴포넌트, 대시보드·테이블·폼 비중 큰 관리자앱에 최적 |
| HTTP | **axios** | 인터셉터(토큰 첨부·401 재발급)의 중심 |
| 서버 상태 | **@tanstack/react-query** | 목록·페이징·무한스크롤·재검증·낙관적 업데이트 |
| 클라이언트 상태 | **zustand** | access token(메모리)·현재 사용자·권한·알림 카운트 |
| 폼 + 검증 | **react-hook-form + zod** (+@hookform/resolvers) | 백엔드 검증 규칙을 zod 스키마로 반영 |
| 실시간(채팅) | **@stomp/stompjs** | STOMP over native WebSocket (SockJS 미사용) |
| 날짜 | **dayjs** | 오프셋 없는 KST 문자열을 UTC 오해 없이 처리 |
| 표/그리드 | **@tanstack/react-table** | 서버 `Page` 페이징과 조합 |
| 캘린더 | **@fullcalendar/react** | 일정·회의·교육 캘린더 API에 대응 |
| 차트 | **Recharts** | 매출·휴가 사용률 대시보드 (React 친화적) |
| 에디터 | **Tiptap** | 게시글 본문(HTML) 리치 에디터 |
| 알림/토스트 | **sonner** (+ shadcn `AlertDialog`) | 에러 토스트·확인 다이얼로그 |

---

## 1. 왜 이 조합인가 — 백엔드 계약과 1:1 매핑

이 스택은 `ready.md`의 계약을 그대로 소화하도록 골랐다.

| 백엔드 계약 (ready.md) | 대응 스택/패턴 |
|---|---|
| CORS는 `localhost:5173`만 + `allowCredentials:true` | Vite(기본 5173) + axios `withCredentials: true` **전역 필수** |
| 성공 응답 envelope 없음 / 에러만 `{code,name,httpStatus,message}` | axios 인터셉터에서 **에러만 정규화**, 성공은 DTO 그대로. TS 타입 `ApiError` 정의 |
| **401=재발급, 403=권한** | 인터셉터: 401→`/api/auth/reissue` 1회→원요청 재시도 / 403→권한 UX. 재발급 재귀 금지 |
| refresh는 HttpOnly 쿠키 | axios `withCredentials`로 쿠키 자동 동봉 (JS가 토큰 직접 접근 안 함) |
| access token은 body로만 → 프론트 보관 | **zustand(메모리)** 저장. 앱 부팅 시 `reissue` 1회로 세션 복원 |
| 페이징 = Spring `Page`(`content`+`number` 0-based) | `useQuery`(페이지) / `useInfiniteQuery`(무한스크롤). `Page<T>` 제네릭 타입 |
| JWT `roles`에 `ROLE_` 접두어 + 2-Layer 권한 | zustand에서 정규화·계층 전개, React Router 가드 |
| 채팅 STOMP(CONNECT 헤더 인증, 목적지 정규식 고정) | `@stomp/stompjs` `connectHeaders`에 `Bearer`. 발행 `/app/...`, 구독 `/topic/...` |
| 날짜 오프셋 없음 + 서버 KST | dayjs로 파싱·포맷. `new Date(문자열)` 금지 |
| 파일 도메인별 크기/확장자 상이 | 업로드 전 zod/유틸로 도메인별 검증(사원 5MB·이미지 / 게시판·기안 20MB 등) |

---

## 2. 프로젝트 구조 (제안 뼈대)

```
src/
├─ lib/
│  ├─ axios.ts          # 인스턴스: baseURL, withCredentials, 인터셉터
│  ├─ queryClient.ts    # QueryClient 기본 옵션(retry, staleTime)
│  └─ stomp.ts          # STOMP 클라이언트 팩토리(connectHeaders)
├─ types/
│  ├─ api.ts            # Page<T>, ApiError, 공통 응답 타입
│  └─ domain/           # 도메인 DTO 타입(REST Docs 스니펫 기준)
├─ stores/
│  └─ authStore.ts      # zustand: accessToken, user, roles(정규화), actions
├─ auth/
│  ├─ useAuth.ts        # login/logout/부팅 시 reissue 복원
│  ├─ roles.ts          # RoleHierarchy 전개, hasRole/hasAnyRole
│  └─ RequireRole.tsx   # 라우트 가드(2-Layer)
├─ api/                 # 도메인별 훅: useBoards, useDrafts, useChat ...
├─ components/ui/       # shadcn/ui 생성물
├─ features/            # 도메인 화면(board, draft, attendance, franchise ...)
└─ pages/ , routes.tsx
```

---

## 3. 인증/데이터 계층 핵심 규칙

**axios 인터셉터 (계약의 심장):**
1. 요청: `authStore.accessToken` → `Authorization: Bearer` 첨부.
2. 응답 `401`: `POST /api/auth/reissue`(쿠키 기반) 1회 → 성공 시 새 토큰으로 원요청 재시도 / 실패(`ROLE_002`) 시 로그아웃 + 로그인 이동. **reissue 자체는 재귀 금지, 재시도 요청 중복 방지.**
3. 응답 `403`: 재발급하지 않음 → 권한 부족 UX.
4. 에러 바디를 `ApiError`(`{code,name,httpStatus,message}`)로 정규화해 React Query `onError`/`throwOnError`로 전달.

**TanStack Query 규약:**
- 쿼리 키는 `['boards', { page, keyword }]`처럼 파라미터 포함(캐시 정확성).
- 목록은 `useQuery` + `keepPreviousData`(페이지 전환 UX), 채팅/피드 무한 목록은 `useInfiniteQuery`.
- 서버 `Page.number`는 0-based → UI 페이지네이션은 +1 변환.

**zustand authStore:**
- 상태: `accessToken`(메모리), `user`, `roles`(정규화된 `["EMPLOYEE","HR",...]`).
- 새로고침 시 토큰 소실 → 앱 마운트에서 `reissue` 1회 시도 후 라우팅.

**권한(2-Layer):**
- Layer 1(`EMPLOYEE`/`DEPT_MANAGER`/`ADMIN`) = 라우트 가드. Layer 2(`HR`/`FRANCHISE`/`FACILITY`/`IT`) = 메뉴/버튼 노출.
- `roles.ts`에서 RoleHierarchy 전개(예: `ADMIN`→`DEPT_MANAGER/HR/EMPLOYEE`). ⚠️ `ADMIN`은 `FACILITY/FRANCHISE/IT` 미포함.
- `DEPT_MANAGER(같은 부서)` 등 부서 검증은 프론트 불가 → 서버 403이 최종.

---

## 4. 채팅(STOMP) 규칙

- 연결: `ws://localhost:8080/ws-chat` (native WebSocket, **SockJS 미사용**).
- 인증: `@stomp/stompjs` `connectHeaders = { Authorization: 'Bearer ' + accessToken }`.
- 발행: `/app/chat/rooms/{roomId}/messages`, body `{ clientMessageId: crypto.randomUUID(), content }` (content ≤ 2000자).
- 구독: `/topic/chat/rooms/{roomId}`.
- 목적지는 서버가 정규식으로 엄격 검증 → 위 형식 외 사용 금지.
- 수신 메시지는 React Query 캐시에 병합(낙관적 렌더는 `clientMessageId`로 dedup).

---

## 5. 설치 명령

```bash
# 프로젝트 생성 (TS)
npm create vite@latest front -- --template react-ts

# 데이터/인증/실시간/날짜
npm i axios @tanstack/react-query zustand zod react-hook-form @hookform/resolvers @stomp/stompjs dayjs

# UI: Tailwind + shadcn/ui
npm i tailwindcss @tailwindcss/vite
npx shadcn@latest init
#  이후 필요한 컴포넌트만: npx shadcn@latest add button table dialog form input ...

# 도메인 UI
npm i @tanstack/react-table @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
npm i recharts @tiptap/react @tiptap/starter-kit sonner
```

---

## 6. 날짜 처리 규칙 (dayjs)

- 서버는 오프셋 없는 KST 문자열: `2026-03-01T10:00:00`, `2026-04-01`, `09:00:00`.
- `new Date("...")`는 브라우저 로컬로 해석되어 UTC 오해 위험 → **dayjs로만 파싱/포맷**.
- 송신 포맷: 날짜 `YYYY-MM-DD`, 연월 `YYYY-MM`, 일시 `YYYY-MM-DDTHH:mm:ss`.

---

## 7. 채택하지 않은 선택지 (근거)

- **Next.js / Remix (SSR)**: 백엔드가 별도 REST 서버이고 인증이 SPA용 토큰+쿠키 구조라 SSR 이점이 작다. Vite SPA가 계약에 더 단순히 맞음.
- **Bootstrap/MUI**: 가능하나, 대량의 테이블·폼·대시보드 커스터마이징 자유도에서 Tailwind+shadcn이 우위(선택 확정).
- **Redux Toolkit/RTK Query**: 규모 대비 보일러플레이트 과다. React Query(서버) + Zustand(클라이언트) 역할 분리가 더 가볍고 명확.
- **SockJS**: 백엔드가 `/ws-chat`에 SockJS를 설정하지 않음(순수 WebSocket) → 프론트도 native + stompjs.
- **JavaScript(무타입)**: 도메인/엔드포인트가 많아 런타임 오류 위험 큼 → TypeScript 확정.
