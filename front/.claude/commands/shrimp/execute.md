---
description: 'shrimp task manager - task execute'
argument-hint: [task-name-or-id] [code-review: true|false, 기본 true] [ux-review: true|false, 기본 true]
---

## 실행 규칙
- `$1`(대상 task)이 특정되지 않았으면, 실행하지 말고
  어떤 task를 진행할지 사용자에게 되묻는다.
- `$1`이 특정되었으면, Shrimp Task Manager의 execute_task 도구로 해당 task를 실행한다.
- `$2`가 false면 실행 후 위임 없이 작업을 종료한다.
- `$2`가 true이거나 미지정이면 아래 `task execute 후 위임` 문단을 참고하여 실행한다.

# 실행은 아래와 같이 단계별로 시행한다.

# 1. `@task-executor` 위임 

`@task-executor` agent가 Shrimp Task Manager의 task를 실행한다.
- `$1` = 대상 task (task-name-or-id)
- `$2` = code-review 플래그 (true/false, 미지정 시 true)

## 2. `@code-reviewer` 위임 (`$2` = true 시 에만)
- 실행이 끝나면 이번 task에서 **변경된 파일 범위**를 명시하여
  `@code-reviewer` agent에게 리뷰를 위임한다. (전체 코드베이스 리뷰 금지)
- code-reviewer가 non-minor 이슈(`//todo` 삽입)를 보고하면,
  커밋하지 말고 그 내용을 사용자에게 요약 보고한 뒤 판단을 기다린다.
- 지적이 없으면(리뷰 통과) task 완료로 처리한다.
- 커밋은 사용자 확인 또는 별도 커밋 명령으로 진행하며, 이 명령이 자동 커밋하지 않는다.

## 3. UX 검토 (`$3` = true 시 에만 )
- 전제: dev 서버(localhost:5173, 필요 시 백엔드 localhost:8080)가 실행 중이어야 한다. 실행 중이 아니면 UX 검토를 건너뛰고 그 사실을 보고한다.
- `Playwright MCP`로 이번 task가 건드린 화면/플로우를 동적 검토한다. 
  - 확인 축:
    - 화면이 정상 렌더되는가 (깨진 화면·빈 화면 감지)
    - 주요 사용자 플로우가 동작하는가 (진입 → 조작 → 결과)
    - 브라우저 콘솔 에러가 없는가
- 문제 발견 시 커밋하지 말고 사용자에게 보고한다. "미적 개선 제안"이 아니라
  "작동 여부"를 본다.