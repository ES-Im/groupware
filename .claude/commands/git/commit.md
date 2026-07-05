아래처럼 정리하면 네 스타일이 더 명확해져.  
핵심은 **이모지 + 컨벤셔널 커밋 + 한국어 명령형 + 원자적 커밋 + Claude 서명 없음**으로 고정했어.

```md
---
description: '이모지와 컨벤셔널 커밋 메시지로 원자적인 커밋을 생성합니다'
allowed-tools:
  [
    'Bash(git add:*)',
    'Bash(git status:*)',
    'Bash(git commit:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
  ]
---

# Commit

이모지와 컨벤셔널 커밋 형식을 사용해 깔끔한 커밋을 생성합니다.

## 사용법

```bash
/commit
```

## 커밋 규칙

- 명령형 어조 ("추가" not "추가됨")
- 첫 줄 72자 미만
- 원자적 커밋 (단일 목적)
- 관련 없는 변경사항 분할

## 프로세스

1. `git status`로 변경사항과 스테이지 상태를 확인합니다.
2. 스테이지된 파일이 있으면 해당 파일의 diff만 분석합니다.
3. 스테이지된 파일이 없으면 전체 변경사항의 diff를 분석합니다.
4. 변경사항이 여러 목적을 포함하면 분할 커밋을 제안합니다.
5. 단일 목적의 변경사항만 스테이징합니다.
6. 이모지 컨벤셔널 커밋 형식으로 커밋합니다.

## 커밋 메시지 형식

```txt
<이모지> <타입>: <설명>

(optional 필요시, 아래 사항을 추가합니다)
1. 변경사항 1
2. 변경사항 2
```

### 예시

```txt
✨ feat: 사용자 초대 기능 추가
🐛 fix: 결재 상태 변경 오류 수정
♻️ refactor: 알림 서비스 책임 분리
✅ test: 근태 정책 테스트 추가
📝 docs: API 인증 문서 보완
```

## 타입 기준

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷팅, 코드 의미 변화 없는 스타일 수정
- `refactor`: 동작 변경 없는 구조 개선
- `perf`: 성능 개선
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드, 설정, 도구, 기타 관리 작업
- `ci`: CI/CD 설정 변경

## 이모지 맵

```
 ✨ `feat`: 기능 추가
 🐛 `fix`: 버그 수정
 🩹 `fix`: 사소한 수정
 🚑️ `hotfix`: 긴급 수정
 📝 `docs`: 문서
 💄 `style`: 스타일, 포맷팅
 ♻️ `refactor`: 리팩토링
 ⚡ `perf`: 성능 개선
 ✅ `test`: 테스트
 🔧 `chore`: 설정, 도구 작업
 🚀 `ci`: 배포
 💚 `ci`: CI 수정
 👷 `ci`: CI 빌드
 🔒️ `security`: 보안
 🚚 `move`: 파일 이동
 🏗️ `architecture`: 구조 변경
 ➕ `add-dep`: 의존성 추가
 ➖ `remove-dep`: 의존성 제거
 🌱 `seed`: 시드 데이터
 🧑‍💻 `dx`: 개발자 경험
 🏷️ `types`: 타입
 👔 `business`: 비즈니스 로직
 🚸 `ux`: 사용자 경험 개선
 🥅 `errors`: 에러 처리
 🔥 `remove`: 코드 또는 파일 제거
 🎨 `structure`: 코드 구조 정리
 🎉 `init`: 초기 설정
 🔖 `release`: 릴리즈
 🚧 `wip`: 작업 중
 📌 `pin-deps`: 의존성 버전 고정
 📈 `analytics`: 분석, 로깅 지표
 ✏️ `typos`: 오타 수정
 ⏪️ `revert`: 되돌리기
 📄 `license`: 라이선스
 💥 `breaking`: 호환성 깨지는 변경
 🍱 `assets`: 에셋
 ♿️ `accessibility`: 접근성
 💡 `comments`: 주석
 🗃️ `db`: 데이터베이스
 🔊 `logs`: 로그 추가
 🔇 `remove-logs`: 로그 제거
 🙈 `gitignore`: gitignore 변경
 📸 `snapshots`: 스냅샷
 ⚗️ `experiment`: 실험
 🚩 `flags`: feature flag
 💫 `animations`: 애니메이션
 ⚰️ `dead-code`: 죽은 코드 제거
 🦺 `validation`: 검증 로직
 ✈️ `offline`: 오프라인 지원
```

## 분할 기준

- 다른 관심사 | 혼합된 타입 | 파일 패턴 | 큰 변경사항

## 메시지 작성 규칙

좋은 예:

```txt
✨ feat: 휴가 신청 승인 기능 추가
🐛 fix: 중복 알림 발송 문제 수정
♻️ refactor: 사용자 권한 검증 로직 분리
```

나쁜 예:

```txt
fix bug
수정함
업데이트
✨ feat: 기능 추가함
```

## 금지사항

- 스테이지된 파일이 있으면 해당 파일만 커밋
  - 스테이지된 파일이 없으면 변경사항을 분석한 뒤 필요한 파일을 스테이징
- 분할 제안을 위한 diff 분석
- **커밋에 Claude 서명 절대 추가하지 않음**

