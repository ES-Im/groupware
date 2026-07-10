# COMPANY(회사 정보) 도메인 — PRD 생성용 입력 스코프

> 이 문서는 `/dev:build-domain COMPANY ROADMAP_COMPANY.md` 실행을 위한 **입력 스코프 정의**다. 개발 로드맵(태스크·의존성)은 이 문서가 아니라 이후 development-planner 단계에서 `docs/ROADMAP2.md`로 새로 만들어진다. 여기서는 "무엇을 만들지"의 범위와 계약 출처만 고정한다.

## 배경 / 발견 사항

- `docs/backend-contract/api-endpoint.md`에 COMPANY API 섹션이 누락되어 있었다 → 이번에 백엔드 컨트롤러 소스(`back/src/main/java/.../adapter/webapi/company/`)와 REST Docs 스니펫(`back/build/generated-snippets/COMPANY_*`)을 직접 대조해 인덱스에 보강했다(아래 "계약 출처" 참조).
- `COMPANY_INFO`(조회 GET)는 REST Docs 스니펫이 존재하지 않는다(`CompanyQueryApiDocsTest`에 `@Test` 없음). 필드는 `CompanyInfoResponse.java` + `CompanyQueryApiTest.java`(jsonPath)로 소스 대조 확정했다.
- 로컬 개발 DB(`localhost:8080`)에서 `GET /api/companies`가 **404**를 반환한다 — 즉 아직 회사 정보가 **한 번도 등록되지 않은 상태**다. 따라서 이 도메인은 "조회/수정"뿐 아니라 ADMIN의 **최초 등록** 플로우도 실사용 경로로 다뤄야 한다(등록 없이는 조회 화면 자체를 검증할 수 없다).

## 도메인 모델 요지 (`docs/도메인모델.md` §회사 정보 관련)

- 단일 회사 체제. `company`는 **이력성(스냅샷) 테이블** — 수정 시 기존 행을 고치지 않고 새 스냅샷을 추가한다. 현재 값은 `edited_at desc, id desc` 최신 스냅샷.
- 최초 등록은 한 번만 가능(이미 존재하면 재등록 불가 → `CompanyAlreadyExistsException`, 409).
- 등록/수정 전부 `ADMIN` 권한 전용(application 계층에서 제한, `SecurityConfig`에서도 `POST /api/companies/**` = ADMIN).
- 필수 필드: 회사명·위치·대표 이메일·대표 외부 연락처·대표자명·홈페이지 URL·`editedAt`. 문자열은 공백만으로 저장 불가, 이메일은 이메일 형식, 홈페이지 URL은 `http(s)://` 시작.
- 변경 API는 3개로 분리되어 있다: 기본정보(회사명/위치/대표자명) / 대표 연락처(이메일/외부번호) / 홈페이지 URL. 각각 부분 수정(optional 필드) + `editedAt` 필수.

## 계약 출처 (기능ID)

인덱스: `docs/backend-contract/api-endpoint.md` "COMPANY API" 섹션(이번에 보강) 참조.

| 기능ID | Method / Endpoint | 권한 | 비고 |
|---|---|---|---|
| `COMPANY_INFO` | `GET /api/companies` | 공개(인증 불요) | 스니펫 없음 — DTO/테스트 소스 대조. 응답: `companyId, companyName, location, presentedEmail, presentedExternalNo, ownerName, homePageURL, editedAt`. 미등록 시 404(`CompanyNotFoundException`, `*_NOT_FOUND_*` 계열) |
| `COMPANY_REGISTER` | `POST /api/companies/new` | ADMIN | 최초 1회. 이미 존재하면 409. 스니펫: `back/build/generated-snippets/COMPANY_REGISTER/` |
| `COMPANY_UPDATE_INFO` | `POST /api/companies/info` | ADMIN | 회사명/위치/대표자명(전부 optional 부분 수정) + `editedAt` 필수. 스니펫: `.../COMPANY_UPDATE_INFO/` |
| `COMPANY_UPDATE_CONTACT` | `POST /api/companies/contact` | ADMIN | 대표 이메일/외부번호(optional) + `editedAt` 필수. 스니펫: `.../COMPANY_UPDATE_CONTACT/` |
| `COMPANY_UPDATE_HOME_PAGE_URL` | `POST /api/companies/home-page-url` | ADMIN | 홈페이지 URL(필수) + `editedAt` 필수. 스니펫: `.../COMPANY_UPDATE_HOME_PAGE_URL/` |

필드 상세(제약조건·타입)는 위 스니펫 경로와 `CompanyRegisterRequest.java`/`CompanyInfoUpdateRequest.java`/`CompanyContactUpdateRequest.java`/`CompanyHomePageUpdateRequest.java`(request DTO)를 원천으로 한다 — 이 문서에서 필드를 재서술하지 않는다.

## 스코프 제안 (PRD 생성 시 반영, 확정은 PRD 검증 체크포인트에서)

- **회사 정보 조회 화면**: 전 사원(EMPLOYEE 이상) 열람 가능한 읽기 전용 뷰. 단일 엔티티라 목록/페이징 없음.
- **ADMIN 등록/수정 UX**: 같은 화면 내에서 ADMIN에게만 편집 진입점 노출 권장(휴가 관리 그룹처럼 별도 라우트를 분리할지, 한 페이지에서 역할별 조건부 렌더링으로 처리할지는 PRD가 결정). 미등록 상태(404)일 때 ADMIN에게는 "최초 등록" 폼/CTA, 비-ADMIN에게는 안내 문구.
- 수정은 3개 API(기본정보/연락처/홈페이지)로 분리되어 있으므로, 폼도 섹션별로 나누거나 단일 폼에서 변경된 섹션만 해당 API로 전송하는 방식 등 UX는 PRD가 정한다(임의 4번째 통합 API 발명 금지).
- 사이드바 메뉴: 현재 ADMIN 전용 "설정류" 그룹이 없다(`sidebarMenuItems.ts` 확인 완료 — 가장 가까운 선례는 "인사관리"(HR)·"가맹점"(FRANCHISE) 그룹). 신규 그룹(예: "회사 설정" 또는 "설정") 신설이 필요하다 — 정확한 라벨/그룹핑은 PRD가 결정.

## 범위 밖(이번 도메인에서 다루지 않음)

- 다중 회사/테넌트 개념 없음(단일 회사 체제 고정).
- 스냅샷 이력 목록 조회 UI(예: "회사 정보 변경 이력 보기")는 백엔드에 해당 조회 API가 없으므로 범위 밖(현재 값만 노출하는 `COMPANY_INFO` 하나뿐).
- 파일/로고 업로드 없음(도메인 모델에 관련 필드 없음).
