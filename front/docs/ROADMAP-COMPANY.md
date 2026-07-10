# 회사 정보(COMPANY) 관리 Frontend 개발 ROADMAP

> 출처 PRD: `docs/prd/14.company-prd.md` (groupware-prd-validator 검증 통과 · Major 1건(409→400 `COMPANY_002`) 정정 반영)
> 이 로드맵은 PRD를 **실행 순서·의존성·태스크**로 전개한 것이다. 기능/계약의 사실 원천은 PRD와 백엔드 계약 문서(`api-endpoint.md` "COMPANY API" 섹션 + `back/build/generated-snippets/COMPANY_{REGISTER,UPDATE_INFO,UPDATE_CONTACT,UPDATE_HOME_PAGE_URL}/`, `COMPANY_INFO`는 스니펫 부재로 `CompanyInfoResponse.java` 소스 대조)이며, 여기서는 **무엇을 어떤 순서로 만들지**만 다룬다. 필드/DTO는 재서술하지 않고 PRD §참조 계약 매핑을 가리킨다.

## 🗺️ 개요

**📅 최종 업데이트**: 2026-07-10 (11개 실행 태스크 전부 구현+code-reviewer 리뷰 통과 — /shrimp:execute 5단계 완료)
**📊 진행 상황**: 11/11 Tasks 완료 (100%) — M1 ✅(3/3) / M2 ✅(2/2) / M3 ✅(6/6) (T3.1·T3.2는 각 3개 서브태스크로 분할, 부모 행은 요약 유지)

- **전략**: walking-skeleton-first 세로 슬라이스. **M0(배관) 없음** — 인증/셸/라우터 가드/axios 인터셉터/QueryClient는 이미 완료된 앱 전역 배관을 그대로 소비한다(재구현 금지). 단일 엔티티 도메인이라 마일스톤도 얇다: **조회+진입 배선(M1) → 최초 등록(M2) → 3분할 수정(M3)** 순으로 PRD 사용자 여정을 그대로 관통한다. M1이 먼저인 이유는 로컬 개발 DB가 현재 미등록 상태(`GET /api/companies` 404 확인됨)라, 조회 페이지 골격(빈 상태 분기 포함)이 있어야 M2의 등록 CTA가 꽂힐 자리가 생기기 때문이다.
- **범위 경계**: 이 로드맵이 소유하는 것은 **회사 정보 페이지(조회+등록+3종 수정) + 그 api/query/mutation(5개 기능ID) + zod 스키마 3~4종 + 신규 사이드바 "설정" 그룹 + 라우트 1개**뿐이다. PRD §MVP 이후 기능(이력 목록 조회 UI·다중 회사·로고 업로드·비-ADMIN 상시 노출 위젯)은 로드맵 범위 밖(§백로그 참조, 태스크화 금지).
- **소비할 기존 완료 자산(재구현 금지)**:
  - **폼/에러 배관**: `src/shared/lib/form.ts`(`useZodForm`/`submitWithErrorMapping`), `shared/lib/apiError.ts`(`handleApiError` — 도메인 에러코드 분기 패턴 포함), axios 인스턴스+인터셉터, `QueryClient`
  - **라우팅/셸**: `ProtectedRoute`, `LayoutShell`, `src/app/router.tsx`, `src/shared/components/sidebarMenuItems.ts`(그룹/리프 구조 컨벤션 — `label`/`to`/`minRole`/`icon`/`children`)
  - **역할 게이팅 헬퍼**: `hasRequiredRole(userRoles, 'ADMIN')`류 기존 role 판정 유틸(정확한 심볼명은 T1.2 착수 시 `sidebarMenuItems.ts`/기존 ADMIN 전용 UI 선례에서 확인 — 신규 발명 금지)
  - **섹션별 편집 다이얼로그 선례**: 부서 상세·기안 상세 등에서 이미 쓰인 "표시 카드 + [편집] 버튼 → shadcn Dialog + RHF+zod 폼 → mutation → invalidate" 패턴(정확한 참조 컴포넌트는 T3.2 착수 시 최근 도메인에서 택1 확인)
  - 날짜 `dayjs` / 토스트 `sonner` / 폼 `react-hook-form + zod` / shadcn Card·Dialog·Input·Label·Button (CLAUDE.md §6 고정 스택 — 추가 라이브러리 도입 금지)
- **PRD에서 확정된 결정(로드맵 반영)**:
  - **에러 코드 정정(Major 반영)**: 등록 시 "이미 존재" 에러는 **HTTP 400, 코드 `COMPANY_002`**다(409 아님, `ApplicationErrorCode.java:88` 실측). 프론트 분기는 `error.code === 'COMPANY_002'`로 한다.
  - **`editedAt` 자동 주입**: 사용자 입력 필드가 아니라 폼 제출 시점의 클라이언트 현재 시각을 `yyyy-MM-dd'T'HH:mm:ss`로 등록/수정 3종 mutation 모두에 자동 주입한다. 서버가 "이전 스냅샷보다 이후여야 함" 규칙을 위반으로 판단하면 500(핸들러 미처리)이 오며, 이 경우도 일반 에러 토스트로 처리한다(전용 UX 불필요).
  - **메뉴 배치 비대칭(의도된 설계)**: 조회 API는 `permitAll`이지만 화면 진입점은 신규 "설정" 그룹(`minRole: 'ADMIN'`)으로 한정한다. 단 **라우트 가드 자체는 `EMPLOYEE`**로 열어 둬, 비-ADMIN이 URL 직접 진입 시에도 읽기 전용 뷰는 정상 표시되어야 한다(편집 UI만 조건부로 숨김). 이 비대칭을 라우팅 태스크(T1.3)에서 정확히 구현한다.
  - **수정 폼 3분할**: 통합 수정 API를 발명하지 않고 기본정보(`COMPANY_UPDATE_INFO`)/연락처(`COMPANY_UPDATE_CONTACT`)/홈페이지(`COMPANY_UPDATE_HOME_PAGE_URL`) 3개 API에 맞춰 섹션별 편집 다이얼로그 3개로 분리한다. 기본정보·연락처는 각각 "최소 1개 필드 변경" 클라 사전검증(도메인 규칙).
- **완료 게이트(전 마일스톤 공통)**: `npm run check-all` 통과 + `npm run build` 성공(CLAUDE.md §9).

## 🧩 의존성 개요

```
[기존 완료 배관: axios 인터셉터·QueryClient·ProtectedRoute·LayoutShell·sidebarMenuItems·router·
 useZodForm/submitWithErrorMapping·handleApiError·역할 게이팅 헬퍼·섹션 편집 다이얼로그 선례]  ← 소비만(재구현 금지)
  │
  ├→ M1 회사 정보 조회 + 진입 배선 슬라이스 (F1401)   ← 즉시 착수, 여정 진입점
  │     T1.1 조회 api+query 훅 ┐
  │     T1.2 CompanyInfoPage(조회 렌더+빈 상태 분기) ┴→ T1.3 라우트+사이드바 "설정" 그룹 배선
  │
  ├→ M2 최초 등록 슬라이스 (F1402)                    ← M1 페이지 골격 필요(등록 CTA가 꽂힐 자리)
  │     T2.1 등록 zod 스키마+api+mutation → T2.2 등록 폼(페이지 내 조건부 렌더)
  │
  └→ M3 수정 슬라이스 (F1403+F1404+F1405)             ← M1 페이지 골격 필요(정보 표시 후 편집 진입)
        T3.1 수정 3종 zod 스키마+api+mutation(병렬) → T3.2 편집 다이얼로그 3종
```

- **M2·M3은 서로 코드 의존이 없다**(둘 다 M1 페이지 골격만 소비) → M1 완료 후 **병렬 착수 가능**. PRD 여정상 등록이 선행 시나리오(미등록 DB)라 M2를 먼저 다루는 것을 권장하나 하드 의존은 아니다.
- **각 마일스톤 내부**: 스키마/api/mutation(1티어)과 페이지/다이얼로그(2티어)는 순차 — 1티어가 여러 개면 서로 독립이라 병렬 가능(M3의 T3.1 내부 3종이 대표 사례).

## 🚩 마일스톤 & 태스크

> 완료 여부: ☐ 미착수 / ☑ 완료.

### M1 — 회사 정보 조회 + 진입 배선 슬라이스 (F1401)

> 목표: 사이드바 신규 "설정 › 회사 정보" → 현재 회사 정보 스냅샷 카드 표시. 미등록(404)이면 ADMIN에게는 등록 유도 빈 상태(실제 등록 폼은 M2), 비-ADMIN에게는 안내 빈 상태. 근거: PRD §사용자 여정, §페이지별 상세(회사 정보 페이지), §메뉴 구조, F1401.
> 완료 정의: `EMPLOYEE` 이상이 페이지에 진입(사이드바 ADMIN 노출 또는 직접 URL)해 조회 성공 시 7개 필드 카드 렌더, 404 시 role별 빈 상태 분기(ADMIN 전용 CTA 자리 존재), 그 외 에러는 `handleApiError` 위임. 사이드바 "설정"(minRole ADMIN) 그룹 + "회사 정보" 리프가 라우트에 연결되고, 라우트 가드는 `EMPLOYEE`(메뉴 노출과 비대칭 — PRD §메뉴 구조 결정 근거 그대로 구현).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T1.1 | 조회 api 함수 `getCompanyInfo`(`GET /api/companies`, 응답 `CompanyInfoResponse` — 스니펫 없음, `CompanyInfoResponse.java` 소스 대조) + `companyKeys` queryKey 팩토리 신설 + `useCompanyInfoQuery` 훅(404를 정상 "미등록" 상태로 다루도록 에러 분기 — throw 대신 컴포넌트가 판별 가능한 형태로) | F1401, §참조 계약 매핑(`COMPANY_INFO`) | — | `features/company/api/getCompanyInfo.ts` + `model/companyKeys.ts` + query 훅 생성, 404는 조회 실패가 아니라 "미등록" 상태로 컴포넌트에서 구분 가능, 그 외 실패는 `handleApiError` 위임 | 9 | 3 | ☑ |
| T1.2 | `CompanyInfoPage`: T1.1 훅으로 조회 → 성공 시 정보 카드(회사명·위치·대표 이메일·대표 연락처·대표자명·홈페이지 URL, `editedAt` dayjs 포맷) 렌더. 404(미등록) 시 role 분기 — ADMIN은 "최초 등록" CTA 영역(버튼/폼 자리, 실제 제출 로직은 T2.2에서 배선), 비-ADMIN은 "등록된 회사 정보가 없습니다" 안내. 로딩 스켈레톤 | F1401, §페이지별 상세(회사 정보 페이지) | T1.1 | `features/company/pages/CompanyInfoPage.tsx` 생성, 등록됨→카드 렌더, 미등록+ADMIN→CTA 자리, 미등록+비ADMIN→안내 빈 상태, 로딩 상태 표시 | 8 | 4 | ☑ |
| T1.3 | **라우팅/사이드바 배선**(react-router-developer 위임 권장): `router.tsx`에 회사 정보 라우트 추가(가칭 `/settings/company`, `ProtectedRoute` 자식, 가드는 `EMPLOYEE`) + `sidebarMenuItems.ts`에 신규 "설정" 그룹(`minRole:'ADMIN'`, 자식 "회사 정보" 리프 `to:'/settings/company'`) 추가 | §메뉴 구조(신규 "설정" 그룹, 메뉴-가드 비대칭) | T1.2 | 사이드바에 ADMIN에게만 "설정 › 회사 정보" 노출, 비-ADMIN도 직접 URL 진입 시 읽기 전용 페이지 정상 렌더(가드가 EMPLOYEE), 미인증→로그인 리디렉션 | 6 | 3 | ☑ |

> **M1 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. T1.2(복잡도4)가 최대이나 단일 쿼리 소비+역할 3-way 분기 렌더 수준이라 임계값 미만. T1.1(단일 API+404 상태분기, 복잡도3)·T1.3(라우트 1개+사이드바 그룹 1개 배선, 복잡도3)도 단순.
> **실행 순서**: T1.1(중요도9, 루트) → T1.2(중요도8, T1.1 의존) → T1.3(중요도6, T1.2 의존). 선형 슬라이스(위상정렬 그대로).

### M2 — 회사 정보 최초 등록 슬라이스 (F1402)

> 목표: 미등록(404) 상태에서 ADMIN이 7개 필드를 입력해 최초 등록 → 성공 시 조회 재조회로 정보 카드 전환. 근거: PRD §사용자 여정, §페이지별 상세("최초 등록" 폼), F1402.
> 완료 정의: ADMIN이 M1의 CTA에서 등록 폼(전 필드 zod required)을 채워 제출 → `204` Empty → `companyKeys` invalidate → 카드 뷰로 전환 + 성공 토스트. 이미 등록되어 있다면(경합) 서버 **400·`COMPANY_002`** → "이미 등록된 회사 정보가 있습니다" 안내 + 재조회로 상태 동기화(Major 정정 반영, 409 아님).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T2.1 | 등록 폼 zod 스키마 `companyRegisterSchema`(companyName≤50·location≤200·presentedEmail 이메일형식≤150·presentedExternalNo≤20·ownerName≤20·homePageURL `http(s)://` 시작≤200 — 전부 required, 공백 불가) + api 함수 `registerCompany`(`POST /api/companies/new`, `editedAt`은 함수 내부에서 제출 시각 자동 주입) + mutation 훅 `useCompanyRegisterMutation`(onSuccess `invalidateQueries(companyKeys.all)`) | F1402, §참조 계약 매핑(`COMPANY_REGISTER` 필드 제약), §폼 UX 결정(editedAt 자동 주입) | T1.1 (companyKeys 재사용) | `features/company/model/companyRegisterSchema.ts` + `api/registerCompany.ts` + mutation 훅 생성, 6필드 인라인 검증(이메일 형식·URL 프리픽스 포함), `editedAt` 미노출(자동 주입), 성공 시 invalidate | 7 | 5 | ☑ |
| T2.2 | `CompanyInfoPage`(T1.2)의 ADMIN 미등록 CTA 자리에 실제 등록 폼 배선: RHF+zod(T2.1) 폼 제출 → mutation → 성공 시 카드 뷰 전환 + 토스트, 실패 시 `error.code==='COMPANY_002'`면 전용 안내 문구 + 재조회, 그 외는 `handleApiError` 위임 | F1402, §페이지별 상세("다음 이동" 등록 성공/이미 존재 분기) | T2.1, T1.2 | 미등록+ADMIN 화면에서 폼 제출→성공 시 카드로 전환, 중복 등록 시도 시 `COMPANY_002` 전용 안내(409 아닌 400 분기), 필수 미입력 시 인라인 에러 | 6 | 5 | ☑ |

> **M2 split 판단(복잡도·중요도)**: 전 태스크 복잡도 < 7 → **split 없음**. T2.1(스키마+api+mutation 번들, 복잡도5)·T2.2(기존 페이지에 폼 배선+`COMPANY_002` 에러코드 분기, 복잡도5) 모두 단일 기능ID(`COMPANY_REGISTER`) 소비라 임계값 미만.
> **실행 순서**: T2.1(중요도7, T1.1 의존) → T2.2(중요도6, T2.1·T1.2 의존). 선형 슬라이스. M1 완료 후 M3와 병렬 착수 가능(§의존성 개요).

### M3 — 회사 정보 수정 슬라이스 (F1403 + F1404 + F1405)

> 목표: 등록된 회사 정보 카드에서 ADMIN이 3개 섹션(기본정보/연락처/홈페이지)을 각각 독립적으로 편집 → 성공 시 카드 갱신. 근거: PRD §사용자 여정, §페이지별 상세(섹션별 편집 다이얼로그), §폼 UX 결정(수정 API 3분할), F1403·F1404·F1405.
> 완료 정의: 카드의 3개 섹션 각각에 [편집] 진입점(ADMIN 전용) → shadcn Dialog + RHF+zod(부분 수정, 각 필드 optional이나 **최소 1개 변경 필수** 클라 검증) → 대응 API 1개 호출(`204`) → `companyKeys` invalidate + 다이얼로그 닫힘 + 토스트. 통합 4번째 API 없음(3개 API 그대로 소비).

| Task | 설명 | 근거(PRD) | Depends-on | Done 조건 | 중요도 | 복잡도 | 완료 여부 |
|---|---|---|---|---|---|---|---|
| T3.1 | 수정 3종 zod 스키마+api+mutation(상호 독립, 병렬 가능): (1) `companyInfoUpdateSchema`+`updateCompanyInfo`(`POST /api/companies/info`, companyName/location/ownerName 전부 optional+길이 제약, "1개 이상 변경" refine) (2) `companyContactUpdateSchema`+`updateCompanyContact`(`POST /api/companies/contact`, presentedEmail/presentedExternalNo optional+형식 제약, "1개 이상 변경" refine) (3) `companyHomePageUpdateSchema`+`updateCompanyHomePageURL`(`POST /api/companies/home-page-url`, homePageURL required+프리픽스 제약). 3개 모두 `editedAt` 제출 시각 자동 주입 + 각 mutation 훅(onSuccess invalidate `companyKeys.all`) | F1403·F1404·F1405, §참조 계약 매핑(3개 기능ID 필드 제약), §폼 UX 결정(editedAt 자동 주입·3분할) | T1.1 | `features/company/model/company{Info,Contact,HomePage}UpdateSchema.ts` + `api/update{CompanyInfo,CompanyContact,CompanyHomePageURL}.ts` + mutation 훅 3종 생성, 각 스키마가 "전부 미변경 시" 폼 에러(refine), `editedAt` 미노출, 성공 시 invalidate | 7 | 8→split | ☐ |
| T3.1-a | 기본정보 수정: `companyInfoUpdateSchema`(companyName/location/ownerName 전부 optional+길이 제약, "1개 이상 변경" refine) + `updateCompanyInfo`(`POST /api/companies/info`, `COMPANY_UPDATE_INFO`, `editedAt` 자동 주입) + mutation 훅 | F1403, §참조 계약 매핑(`COMPANY_UPDATE_INFO`) | T1.1 | `model/companyInfoUpdateSchema.ts` + `api/updateCompanyInfo.ts` + mutation 훅 생성, 무변경 refine, `editedAt` 미노출, 성공 시 invalidate | 6 | 4 | ☑ |
| T3.1-b | 연락처 수정: `companyContactUpdateSchema`(presentedEmail/presentedExternalNo optional+형식 제약, "1개 이상 변경" refine) + `updateCompanyContact`(`POST /api/companies/contact`, `COMPANY_UPDATE_CONTACT`, `editedAt` 자동 주입) + mutation 훅 | F1404, §참조 계약 매핑(`COMPANY_UPDATE_CONTACT`) | T1.1 | `model/companyContactUpdateSchema.ts` + `api/updateCompanyContact.ts` + mutation 훅 생성, 무변경 refine, `editedAt` 미노출, 성공 시 invalidate(code-reviewer non-minor 2건 수정 반영: presentedEmail z.email() 재사용 통일 + presentedExternalNo 공백-only 가드 추가) | 6 | 4 | ☑ |
| T3.1-c | 홈페이지 URL 수정: `companyHomePageUpdateSchema`(homePageURL required+`http(s)://` 프리픽스+길이 제약) + `updateCompanyHomePageURL`(`POST /api/companies/home-page-url`, `COMPANY_UPDATE_HOME_PAGE_URL`, `editedAt` 자동 주입) + mutation 훅 | F1405, §참조 계약 매핑(`COMPANY_UPDATE_HOME_PAGE_URL`) | T1.1 | `model/companyHomePageUpdateSchema.ts` + `api/updateCompanyHomePageURL.ts` + mutation 훅 생성, 필수+프리픽스 인라인 검증, `editedAt` 미노출, 성공 시 invalidate | 6 | 3 | ☑ |
| T3.2 | 편집 다이얼로그 3종(기본정보/연락처/홈페이지): `CompanyInfoPage`(T1.2) 카드의 각 섹션에 ADMIN 전용 [편집] 버튼 → shadcn Dialog + RHF+zod(T3.1) 프리필(현재 조회값 초기값) → 제출 → 성공 시 다이얼로그 닫힘 + invalidate + 토스트, 실패는 `handleApiError` 위임(500 unhandled 케이스 포함 일반 토스트) | F1403·F1404·F1405, §페이지별 상세(섹션별 편집 다이얼로그), §폼 UX 결정 | T3.1, T1.2 | 3개 섹션 각각 [편집]→다이얼로그 오픈+현재값 프리필, 무변경 제출 차단(인라인 에러), 성공→카드 갱신 확인 가능, 서버 에러(400/403/500)→토스트 | 7 | 7→split | ☐ |
| T3.2-a | 기본정보 편집 다이얼로그: 카드 기본정보 섹션 [편집]→Dialog+RHF+zod(T3.1-a) 프리필→제출→성공 시 닫힘+invalidate+토스트 | F1403, §페이지별 상세(섹션별 편집 다이얼로그) | T3.1-a, T1.2 | [편집]→다이얼로그 오픈+현재값 프리필, 무변경 제출 차단, 성공→카드 갱신, 서버 에러(400/403/500)→토스트(code-reviewer non-minor 2건 수정 반영: useUpdateCompanyInfoMutation 토스트 소유권을 형제 훅과 통일 + 공백-only 가드/stale root 에러 정리. contract-conformance-reviewer 후속 지적 1건도 수정: 필드를 공백으로 "지우는" 제출은 falsy-drop으로 서버에 전달 안 되므로 무변경으로 재분류해 오탐 토스트 제거) | 5 | 4 | ☑ |
| T3.2-b | 연락처 편집 다이얼로그: 카드 연락처 섹션 [편집]→Dialog+RHF+zod(T3.1-b) 프리필→제출→성공 시 닫힘+invalidate+토스트 | F1404, §페이지별 상세(섹션별 편집 다이얼로그) | T3.1-b, T1.2 | [편집]→다이얼로그 오픈+현재값 프리필, 무변경 제출 차단, 성공→카드 갱신, 서버 에러(400/403/500)→토스트(code-reviewer 지적 1건은 "필드를 공백으로 지우면 api 계층이 falsy로 제외해 조용히 무시"하는 도메인 전반 공유 정책 — 데이터 손상 없고 필드 자체가 사실상 필수라 공백화가 정상 흐름이 아니므로 알려진 제한사항으로 수용) | 5 | 4 | ☑ |
| T3.2-c | 홈페이지 편집 다이얼로그: 카드 홈페이지 섹션 [편집]→Dialog+RHF+zod(T3.1-c) 프리필→제출→성공 시 닫힘+invalidate+토스트 | F1405, §페이지별 상세(섹션별 편집 다이얼로그) | T3.1-c, T1.2 | [편집]→다이얼로그 오픈+현재값 프리필, 무변경 제출 차단(URL 필수/프리픽스), 성공→카드 갱신, 서버 에러(400/403/500)→토스트 | 5 | 3 | ☑ |

> **M3 split 판단(복잡도·중요도)**: T3.1(복잡도8)·T3.2(복잡도7) 둘 다 임계값 도달 — 각각 **3개 기능ID/3개 API를 한 태스크로 번들**(`COMPANY_UPDATE_INFO`/`_CONTACT`/`_HOME_PAGE_URL`)한 것이 원인. ROADMAP 본문이 이미 "(1)기본정보 (2)연락처 (3)홈페이지" 순서로 열거해 둔 경계를 그대로 축으로 삼아 **T3.1→T3.1-a/b/c, T3.2→T3.2-a/b/c**로 분할했다(서로 다른 스키마·api 함수·다이얼로그 섹션이라 파일 독립 — 3종 모두 병렬 가능, 단 T3.2-a/b/c는 공통으로 `CompanyInfoPage.tsx` 한 파일을 수정하므로 병합 순서 조율 필요). 분할 후 각 서브태스크는 단일 기능ID+단일 도메인+실시간·파일 미포함이라 복잡도 3~4로 임계값 미만.
> **실행 순서**: T3.1-a(6)·T3.1-b(6)·T3.1-c(6) 상호 독립(T1.1만 의존) → 병렬 → T3.2-a(5, T3.1-a·T1.2 의존)·T3.2-b(5, T3.1-b·T1.2 의존)·T3.2-c(5, T3.1-c·T1.2 의존) 병렬(단, `CompanyInfoPage.tsx` 공유 파일이라 실제 머지는 순차 권장). 위상정렬 + 동순위 내 중요도 순(3종 모두 동률이라 PRD 열거 순서 (1)→(2)→(3) 그대로 사용 권장).

## 🔀 병렬화 가능 지점

build-domain 5단계가 아래 그룹을 병렬 실행자에게 위임 판단할 수 있다.

- **M1 내부**: T1.1(조회 api)은 단일 진입, T1.2가 소비, T1.3(배선)이 리프 — 선형.
- **M2 ↔ M3**: 둘 다 M1 페이지 골격만 소비(코드 하드 의존 없음) → M1 완료 후 **병렬 착수 가능**.
- **M3 내부(task-planner 재산정, T3.1·T3.2 각 3분할 반영)**: T3.1-a/b/c(기본정보/연락처/홈페이지 스키마+api+mutation)는 서로 다른 파일이라 **상호 독립 → 병렬 가능**. T3.2-a/b/c(대응 편집 다이얼로그 3종)도 각각 T3.1-a/b/c 완료 후 착수 가능한 별개 서브태스크이나, 셋 다 `CompanyInfoPage.tsx` 한 파일을 수정하므로 **작업 자체는 병렬로 진행하되 머지(커밋 반영)는 순차 조율** 필요.
- **병렬 웨이브 요약**:
  - **웨이브 1**: T1.1
  - **웨이브 2**: T1.2(→T1.3 M1 리프) / (M1 완료 후) T2.1 · T3.1-a · T3.1-b · T3.1-c 동시 착수
  - **웨이브 3**: T2.2(T2.1·T1.2 의존) / T3.2-a(T3.1-a·T1.2 의존) · T3.2-b(T3.1-b·T1.2 의존) · T3.2-c(T3.1-c·T1.2 의존) — 병렬(단 `CompanyInfoPage.tsx` 머지는 순차)

## ⚠️ 리스크 & 선행 결정 (Open Questions — PRD §판단·전제 요약 승계)

- **라우트 경로 명명(신규 결정)**: `/settings/company`는 가칭. react-router-developer가 T1.3 착수 시 기존 라우트 트리와 세그먼트 충돌 여부를 확인하고 확정한다.
- **[PRD 판단 #1] 메뉴 배치**: 조회는 `permitAll`이지만 진입점은 ADMIN "설정" 그룹으로 한정(§메뉴 구조). 비-ADMIN 상시 노출 위젯(홈/푸터)은 이번 로드맵 범위 밖 — 필요 시 별도 요청.
- **[PRD 판단 #2] `editedAt` 자동 주입**: 수동 입력 UI 없음. 서버가 "이전 스냅샷 이후" 규칙 위반을 500(미처리 예외)으로 응답하므로, 동시성 경합(같은 초 재제출 등)은 일반 에러 토스트로만 처리하고 재시도 유도 UX는 만들지 않는다(저빈도).
- **[PRD 판단 #3] 수정 폼 3분할**: 섹션별 다이얼로그로 확정. 단일 통합 폼으로 바꾸는 안은 채택하지 않음(3개 API 그대로 소비).
- **참조 컴포넌트 미확정**: T3.2의 "섹션별 편집 다이얼로그" 정확한 복제 대상(어느 기존 도메인의 어느 컴포넌트)은 태스크 착수 시 최근 완료 도메인에서 최적 선례를 골라 확인한다(로드맵 단계에서 특정 파일로 못박지 않음 — 발명 방지).

## 📦 백로그 (PRD 명시 제외 — 태스크화 금지)

PRD §"MVP 이후 기능" 참조로만 나열:

- **회사 정보 변경 이력 목록 조회 UI** — 백엔드에 이력 목록 API 없음(현재 값만 반환하는 `COMPANY_INFO` 하나).
- **다중 회사/테넌트 전환** — 단일 회사 체제 고정.
- **회사 로고/이미지 업로드** — 도메인 모델에 파일 필드 없음.
- **비-ADMIN 사원용 상시 회사 정보 노출**(홈 위젯/푸터 "회사 소개" 링크 등) — 별도 후속 범위.
- 테마/다크모드·다국어(i18n)·프로필 커스터마이징.

## ✅ 정합성 검증 체크리스트 (실행 결과)

- 🔍 **커버리지**: F1401(T1.1/T1.2/T1.3)·F1402(T2.1/T2.2)·F1403+F1404+F1405(T3.1/T3.2) — PRD MVP 핵심 기능 5개 전부 ≥1 태스크 매핑 ✅
- 🔍 **역참조**: 모든 태스크가 PRD F1401~F1405/§페이지별 상세/§참조 계약 매핑/§메뉴 구조/§폼 UX 결정에 근거 — 발명 태스크 없음 ✅
- 🔍 **의존성**: M1(T1.1→T1.2→T1.3) 선형, M2·M3은 M1만 의존하고 상호 독립(병렬), M3 내부 T3.1-a/b/c 3종 병렬 → 대응 T3.2-a/b/c 3종 병렬(task-planner 재산정, 복잡도 임계값 도달로 분할) → 위상 정렬 성립, 순환 없음 ✅
- 🔍 **여정 정합**: 태스크 순서가 PRD 사용자 여정(진입→조회→(미등록)등록→(등록됨)섹션별 수정)과 일치. 로컬 DB 미등록 상태를 반영해 M1이 M2/M3보다 먼저 골격을 세움 ✅
- 🔍 **범위**: PRD 제외 기능(이력 목록·다중 회사·로고 업로드·상시 노출 위젯·테마/i18n)은 백로그로만, 태스크화 없음 ✅
- 🔍 **규약**: 계약/전역 규칙(에러코드 매핑·페이징 없음·`withCredentials`·날짜 dayjs) 재서술 없음, 필드/DTO 설계 없음(PRD §참조 계약 매핑으로 위임), 인프라/견적 강제 없음, Major 정정(400 vs 409) 로드맵에 반영 ✅

**결과: 6개 항목 전부 통과. M1(조회+배선) → M2(최초 등록)·M3(3분할 수정) 병렬 착수 가능 구조로 설계 완료. Open Questions는 태스크 착수 시점에 비차단으로 해소.**
