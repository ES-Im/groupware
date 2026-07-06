---
description: '지정한 ROADMAP 태스크를 task-planner 서브에이전트로 계획한다'
argument-hint: [task-id  예: T1.4]
allowed-tools: Task
---

`roadmap-task-planner` 서브에이전트에게 `$1` 태스크의 계획을 위임한다.

- 대상: $1  (비어 있으면 서브에이전트가 어떤 태스크를 계획할지 되묻는다)
- 서브에이전트가 Shrimp 내부 태스크 생성 + `docs/ROADMAP.md` 테이블 반영까지 수행하고
  요약을 반환하면, 그 요약만 사용자에게 전달한다.
- 실행(execute)은 이 흐름에서 하지 않는다. 계획 완료 후 사용자에게
  `/shrimp:execute <task-id>` 또는 `task-executor` 에이전트로 실행하라고 안내한다.