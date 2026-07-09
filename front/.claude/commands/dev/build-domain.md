---
description: '한 도메인의 PRD 생성 → 검증 → 로드맵 구성 → 태스크 분할 → 병렬 실행 → 테스트 → 규약/ UI 리뷰까지 오케스트레이션한다'
argument-hint: [domain 예: 근태] [roadmap-file 기본 docs/ROADMAP2.md] [auto: true|false 기본 false]
allowed-tools: Task, SlashCommand, Read, Write, Edit
---

## 개요
이 명령은 한 도메인(`$1`)에 대한 개발 준비~착수 전 과정을 **지휘(orchestration)만** 한다.
각 전문 작업은 기존 에이전트/커맨드에 위임하고, 이 명령은 결과 요약을 취합해 다음 단계로 넘긴다.
새 에이전트를 만들지 않고, 이미 있는 에이전트/커맨드를 재사용하는 것이 이 명령의 목적이다.

## 인자
- `$1` **domain**: 대상 도메인 (예: 근태). 비어 있으면 **실행하지 말고** 어떤 도메인을 진행할지 사용자에게 되묻는다.
- `$2` **roadmap-file**: 로드맵 출력 파일. 미지정 시 `docs/ROADMAP2.md`.
  기존 `docs/ROADMAP.md`는 크므로 **절대 덮어쓰지 않는다.**
- `$3` **auto**: `false`(기본)면 아래 [체크포인트]마다 사용자 승인을 기다린다.
  `true`면 체크포인트를 건너뛰고 연속 진행한다. 단, 아래 "공통 규칙"의 커밋/도메인 이탈 확인은 auto와 무관하게 항상 지킨다.

## 공통 규칙 (주의사항)
- **커밋 금지**: 이 명령은 어떤 경우에도 자동 커밋하지 않는다. 커밋은 사용자 확인 또는 별도 커밋 명령으로만 진행한다.
- **도메인 이탈 확인**: `$1` 도메인을 벗어나는 로직 변경이 필요하면, 진행 전 반드시 사용자에게 묻는다.
- **복잡 단계는 절차적 사고**: 판단이 복잡한 단계(로드맵 설계, 병렬성 판정, 규약 충돌 등)는 `sequential-thinking` MCP로 단계적으로 사고한 뒤 진행한다.
- **위임 원칙**: 각 하위 작업은 지정된 에이전트/커맨드에 위임하고, 이 명령은 요약만 받아 취합한다. 전체 코드베이스 통째 처리 금지 — 항상 변경 범위를 명시한다.

---

# 실행 단계

## 0. 사전 확인
- `$1`이 비어 있으면 되묻고 중단한다.
- 현재 상태를 간단히 파악한다: 기존 PRD 목록, `$1` 관련 백엔드 계약/공통 규약, 기존 `docs/ROADMAP.md` 구조.

## 1. PRD 생성 — `@groupware-frontend-prd-generator`
- `$1` 도메인에 대한 PRD 생성을 `@groupware-frontend-prd-generator` 에이전트에 위임한다.

## 2. PRD 검증 — `@groupware-prd-validator`
- 생성된 PRD를 `@groupware-prd-validator` 에이전트에 위임해 검토한다.
- non-minor 이슈가 보고되면 그 내용을 사용자에게 요약 보고한다.
- **[체크포인트]** `$3`=false면 PRD 확정 여부에 대한 사용자 승인을 기다린다.

## 3. 로드맵 구성 — development-planner 규칙
- `.claude/agents/docs/development-planner.md`를 Read 하여 그 규칙/포맷에 따라 로드맵을 구성한다.
- 결과를 `$2`(기본 `docs/ROADMAP2.md`) **새 파일**로 작성한다. 기존 `docs/ROADMAP.md`는 건드리지 않는다.
- 각 태스크에 안정적인 ID(예: T1.1, T1.2 …)와 **의존 관계**를 명시한다(병렬성 판정을 위해 필수).
- **[체크포인트]** `$3`=false면 로드맵 범위/우선순위에 대한 사용자 승인을 기다린다.

## 4. 태스크 분할(계획) — `/shrimp:thought_split`
- `$2` 로드맵의 각 태스크에 대해 `SlashCommand`로 `/shrimp:thought_split <task-id>`를 호출해 계획을 세운다.
  (이 커맨드는 `roadmap-task-planner`가 Shrimp 태스크 생성 + 로드맵 반영까지 수행한다.)
- 계획 결과의 의존 관계를 바탕으로 **병렬 실행 그룹**과 **순차 실행 순서**를 확정한다.
- 계획 단계에서는 실행하지 않는다.

## 5. 실행 — `/shrimp:execute` (병렬 우선)
- 서로 **의존성이 없는** 태스크들은 같은 턴에 `/shrimp:execute <task-id> true true $2`를 **동시에** 위임해 병렬 처리한다.
  (네 번째 인자로 `$2`(로드맵 파일)를 넘겨 완료 표기 대상을 `ROADMAP2.md`로 맞춘다.)
  (`/shrimp:execute`는 내부적으로 `task-executor` 실행 → `code-reviewer` 변경 범위 리뷰 → Playwright UX 검토 → `$2` 로드맵 완료 표기를 수행한다.)
- 의존성이 있는 태스크는 선행 태스크 완료 후 순서대로 실행한다.
- `code-reviewer`가 non-minor 이슈(`//todo`)를 보고하면, 커밋하지 말고 사용자에게 요약 보고 후 판단을 기다린다.

## 6. 테스트 — `@test-author-runner`
- 각 태스크별로 **이번 태스크가 변경한 파일 범위를 명시**하여 `@test-author-runner`에게 테스트 작성/실행을 위임한다.

## 7. 규약 검토(필요 시) — `@contract-conformance-reviewer`
- 백엔드 계약/공통 규약에 영향이 있는 태스크에 한해 `@contract-conformance-reviewer`에게 규약 준수를 검토시킨다.
- 위반 보고 시 커밋하지 말고 사용자에게 요약 보고한다.

## 8. UI/UX 구성 — `@ux-ui-stylist`
- UI/UX 구성·개선이 필요한 태스크는 `@ux-ui-stylist` 에이전트에 위임한다.

## 9. 마무리 보고
- 완료 표기는 5단계에서 `/shrimp:execute`가 `$2` 로드맵 파일에 대해 수행하므로, 이 단계에서는 누락된 항목만 점검해 보완한다.
- 최종 요약을 보고한다: 완료 태스크 목록, 미해결 이슈(`//todo`·규약 위반·UX 문제), 커밋 대기 항목.
- **커밋은 하지 않는다.** 사용자에게 다음 액션(커밋 여부 등)을 안내하고 종료한다.
