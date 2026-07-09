# 전자결재 공통(Approval Common) Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/7.approval-common-prd.md` (groupware-frontend-prd-generator 생성 · groupware-prd-validator 5단계 전부 통과 — 잔여 Open Questions #1~#7은 비블로킹으로 격리)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md` DRAFT/DOCUMENT API + FILE API + `back/build/generated-snippets/<기능ID>/`)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-09
**📊 진행 상황**: 28/28 Tasks 완료 (100%) — M1~M7 ✅ 전체 완료 (전자결재 공통 관심사)

- **전략**: walking-skeleton-first 세로 슬라이스. 단, **아키텍처 배관(M0)·인증·셸·사원뷰·board/attendance 도메인은 이미 완료**되어 있으므로 재구축하지 않고 **소비**한다. 전자결재 공통 도메인은 문서함 목록 조회 → 상세 read-only(공통 셸 + 유형 슬롯) → 결재자 액션 → 기안자 액션 → 공람 → 첨부 → 문서함 홈 요약/뱃지 순으로 얇게 관통한다.
- **이 로드맵의 첫 마일스톤(M1)이 전자결재 도메인 스캐폴딩(`features/approval/{model,api,components,pages,lib}`)과 공용 `DocumentBoxTable`을 최초로 생성**한다 — 이후 모든 슬라이스가 복제·소비한다.
- **소비할 기존 배관(재구축 금지)**:
  - axios 단일 인스턴스·401/reissue 인터셉터·`withCredentials`: `src/shared/api/client.ts`
  - QueryClient·retry/staleTime 방침: `src/shared/api/queryClient.ts`
  - 에러 정규화·에러코드→UI 매핑 헬퍼: `src/shared/lib/apiError.ts` (403 권한부족·404 not-found UX 포함, reissue 금지)
  - 보호 라우트·role 가드: `src/shared/components/ProtectedRoute.tsx`, `src/shared/lib/hasRequiredRole.ts`
  - 레이아웃 셸·사이드바 메뉴 트리: `src/shared/components/LayoutShell.tsx`, `sidebarMenuItems.ts` (기존 "전자결재" 그룹의 placeholder 3개[기안함/결재함/공람함]는 이 로드맵이 PRD 5개 항목으로 **교체**)
  - 사원 프로필/본인 `empId` 출처: `src/features/employee/api/useMeQuery.ts` (액션 버튼 노출 판정의 "나" 기준)
  - 본인 부서(`deptId`) 도출 훅: `src/features/attendance/model/usePrimaryDeptId.ts` (사원 검색 후보 조회 시 재사용 검토, 신규 작성 금지)
  - 페이징 표·필터·react-table 목록 패턴: `src/features/board/**`, `src/features/attendance/**` 복제 대상
  - queryKey 팩토리 컨벤션: `src/features/attendance/model/queryKeys.ts` / `src/features/board/model/queryKeys.ts` 동형 복제
  - 파일 업로드/검증·미리보기·다운로드 패턴: `src/features/board/api/uploadBoardFile.ts`·`downloadBoardFile.ts`·`useBoardFilePreviewUrl.ts`, `src/features/board/lib/fileValidation.ts` 복제 대상(전자결재 첨부는 board와 동일 확장자 정책)
  - 날짜/`yyyy-MM-dd'T'HH:mm:ss` 포맷: `dayjs` / 토스트: `sonner` / 폼: `react-hook-form + zod` / 다이얼로그·표·탭·배지·카드: `shadcn/ui` (CLAUDE.md §6 고정 스택)
- **범위 경계**: PRD §"MVP 이후 기능 / 범위 외"는 로드맵 범위 밖(§백로그 참조, 태스크화 금지). 특히 **유형별 기안서 작성/수정(GENERAL/LEAVE/BUSINESS_TRIP/SALES)·유형별 이력 조회**는 각 유형 작성 PRD 관할이다. 이 공통 로드맵은 상세 페이지의 **유형별 본문 슬롯을 확장 포인트로 설계**하되, GENERAL 렌더까지만 구현하고 나머지 유형 슬롯 본문은 "해당 유형 화면 준비 중" 폴백으로 처리한다(Open Q#3).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9). 도메인 슬라이스 구현 직후 test-author-runner로 유닛/컴포넌트 테스트 작성·실행.

### 🔗 특수 맥락 (이 로드맵의 위상)

1. **이 공통 로드맵이 상세(F701)·문서함·결재/철회/취소·공람·첨부의 원(原) 소유자다.** `docs/ROADMAP(LEAVE).md`의 M2(F606 상세)·M4(기안자 액션 F607~F609)·M5(결재대기함 F619 + 결재자 액션 F610·F611)와 `docs/prd/6.leave-prd.md`의 대응 섹션은 휴가 로드맵이 이 공통 API를 **선점 기술**한 것이다. 본 공통 로드맵 확정 이후 LEAVE 로드맵/PRD의 해당 섹션은 재편(overwrite)될 예정이나, **그 재편은 이 로드맵의 태스크가 아니다**(별도 단계에서 처리 — 태스크로 만들지 않음). 앞으로 상세·문서함·결재/철회/취소·공람·첨부의 사실 원천은 이 로드맵(과 그 출처 PRD)이며, 휴가 로드맵은 "휴가 유형 슬롯 본문"만 소유한다.
2. **결재대기함 메뉴 이관**: LEAVE 로드맵은 결재대기함(F619)을 임시로 "휴가 관리" 그룹에 두었다(자기 로드맵 주석에서 "추후 전자결재 도메인 PRD 착수 시 이관 가능" 명시). 이 로드맵이 "전자결재" 그룹을 신규 추가(M1 T1.7)하면서 **결재대기함(F710)의 원 소유자가 된다.** 사이드바 "전자결재" 그룹 5개 항목(문서함 홈/상신함/임시저장함/결재대기함/결재함)을 M1이 신규 추가한다.

## 🧩 의존성 개요

```
[이미 완료된 배관: M0 배관 · 인증 슬라이스 · 셸/사원뷰 · board · attendance]  ← 소비만 함(재구축 금지)
  └→ M1 문서함 목록 조회 슬라이스 (F710·F712·F713·F714)          ← approval 스캐폴딩 + 공용 DocumentBoxTable 최초 생성 + "전자결재" 그룹 신규
        └→ M2 기안서 상세 read-only 슬라이스 (F701)               ← 공통 셸 + 유형 슬롯 분기 = 이후 모든 상세 액션의 대지(canvas)
              ├→ M3 결재자 액션 슬라이스 (F705 승인 · F706 반려)       ┐
              ├→ M4 기안자 액션 슬라이스 (F702·F703·F704)             ├ 전부 M2 상세 셸에 의존 → 병렬 착수 가능
              │     └→ M5 공람 슬라이스 (F707·F708·F709)             ┘   (M5는 M4의 사원선택 컴포넌트[T4.4] 재사용 → M4 일부 의존)
              └→ M6 첨부 슬라이스 (F716·F717·F718·F719)
  M7 문서함 홈 요약/뱃지 슬라이스 (F715·F711)                       ← M1(문서함 라우트)에만 의존 → M2~M6 클러스터와 병렬 착수 가능
```

- **M3·M4·M6은 셋 다 M2(상세 셸)에만 의존** → M2 완료 후 병렬 착수 가능(결재자 액션·기안자 액션·첨부를 동시에).
- **M5(공람)는 M2 + M4의 사원선택 공용 컴포넌트(T4.4)에 의존** → M4의 T4.4 완료 후 착수(취소기안 결재선 선택과 공람 대상 선택이 동일 컴포넌트를 공유하므로 M4가 원 소유, M5가 재사용).
- **M7(문서함 홈 요약/뱃지)은 M1에만 의존**(요약 카드 → 4종 문서함 라우팅) → M2~M6과 완전 병렬 가능. 문서함 홈은 "실제 문서함 4종을 집계"하는 요약 대시보드이므로 walking-skeleton 원칙상 개별 문서함(M1)이 먼저 동작한 뒤 마지막에 얹는다(PRD 여정의 첫 화면이나, 집계 성격상 M7로 후치 — §여정 정합 참조).

## 🚩 마일스톤 & 태스크

### M1 — 문서함 목록 조회 슬라이스 (읽기 우선 세로 슬라이스 + 도메인 스캐폴딩) ✅

> 목표: 사이드바 "전자결재" 그룹 → 4종 문서함(상신함·임시저장함·결재대기함·결재함) 진입 → 제목 검색 + 페이징 표가 실제로 그려지는 얇은 슬라이스. 근거: PRD §사용자 여정, §페이지별 상세(4종 문서함), F710·F712·F713·F714.
> 완료 정의: `EMPLOYEE`가 메뉴로 4종 문서함에 진입해 `keyword` 검색·페이징(`number+1`)으로 목록을 조회. 4종은 동일 `DocumentBoxRow` 구조를 공유하므로 **단일 공용 `DocumentBoxTable`을 재사용**한다(행 클릭→상세 네비게이션은 상세 라우트가 생기는 M2 T2.5에서 배선).
> 이 마일스톤이 전자결재 도메인 스캐폴딩(`features/approval/{model,api,components,pages,lib}`)과 공용 `DocumentBoxTable`을 최초로 만든다 — 이후 모든 슬라이스가 복제·소비.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 도메인 타입 정의: `ApprovalStatus` enum(UNSUBMITTED/WAITING/IN_PROGRESS/APPROVED/REJECTED)·`DocumentBoxRow`(4종 공용 행)·`draftType` 취급(필드 상세는 스니펫 실측, 재서술 안 함) | §참조 계약 매핑(공용 행 타입·enum), F710·F712·F713·F714 | — | `features/approval/model/approval.ts`에 타입 존재, 스니펫 대조 통과(contract-conformance) | 9 | 3 | ☑ |
| T1.2 | `approvalKeys` queryKey 팩토리(board/attendance 동형: `all`/`submitted(params)`/`unsubmitted(params)`/`pending(params)`/`accessible(params)` 선언, 이후 슬라이스가 상세·요약 축 확장) | §기술 스택, §참조 계약 매핑 | — (T1.1과 병렬) | `invalidateQueries(approvalKeys.all)`로 하위 일괄 갱신 가능한 구조 | 8 | 2 | ☑ |
| T1.3 | 표시 유틸(lib): `ApprovalStatus` 배지 매핑(응답은 **표시명 문자열**로 내려옴 → 표시명↔enum 코드 대응)·`Approvers.role`(APPROVER/COOPERATOR) 라벨·`submittedAt` 등 일시 포맷(dayjs)·`isFileAttached` 첨부 아이콘 표기 | §참조 계약 매핑(enum·표시 규칙) | T1.1 | 5개 상태 배지 + role 라벨 + 일시 포맷 + 첨부 아이콘 헬퍼 존재 | 7 | 3 | ☑ |
| T1.4 | 공용 `DocumentBoxTable` 컴포넌트(react-table): 컬럼 `draftTitle`·`drafterName`·`submittedAt`·`latestApproverName`·`approvalStatus` 배지·`isFileAttached` 아이콘 + 제목 `keyword` 검색 + 페이징(`number+1`). 행 클릭 콜백은 props로 주입(상세 배선은 M2) | §MVP 필수 지원 기능(DocumentBoxTable 재사용), §페이지별 상세(4종) | T1.3 | 4종 문서함이 공유하는 단일 표 컴포넌트로 검색·페이징·행렌더 동작(목록에 `draftType` 없음 → 유형 뱃지 미표시, Open Q#7) | 8 | 6 | ☑ |
| T1.5 | 4종 목록 API 함수 + query 훅: 상신함(F712)·임시저장함(F713)·결재대기함(F710)·결재함(F714). 전부 `Page<DocumentBoxRow>`, `keyword`/page/size optional | F710·F712·F713·F714, §참조 계약 매핑 | T1.1, T1.2 | 4개 엔드포인트 axios 인스턴스 소비, 페이징 메타(`number+1`) 반영, 조회 실패→apiError 매핑 | 8 | 5 | ☑ |
| T1.6 | 4종 문서함 페이지 조립: 상신함/임시저장함/결재대기함/결재함 각각 제목 + 검색 상태 + `DocumentBoxTable`(T1.4) 재사용. 4종 동형 thin 페이지(공용 표가 반복 로직 캡슐화) | §페이지별 상세(4종), F710·F712·F713·F714 | T1.4, T1.5 | 4종 페이지가 각 목록 훅으로 검색·페이징·렌더, 조회 실패 시 에러 토스트, 행 클릭 콜백 슬롯 확보(상세 이동은 T2.5) | 6 | 6 | ☑ |
| T1.7 | 라우트 승격 + 사이드바 "전자결재" 그룹 신규: `/approval/box/*`(가칭) 4종 ProtectedRoute 자식 추가 + `sidebarMenuItems.ts` 기존 "전자결재" placeholder 3종(기안함/결재함/공람함)을 **PRD 5개 항목(문서함 홈/상신함/임시저장함/결재대기함/결재함)으로 교체**(문서함 홈은 M7까지 placeholder, 나머지 4종 live) | §메뉴 구조, 특수 맥락 #2 | T1.6 | 미인증→로그인 리디렉션(기존 가드), `EMPLOYEE` 메뉴 클릭→4종 문서함 진입, 문서함 홈은 "준비중" placeholder | 5 | 4 | ☑ |

*(라우트 경로 최종 확정·router.tsx/sidebarMenuItems.ts 배선은 react-router-developer 위임 권장. `/approval/box/{submitted,unsubmitted,pending,accessible}` 경로명은 착수 시 확정 — §Open Questions 참조.)*

> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(7개 전부 단일 task 유지)**. T1.1(순수 타입선언, 전 슬라이스 기반이라 최고 중요도 9)·T1.2(선언적 팩토리)·T1.3(단일 도메인 순수 표시 유틸)은 낮은 복잡도(2~3). T1.4(공용 `DocumentBoxTable`은 react-table 컬럼+검색+페이징을 캡슐화하는 재사용 핵심이라 복잡도 6·중요도 8이나 board/attendance 표 패턴 복제라 임계값 미만)·T1.5(4개 엔드포인트지만 동일 `DocumentBoxRow`+표준 axios/react-query 반복이라 5)·T1.6(4종 thin 페이지지만 T1.4가 반복 로직을 흡수해 각 페이지가 얇은 래퍼 → 6, split 불필요)은 7 미만 유지. T1.7은 기존 placeholder 그룹 교체 + 4종 라우트 승격이라 4.
> **실행 순서**: T1.1(중요도9) → T1.2(중요도8, T1.1과 병렬 가능) → T1.3(중요도7, T1.1 의존) → T1.4(중요도8, T1.3 의존) → T1.5(중요도8, T1.1·T1.2 의존·T1.4와 병렬 가능) → T1.6(T1.4·T1.5 의존) → T1.7(T1.6 의존, M1 리프). 근거: 위상정렬(Depends-on) 우선 + 동순위 내 중요도 높은 순. T1.1~T1.5는 M2~M7 전 슬라이스가 재사용하는 기반이라 M1 내 최고 중요도.

### M2 — 기안서 상세 read-only 슬라이스 (공통 셸 + 유형별 본문 슬롯) ✅

> 목표: 문서함 행 클릭 → 기안서 상세를 읽기 전용으로 렌더하는 슬라이스(공통 헤더·결재선 타임라인·공람자 목록·첨부 목록 표시 + 유형별 본문 슬롯 분기). 근거: PRD §사용자 여정(상세), §페이지별 상세(기안서 상세), F701.
> 완료 정의: `draftId`로 상세 조회 → `drafter`/`title`/`content`/`submittedAt`/`approvalStatus` 배지·`approvers[]`(order/role/approvedAt/rejectedAt/rejectReason)·`circulations[]`(readAt 표시만)·`files[]`(표시만)·`sourceDraftId`/`cancellationDraftId` 링크가 렌더. 유형 슬롯은 `draftType`으로 분기(GENERAL=content만, 나머지=폴백). **액션 버튼은 다음 슬라이스(M3~M6)에서 배선** — 이 슬라이스는 read-only 대지(canvas)를 만든다.
> 이 상세 페이지 셸과 `DraftDetailResponse` 타입은 F702~F719가 전부 소비하므로 전자결재 도메인의 관문이다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 상세 타입 정의: `DraftDetailResponse`(draftType·drafter·title·content·submittedAt·approvalStatus·approvers[]·circulations[]·files[]·sourceDraftId/cancellationDraftId/cancellationSubmittedAt·`leave`/`businessTrip`/`sales` 슬롯 nullable). 필드 상세는 `DRAFT_DETAIL` 스니펫/DTO 실측 | §참조 계약 매핑(`DRAFT_DETAIL`) | T1.1 | `features/approval/model/draftDetail.ts`에 타입 존재, 스니펫 대조 통과. F702~F719가 재사용할 기반 | 9 | 4 | ☑ |
| T2.2 | `approvalKeys`에 상세 축 추가(`draftDetail(draftId)`) + API 함수·query 훅: 상세 조회(F701) | F701, §참조 계약 매핑 | T2.1, T1.2 | 단건 조회 훅, 403(권한부족)/404(not-found)→apiError 매핑 소비(reissue 금지) | 9 | 4 | ☑ |
| T2.3 | 상세 공통 셸 조립(read-only): 헤더(제목·기안자·상태 배지·상신일시) + 결재선 타임라인(approvers order/role/승인·반려·사유) + 공람자 목록 표시(circulations readAt) + 첨부 목록 표시(files) + 취소기안 링크(sourceDraftId/cancellationDraftId). 액션 버튼 슬롯만 확보(비어 있음) | §페이지별 상세(기안서 상세 공통 셸), F701 | T2.2, T1.3 | 공통 필드·결재선·공람·첨부·취소링크·배지 렌더, 액션 슬롯 비어 있음, 조회 실패 에러 토스트 | 7 | 6 | ☑ |
| T2.4 | 유형별 본문 슬롯 분기 컴포넌트: `draftType` 분기 → GENERAL은 `content`만, `leave`/`businessTrip`/`sales` 중 non-null 슬롯이면 "해당 유형 화면 준비 중" 폴백. 취소기안은 `sourceDraftId`로 원본 링크(유형 판별은 non-null 슬롯 체크로 회피, Open Q#2) | §설계 요구사항(확장 포인트), Open Q#2·#3 | T2.3, T2.1 | GENERAL 렌더 + 타 유형 슬롯 폴백 표기, 슬롯 계약(어느 draftType에 어느 객체) 문서화 | 6 | 4 | ☑ |
| T2.5 | 라우트 승격: `/approval/drafts/:draftId`(가칭) ProtectedRoute 자식 추가 + 4종 문서함(T1.6) 행 클릭→상세 네비게이션 배선 | §메뉴 구조(하위 라우트), §사용자 여정 | T2.4, T1.6 | 4종 문서함 행 클릭 → 상세 진입, 직접 URL 진입도 동작 | 5 | 3 | ☑ |

> **M2 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(5개 전부 단일 task 유지)**. T2.1(순수 타입선언이나 `DraftDetailResponse`는 필드가 많고 F702~F719 전부의 기반이라 복잡도 4·중요도 9)·T2.2(단건 GET+403/404 매핑, 표준 패턴이나 전자결재 관문이라 중요도 9)는 M2 최고 중요도. T2.3(공통 셸은 헤더·결재선 타임라인·공람 목록·첨부 목록·취소링크까지 렌더 섹션이 많으나 전부 presentational read-only라 6, 액션 배선은 M3~M6로 분리)·T2.4(draftType 분기 + GENERAL 렌더 + 폴백, non-null 슬롯 체크로 enum 미확정 회피라 4)는 임계값 미만. T2.5는 T1.7과 동형 라우트 승격 + 행 네비게이션이라 3.
> **실행 순서**: T2.1(중요도9) → T2.2(중요도9, T2.1 의존) → T2.3(중요도7, T2.2·T1.3 의존) → T2.4(중요도6, T2.3 의존) → T2.5(중요도5, T2.4·T1.6 의존, M2 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순. T2.1/T2.2가 F702~F719(M3~M6)까지 재사용되는 기반이라 M2 최고 중요도.

### M3 — 결재자 액션 슬라이스 (F705 승인 · F706 반려) ✅

> 목표: 결재대기함(M1)→상세(M2)로 진입한 **현재 내 결재 차례 결재자**가 승인·반려를 수행하는 슬라이스. 근거: PRD §페이지별 상세(기안서 상세 결재자 액션·다음 이동), F705·F706.
> 완료 정의: "미처리 결재자 중 최소 order = 현재 차례"인 결재자가 상세에서 [승인](F705)/[반려](F706, `reason` 필수·공백불가). 성공(204)→상세·결재대기함 invalidate + 토스트, 규칙위반(차례 아님·이미 처리·결재선 밖)→서버 에러 토스트(apiError 소비).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 결재자 버튼 노출 판정 로직(순수 파생): 상세 `approvers[]`로 "현재 내 결재 차례" 도출(본인이 결재선에 있고 이전 order 전부 처리·본인 미처리). 최종은 서버 판정 — Open Q#4 | §페이지별 상세(버튼 노출 규칙), Open Q#4 | T2.1 | 승인/반려 노출 여부 도출, 차례 아님·이미 처리 케이스 판정 문서화 | 7 | 5 | ☑ |
| T3.2 | 결재자 mutation 훅: 승인(F705, body 없음), 반려(F706, `reason` 필수·공백 불가). onSuccess invalidate(상세·결재대기함) + 토스트 | F705·F706, §참조 계약 매핑 | T2.2 | 204 처리, 차례 아님·이미 처리·결재선 밖→서버 에러 토스트(apiError 소비) | 7 | 4 | ☑ |
| T3.3 | 상세에 승인/반려 버튼 배선(T3.1 판정 × T3.2 mutation) + 반려 사유 다이얼로그(shadcn Dialog + RHF+zod, `reason` 공백 불가) | §페이지별 상세(기안서 상세) | T3.1, T3.2, T2.3 | 결재 차례 시 버튼 노출·클릭, 반려 사유 미입력 폼 에러, 성공 시 상세·결재대기함 갱신 | 6 | 5 | ☑ |

> **M3 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(3개 전부 단일 task 유지)**. T3.1(결재선 order 순회로 "현재 내 차례" 도출하는 순수 파생, API 없음, Open Q#4 판정 기준이라 복잡도 5·중요도 7)·T3.2(F705/F706 body-없음/reason-only mutation 2종, 복잡도 4)·T3.3(T3.1×T3.2 배선 + 반려 사유 미니폼 다이얼로그, 복잡도 5)은 임계값 미만.
> **실행 순서**: T3.1(중요도7) → T3.2(중요도7, T2.2 의존·T3.1과 병렬 가능) → T3.3(중요도6, T3.1·T3.2·T2.3 의존, M3 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순. T3.1(판정)·T3.2(mutation)은 상호 독립이라 병렬 착수 가능.

### M4 — 기안자 액션 슬라이스 (F702 상신 · F703 철회 · F704 취소기안) ✅

> 목표: 상세(M2)에서 **기안자 본인**이 상태에 따라 상신·철회·취소기안을 수행하는 슬라이스. 근거: PRD §페이지별 상세(기안서 상세 기안자 액션·다음 이동), F702·F703·F704.
> 완료 정의: 기안자+`UNSUBMITTED`→[상신](F702)/[수정](→유형 작성 PRD, 미구현 폴백), 기안자+`WAITING`/`IN_PROGRESS`→[상신 철회](F703), 기안자+`APPROVED`+`cancellationDraftId==null`→[취소 기안 작성](F704). 성공(204/201)→상세·관련 문서함 invalidate + 토스트, 규칙위반→서버 에러 토스트.
> 이 마일스톤이 **사원 검색/선택 공용 컴포넌트(T4.4)의 원 소유자**다 — 취소기안 결재선(approvers)과 공람 대상(M5 empIds)이 이 컴포넌트를 공유한다.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T4.1 | 기안자 버튼 노출 판정 로직(순수 파생): 상세 응답으로 기안자 여부(`drafter.empId`==me)·상태별 노출(UNSUBMITTED→상신/수정, WAITING·IN_PROGRESS→철회, APPROVED+`cancellationDraftId==null`→취소기안). 최종은 서버 판정 — Open Q#4 | §페이지별 상세(버튼 노출 규칙), Open Q#4 | T2.1 | 상태 × 기안자 판정 → 노출 버튼 집합 도출, 판정 기준 문서화 | 7 | 4 | ☑ |
| T4.2 | 기안자 단순 mutation 훅: 상신(F702, body optional `approvers`—MVP는 기존 결재선 상신, 재지정은 T4.4 재사용 옵션), 상신 철회(F703, body 없음). onSuccess invalidate(상세·상신함/임시저장함) + 토스트 | F702·F703, §참조 계약 매핑 | T2.2 | 204 처리, 차례/상태/기안자 위반→서버 에러 토스트 | 7 | 4 | ☑ |
| T4.3 | 상세에 상신/철회 버튼 배선(T4.1 판정 × T4.2 mutation) + [수정] 라우팅(유형 작성 PRD, 미구현 유형은 폴백 안내 Open Q#3) | §페이지별 상세(기안서 상세) | T4.1, T4.2, T2.3 | 상태별 버튼 노출·클릭 동작, 성공 시 상세 즉시 갱신, [수정]→유형 작성 페이지(미구현 폴백) | 6 | 4 | ☑ |
| T4.4 | **사원 검색/선택 공용 컴포넌트**(취소기안 approvers·공람 empIds 산출용, M4/M5 공용): 사원 후보 조회 → 선택. **일반 사원 후보 조회 표준 경로는 Open Q#1**(`DEPT_MEMBERS`/`DEPTS` 유력, EMPLOYEE 게이트·부서제약 없음 경로 — 착수 전 확정, 발명 금지) | §MVP 필수 지원 기능(사원 검색), Open Q#1 | T1.1 | 사원 검색·선택 → id 배열 산출(결재선은 role·order 추가). 후보 조회 경로 미확정 시 //todo 플래그 후 사용자 질의 | 7 | 6 | ☑ |
| T4.5 | 취소기안 mutation 훅 + 다이얼로그(F704 생성/생성+상신, `{title,content,approvers?}`, path `sourceDraftId`, resp `{draftId}`). 결재선 선택은 T4.4 재사용. APPROVED 원본만 | F704, §참조 계약 매핑, Open Q#1·#4 | T4.1, T4.4, T2.2 | 기안자+APPROVED에서만 오픈, 201(draftId)→상세 갱신/이동 + 토스트, 검증 실패 폼 에러 | 5 | 6 | ☑ |

*(router.tsx 배선·사이드바 비노출 하위 라우트는 react-router-developer 위임 권장.)*

> **M4 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(5개 전부 단일 task 유지)**. T4.1(캐시된 상세 파생 순수 로직, Open Q#4 판정 기준이라 복잡도 4·중요도 7)·T4.2(F702+F703 단순 204 mutation 2종, 복잡도 4)·T4.3(신규 API 없이 T4.1×T4.2 배선 + 수정 라우팅, 복잡도 4)은 낮음. T4.4(사원 후보 조회+검색+선택 공용 컴포넌트, **Open Q#1 미확정이 최대 리스크**, M4/M5 공유 자산이라 복잡도 6·중요도 7)·T4.5(F704는 2개 엔드포인트 묶음 + `{title,content,approvers}` 미니폼 다이얼로그 + 생성/상신 분기, T4.4 재사용이나 복잡도 6)는 M4 최대 복잡도로 격리.
> **실행 순서**: T4.4(중요도7, T1.1 의존·Open Q#1 병목이라 착수 즉시 경로 확정)와 T4.1(중요도7, T2.1 의존)·T4.2(중요도7, T2.2 의존)는 상호 독립 → 병렬 착수 가능 → T4.3(중요도6, T4.1·T4.2·T2.3 의존) → T4.5(중요도5, T4.1·T4.4·T2.2 의존, M4 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순. T4.4는 M5(공람 추가)도 재사용하므로 Open Q#1 미해결 시 M4·M5 공통 병목 — 착수 즉시 사용자와 후보 조회 경로 확정.

### M5 — 공람 슬라이스 (F707 추가 · F708 제거 · F709 읽음) ✅

> 목표: 상세(M2)에서 **기안자**가 공람 대상을 추가/제거하고, **공람 대상자**가 최초 열람 시 읽음 처리하는 슬라이스. 근거: PRD §페이지별 상세(기안서 상세 공람 영역), F707·F708·F709.
> 완료 정의: 기안자→공람자 배치 추가(F707 `{empIds}`, 빈 배열 불가, T4.4 사원선택 재사용)/제거(F708 path empId), 공람 대상자(본인이 `circulations[]`에 있고 `readAt==null`)→읽음 처리(F709, `/circulations/me/read`, 재열람 불가). 성공(204)→상세 invalidate + 토스트.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T5.1 | 공람 mutation 훅: 추가(F707 `{empIds}`), 제거(F708 path empId), 읽음(F709 `/circulations/me/read`). onSuccess invalidate(상세) + 토스트 | F707·F708·F709, §참조 계약 매핑 | T2.2 | 204 처리, 빈 배열·기안자 아님·이미 읽음 등 서버 위반→에러 토스트 | 7 | 4 | ☑ |
| T5.2 | 공람 영역 조립 + 노출 판정: 공람자 목록(readAt 표시, T2.3 확장) + (기안자) 공람 추가 다이얼로그(T4.4 재사용)/제거 + (공람 대상자·readAt==null) 읽음 처리 버튼. 노출 판정은 상세 응답 필드로 도출(Open Q#4) | §페이지별 상세(공람 영역), Open Q#1·#4 | T5.1, T4.4, T2.3 | 기안자엔 추가/제거, 공람 대상자엔 읽음 버튼 노출, 성공 시 상세 즉시 갱신 | 6 | 6 | ☑ |

> **M5 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(2개 전부 단일 task 유지)**. T5.1(F707/F708/F709 mutation 3종이나 전부 204·표준 패턴이라 복잡도 4·중요도 7)·T5.2(공람자 목록 + 기안자 추가/제거 + 공람자 읽음의 노출 판정을 한 영역에 조립하나 T4.4 사원선택 재사용으로 신규 UI 최소화, 복잡도 6)은 임계값 미만.
> **실행 순서**: T5.1(중요도7, T2.2 의존) → T5.2(중요도6, T5.1·T4.4·T2.3 의존, M5 리프). 근거: 위상정렬 우선. M5는 M4의 T4.4(사원선택) 완료를 전제로 착수한다(공람 추가가 동일 컴포넌트 재사용).

### M6 — 첨부 슬라이스 (F716 업로드 · F717 삭제 · F718 미리보기 · F719 다운로드) ✅

> 목표: 상세(M2)에서 **기안자**가 첨부를 업로드/삭제하고, **조회 가능자**가 미리보기/다운로드하는 슬라이스. 근거: PRD §페이지별 상세(기안서 상세 첨부 영역), F716~F719.
> 완료 정의: 기안자→업로드(F716 PATCH multipart part명 `file`)/삭제(F717 path fileId), 조회 가능자→미리보기(F718)/다운로드(F719, Binary). 성공(204)→상세 invalidate + 토스트. 파일 정책(확장자·기안서당 최대 10개·총 10MB, `FILE_001~005`)은 `@docs/backend-contract/file-upload.md` + `@../docs/도메인모델.md` 관할, board `fileValidation` 복제.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T6.1 | 첨부 업로드/삭제 mutation 훅: 업로드(F716, multipart part명 `file`, PATCH) + 삭제(F717, path fileId). board `uploadBoardFile`·`fileValidation` 복제(확장자·10개·10MB 사전검증, 다중/단건은 Open Q#6). onSuccess invalidate(상세) + 토스트 | F716·F717, §참조 계약 매핑, Open Q#6 | T2.2 | 204 처리, 파일 정책 위반(`FILE_001~005`)→에러 토스트, 사전검증 동작 | 7 | 5 | ☑ |
| T6.2 | 첨부 미리보기/다운로드: 미리보기(F718 inline)·다운로드(F719 attachment) Binary. board `useBoardFilePreviewUrl`·`downloadBoardFile` 패턴 복제 | F718·F719, §참조 계약 매핑 | T2.2 | 미리보기 URL 생성·인라인 렌더, 다운로드 트리거 동작 | 6 | 4 | ☑ |
| T6.3 | 첨부 영역 조립(T2.3 확장): 첨부 목록 + (기안자) 업로드/삭제 버튼(T6.1) + (조회 가능자) 미리보기/다운로드(T6.2). 기안자 여부는 상세 응답으로 도출 | §페이지별 상세(첨부 영역), F716~F719 | T6.1, T6.2, T2.3 | 기안자엔 업로드/삭제, 조회자엔 미리보기/다운로드 노출, 성공 시 상세 즉시 갱신 | 6 | 5 | ☑ |

> **M6 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(3개 전부 단일 task 유지)**. T6.1(F716 multipart+F717 삭제, board 파일 패턴 복제라 표준화, Open Q#6 다중/단건만 리스크라 복잡도 5·중요도 7)·T6.2(F718/F719 Binary, board 미리보기/다운로드 패턴 복제라 복잡도 4)·T6.3(목록+업로드/삭제+미리보기/다운로드 배선, 복잡도 5)은 임계값 미만.
> **실행 순서**: T6.1(중요도7, T2.2 의존) → T6.2(중요도6, T2.2 의존·T6.1과 병렬 가능) → T6.3(중요도6, T6.1·T6.2·T2.3 의존, M6 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순. T6.1·T6.2는 상호 독립(변경 vs 읽기)이라 병렬 가능.

### M7 — 문서함 홈 요약/뱃지 슬라이스 (F715 요약 · F711 뱃지) ✅

> 목표: 사이드바 "전자결재 > 문서함 홈" 진입 → 4종 문서함 건수 요약 카드 + 카드 클릭 이동, 그리고 결재대기 건수 뱃지(사이드바·홈 카드)를 완성하는 슬라이스. 근거: PRD §사용자 여정(문서함 홈), §페이지별 상세(문서함 홈), F715·F711.
> 완료 정의: 문서함 홈에서 요약 카드 4종(결재대기/임시저장/상신/조회가능) 렌더 + 카드→4종 문서함(M1) 라우팅, 사이드바 "결재대기함" 뱃지에 F711 건수 표시. 조회 실패→에러 토스트.
> **왜 M7(마지막)인가**: 문서함 홈은 개별 문서함(M1)을 집계하는 요약 대시보드이므로, walking-skeleton 원칙상 실제 문서함이 먼저 동작한 뒤 마지막에 얹는다. M1(문서함 라우트)에만 의존하므로 M2~M6과 병렬 착수 가능.

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T7.1 | 요약/뱃지 API 함수 + query 훅: 문서함 요약(F715, 단일 객체 4 counts) + 결재대기 건수(F711, **bare number** 응답). `approvalKeys` 요약 축 추가 | F715·F711, §참조 계약 매핑 | T1.2 | 요약 4 counts·뱃지 단일 정수 조회, bare number 파싱 처리, 조회 실패→apiError 매핑 | 7 | 4 | ☑ |
| T7.2 | 문서함 홈 페이지 조립: 요약 카드 4종(shadcn Card, `pendingApprovalDraftCount`/`unsubmittedDraftCount`/`submittedDraftCount`/`accessibleDocumentCount`) + 결재대기 강조(F711) + 카드→문서함(M1) 라우팅 | §페이지별 상세(문서함 홈), F715·F711 | T7.1, T1.6 | 4종 카드 렌더, 카드 클릭→상신함/임시저장함/결재대기함/결재함 이동, 조회 실패 에러 토스트 | 6 | 5 | ☑ |
| T7.3 | 사이드바 결재대기함 뱃지 배선(F711 count) + "문서함 홈" 메뉴 placeholder→승격: `/approval/box/home`(가칭) ProtectedRoute 자식 추가. 뱃지 표시는 `SidebarMenuItem`/Sidebar 확장 필요(뱃지 슬롯) | §메뉴 구조, F711 | T7.1, T7.2 | "결재대기함" 메뉴에 건수 뱃지 표시, "문서함 홈" live 승격·진입 가능 | 5 | 4 | ☑ |

*(router.tsx 배선·사이드바 뱃지 슬롯 확장은 react-router-developer 위임 권장.)*

> **M7 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음(3개 전부 단일 task 유지)**. T7.1(F715 단일 객체 + F711 bare number 2종 GET, 표준 패턴이나 bare number 파싱 주의라 복잡도 4·중요도 7)·T7.2(요약 카드 4종 + 카드 라우팅, 복잡도 5)·T7.3(사이드바 뱃지 슬롯 확장 + 문서함 홈 승격, `SidebarMenuItem` 인터페이스 확장 포함이라 복잡도 4)은 임계값 미만.
> **실행 순서**: T7.1(중요도7, T1.2 의존) → T7.2(중요도6, T7.1·T1.6 의존) → T7.3(중요도5, T7.1·T7.2 의존, M7 리프). 근거: 위상정렬 우선 + 동순위 내 중요도 높은 순.

## 🔀 병렬화 가능 지점

- **T1.1(타입)과 T1.2(queryKeys)**: 상호 독립 → 병렬. T1.5(4종 목록 API)도 T1.1·T1.2 이후 T1.4(공용 표)와 병렬 가능.
- **M3(결재자 액션)·M4(기안자 액션)·M6(첨부)**: 셋 다 M2(상세 셸)에만 의존하고 서로 독립 → 세 슬라이스 병렬 착수 가능. 각 마일스톤 내부에서도 판정 로직(T3.1/T4.1)과 mutation 훅(T3.2/T4.2), 업로드(T6.1)와 미리보기/다운로드(T6.2)가 독립이라 병렬 진행 가능.
- **M5(공람)**: M2 + M4의 T4.4(사원선택) 완료 후 착수. M4의 나머지(T4.1~T4.3·T4.5)와는 독립이므로 T4.4만 끝나면 M5를 M4 잔여 태스크와 병렬 진행 가능.
- **M7(문서함 홈 요약/뱃지)**: M1에만 의존 → M2~M6 클러스터와 완전 병렬 착수 가능(상세 진입 불필요, 문서함 라우트만 소비).
- **M4 T4.4(사원선택, Open Q#1 병목)**: 최대 리스크 태스크 → M4 착수 즉시(다른 M4 태스크와 병렬로) 후보 조회 경로를 사용자와 확정. M5도 재사용하므로 조기 확정이 M4·M5 클러스터 전체를 언블록.

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §Open Questions 승계)

- **라우트 경로 명명(신규 결정)**: 전자결재 페이지 경로(`/approval/box/{submitted,unsubmitted,pending,accessible,home}`·`/approval/drafts/:draftId`는 전부 가칭)를 기존 router 컨벤션(board/attendance)에 맞춰 착수 전 확정. 사이드바 그룹 구성은 PRD §메뉴 구조를 따른다.
- **[Open Q#1] 결재선/공람 사원 검색 표준 경로(M4 T4.4·T4.5 · M5 T5.2 착수 전 선행 게이트)**: 취소기안(F704)의 `approvers[]`와 공람 추가(F707)의 `empIds[]`를 지정할 **일반 사원(EMPLOYEE) 표준 사원 검색 경로 미확정**. `EMPS_FOR_MANAGEMENT`/`NEW_EMP_LIST`는 HR/DEPT_MANAGER 전용이라 불가, `DEPT_MEMBERS`(`/api/departments/{deptId}/members`, EMPLOYEE 가능·부서제약 없음)+`DEPTS`가 유일 후보로 보임. **휴가 PRD Open Q#1과 동일 이슈 → 공통 컴포넌트(T4.4)로 통합.** T4.4 착수 즉시 사용자와 확정(발명 금지, 미확정 시 //todo 플래그).
- **[Open Q#4] 상세 액션 버튼 노출 판정 기준(M3 T3.1 · M4 T4.1 · M5 T5.2 · 특히 F704·F707 착수 전 선행 게이트)**: "현재 내 결재 차례"(본인 결재선 소속 + 이전 order 전부 처리 + 본인 미처리), 기안자 상태별 노출(UNSUBMITTED→상신/수정, WAITING/IN_PROGRESS→철회, APPROVED+`cancellationDraftId==null`→취소기안), 공람 읽음 노출(본인이 `circulations[]`에 있고 `readAt==null`)을 상세 응답 필드로 프론트 도출하는 규칙 확정 필요. 프론트는 노출만 담당, 최종 판단은 서버(403/도메인 에러 폴백).
- **[Open Q#2] `draftType` 정규 enum 값 집합 + 취소기안 유형 표기(M2 T2.4)**: 상세 `draftType`은 String이며 스니펫 관측값은 `BUSINESS_TRIP`뿐(GENERAL/LEAVE/SALES 추정). 취소기안이 별도 `draftType`을 갖는지, 원본 유형 + `sourceDraftId!=null`로 판별하는지 미확정. **→ enum 정규값에 의존하지 않고 `leave`/`businessTrip`/`sales` non-null 슬롯 체크로 분기해 회피**(T2.4). 취소기안은 `sourceDraftId`로 원본 링크.
- **[Open Q#3] 미구현 유형 슬롯 폴백 UX(M2 T2.4 · M4 T4.3)**: 이번 공통 로드맵은 공통 셸 + GENERAL 렌더만 구현하고 LEAVE/BUSINESS_TRIP/SALES 슬롯 본문·[수정] 라우팅은 각 유형 PRD 소유. 미착수 유형은 상세 본문 슬롯·[수정]을 "해당 유형 화면 준비 중" 폴백으로 처리(폴백 표기/비활성 범위 확정 필요).
- **[Open Q#5] `leave`/`sales` 슬롯 하위필드 스니펫 재확인(M2 T2.1)**: `DRAFT_DETAIL` 스니펫 예시가 BUSINESS_TRIP이라 `leave`/`sales` 하위필드 미노출. GENERAL만 렌더하고 타 유형은 폴백하는 이번 범위에선 저리스크이나, 타입 정의 시 휴가·매출 유형 상세 케이스 스니펫으로 대조 권장.
- **[Open Q#6] 첨부 업로드 다중/단건(M6 T6.1)**: `DRAFT_FILE_UPLOAD` request-parts는 part명 `file`(단수)로 1회 1파일이나 도메인 규칙은 기안서당 최대 10개·총 10MB. 다중 파일 UX(연속 업로드 vs 다중 선택)와 클라이언트 사전검증 범위 확정 필요(`@docs/backend-contract/file-upload.md`, board `fileValidation` 복제).
- **[Open Q#7] 문서함 목록 유형 뱃지/필터(M1 T1.4·T1.6)**: 4종 문서함 행(`DocumentBoxRow`)에 `draftType`이 없어 목록 단계 유형 식별·필터 불가(제목/기안자만). 특히 결재대기함의 유형 혼재를 목록 뱃지로 제공할지, 상세 진입 후 분기로만 처리할지 확정 필요(백엔드 `draftType` 목록 노출 요청 여부 포함). 이번 범위는 상세 진입 후 분기 가정.

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능 / 범위 외" 참조로만 나열(각 유형 작성 PRD 또는 타 도메인 대상):

- **유형별 기안서 생성/수정 API 전부**: `GENERAL_DRAFT_CREATE`/`_CREATE_SUBMISSION`/`_UPDATE`(②일반)·`LEAVE_DRAFT_*`(④연가, `docs/prd/6.leave-prd.md`)·`BUSINESS_TRIP_DRAFT_*`·`BUSINESS_TRIP_PARTICIPANTS_UPDATE`(③출장)·`SALES_DRAFT_*`(⑤매출, FRANCHISE 전용) — 각 유형 작성 PRD 관할. 상세 페이지 유형 슬롯은 이들의 본문이 나중에 꽂힐 확장 포인트(T2.4)이며, 상세 [수정]은 각 유형 작성 페이지로 라우팅만.
- **유형별 이력 조회**: `MY/DEPT_LEAVE_REQUEST_HISTORY`(④연가)·`MY/DEPT_BUSINESS_TRIP_REQUEST_HISTORY`(③출장) — 각 유형 PRD.
- **테마/다크모드·다국어(i18n)·브라우저 푸시 알림** — 전 도메인 공통 제외.
- **(LEAVE 로드맵 재편)**: 본 로드맵 확정 후 `docs/ROADMAP(LEAVE).md`의 M2/M4/M5 재편(overwrite)은 별도 단계에서 처리 — 이 로드맵의 태스크가 아님(특수 맥락 #1).

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F701(T2.1/T2.2/T2.3/T2.4)·F702(T4.2/T4.3)·F703(T4.2/T4.3)·F704(T4.5)·F705(T3.2/T3.3)·F706(T3.2/T3.3)·F707(T5.1/T5.2)·F708(T5.1/T5.2)·F709(T5.1/T5.2)·F710(T1.5/T1.6)·F711(T7.1/T7.3)·F712(T1.5/T1.6)·F713(T1.5/T1.6)·F714(T1.5/T1.6)·F715(T7.1/T7.2)·F716(T6.1/T6.3)·F717(T6.1/T6.3)·F718(T6.2/T6.3)·F719(T6.2/T6.3) — 19개 전부 ≥1 태스크 매핑 ✅
- 🔍 **역참조**: 모든 태스크가 PRD F70x/§페이지별 상세/§참조 계약 매핑/§설계 요구사항/§Open Questions에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1→M2→(M3·M4·M6), M2+M4.T4.4→M5, M1→M7 위상 정렬, 순환 없음. 기존 배관(M0·인증·셸·board/attendance·usePrimaryDeptId)은 재구축하지 않고 소비 전제 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(문서함 목록→상세 read-only→결재자 액션→기안자 액션→공람→첨부→문서함 홈 요약)과 일치. 문서함 홈은 PRD 여정 첫 화면이나 집계 대시보드 성격상 M7로 후치(개별 문서함 M1이 선행, 홈은 M1 소비) — walking-skeleton 정합 ✅
- 🔍 **범위**: PRD 제외 기능(유형별 작성/수정·유형별 이력)은 백로그로만, 태스크화 없음. 상세 유형 슬롯은 확장 포인트로 설계(발명 아님)·GENERAL 렌더까지만 ✅
- 🔍 **규약**: 계약/전역 규칙(reissue·페이징+1·403/404 매핑·withCredentials·날짜 dayjs·파일 정책) 재서술 없음, 필드/DTO 설계 없음(스니펫·§참조 계약 매핑으로 위임), URL/인프라/견적 강제 없음(경로는 가칭 + react-router-developer 위임) ✅

**결과: 6개 항목 전부 통과. 기존 배관 소비 전제로 전자결재 공통 도메인 M1~M7만 설계 완료. Open Questions #1·#4는 F704(취소기안)·F707(공람 추가)의 선행 결정 게이트(T4.4 착수 즉시 확정), #2·#3·#5·#6·#7은 비블로킹으로 격리 — F701~F719 착수 가능.**
