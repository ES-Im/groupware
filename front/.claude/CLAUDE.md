## 현재 진행 목표

- backend : 완료, server에서 통신하는 endpoint 정리 완료
- front : UBold admin 템플릿 기반 React 19 SPA (Vite, Bootstrap 5)
  - REST API 기반 필수 컴포넌트만 선별 (Mock 데이터로 화면 구성)
  - 네비게이션 정리 (192개 API 엔드포인트 → 메뉴 체계화)
  - API 메서드 레이어 준비 (향후 실제 API 호출 시 바로 연동 가능)

### 현재 상태 (실제 디렉토리 기준)

- 프로젝트 구조
```
groupware/front/
├─ src/
│  ├─ routes/           (현재 index.jsx 단일 — 도메인 라우트로 교체 필요)
│  ├─ views/            (UBold 더미 다수 포함 — REST API 관련만 선별 유지)
│  ├─ components/       (공통 컴포넌트 — 정리 필요)
│  ├─ layouts/          (Base/Main/Horizontal/Vertical 존재 — MainLayout 중심으로 정리)
│  ├─ services/         (신규 생성 — API 호출 레이어, 아직 없음)
│  ├─ types/            (이미 존재, JS 모듈. 도메인 모델 정의는 여기 .js로)
│  └─ hooks/            (use* 커스텀 훅 — 최소화)
├─ package.json         (미사용 라이브러리 정리)
└─ vite.config.js / eslint.config.js
```

- API 호출 레이어 구조 (services/, 신규 생성)
  - `src/services/` 하위에 도메인별 모듈로 분리한다 (예: `employee`, `draft`, `chat`, `meeting`, `franchise` …).
  - 공통 HTTP 클라이언트(Authorization Bearer 토큰 주입, 401 시 `/reissue` 처리 등)를 두고 각 도메인 모듈이 이를 사용한다.
  - 엔드포인트/메서드/권한은 `rules/api-endpoint.md`를 단일 출처로 삼는다.
  - (참고: 기존 `src/api/http.js`는 제거됨 — `services/`로 재구성)

- UBOLD 템플릿의 현재 문제점 (views/apps 기준 미사용 도메인 잔존)
  - 192개 API와 무관한 더미 페이지 다수 (crm, email, invoice, social-feed, ecommerce, charts 등)
  - 불필요한 npm 패키지 포함
  - 라우트 구조가 마케팅/템플릿 중심

#### 필요한 컴포넌트 선별 기준

```
필수:
  ├─ MainLayout (Sidebar + Header + Content)
  ├─ Sidebar (REST API 메뉴)
  ├─ Header (로그인 정보, 알림)
  ├─ Breadcrumb
  └─ Modal/Alert (공통)

페이지:
  ├─ Authentication (Login, Logout)
  ├─ Dashboard (메인 대시보드)
  ├─ Employee (사원 정보)
  ├─ Attendance (근태)
  ├─ Document (기안서 목록/상세)
  ├─ Schedule (일정)
  ├─ Meeting (회의)
  ├─ Board (게시판)
  ├─ Message (쪽지)
  ├─ Chat (채팅)
  ├─ Department (부서)
  └─ Admin (가맹점) [선택]

Form:
  ├─ 기안서 작성 (LEAVE, BUSINESS_TRIP, GENERAL)
  ├─ 사원 정보 수정
  ├─ 회의 예약
  └─ 게시글 작성
```

