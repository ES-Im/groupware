# 채팅(Chat) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/9.chat-prd.md` (groupware-frontend-prd-generator 생성 · groupware-prd-validator 검증 통과 — non-minor 이슈 없음, minor 3건 반영 완료)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md`의 CHAT 기능ID 10개 + `docs/backend-contract/chat-stomp.md`(STOMP) + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 17/17 Tasks 완료 (100%) — M0 ✅ / M1 ✅ / M2 ✅ / M3 ✅ / M4 ✅

- **전략**: walking-skeleton-first 세로 슬라이스. 단, **전역 아키텍처 배관(axios/reissue 인터셉터·QueryClient·authStore·부팅 시퀀스·ProtectedRoute)은 이미 완료**되어 있으므로 재구축하지 않고 **소비**한다. 채팅 도메인의 walking skeleton은 "**별도 창으로 뜨는 독립 채팅 앱의 셸·부팅·STOMP 연결**"(M0)이며, 이후 목록 슬라이스(REST) → 대화 슬라이스(REST+STOMP) → 생성 → 방 설정 순으로 얇게 관통한다.
- **채팅 도메인의 특수성**: 채팅은 메인 셸 안의 패널이 아니라 **헤더 말풍선 → `window.open('/chat')` 별도 창**으로 뜨는 "별도 서비스인 척" 도메인이다. `/chat`·`/chat/rooms/:roomId`는 메인 `LayoutShell`과 **형제인 최상위 라우트**(전용 `ChatWindowLayout`)로 등록하며, 이는 이미 `router.tsx`에 존재하는 `/login`·`/register` 최상위 형제 패턴을 복제한다.
- **소비할 기존 자산(재구축 금지)**:
  - axios 단일 인스턴스·401/`ROLE_002` reissue 인터셉터·`withCredentials`: `src/shared/api/client.ts` (`requestReissue` export 재사용)
  - QueryClient·retry/staleTime 방침: `src/shared/api/queryClient.ts`
  - 에러 정규화·에러코드→UI 매핑 헬퍼(403 권한부족·404/`CHAT_*` not-found): `src/shared/lib/apiError.ts`
  - 인메모리 토큰 스토어: `src/shared/api/tokenStore.ts`
  - authStore(토큰·roles·bootstrap)·부팅 시퀀스(reissue → `RETRIEVE_ME_INFO`): `src/features/auth/store/authStore.ts`, `src/features/auth/hooks/useBootstrapAuth.ts`, `src/app/App.tsx`
  - 보호 라우트 게이트 패턴: `src/shared/components/ProtectedRoute.tsx` (채팅 창은 이 패턴을 복제하되 미인증 시 `/login` 리디렉션 대신 팝업 UX 분기 — Open Q#1)
  - 인증 필요 preview 이미지(profileImageUrl blob): `src/shared/components/BlobAvatar.tsx`
  - queryKey 팩토리 컨벤션: `src/features/*/model/queryKeys.ts` 동형 복제
  - 날짜 `yyyy-MM-dd'T'HH:mm:ss` 파싱/표기 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / STOMP `@stomp/stompjs` (CLAUDE.md §6 고정 스택)
- **범위 경계**: PRD §"MVP 이후 기능 / 범위 외"는 로드맵 범위 밖(§백로그 참조, 태스크화 금지). 파일/이미지 첨부·전역 unread 헤더 배지(Open Q#4)·메시지 수정/삭제·읽음확인·타이핑·리액션·테마/i18n/푸시는 계약 부재로 제외.
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

## 🧩 의존성 개요

```
[이미 완료된 전역 배관: axios/reissue 인터셉터·QueryClient·authStore·부팅(reissue→me)·ProtectedRoute·BlobAvatar·apiError]  ← 소비만(재구축 금지)
  └→ M0 채팅 창 셸 & 진입 배관 (Chat Walking Skeleton)
        T0.1 최상위 라우트(/chat·/chat/rooms/:roomId) + ChatWindowLayout(독립 크롬)
              ├→ T0.2 Header 말풍선 슬롯 window.open 배선
              └→ T0.3 채팅 창 인증 게이트(reissue→me 재사용, 미인증 팝업 UX)
                    └→ T0.4 단일 STOMP 클라이언트 CONNECT 인프라
        └→ M1 채팅방 목록 슬라이스 (F901 조회 + F910 즐겨찾기 · REST only, STOMP 불필요)
              T1.1 목록 조회 훅 + chat queryKey 팩토리 → T1.2 목록 패널 UI → T1.3 즐겨찾기 토글
              └→ M2 채팅방 대화 슬라이스 (F902·F903·F904·F905·F911 · REST + STOMP)
                    T2.1 상세+대화 헤더 → T2.2 메시지 cursor 무한스크롤
                         → T2.3 SUBSCRIBE 실시간 수신(+T0.4) → T2.4 SEND 낙관/ dedup → T2.5 읽음 위치 갱신
                    ├→ M3 채팅방 생성 슬라이스 (F906)
                    │     T3.1 생성 다이얼로그 + 대상 사원 검색(Open Q#2)
                    └→ M4 방 설정 슬라이스 (F910 재사용·F907·F908·F909)
                          T4.1 설정 메뉴 + 즐겨찾기 재사용 → {T4.2 초대 ∥ T4.3 표시명 ∥ T4.4 나가기}
```

- **T0.2(헤더 배선)와 T0.3(인증 게이트)은 둘 다 T0.1에만 의존** → 상호 독립·병렬 착수 가능.
- **T0.4(STOMP 인프라)와 M1 목록 슬라이스(T1.1~T1.3)는 둘 다 T0.3에만 의존** → 목록은 순수 REST라 STOMP 불필요 → STOMP 인프라 구축과 목록 슬라이스를 **동시 진행 가능**.
- **M3(생성)과 M4(방 설정)는 둘 다 대화 슬라이스(T2.1~) 완료 후 착수하나 상호 독립** → 병렬 가능. M4 내부 T4.2/T4.3/T4.4도 상호 독립 병렬.

## 🚩 마일스톤 & 태스크

### M0 — 채팅 창 셸 & 진입 배관 (Chat Walking Skeleton) ✅

> 목표: 이후 모든 채팅 슬라이스가 복제·소비할 배관 확정 — 헤더 말풍선 → 별도 팝업 창 → 창 자체 부팅 인증 → STOMP 연결 → 빈 `/chat` 렌더까지 **관통하는 얇은 골격**. 근거: PRD §🪟 채팅 창 UX 구현 방향, §메뉴 구조, §사용자 여정(부팅), §지원 기능.
> 완료 정의: 인증된 사원이 메인 헤더 말풍선 아이콘을 클릭하면 `haruon-chat` 팝업이 뜨고, 창이 reissue→me→STOMP CONNECT로 자체 부팅해 `ChatWindowLayout`(사이드바/헤더 없는 독립 크롬)의 빈 `/chat`을 렌더한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 |
|---|---|---|---|---|---|---|---|
| T0.1 | 최상위 채팅 라우트 `/chat`·`/chat/rooms/:roomId`를 `createBrowserRouter`에 **메인 `LayoutShell`과 형제인 최상위 라우트**로 등록(기존 `/login`·`/register` 형제 패턴 복제) + 전용 `ChatWindowLayout`(사이드바·헤더 없는 독립 크롬) 스캐폴드. 라우팅 배선은 react-router-developer 위임 권장 | §🪟-2, §메뉴 구조 | — | `/chat`·`/chat/rooms/:roomId`가 최상위 라우트로 매칭되고 `ChatWindowLayout`(빈 스캐폴드 허용)이 렌더된다. 메인 셸 크롬 미노출 | 10 | 5 | ☑ |
| T0.2 | `Header.tsx` 무동작 채팅 슬롯(97~101줄, `// todo: 채팅 도메인 PRD 확정 시 연결`)에 `openChatWindow = () => window.open('/chat','haruon-chat','popup,width=420,height=760')?.focus()` 배선. 창 이름 고정으로 재클릭 시 기존 창 focus | §🪟-1, §지원 기능(채팅 창 열기), §메뉴 구조 | T0.1 | 헤더 말풍선 클릭 → `haruon-chat` 팝업이 `/chat` 로드, 재클릭 시 새 창 난립 없이 기존 창 focus. `//todo` 팝업 차단 시 `window.open` null 반환 폴백(§🪟 //todo), `//todo` 새 창(popup) vs 새 탭 정책 확정(§🪟 //todo) | 4 | 3 | ☑ |
| T0.3 | 채팅 창 인증 게이트: 창이 별도 SPA 인스턴스로 뜨며 기존 부팅 시퀀스(App `useBootstrapAuth`: reissue → `RETRIEVE_ME_INFO`)를 **재사용**해 인증. `ChatWindowLayout`은 인증 완료 후에만 자식 렌더(ProtectedRoute 패턴 복제) | §사용자 여정(부팅), §🪟-3, 페이지별 상세(접근 권한) | T0.1 | 인증 상태면 `/chat` 정상 진입, 미인증(reissue 실패)이면 팝업 로그인 UX 분기 지점 확보. `//todo` **Open Q#1**: 팝업 내 로그인 폼 vs 팝업 닫고 부모 창 로그인 유도 — 미확정(발명 금지) | 9 | 5 | ☑ |
| T0.4 | 채팅 창 단일 STOMP 클라이언트(`@stomp/stompjs`) CONNECT 인프라: `ws://localhost:8080/ws-chat`에 `connectHeaders {Authorization: Bearer <at>}`(네이티브 헤더)로 연결, 연결 상태 노출. F904/F905의 전제 인프라 (**복잡도≥7 → T0.4-a/T0.4-b로 split, 하위 행 참조**) | §지원 기능(STOMP 연결 수립), chat-stomp.md(연결·인증) | T0.3 | 인증 완료 후 단일 STOMP 클라이언트가 CONNECT 성공, 연결/끊김 상태를 소비처에 노출. `//todo` **Open Q#6**: access token 만료(30분) 재CONNECT·창 닫힘 DISCONNECT 정리 등 재연결 정책 미확정 | 8 | 7 | ☐ |
| T0.4-a | STOMP 클라이언트 인스턴스 신설 및 `ws://localhost:8080/ws-chat` CONNECT(connectHeaders Authorization 네이티브 헤더). 연결 수립만 담당(상태 노출·재연결 정책은 T0.4-b) | chat-stomp.md(연결·인증) | T0.3 | 인증 완료 후 STOMP 클라이언트가 CONNECT 성공(CONNECTED 프레임 수신) | 7 | 6 | ☑ |
| T0.4-b | T0.4-a 클라이언트의 연결/끊김 상태를 소비처(T2.3-a 등)에 노출 + 창 닫힘 DISCONNECT 정리 + 토큰 만료 재CONNECT 정책 지점 확보 | chat-stomp.md(연결·인증) | T0.4-a | 연결/끊김 상태가 소비처에서 읽을 수 있게 노출, 창 닫힘 시 DISCONNECT 호출. `//todo` **Open Q#6** 재연결 정책 미확정 | 8 | 7 | ☑ |

> 실행 순서: T0.1 → {T0.2 ∥ T0.3} → T0.4-a → T0.4-b — T0.1이 전체 최상위 선행(중요도10), T0.3(중요도9)이 T0.4·M1 두 갈래의 분기점이라 T0.2(leaf, 중요도4)보다 우선 착수 권장.

### M1 — 채팅방 목록 슬라이스 (F901 조회 + F910 즐겨찾기 · 순수 REST) ✅

> 목표: 새 창으로 뜬 채팅 앱의 홈(`/chat`)에서 내 채팅방 목록이 실제로 그려지고, 검색·즐겨찾기 필터·별 토글이 동작하는 얇은 슬라이스. 근거: PRD §페이지별 상세(채팅방 목록 패널), F901·F910.
> 완료 정의: `EMPLOYEE`가 채팅 창에서 내 채팅방(참여 방)을 keyword/isBookmark로 탐색하고, unread 배지·오래된 방 흐림 표시를 확인하며, 별 클릭으로 즐겨찾기를 토글하고, 방 클릭으로 대화 화면 라우트로 이동한다. **plain array 응답(페이징 없음)**.
> 이 마일스톤이 채팅 도메인 스캐폴딩(`features/chat/{model,api,components,pages,lib}`)을 최초로 만든다 — 이후 모든 슬라이스가 복제·소비.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 |
|---|---|---|---|---|---|---|---|
| T1.1 | 채팅 도메인 스캐폴딩 + `chatKeys` queryKey 팩토리 + F901 목록 조회 API·훅(`CHAT_ROOM_LIST`, query `keyword?`/`isBookmark?`, **plain array**). 필드는 스니펫 실측(재서술 안 함) | F901, §참조 계약 매핑(CHAT_ROOM_LIST) | T0.3 | `keyword`/`isBookmark`로 내 채팅방 목록(배열) 조회 훅 동작, `invalidateQueries(chatKeys.all)` 구조 확보. `//todo` **Open Q#3**: `roomName` null 가능 여부/폴백(목록엔 폴백용 member 정보 없음) — 미확정 | 8 | 5 | ☑ |
| T1.2 | 채팅방 목록 패널 UI 조립(`/chat`): 검색어 입력(`keyword`)·즐겨찾기 필터 토글(`isBookmark`)·방 카드(`unreadMessageCount` 배지·`isPastRoom` 흐림·`isGroup`·`joinedMemberCount`·`lastMessageContent`·`lastMessagedAt` dayjs 표기)·방 클릭 → `/chat/rooms/:roomId` 이동·[새 채팅] 버튼(모달은 M3) | F901, §페이지별 상세(채팅방 목록 패널) | T1.1 | 목록 렌더·검색/필터 반영·방 클릭 이동·조회 실패 시 sonner 토스트(apiError 매핑 소비). `//todo` **Open Q#3**(roomName 폴백 표기) | 8 | 6 | ☑ |
| T1.3 | 즐겨찾기 토글(F910) mutation + 목록 별 배선: 현재 `isBookmarked`에 따라 `CHAT_ROOM_BOOKMARK`/`CHAT_ROOM_UNBOOKMARK`(둘 다 body 없음, `204`) 분기 → 목록 invalidate | F910, §참조 계약 매핑(BOOKMARK/UNBOOKMARK) | T1.2 | 별 클릭 → 현재 상태 따라 등록/해제 토글 → 204 → 목록 즉시 갱신, 실패 시 토스트 | 7 | 5 | ☑ |

> 실행 순서: T1.1 → T1.2 → T1.3 — 순차 단일 체인(중요도 8→8→7), 병렬 지점 없음.

### M2 — 채팅방 대화 슬라이스 (F902·F903·F904·F905·F911 · REST + STOMP 핵심 슬라이스) ✅

> 목표: 선택 방(`/chat/rooms/:roomId`)에서 과거 메시지 무한스크롤 열람 + STOMP 실시간 송수신 + 읽음 갱신까지 관통하는 채팅의 **핵심 세로 슬라이스**. 근거: PRD §페이지별 상세(채팅방 대화 화면), F902·F903·F904·F905·F911, chat-stomp.md.
> 완료 정의: 채팅방 멤버가 방에 진입해 상세(멤버·표시명·읽음 기준)를 보고, 과거 메시지를 커서 페이징으로 열람하며, 실시간으로 메시지를 수신(dedup)·발신(낙관 렌더)하고, 진입·수신 시 읽음 위치가 갱신돼 unread가 해소된다. 비멤버·종료방은 서버가 거부(403/`CHAT_*`/STOMP ERROR) → 권한/안내 UX(재발급 금지, 에러코드 비의존).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 |
|---|---|---|---|---|---|---|---|
| T2.1 | F902 채팅방 상세 조회(`CHAT_ROOM_DETAIL`) 훅 + 대화 화면 헤더: `roomName`·`isGroup`·`lastReadMessageId`·`members[]`. 표시명 null 시 참여자 소속·이름으로 폴백, `profileImageUrl`은 `BlobAvatar` 재사용 | F902, §페이지별 상세(대화 화면), §참조 계약 매핑(CHAT_ROOM_DETAIL) | T0.3, T1.2 | `/chat/rooms/:roomId` 진입 시 상세 로드·헤더 렌더, 비멤버 403/`CHAT_*` → not-found/권한 UX(apiError 소비). `//todo` **Open Q#3**(roomName null 폴백 구성) | 8 | 6 | ☑ |
| T2.2 | F903 메시지 목록 cursor 무한스크롤(`CHAT_MESSAGES`) 훅 + 초기 렌더: query `cursor?`/`size?`(기본 50), 응답 `nextCursor`/`hasNext`(**Spring Page 아님**). 상단 스크롤 도달 시 과거 메시지 추가 로드, `sentAt` dayjs 표기 | F903, §참조 계약 매핑(CHAT_MESSAGES) | T2.1 | 초기 메시지 렌더 + 상단 스크롤로 과거 페이지 append. `//todo` **Open Q#5**: 페이지 내부 정렬 순서(newest-first vs oldest-first) 미문서화 → 초기 렌더 정렬·append 위치 결정 전 확인 | 7 | 6 | ☑ |
| T2.3 | F904 방 토픽 실시간 수신: `SUBSCRIBE /topic/chat/rooms/{roomId}`(T0.4 클라이언트 사용) → 브로드캐스트 수신 시 메시지 목록 append, `clientMessageId`로 낙관 메시지 dedup. 방 전환 시 이전 토픽 UNSUBSCRIBE (**복잡도≥7 → T2.3-a/T2.3-b로 split, 하위 행 참조**) | F904, chat-stomp.md(SUBSCRIBE) | T0.4, T2.2 | 방 진입 시 구독·수신 append, 방 이탈/전환 시 UNSUBSCRIBE, 비멤버·종료방 STOMP ERROR 시 재구독 금지+안내. `//todo` **Open Q#5**(브로드캐스트 프레임 스키마 미문서화 → CHAT_MESSAGES item 형태 가정), `//todo` **Open Q#6**(끊김 감지→재CONNECT·재SUBSCRIBE) | 8 | 7 | ☐ |
| T2.3-a | 방 토픽 SUBSCRIBE/UNSUBSCRIBE lifecycle: 방 진입 시 `/topic/chat/rooms/{roomId}` 구독(T0.4-b 클라이언트 사용), 방 이탈/전환 시 이전 토픽 UNSUBSCRIBE. 수신 append·dedup은 T2.3-b 담당 | F904, chat-stomp.md(SUBSCRIBE) | T0.4-b, T2.2 | 방 진입 시 구독, 방 이탈/전환 시 UNSUBSCRIBE 동작 확인 | 7 | 6 | ☑ |
| T2.3-b | 실시간 수신 append 및 `clientMessageId` dedup: 브로드캐스트 프레임을 메시지 목록에 append, 낙관 메시지와 dedup. 비멤버·종료방 STOMP ERROR 시 재구독 금지+안내 | F904, chat-stomp.md(SUBSCRIBE) | T2.3-a | 방 진입 시 구독·수신 append, 비멤버·종료방 STOMP ERROR 시 재구독 금지+안내. **Open Q#5 해소(T2.4에서 실측)**: 브로드캐스트 프레임은 평면 구조가 아닌 이벤트 봉투(`{eventType:"MESSAGE_CREATED", data:{...}}`) — `parseChatBroadcastMessage`가 실측 스키마로 파싱한다. `//todo` **Open Q#6**(재연결 시 재구독)은 미확정 유지 | 8 | 7 | ☑ |
| T2.4 | F905 메시지 발신: `SEND /app/chat/rooms/{roomId}/messages`, body `ChatClientSend { clientMessageId: crypto.randomUUID(), content ≤2000 }`. 전송 즉시 낙관 렌더 → 브로드캐스트 수신으로 확정(dedup). 2000자 클라 사전 제한 | F905, chat-stomp.md(SEND) | T2.3 | 입력·전송(Enter/버튼) → 낙관 렌더 → 수신 echo로 확정, 2000자 초과 클라 차단, 종료방/비멤버 STOMP ERROR 시 재전송 안내·토스트. **Open Q#5 해소**: dev 서버 실측으로 브로드캐스트 프레임이 평면 구조가 아닌 이벤트 봉투(`{eventType:"MESSAGE_CREATED", data:{chatId,...}}`)임을 확인, `parseChatBroadcastMessage`를 실측 스키마로 재작성해 낙관→echo 확정이 실제 환경에서 동작함을 Playwright로 검증(같은 탭·별도 탭 모두) | 5 | 6 | ☑ |
| T2.5 | F911 읽음 위치 갱신(`CHAT_ROOM_READ_POSITION_UPDATE`, body `{ lastReadMessageId }`, `204`): 방 진입·새 메시지 도달 시 보유한 최신 메시지 id로 갱신 → unread 해소 → 목록 invalidate | F911, §참조 계약 매핑(READ_POSITION_UPDATE) | T2.2, T2.3 | 진입·수신 시 lastReadMessageId 갱신 → 204 → 목록 unread 배지 해소. `//todo` 도메인모델상 읽음 갱신 자체의 시각 검증 규칙 미확인([INFERENCE], §참조 계약 매핑) — 서버 최종 검증 신뢰 | 5 | 5 | ☑ |

> 실행 순서: T2.1 → T2.2 → T2.3-a → T2.3-b → T2.4 → T2.5 — 위상 순 단일 체인(T0.4-b∥T2.2가 T2.3-a에서 합류). T2.3-b(중요도8)가 T2.4(중요도5)보다 먼저 완료돼야 발신 dedup 인프라가 갖춰짐.

### M3 — 채팅방 생성 슬라이스 (F906) ✅

> 목표: 목록 패널 [새 채팅]에서 대상 사원을 골라 방을 생성하고 즉시 입장하는 슬라이스. 근거: PRD §페이지별 상세(채팅방 생성 다이얼로그), F906.
> 완료 정의: 사원 다중 선택 후 방 생성 성공 시 생성된 방의 대화 화면으로 이동하고 목록이 갱신된다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 |
|---|---|---|---|---|---|---|---|
| T3.1 | F906 채팅방 생성 다이얼로그(shadcn Dialog + RHF/zod): 대상 사원 검색·다중 선택(`memberIds: number[]`, 필수·빈 배열 불가) → `CHAT_ROOM_CREATE` `POST` → `200 { roomId }`(주의: 201 아님) → 해당 방 대화 화면 이동 + 목록 invalidate (**복잡도≥7 → T3.1-a/T3.1-b로 split, 하위 행 참조**) | F906, §페이지별 상세(생성 다이얼로그), §참조 계약 매핑(CHAT_ROOM_CREATE) | T1.2, T2.1 | [새 채팅] → 다이얼로그, 빈 선택 차단, 생성 성공 → `/chat/rooms/{roomId}` 이동 + 목록 갱신, 실패 시 토스트. `//todo` **Open Q#2**: `memberIds` 후보 사원 검색 표준 경로 미확정(`EMPS_FOR_MANAGEMENT` 일반사원 불가 → `DEPT_MEMBERS`/`DEPTS` 후보, 전자결재 PRD Open Q#1과 공통·공용 사원선택 컴포넌트 통합 검토) — 발명 금지 | 7 | 7 | ☑ |
| T3.1-a | 대상 사원 검색·다중 선택 UI(`memberIds` 후보 소스). chat 도메인이 dept/org 도메인을 cross-consume하는 지점 | F906, §페이지별 상세(생성 다이얼로그) | T1.2, T2.1 | 사원 검색·다중 선택 UI가 `memberIds` 배열을 산출, 빈 선택 상태 구분 가능. **Open Q#2 해소**: 후보 조회 표준 경로는 전자결재 PRD Open Q#1과 동일하게 `DEPTS`→`DEPT_MEMBERS`(`EMPLOYEE` 게이트) 흐름으로 확정, 기존 `EmployeePicker`(`src/features/approval/components/EmployeePicker.tsx`)를 cross-feature 재사용해 신규 구현 없이 연결(`CreateChatRoomDialog.tsx`). 방 생성자는 서버가 자동 멤버 포함(`ChatRoom.createRoom()`, 사용자 확인)하므로 로그인 본인은 `disabledEmpIds`로 후보에서 제외 | 7 | 6 | ☑ |
| T3.1-b | `memberIds`로 생성 폼 완성 → `CHAT_ROOM_CREATE` `POST` → `200 { roomId }` → 대화 화면 이동 + 목록 invalidate | F906, §참조 계약 매핑(CHAT_ROOM_CREATE) | T3.1-a | [새 채팅] → 다이얼로그, 빈 선택 차단, 생성 성공 → `/chat/rooms/{roomId}` 이동 + 목록 갱신, 실패 시 토스트 | 6 | 5 | ☑ |

> 실행 순서: T3.1-a → T3.1-b — Open Q#2(사원 검색 표준 경로) 확인이 a의 실질 착수 전제이며, b는 a 산출물(memberIds) 없이는 시작 불가.

### M4 — 방 설정 슬라이스 (F910 재사용 · F907 초대 · F908 표시명 · F909 나가기) ✅

> 목표: 대화 화면 방 설정 메뉴에서 초대·표시명 수정·나가기·즐겨찾기를 수행하는 슬라이스. 근거: PRD §페이지별 상세(대화 화면 방 설정 메뉴), F907·F908·F909·F910.
> 완료 정의: 멤버가 설정 메뉴로 사원 초대·표시명 변경·즐겨찾기 토글·방 나가기를 수행하고, 각 성공(204) 후 상세/목록이 갱신되며 나가기 성공 시 목록으로 복귀한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 |
|---|---|---|---|---|---|---|---|
| T4.1 | 대화 화면 방 설정 메뉴 컨테이너(shadcn DropdownMenu) 스캐폴드 + F910 즐겨찾기 항목(T1.3 mutation 재사용) 대화 화면 배선 | F910(대화 화면), §페이지별 상세(방 설정 메뉴) | T2.1, T1.3 | 대화 헤더에 방 설정 메뉴 노출, 즐겨찾기 항목이 T1.3 토글 재사용 → 상세/목록 invalidate | 9 | 4 | ☑ |
| T4.2 | F907 멤버 초대 다이얼로그(`CHAT_ROOM_INVITE`, `{ memberIds }` 필수·빈 배열 불가, `204`): 사원 검색·선택 → 초대 → 상세 invalidate + 토스트. 사원 선택 UI는 T3.1 산출물 재사용 | F907, §참조 계약 매핑(CHAT_ROOM_INVITE) | T4.1, T3.1 | 초대 다이얼로그 → 빈 선택 차단 → 204 → 멤버 목록 갱신+토스트. `//todo` **Open Q#2**(사원 검색 표준 경로 — T3.1과 공유) | 5 | 6 | ☑ |
| T4.3 | F908 표시명 수정 다이얼로그(`CHAT_ROOM_NAME_UPDATE`, `{ name ≤20, @NotBlank }`, `204`): 멤버별 커스텀 표시명 변경 → 상세·목록 invalidate + 토스트 | F908, §참조 계약 매핑(CHAT_ROOM_NAME_UPDATE) | T4.1 | 표시명 다이얼로그(공백/20자 초과 클라 검증) → 204 → 상세·목록 갱신+토스트 | 4 | 5 | ☑ |
| T4.4 | F909 채팅방 나가기(`CHAT_ROOM_LEAVE`, `PATCH .../leave`, body 없음, `204`) — shadcn AlertDialog 확인 → 나가기 → 목록 복귀 + 목록 invalidate | F909, §참조 계약 매핑(CHAT_ROOM_LEAVE) | T4.1 | 나가기 확인 다이얼로그 → 204 → `/chat` 목록 복귀 + 목록 갱신 | 4 | 4 | ☑ |

> 실행 순서: T4.1 → {T4.2 ∥ T4.3 ∥ T4.4} — T4.1(중요도9)이 셋의 공통 컨테이너 선행. 병렬 그룹 내에서는 T4.2가 T3.1-a 사원선택 재사용 이점 때문에 T3.1 완료 직후 우선 착수 권장, T4.3·T4.4는 순서 무관.

## 🔀 병렬화 가능 지점

- **T0.2(헤더 window.open 배선) ∥ T0.3(창 인증 게이트)** — 둘 다 T0.1(라우트+레이아웃)에만 의존, 상호 독립.
- **T0.4(STOMP 인프라) ∥ M1 목록 슬라이스(T1.1→T1.2→T1.3)** — 목록은 순수 REST라 STOMP가 불필요하고 둘 다 T0.3에만 의존 → STOMP CONNECT 인프라 구축과 목록 슬라이스를 **동시 진행 가능**(대화 슬라이스 M2의 T2.3 시점에 두 갈래가 합류).
- **M3(T3.1 생성) ∥ M4(방 설정 T4.1~)** — 둘 다 대화 슬라이스(T2.1~) 완료 후 착수하나 상호 독립.
- **M4 내부 T4.2(초대) ∥ T4.3(표시명) ∥ T4.4(나가기)** — 모두 T4.1에만 의존, 상호 독립 병렬. 단 T4.2는 사원 검색 UI를 T3.1과 공유하므로 T3.1 선행이 유리(공용 사원선택 컴포넌트 재사용 — Open Q#2).

## ⚠️ 리스크 & 선행 결정 (Open Questions)

> PRD §❓ Open Questions(#1~#6)를 로드맵 태스크에 연결한다. 각 태스크의 `//todo`가 걸린 지점이며, **확정은 이 로드맵의 몫이 아니다**(착수 전 사용자/백엔드 확인).

- **Open Q#1 — 채팅 창 미인증(reissue 실패) UX** → **T0.3**. 팝업 내 로그인 폼(a) vs 팝업 닫고 부모 창 로그인 유도(b) 확정 필요. 비블로킹이나 T0.3 게이트 분기 구현 전 결정 권장.
- **Open Q#2 — `memberIds` 후보 사원 검색 표준 경로** → **T3.1**(생성), **T4.2**(초대) 공유. `EMPS_FOR_MANAGEMENT`는 일반 사원 불가 → `DEPT_MEMBERS`/`DEPTS` 후보. 전자결재 PRD Open Q#1과 동일 이슈 → 공용 사원선택 컴포넌트 통합 검토. **착수 전 확인 권장(발명 금지)**.
- **Open Q#3 — `CHAT_ROOM_LIST.roomName` null 가능 여부/폴백** → **T1.1·T1.2**(목록), **T2.1**(상세 폴백). 목록엔 폴백용 member 정보가 없어, 서버가 표시명을 이미 합성해 내려주는지(null 안 옴) 확인 필요.
- **Open Q#4 — 전역 안읽음 알림/헤더 배지** → **태스크 없음(범위 외·백로그)**. 개인 큐 목적지(`/user/...`) 미문서화 → MVP는 열린 방만 구독, 나머지는 목록 재조회로 갱신. 백엔드 개인 큐 계약 추가 시 별도 확장.
- **Open Q#5 — STOMP 브로드캐스트 프레임 스키마 및 메시지 정렬 순서** → **T2.2**(페이지 내부 정렬), **T2.3**(브로드캐스트 프레임 스키마·이벤트 종류), **T2.4**(dedup 키/echo). `CHAT_MESSAGES` item 형태로 가정하나 정확한 필드·정렬 순서 착수 전 확인 권장(**M2 핵심 슬라이스 리스크**).
- **Open Q#6 — 재구독/재연결 정책** → **T0.4**(창 닫힘 DISCONNECT·토큰 만료 재CONNECT), **T2.3**(방 전환 UNSUBSCRIBE·끊김 감지 재SUBSCRIBE). 계약상 재연결 신호 부재 → 구현 세부 정책 확정 필요.
- **§🪟 채팅 창 //todo(스택 확장 아님)** → **T0.2**. 팝업 차단 시 `window.open` null 폴백(새 탭 안내/토스트), 새 창(popup) vs 새 탭 정책 확정(현재 popup 가정).

## 📦 백로그 (PRD §"MVP 이후 기능 / 범위 외" — 태스크화 금지)

- **채팅 파일/이미지 첨부**: `ChatMessage`는 `content`(텍스트)만, `file-upload.md`에 `chat` 도메인 없음 → 계약 부재, 발명 금지. 향후 백엔드 계약 추가 시 별도 확장.
- **전역 안읽음 알림/헤더 배지**(Open Q#4): 개인 큐 목적지 미문서화 → 범위 외. 백엔드 개인 큐 계약 요청 포함.
- **메시지 수정/삭제·읽음 확인(누가 읽었는지)·타이핑 인디케이터·이모지 리액션**: 계약 없음 → 제외.
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림**: 전 도메인 공통 제외(채팅 창은 메인 앱 테마 토큰만 상속).

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: PRD의 모든 F901~F911이 최소 1개 태스크에 매핑됨 — F901→T1.1·T1.2 / F902→T2.1 / F903→T2.2 / F904→T2.3 / F905→T2.4 / F906→T3.1 / F907→T4.2 / F908→T4.3 / F909→T4.4 / F910→T1.3(목록)·T4.1(대화 재사용) / F911→T2.5. STOMP 지원 인프라(CONNECT)는 T0.4, 창 열기/부팅은 T0.1~T0.3 ✅ (제외 기능 제외)
- 🔍 **역참조**: 모든 태스크가 PRD의 F901~F911 / §페이지별 상세 / §🪟 / §지원 기능 / chat-stomp.md에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: depends-on이 위상 정렬(순환 없음). 채팅 셸/부팅/STOMP 배관(M0)이 도메인 슬라이스(M1~M4)보다 선행, 목록(REST)이 대화(STOMP)보다 선행 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(헤더 아이콘 → 창 부팅 → 목록 → 대화 → 생성/방 설정)과 일치 ✅
- 🔍 **범위**: PRD 제외 기능(첨부·전역 배지·수정/삭제·타이핑·테마/i18n/푸시)은 태스크 없이 §백로그로만 격리 ✅
- 🔍 **규약**: 계약/전역 규칙 재서술·필드/DTO 설계·URL 명세·인프라·마일스톤 날짜/시수 견적 강제 없음. 필드는 스니펫/§참조 계약 매핑을 가리킴, 전역 배관은 "소비" 명시 ✅
