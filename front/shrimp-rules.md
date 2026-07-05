# HARUON Frontend — AI Agent 실행 규칙

> 이 문서는 AI 코딩 에이전트(Claude Code) 전용 운영 규칙이다. 일반 개발 지식은 포함하지 않는다.
> 프로젝트 개요·기술 스택·계약 문서 인덱스는 `.claude/CLAUDE.md`가 원천이므로 여기서 반복하지 않는다.

## 1. 현재 상태 (필수 인지)

- `front/`는 아직 React 소스 코드가 없다. `package.json`엔 `shadcn` devDependency 하나뿐이고 `src/`가 존재하지 않는다.
- 실행 계획의 사실 원천은 `docs/prd/ROADMAP.md`다(PRD: `docs/prd/auth-walking-skeleton-prd.md`). **모든 구현 작업은 이 ROADMAP의 태스크(T0.1~T3.1)에 대응해야 한다.**
- ROADMAP에 없는 화면·기능·파일을 임의로 만들지 않는다. 필요해 보이면 ROADMAP·PRD를 다시 읽고, 그래도 근거가 없으면 사용자에게 질문한다.

## 2. 실행 순서 (위반 금지)

- 마일스톤 순서 **M0(배관) → M1(인증) → M2(EMP 조회) → M3(mutation)**를 반드시 지킨다. 뒤 마일스톤 코드를 먼저 만들지 않는다.
- 각 태스크(T0.1…T3.1) 착수 전 `docs/prd/ROADMAP.md`에서 해당 태스크 행의 **Depends-on**을 확인하고, 선행 태스크가 완료되지 않았으면 먼저 처리한다.
- M0 안에서 **T0.1·T0.3·T0.6**은 상호 독립이므로 병렬 착수 가능. M1 안에서 **T1.5(회원가입)**는 T1.2~T1.4와 독립 병렬 가능. 그 외 태스크는 표시된 순서를 따른다.
- 태스크 구현 완료 시, 반드시 ROADMAP 해당 행의 **Done 조건** 문장과 실제 동작을 대조한다(예: T0.1은 "401·`ROLE_002`→reissue→원요청 재시도 경로 및 재귀 금지가 동작"이 실제로 되는지 확인).

## 3. 폴더/아키텍처 배관 (T0.6 고정 트리)

- 폴더 구조는 ROADMAP T0.6이 지정한 트리를 그대로 따른다: `app/`, `features/{auth,employee}/{api,components,pages,model}`, `shared/{api,lib,components,ui}`.
- 임의로 다른 최상위 디렉터리(`components/`, `utils/`, `pages/` 단독 등)를 루트에 만들지 않는다.
- 새 도메인(예: attendance)이 추가되면 `features/attendance/{api,components,pages,model}` 형태로 동일 패턴을 복제한다. 다른 패턴을 발명하지 않는다.

## 4. 계약 조회 규칙 (추측 금지)

- 엔드포인트 존재 여부는 `docs/backend-contract/api-endpoint.md`의 기능ID로만 확인한다. "경로별 접근 매핑" 표를 기능 존재 근거로 쓰지 않는다.
- 요청/응답 필드 상세가 필요하면 `../back/build/generated-snippets/<기능ID>/`의 스니펫(`response-body.adoc` 등)을 직접 읽는다. 필드명·타입·제약을 추측하지 않는다.
- zod 스키마를 작성할 때(`REGISTER`의 `empNo`/`loginId`/`password` 규칙, `UPDATE_SELF_INFO`의 `extensionNo` `NNN-NNNN` 등) 반드시 해당 기능ID의 스니펫을 실측 근거로 삼는다.
- 전역 규칙(reissue 로직, dayjs 날짜 포맷, 페이징 +1, `ApiError` 구조, `withCredentials`, 에러코드→UI 매핑)은 `docs/backend-contract/*` 및 CLAUDE.md 7번 항목이 원천이다. 이 규칙들을 **재설계하거나 다르게 구현하지 않는다** — 문서에 정의된 사양 그대로 코드로 옮긴다.
- 재발급(reissue) 트리거는 `401 && code === 'ROLE_002'`로만 한정한다. 다른 401(`AUTH_001` 등)에서 reissue를 트리거하지 않는다.

## 5. 이번 스코프에서 금지되는 구현

- ROADMAP `📦 백로그` 섹션에 명시된 항목(사원 수정 HR/부서매니저, 퇴직/정직/활성화, 검색·필터, 페이징 UI, 파일 업로드, 테마/i18n, auth 외 전 도메인)은 절대 구현하지 않는다.
- `F004`(EMP create)와 `F013`(auth 회원가입)은 **동일 기능ID `REGISTER`**를 가리키는 하나의 흐름이다. T1.5 하나로만 구현하고 별도 화면·훅으로 중복 구현하지 않는다.
- `activeFiles` 필드는 응답에 존재하지만 이번 스코프는 파일 업로드/미리보기 UI를 만들지 않는다(렌더링 최소화만).

## 6. Open Questions — 임의 결정 금지

ROADMAP `⚠️ 리스크 & 선행 결정` 섹션의 아래 항목은 착수 전/중 임의로 값을 정하지 말고, 스니펫 실측 또는 사용자 확인을 거친다:

- `QueryClient`의 `staleTime`/`retry` 구체값(T0.3)
- 회원가입/내 정보 수정 zod 필드 제약 상세(T1.1, T1.5, T3.1) — `generated-snippets/<기능ID>/` 실측 필수
- 레이아웃 셸 디자인 세부(T0.7, T1.6) — 스크린샷 없음, 텍스트 스펙 기준
- 부서 멤버 목록 진입 시 `deptId` 출처(본인 부서 자동 vs 고정)(T2.1) — 사용자 확인 필요

## 7. 완료 게이트

- 각 마일스톤(M0~M3) 종료 시 `npm run check-all`과 `npm run build`를 모두 통과해야 다음 마일스톤으로 진행한다.

## 8. 언어·네이밍 (CLAUDE.md 재확인)

- 커밋 메시지, 코드 주석(WHY 설명), 에러 메시지는 한국어. 식별자(변수·함수·컴포넌트명)는 영문 `camelCase`/`PascalCase`.
- 들여쓰기 2칸.
