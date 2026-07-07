# 게시판 카운트 정책 (Frontend Guide)

## 1. 목적

게시판의 `좋아요 수`, `조회수`, `댓글 수`는 즉시성 때문에 DB만 바로 읽지 않고,

- `DB`에는 기준값(base count)을 저장하고
- `Redis`에는 마지막 DB 반영 이후 발생한 증감값(delta)을 저장한 뒤
- 조회 API 응답 시 `DB 값 + Redis delta`를 합쳐서 내려주는 방식으로 처리합니다.

프론트에서는 이 문서를 기준으로 "어떤 API가 카운트를 올리는지", "어떤 응답값을 신뢰해야 하는지", "중복 요청을 왜 조심해야 하는지"를 이해하면 됩니다.

## 2. 핵심 요약

- 카운트의 최종 표시값은 `DB 값 + Redis delta` 입니다.
- 프론트가 화면에 보여줄 카운트의 기준값은 `목록 API` 또는 `상세 API` 응답입니다.
- `좋아요/댓글` 변경 API는 카운트 값을 응답 바디로 내려주지 않고 상태코드만 반환합니다.
- `조회수`는 `GET /api/boards/{boardId}` 호출 1회당 1 증가합니다.
- 같은 사용자가 다시 들어와도, 같은 브라우저에서 새로고침해도, 상세 조회 API를 다시 호출하면 조회수는 다시 증가합니다.
- 댓글 수는 `대댓글`도 포함합니다.
- 삭제된 댓글은 댓글 목록에 `isDeleted=true`로 남아 있을 수 있지만, `commentCount`에는 포함되지 않습니다.
- ⚠️ 좋아요 토글(`POST/DELETE /api/boards/{boardId}/likes`)은 백엔드 소스에 구현되어 있으나 `api-endpoint.md`/`generated-snippets`에 문서화되지 않았다 — 정식 계약으로 확정 전까지 프론트는 이 엔드포인트를 소비하지 않는다(§5.2 참조).

## 3. Redis 저장 정책

### 3.1 저장 구조

게시글별 카운트 delta는 Redis에 아래처럼 저장합니다.

- Hash Key: `board:reaction:delta:{boardId}`
- Set Key: `board:reaction:dirty`

Hash 필드:

- `viewCount`
- `likeCount`
- `commentCount`

예시:

```text
board:reaction:delta:15
  - viewCount: 3
  - likeCount: 1
  - commentCount: -1

board:reaction:dirty
  - 15
```

의미:

- `board:reaction:delta:15`는 15번 게시글에 대해 아직 DB에 반영되지 않은 증감값입니다.
- `board:reaction:dirty`는 나중에 배치가 DB 반영할 대상 게시글 ID 목록입니다.

### 3.2 저장 방식

카운트가 바뀌면 백엔드는 Redis에 아래 작업을 원자적으로 수행합니다.

1. `HINCRBY`로 해당 게시글 delta 값을 증가/감소
2. `SADD`로 dirty set에 게시글 ID 추가

즉, 카운트 변경이 생기면 "증감값 기록"과 "배치 반영 대상 등록"이 같이 처리됩니다.

## 4. 조회 정책

### 4.1 목록 조회

대상 API:

- `GET /api/categories/{categoryId}/boards`

동작:

1. DB에서 게시글 목록과 기본 카운트 조회
2. 목록에 포함된 `boardId`들의 Redis delta 조회
3. 응답 직전에 `base count + delta`로 합산

따라서 프론트가 목록에서 받는 `viewCount`, `likeCount`, `commentCount`는 배치 반영 전이라도 최신값에 가깝습니다.

### 4.2 상세 조회

대상 API:

- `GET /api/boards/{boardId}`

동작:

1. DB에서 게시글 상세 조회
2. 해당 게시글 `viewCount` delta를 Redis에서 `+1`
3. Redis delta를 다시 읽어서 응답에 반영

중요:

- 상세 조회 응답의 `viewCount`에는 현재 요청으로 증가한 `+1`이 포함됩니다.
- 프론트가 상세 화면 진입 후 별도로 조회수 `+1`을 로컬에서 다시 더하면 중복 반영이 됩니다.

## 5. 카운트별 정책

| 항목 | 증가/감소 시점 | 포함 규칙 | 프론트 주의점 |
| --- | --- | --- | --- |
| 조회수 | `GET /api/boards/{boardId}` 호출 시 `+1` | 상세 조회 호출 수 기준 | 자동 재호출, prefetch, 중복 mount 주의 |
| 좋아요 수 | `POST /api/boards/{boardId}/likes` 시 `+1`, `DELETE /api/boards/{boardId}/likes` 시 `-1` | 게시글 좋아요 수 | 응답 바디에 count 없음 |
| 댓글 수 | 댓글 등록 `+1`, 대댓글 등록 `+1`, 댓글 삭제 `-1` | 댓글 + 대댓글 포함, 삭제 댓글 제외 | 목록의 `commentCount`와 댓글 목록 row 수가 다를 수 있음 |

### 5.1 조회수

정책:

- 게시글 상세 조회 API를 호출할 때마다 조회수는 증가합니다.
- 사용자 중복 여부, 세션, IP, 쿠키 기반 중복 방지 로직은 현재 없습니다.

프론트 구현 시 주의:

- 상세 화면 진입 시 동일 API를 여러 번 호출하지 않도록 합니다.
- 아래 상황은 조회수 중복 증가 원인이 될 수 있습니다.
  - mount 후 재호출
  - 동일 화면 내 중복 fetch
  - visibility/focus 기반 자동 refetch
  - prefetch 후 실제 진입 시 재요청
  - retry 설정으로 인한 재호출
  - 개발환경에서 의도치 않은 중복 effect

권장:

- 상세 화면의 조회수는 `GET /api/boards/{boardId}` 응답값을 그대로 사용합니다.
- 프론트에서 수동으로 `viewCount + 1` 계산은 하지 않습니다.

### 5.2 좋아요 수

> ⚠️ **문서화 상태 주의**: 아래 엔드포인트는 백엔드 컨트롤러(`back/src/main/java/.../adapter/webapi/board/BoardLikeCommandApi.java`)에 실제로 구현되어 있음을 소스 코드로 확인했다. 그러나 **`docs/backend-contract/api-endpoint.md` 인덱스와 `back/build/generated-snippets/`에는 이 엔드포인트에 대한 항목/스니펫이 없다**(RestDocs 테스트 미작성 추정). CLAUDE.md §7 원칙("필드/요청·응답 스펙을 추측하지 않는다. 기능ID로 인덱스를 확인하고, 필드는 스니펫을 읽는다")에 따라, **기능ID·스니펫으로 확정되지 않은 이 엔드포인트를 프론트 구현에 바로 소비해서는 안 된다.** 좋아요 토글을 구현하려면 먼저 백엔드에 RestDocs 스니펫 생성 + `api-endpoint.md` 반영을 요청해 정식 계약으로 확정해야 한다(현재 PRD `4.board-slice-prd.md` §열린항목1과 동일 사안 — "기능 자체가 없다"가 아니라 "기능은 있으나 미문서화"로 정정).

대상 API(소스 코드 기준, **미문서화**):

- `POST /api/boards/{boardId}/likes`
- `DELETE /api/boards/{boardId}/likes`

정책:

- 좋아요 등록 성공 시 Redis `likeCount +1`
- 좋아요 취소 성공 시 Redis `likeCount -1`
- 같은 사용자가 이미 좋아요한 게시글에 다시 좋아요 요청하면 서버에서 예외 처리합니다.

응답 특성:

- 등록: `201 Created`
- 취소: `204 No Content`
- 둘 다 카운트 값을 응답 바디로 주지 않습니다.

프론트 권장 처리:

- 방법 1: 성공 시 현재 화면 count를 낙관적으로 `+1/-1` 반영
- 방법 2: 성공 후 상세/목록 API 재조회

둘 중 어떤 방식을 써도 되지만, 현재 백엔드는 변경 직후 Redis에 반영하므로 재조회 시 최신 count가 바로 보입니다.

### 5.3 댓글 수

대상 API:

- `POST /api/boards/{boardId}/comments`
- `POST /api/boards/{boardId}/comments/{parentCommentId}/replies`
- `DELETE /api/boards/{boardId}/comments/{commentId}`
- `PATCH /api/boards/{boardId}/comments/{commentId}`

정책:

- 댓글 등록: `commentCount +1`
- 대댓글 등록: `commentCount +1`
- 댓글 삭제: `commentCount -1`
- 댓글 수정: count 변화 없음

중요:

- `commentCount`는 댓글과 대댓글을 모두 포함합니다.
- 삭제된 댓글은 row 자체가 사라지지 않고, 댓글 목록 응답에 `isDeleted=true`로 남을 수 있습니다.
- 하지만 삭제 시 count는 감소하므로, `commentCount`와 댓글 목록의 전체 row 수는 같지 않을 수 있습니다.

프론트 해석 기준:

- "댓글 수 배지"는 `commentCount`를 기준으로 표시합니다.
- "댓글 목록 렌더링"은 `/api/boards/{boardId}/comments` 응답을 기준으로 표시합니다.
- 삭제 댓글은 placeholder UI로 처리하고, count와 목록 row 수를 1:1로 맞추려 하지 않습니다.

## 6. DB 반영 정책

Redis에 쌓인 delta는 배치 작업이 나중에 DB에 반영합니다.

동작 순서:

1. dirty set에서 반영 대상 `boardId` 조회
2. 각 게시글의 Redis delta 조회
3. DB의 `viewCount`, `likeCount`, `commentCount`에 delta 누적 반영
4. 반영 성공 후 Redis delta hash와 dirty set 정리

의미:

- 운영 중 API 응답은 Redis delta까지 합산해서 보여주므로, 사용자는 거의 최신 count를 보게 됩니다.
- 하지만 DB만 직접 조회하는 별도 집계, 배치, 관리자 SQL 확인값은 Redis 반영 전까지 잠시 차이가 날 수 있습니다.

주의:

- 배치 주기는 현재 애플리케이션 코드 내부에 고정되어 있지 않습니다.
- 즉, "DB에 몇 초 내로 반영된다"는 보장은 프론트 정책 문서에서는 가정하지 않는 것이 안전합니다.

## 7. 프론트 구현 가이드

### 7.1 화면별 count 신뢰 기준

- 게시글 목록 화면: `GET /api/categories/{categoryId}/boards` 응답값 사용
- 게시글 상세 화면: `GET /api/boards/{boardId}` 응답값 사용
- 좋아요/댓글 액션 직후: 로컬 갱신 또는 재조회 중 하나를 선택

### 7.2 추천 처리 방식

#### 상세 화면

- 진입 시 `GET /api/boards/{boardId}` 1회 호출
- 응답의 `viewCount`, `likeCount`, `commentCount`를 그대로 사용
- 좋아요/댓글 성공 후에는 현재 상세 상태를 낙관적으로 갱신하거나, 필요 시 상세 재조회

#### 목록 화면

- 목록 count는 목록 API 응답을 기준으로 렌더링
- 상세 화면에서 좋아요/댓글 후 목록으로 복귀할 때 count 동기화가 필요하면:
  - 목록 캐시를 직접 갱신하거나
  - 목록 API를 다시 조회

### 7.3 피해야 할 구현

- 상세 응답을 받은 뒤 프론트에서 조회수를 한 번 더 `+1` 하는 처리
- 좋아요/댓글 API 응답 바디에 최신 count가 올 것이라고 가정하는 처리
- 댓글 row 수와 `commentCount`가 반드시 같다고 가정하는 처리
- 상세 페이지 prefetch와 실제 진입 fetch를 둘 다 수행하는 처리

## 8. 프론트와 공유할 한 줄 정책

`게시판 카운트는 DB 기준값에 Redis delta를 합산한 값을 응답으로 내려주며, 조회수는 상세 조회 API 호출마다 증가하고, 좋아요/댓글 변경 API는 상태코드만 반환하므로 프론트는 목록/상세 조회 응답값을 count의 기준값으로 사용한다.`

## 9. 백엔드 근거 코드

- Redis 카운트 저장: `src/main/java/com/haruon/groupware/adapter/redis/board/BoardRedis.java`
- 상세 조회 시 조회수 증가: `src/main/java/com/haruon/groupware/application/board/service/query/BoardAndCommentQueryService.java`
- 좋아요 카운트 변경: `src/main/java/com/haruon/groupware/application/board/service/command/LikeCommandService.java`
- 좋아요 컨트롤러(**미문서화** — api-endpoint.md·generated-snippets 없음): `src/main/java/com/haruon/groupware/adapter/webapi/board/BoardLikeCommandApi.java`
- 댓글 카운트 변경: `src/main/java/com/haruon/groupware/application/board/service/command/CommentCommandService.java`
- 목록/상세 count 합산 DTO: 
  - `src/main/java/com/haruon/groupware/application/board/service/query/dto/BoardSummaryResponse.java`
  - `src/main/java/com/haruon/groupware/application/board/service/query/dto/BoardDetailResponse.java`
- DB 반영 배치:
  - `src/main/java/com/haruon/groupware/adapter/batch/board/BoardReactionDeltaApplyService.java`
  - `src/main/java/com/haruon/groupware/adapter/batch/board/BoardReactionDeltaDbApplyService.java`
